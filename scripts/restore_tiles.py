# -*- coding: utf-8 -*-
"""
从 index_前四关.html 还原原版"厚瓦片 2.5D"格子系统到 index.html
- CSS 块: 新版"圆角微立体" -> 原版"厚瓦片"(含 tile-side / 类型配色 / fork-badge / gain-text)
- 模板: 补回 <div class="tile-side"></div>, 去掉 +2px 偏移
"""
import io, sys

ROOT = r"E:/学习资料/RUTH"
SRC = ROOT + "/index_前四关.html"   # 原版参考
TGT = ROOT + "/index.html"          # 当前文件

def read(p):
    with io.open(p, "r", encoding="utf-8") as f:
        return f.read()

def write(p, s):
    with io.open(p, "w", encoding="utf-8", newline="") as f:
        f.write(s)

src = read(SRC)
tgt = read(TGT)

# ---------- 1. CSS 块还原 ----------
# 原版锚点: 厚瓦片注释开始 -> 怪物注释开始(不含)
CSS_START_OLD = """  /* =====================================================
     厚瓦片 - 真正的2.5D立体效果
     ===================================================== */"""
CSS_END_MARK = """  /* 怪物 - 立在格子上有高度 */"""

# 当前新版锚点
NEW_START = """  /* =====================================================
     新版格子系统 — 圆角微立体，无溢色
     ===================================================== */"""

i_old_css = src.index(CSS_START_OLD)
i_old_end = src.index(CSS_END_MARK, i_old_css)
old_css_block = src[i_old_css:i_old_end]          # 原版整块(含 gain-text 等)

i_new_css = tgt.index(NEW_START)
i_new_end = tgt.index(CSS_END_MARK, i_new_css)
new_css_block = tgt[i_new_css:i_new_end]

tgt = tgt.replace(new_css_block, old_css_block)
print("[1] CSS 块已还原: %d 字符 -> %d 字符" % (len(new_css_block), len(old_css_block)))

# ---------- 2. 模板还原 ----------
# 当前模板(缺 tile-side, 有 +2 偏移)
cur_tmpl = """      <div class="tile-shadow"></div>
      <div class="tile-top"></div>
      <div class="tile-content">${tileIconHTML(p, LEVEL.gain)}</div>"""
new_tmpl = """      <div class="tile-shadow"></div>
      <div class="tile-side"></div>
      <div class="tile-top"></div>
      <div class="tile-content">${tileIconHTML(p, LEVEL.gain)}</div>"""

cnt = tgt.count(cur_tmpl)
if cnt > 0:
    tgt = tgt.replace(cur_tmpl, new_tmpl)
    print("[2] 模板补回 tile-side (%d 处)" % cnt)
else:
    print("[2] 警告: 未找到当前模板结构, 跳过")

# 去掉 +2px 偏移(恢复原版居中定位)
cnt2 = tgt.count('left:${p.c*T-TW/2+2}px;top:${p.r*T-TW/2+2}px')
if cnt2 > 0:
    tgt = tgt.replace('left:${p.c*T-TW/2+2}px;top:${p.r*T-TW/2+2}px',
                      'left:${p.c*T-TW/2}px;top:${p.r*T-TW/2}px')
    print("[3] 去掉 +2px 偏移 (%d 处)" % cnt2)

write(TGT, tgt)
print("完成! index.html 已还原为厚瓦片格子系统")
