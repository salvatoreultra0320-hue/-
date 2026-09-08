# -*- coding: utf-8 -*-
"""抠掉 UI.png 的白底，只保留组件（标题+按钮），并输出各按钮的精确百分比位置。"""
from PIL import Image
import numpy as np

SRC = r"E:\学习资料\RUTH\images\UI.png"
DST = r"E:\学习资料\RUTH\images\UI_cut.png"

im = Image.open(SRC).convert("RGBA")
arr = np.array(im)
rgb = arr[:, :, :3].astype(np.int16)

# 近白像素（所有通道都很亮）视为背景 -> 透明
white = np.all(rgb >= 235, axis=2)
alpha = np.where(white, 0, 255).astype(np.uint8)

# 轻微羽化边缘：对 alpha 做一次 3x3 最小值+最大值平滑，减少白边
from PIL import ImageFilter
a_img = Image.fromarray(alpha, "L")
a_img = a_img.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1))
alpha = np.array(a_img)

out = arr.copy()
out[:, :, 3] = alpha

# 裁剪到内容 bbox
ys, xs = np.where(alpha > 10)
if len(ys) == 0:
    raise SystemExit("no content found")
y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
out = out[y0:y1, x0:x1]
h, w = out.shape[:2]
Image.fromarray(out, "RGBA").save(DST)

print("crop bbox: x=%d..%d y=%d..%d  size=%dx%d" % (x0, x1, y0, y1, w, h))

# ---- 在裁剪后的图里找按钮行带（中央列区） ----
a = out[:, :, 3] > 40
cx0, cx1 = int(w * 0.25), int(w * 0.75)
center = a[:, cx0:cx1]
vproj = center.sum(axis=1)

# 平滑后找连续内容带
bands = []
in_b = False
for i, c in enumerate(vproj):
    if c > 30 and not in_b:
        in_b = True; s = i
    elif c <= 30 and in_b:
        in_b = False
        if i - s > 15:
            bands.append((s, i))
if in_b:
    bands.append((s, h))

print("row bands (y_start,y_end,height):")
for b in bands:
    print("  %d %d %d  -> top=%.1f%% h=%.1f%%" % (b[0], b[1], b[1]-b[0], b[0]/h*100, (b[1]-b[0])/h*100))

# ---- 对每条按钮带求水平范围 ----
print("button x ranges:")
for idx, (s, e) in enumerate(bands):
    strip = a[s:e, :]
    hproj = strip.sum(axis=0)
    cols = np.where(hproj > (e - s) * 0.15)[0]
    if len(cols) > 0:
        lx, rx = cols.min(), cols.max()
        print("  band%d: x=%d..%d  left=%.1f%% width=%.1f%%" % (idx, lx, rx, lx/w*100, (rx-lx)/w*100))
