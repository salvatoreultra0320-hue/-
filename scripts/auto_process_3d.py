# -*- coding: utf-8 -*-
"""
auto_process_3d.py

生肖Boss 3D模型自动续生成脚本：
- 从 jobs.json 读取12个Boss的任务状态
- 自动提交 PENDING 任务（并发最多2个）
- 轮询 RUNNING 任务
- 下载完成任务的预览图到 images/bosses_3d/ 目录

特性：
- 每日限额5个：遇 daily limit 错误时自动保存状态并优雅退出
- 并发控制：同时最多2个 RUNNING 任务
- 状态原子保存：每完成一步就写回 jobs.json
- Token 从 images/bosses_3d/token.txt 读取
"""

import base64
import contextlib
import importlib.util
import io
import json
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

# Force UTF-8 output
if sys.stdout.encoding and sys.stdout.encoding.lower().replace("-", "") != "utf8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if sys.stderr.encoding and sys.stderr.encoding.lower().replace("-", "") != "utf8":
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BOSSDIR = os.path.join(SCRIPT_DIR, "images", "bosses_3d")
JOBS_PATH = os.path.join(BOSSDIR, "jobs.json")
TOKEN_PATH = os.path.join(BOSSDIR, "token.txt")
BUDDY_CLOUD = os.path.join(
    os.environ.get("WORKBUDDY_PLUGINS", r"C:\Users\叛逆猪大肠\.workbuddy\plugins\cache"),
    "workbuddy-builtin",
    "skill-buddy-multimodal-generation",
    "0.1.0",
    "scripts",
    "buddy-cloud.py",
)

# Bosses in order: 鼠牛虎兔龙蛇马羊猴鸡狗猪
BOSSES = [
    {"key": "rat",     "name": "鼠", "image": "boss_rat.png",     "level": 1},
    {"key": "ox",      "name": "牛", "image": "boss_ox.png",      "level": 6},
    {"key": "tiger",   "name": "虎", "image": "boss_tiger.png",   "level": 11},
    {"key": "rabbit",  "name": "兔", "image": "boss_rabbit.png",  "level": 16},
    {"key": "dragon",  "name": "龙", "image": "boss_dragon.png",  "level": 21},
    {"key": "snake",   "name": "蛇", "image": "boss_snake.png",   "level": 26},
    {"key": "horse",   "name": "马", "image": "boss_horse.png",   "level": 31},
    {"key": "goat",    "name": "羊", "image": "boss_goat.png",    "level": 36},
    {"key": "monkey",  "name": "猴", "image": "boss_monkey.png",  "level": 41},
    {"key": "rooster", "name": "鸡", "image": "boss_rooster.png", "level": 42},
    {"key": "dog",     "name": "狗", "image": "boss_dog.png",     "level": 46},
    {"key": "pig",     "name": "猪", "image": "boss_pig.png",     "level": 50},
]

POLL_INTERVAL_SEC = 15       # seconds between status checks
MAX_RUNNING = 2              # concurrent RUNNING jobs
SUBMIT_RETRY_LIMIT = 2       # retries on transient errors
DAILY_LIMIT_QUOTA = 5        # per-day submit quota

# ---------------------------------------------------------------------------
# IO helpers
# ---------------------------------------------------------------------------


def log(*args):
    msg = " ".join(str(a) for a in args)
    print(f"[auto] {msg}", file=sys.stderr, flush=True)


def read_jobs():
    if not os.path.isfile(JOBS_PATH):
        return []
    with open(JOBS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def write_jobs(jobs):
    """Atomically write jobs.json so partial writes don't corrupt state."""
    tmp = JOBS_PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(jobs, f, ensure_ascii=False, indent=2)
    os.replace(tmp, JOBS_PATH)


def ensure_job_index(jobs):
    """Make sure every BOSSES entry exists in jobs.json; add missing ones."""
    by_key = {j["key"]: j for j in jobs}
    changed = False
    for b in BOSSES:
        if b["key"] not in by_key:
            log(f"新增任务条目: {b['key']} ({b['name']})")
            jobs.append({
                "key": b["key"],
                "name": b["name"],
                "job_id": None,
                "status": "PENDING",
            })
            changed = True
    if changed:
        write_jobs(jobs)
    return jobs


def count_today_submits(jobs):
    """Count DONE/RUNNING jobs that share today's quota.
    Since we don't track timestamps in jobs.json explicitly, we conservatively
    count any job that already has a job_id (DONE or RUNNING) as consuming
    today's quota. Daily reset happens across midnight server time.
    """
    n = 0
    for j in jobs:
        if j.get("job_id") and j.get("status") in ("RUNNING", "DONE", "FAIL"):
            n += 1
    return n


# ---------------------------------------------------------------------------
# buddy-cloud.py wrapper
# ---------------------------------------------------------------------------


def run_buddy(args, timeout=60):
    """Run buddy-cloud.py with the given args; return (rc, stdout, stderr)."""
    cmd = [sys.executable, BUDDY_CLOUD] + args + ["--token-file", TOKEN_PATH]
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            encoding="utf-8",
            errors="replace",
        )
        return proc.returncode, proc.stdout, proc.stderr
    except subprocess.TimeoutExpired:
        return -1, "", f"timeout after {timeout}s"


def _load_buddy():
    """Import buddy-cloud.py as a module (in-process, no CLI length limits)."""
    spec = importlib.util.spec_from_file_location("buddy_cloud", BUDDY_CLOUD)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_BUDDY = None


def get_buddy():
    global _BUDDY
    if _BUDDY is None:
        _BUDDY = _load_buddy()
    return _BUDDY


def read_token():
    with open(TOKEN_PATH, "r", encoding="utf-8") as f:
        return f.read().strip()


def _call_buddy_api(cfg, action, body):
    """Call buddy-cloud API in-process. Returns (ok, result_or_error_text).
    buddy-cloud.py calls sys.exit(1) via _error_out on failures; we capture the
    printed JSON from stdout and return it as the error text.
    """
    buddy = get_buddy()
    token = read_token()
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            result = buddy._call_api(
                buddy._DEFAULT_ENDPOINT, cfg["provider"], cfg["service"], cfg["version"],
                action, body, token,
            )
        return True, result
    except SystemExit:
        return False, buf.getvalue()
    except Exception as e:  # noqa: BLE001
        return False, "exception: %s" % e


def submit_job(image_path):
    """Submit an image-to-3D job (in-process base64). Returns dict
    {ok, job_id, daily_limit, error}.
    """
    buddy = get_buddy()
    cfg = buddy._PROVIDER_MAP["3d"]
    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    body = buddy._build_3d_body(
        prompt="",
        model="3.0",
        image_base64=b64,
        generate_type="LowPoly",
        polygon_type="triangle",
    )
    ok, result = _call_buddy_api(cfg, cfg["submit_action"], body)
    if not ok:
        err = (result or "").strip()
        low = err.lower()
        if ("daily" in low and ("limit" in low or "quota" in low or "exceed" in low)) or "quota" in low:
            return {"ok": False, "daily_limit": True, "error": err[:500]}
        return {"ok": False, "daily_limit": False, "error": err[:500]}
    job_id = result.get("JobId") if isinstance(result, dict) else None
    if not job_id:
        return {"ok": False, "daily_limit": False, "error": "no JobId in response: " + json.dumps(result)[:300]}
    return {"ok": True, "job_id": str(job_id)}


def _find_preview_url(raw):
    """Robustly locate a preview PNG URL from the raw query result."""
    if not isinstance(raw, dict):
        return None

    def _first_png(obj):
        """Return first .png URL found anywhere inside obj."""
        if isinstance(obj, dict):
            for v in obj.values():
                r = _first_png(v)
                if r:
                    return r
        elif isinstance(obj, list):
            for v in obj:
                r = _first_png(v)
                if r:
                    return r
        elif isinstance(obj, str):
            if obj.startswith("http") and ".png" in obj.lower():
                return obj
        return None

    # Preferred: a field that explicitly names a preview image
    for key in ("PreviewImageUrl", "PreviewUrl", "ResultImageUrl", "ResultImage", "ImageUrl"):
        if isinstance(raw.get(key), str) and raw[key].startswith("http"):
            return raw[key]

    # Fallback: any .png URL (preview images are PNGs)
    return _first_png(raw)


def query_status(job_id):
    """Query job status in-process; return {status, raw} with raw = full result dict."""
    buddy = get_buddy()
    cfg = buddy._PROVIDER_MAP["3d"]
    ok, result = _call_buddy_api(cfg, cfg["query_action"], {"JobId": job_id})
    if not ok:
        return {"status": "ERROR", "raw": str(result)[:500]}
    if not isinstance(result, dict):
        return {"status": "ERROR", "raw": str(result)[:500]}
    status = result.get("Status", "UNKNOWN")
    # JobStatusCode: 1=QUEUED 2=PROCESSING 4=FAIL 5=DONE
    code = result.get("JobStatusCode")
    if code is not None:
        code_map = {1: "QUEUED", 2: "PROCESSING", 4: "FAIL", 5: "DONE"}
        if not status or status == "UNKNOWN":
            status = code_map.get(code, str(code))
    return {"status": status, "raw": result}


def download_preview(url, dest):
    """Download preview image with urllib; return True on success."""
    import urllib.request
    try:
        with urllib.request.urlopen(url, timeout=60) as r:
            data = r.read()
        with open(dest, "wb") as f:
            f.write(data)
        return True
    except Exception as e:
        log(f"下载失败 {dest}: {e}")
        return False


# ---------------------------------------------------------------------------
# Worker functions
# ---------------------------------------------------------------------------


def submit_one(job_entry):
    """Submit a PENDING job. Mutates job_entry in-place."""
    key = job_entry["key"]
    name = job_entry["name"]
    image_path = os.path.join(SCRIPT_DIR, "images", "bosses", f"boss_{key}.png")
    if not os.path.isfile(image_path):
        log(f"[{key}] 缺少源图 {image_path}，跳过")
        return False
    log(f"[{key}] 提交 3D 生成任务 (源图={os.path.basename(image_path)})")
    result = submit_job(image_path)
    if result.get("daily_limit"):
        log(f"[{key}] 今日限额已满，停止提交")
        return "DAILY_LIMIT"
    if not result.get("ok"):
        log(f"[{key}] 提交失败: {result.get('error','')}")
        return False
    job_entry["job_id"] = result["job_id"]
    job_entry["status"] = "RUNNING"
    log(f"[{key}] 已提交 job_id={result['job_id']}")
    return True


def poll_one(job_entry):
    """Poll one RUNNING job. Mutates job_entry in-place.
    Returns 'DONE' if completed and downloaded, 'FAIL' if failed, None if still running.
    """
    key = job_entry["key"]
    job_id = job_entry.get("job_id")
    if not job_id:
        return None
    status = query_status(job_id)
    s = status.get("status", "").upper()
    if s in ("DONE", "SUCCESS", "5"):
        # Extract preview URL from raw
        raw = status.get("raw", {})
        preview_url = _find_preview_url(raw)
        if not preview_url:
            log(f"[{key}] DONE 但未找到预览图URL: {json.dumps(raw)[:300]}")
            job_entry["status"] = "FAIL"
            job_entry["error"] = "no_preview_url"
            return "FAIL"
        # Download
        dest = os.path.join(BOSSDIR, f"boss_{key}_preview.png")
        if download_preview(preview_url, dest):
            job_entry["status"] = "DONE"
            job_entry["preview_url"] = preview_url
            job_entry["local_path"] = dest
            log(f"[{key}] 预览图下载完成 → {dest}")
            return "DONE"
        job_entry["status"] = "FAIL"
        job_entry["error"] = "download_failed"
        return "FAIL"
    if s in ("FAIL", "FAILED", "4", "ERROR"):
        job_entry["status"] = "FAIL"
        job_entry["error"] = json.dumps(status.get("raw", {}))[:300]
        log(f"[{key}] 生成失败: {job_entry['error']}")
        return "FAIL"
    log(f"[{key}] 状态={s}，继续等待")
    return None


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------


def find_image_url_for_key(key):
    """Return absolute path to the source PNG for a given boss key."""
    return os.path.join(SCRIPT_DIR, "images", "bosses", f"boss_{key}.png")


def main():
    if not os.path.isfile(TOKEN_PATH):
        log(f"未找到 token 文件: {TOKEN_PATH}")
        sys.exit(1)
    if not os.path.isfile(BUDDY_CLOUD):
        log(f"未找到 buddy-cloud.py: {BUDDY_CLOUD}")
        sys.exit(1)

    os.makedirs(BOSSDIR, exist_ok=True)
    jobs = ensure_job_index(read_jobs())

    # Note: 每日限额5个。jobs.json 没有时间戳，无法精确区分哪些 DONE 算今日消耗。
    # 因此采用「试错」策略：尝试提交新任务，遇到 daily limit 则本轮不再提交，
    # 仅轮询已在 RUNNING 的任务。这是 fail-graceful 的。
    log("开始续跑生肖Boss 3D生成任务")
    log(f"已 DONE: {sum(1 for j in jobs if j.get('status') == 'DONE')}, "
        f"RUNNING: {sum(1 for j in jobs if j.get('status') == 'RUNNING')}, "
        f"PENDING: {sum(1 for j in jobs if j.get('status') == 'PENDING')}, "
        f"FAIL: {sum(1 for j in jobs if j.get('status') == 'FAIL')}")

    round_no = 0
    daily_limit_hit = False

    while True:
        round_no += 1
        jobs = read_jobs()
        jobs = ensure_job_index(jobs)

        running = [j for j in jobs if j.get("status") == "RUNNING"]
        pending = [j for j in jobs if j.get("status") == "PENDING"]
        done = [j for j in jobs if j.get("status") == "DONE"]
        failed = [j for j in jobs if j.get("status") == "FAIL"]

        log(f"--- 第 {round_no} 轮: DONE={len(done)} RUN={len(running)} PENDING={len(pending)} FAIL={len(failed)} ---")

        # 1) Poll all running jobs (sequentially to avoid rate limits)
        for job in running:
            result = poll_one(job)
            if result in ("DONE", "FAIL"):
                write_jobs(jobs)
                # Decrement today-quota counter so a new submission can fill the slot
                if result == "FAIL":
                    # If a job failed and never used a quota slot we can retry;
                    # but we don't know that for sure, so we leave it to manual retry.
                    pass

        # 2) Submit new jobs up to MAX_RUNNING
        slots = MAX_RUNNING - len([j for j in jobs if j.get("status") == "RUNNING"])

        for job in pending:
            if slots <= 0 or daily_limit_hit:
                break
            # Skip if boss source image missing
            if not os.path.isfile(find_image_url_for_key(job["key"])):
                log(f"[{job['key']}] 源图缺失，跳过（不会消耗额度）")
                continue
            result = submit_one(job)
            if result == "DAILY_LIMIT":
                daily_limit_hit = True
                break
            if result is True:
                write_jobs(jobs)
                slots -= 1
            else:
                # Submission failed (network/transient). Mark as PENDING, will retry next round.
                pass

        # 3) Termination check
        jobs = read_jobs()
        pending = [j for j in jobs if j.get("status") == "PENDING"]
        running = [j for j in jobs if j.get("status") == "RUNNING"]

        if not running and not pending:
            log("全部任务已完成或失败，退出")
            break
        if not running:
            if daily_limit_hit:
                log("今日限额已满且无 RUNNING 任务，保存状态后退出（明天 00:10 续跑）")
                break
            # No running, but pending exist
            log("无 RUNNING 任务且无法继续提交，退出")
            break

        time.sleep(POLL_INTERVAL_SEC)

    # Final report
    final = read_jobs()
    log("===== 最终状态 =====")
    for j in final:
        log(f"  {j['key']:8s} {j.get('name',''):2s} {j.get('status','')} job_id={j.get('job_id','')}")


if __name__ == "__main__":
    main()
