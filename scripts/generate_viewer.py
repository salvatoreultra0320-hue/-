# -*- coding: utf-8 -*-
"""
generate_viewer.py

从 jobs.json 重新生成 viewer.html 预览页：
- DONE：显示预览图，状态"模型已生成"
- RUNNING：显示占位符 + 蓝色"生成中"徽章
- PENDING：显示占位符 + "待生成"徽章
- FAIL：橙色"生成失败"徽章
"""

import io
import json
import os
import sys

if sys.stdout.encoding and sys.stdout.encoding.lower().replace("-", "") != "utf8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if sys.stderr.encoding and sys.stderr.encoding.lower().replace("-", "") != "utf8":
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BOSSDIR = os.path.join(SCRIPT_DIR, "images", "bosses_3d")
JOBS_PATH = os.path.join(BOSSDIR, "jobs.json")
VIEWER_PATH = os.path.join(BOSSDIR, "viewer.html")

# Order: 鼠牛虎兔龙蛇马羊猴鸡狗猪
ORDER = ["rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse", "goat", "monkey", "rooster", "dog", "pig"]

PREVIEW_FILENAME = {
    "rat": "boss_rat_preview.png",
    "ox": "boss_ox_preview.png",
    "tiger": "boss_tiger_preview.png",
    "rabbit": "boss_rabbit_preview.png",
    "dragon": "boss_dragon_preview.png",
    "snake": "boss_snake_preview.png",
    "horse": "boss_horse_preview.png",
    "goat": "boss_goat_preview.png",
    "monkey": "boss_monkey_preview.png",
    "rooster": "boss_rooster_preview.png",
    "dog": "boss_dog_preview.png",
    "pig": "boss_pig_preview.png",
}

LEVEL_NUM = {
    "rat": 1, "ox": 6, "tiger": 11, "rabbit": 16, "dragon": 21, "snake": 26,
    "horse": 31, "goat": 36, "monkey": 41, "rooster": 42, "dog": 46, "pig": 50,
}


def status_badge(status):
    s = (status or "").upper()
    if s == "DONE":
        return '<span class="badge ok">模型已生成</span>'
    if s == "RUNNING":
        return '<span class="badge run">生成中</span>'
    if s == "FAIL":
        return '<span class="badge warn">生成失败</span>'
    return '<span class="badge pending">待生成</span>'


def build_card(key, job):
    name = job.get("name") or key
    level = LEVEL_NUM.get(key, "?")
    status = job.get("status") or "PENDING"
    badge_html = status_badge(status)
    if status == "DONE" and job.get("local_path"):
        # Wrap filename with explicit folder for relative path from viewer.html
        img_src = PREVIEW_FILENAME[key]
        img_block = '<img src="{0}" alt="{1} Boss">'.format(img_src, name)
    else:
        msg = {
            "RUNNING": "生成中…",
            "FAIL": "生成失败",
        }.get(status, "预览图未就绪")
        img_block = '<div class="placeholder">{0}</div>'.format(msg)
    card = '''    <div class="card">
      <div class="img-wrap">{img}</div>
      <div class="info">
        <div class="title"><span class="zodiac">{name}</span><span class="level">第{level}关</span></div>
        <div class="meta">Low Poly · 三角面 · {badge}</div>
      </div>
    </div>'''.format(img=img_block, name=name, level=level, badge=badge_html)
    return card


def build_html(jobs):
    by_key = {j.get("key"): j for j in jobs}
    cards = []
    for key in ORDER:
        job = by_key.get(key, {"key": key, "status": "PENDING"})
        cards.append(build_card(key, job))
    cards_html = "\n\n".join(cards)

    done_count = sum(1 for j in jobs if (j.get("status") or "").upper() == "DONE")
    total = len(jobs) or 12

    html = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>十二生肖 Boss · Low Poly 3D 模型预览</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
    font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    min-height: 100vh;
    padding: 32px 20px;
    color: #eee;
  }}
  .header {{
    text-align: center;
    margin-bottom: 36px;
  }}
  .header h1 {{
    font-size: 30px;
    background: linear-gradient(90deg, #ffd700, #ff8c00, #ffd700);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 2px;
  }}
  .header p {{
    margin-top: 8px;
    color: #9aa5c1;
    font-size: 14px;
  }}
  .header .progress {{
    margin-top: 10px;
    font-size: 13px;
    color: #c0c8e0;
  }}
  .grid {{
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }}
  .card {{
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px;
    overflow: hidden;
    transition: transform .25s ease, box-shadow .25s ease;
    backdrop-filter: blur(6px);
  }}
  .card:hover {{
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(0,0,0,.4);
    border-color: rgba(255,215,0,.4);
  }}
  .img-wrap {{
    aspect-ratio: 1/1;
    background: radial-gradient(circle at 30% 30%, #2a2a4a, #0d0d1f);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }}
  .img-wrap img {{
    width: 92%;
    height: 92%;
    object-fit: contain;
    filter: drop-shadow(0 8px 24px rgba(0,0,0,.5));
    transition: transform .3s ease;
  }}
  .card:hover .img-wrap img {{ transform: scale(1.06); }}
  .placeholder {{
    color: #556;
    font-size: 13px;
    text-align: center;
    padding: 40px 12px;
  }}
  .info {{ padding: 14px 16px 16px; }}
  .title {{
    display: flex;
    align-items: center;
    justify-content: space-between;
  }}
  .zodiac {{ font-size: 20px; font-weight: 700; }}
  .level {{ font-size: 13px; color: #ffd700; background: rgba(255,215,0,.12); padding: 3px 10px; border-radius: 999px; }}
  .meta {{ margin-top: 8px; font-size: 12px; color: #8a93b3; display: flex; align-items: center; gap: 6px; }}
  .badge {{ font-size: 11px; padding: 2px 8px; border-radius: 999px; }}
  .badge.ok {{ background: rgba(76,209,55,.18); color: #4cd137; }}
  .badge.warn {{ background: rgba(255,165,0,.18); color: #ffa500; }}
  .badge.pending {{ background: rgba(255,255,255,.12); color: #9aa5c1; }}
  .badge.run {{ background: rgba(0,164,255,.18); color: #00a4ff; }}
</style>
</head>
<body>
  <div class="header">
    <h1>🐉 十二生肖 Boss · Low Poly 3D</h1>
    <p>共 12 个 Boss · 游戏 50 关卡中的精英守卫</p>
    <div class="progress">已完成 {done} / 12</div>
  </div>
  <div class="grid">
{cards}
  </div>
</body>
</html>
'''.format(done=done_count, cards=cards_html)
    return html


def main():
    if not os.path.isfile(JOBS_PATH):
        print("jobs.json 不存在", file=sys.stderr)
        sys.exit(1)
    with open(JOBS_PATH, "r", encoding="utf-8") as f:
        jobs = json.load(f)
    html = build_html(jobs)
    with open(VIEWER_PATH, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"已生成 {VIEWER_PATH}（共 {len(jobs)} 个 Boss）")


if __name__ == "__main__":
    main()
