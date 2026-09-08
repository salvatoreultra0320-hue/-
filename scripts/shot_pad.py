# -*- coding: utf-8 -*-
# 截图棋盘外扩 pad 区域(美化前后对比)
import sys, pathlib
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent

THEME_LEVEL = {
    "default":    1,
    "grass":      2,
    "deepforest": 12,
    "desert":     22,
    "volcano":    32,
    "crystal":    42,
}

theme = sys.argv[1] if len(sys.argv) > 1 else "default"
lvid  = THEME_LEVEL.get(theme, 1)
out   = root / "scripts" / ("pad_after_" + theme + ".png")

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 480, "height": 900}, device_scale_factor=2)
    pg.goto((root / "index.html").as_uri())
    pg.wait_for_timeout(1500)
    js = "(()=>{var lv=LEVELS.find(function(x){return x.id==" + str(lvid) + ";});if(lv){window.startLevel(lv);return 'ok';}return 'no';})()"
    pg.evaluate(js)
    pg.wait_for_timeout(1800)
    el = pg.locator("#scene").first
    el.screenshot(path=str(out))
    b.close()
print("saved", out)
