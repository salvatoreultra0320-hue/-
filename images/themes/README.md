# 美术资源分段规范(五套换皮)

每个关卡分段对应一套完整美术资源,换皮 = 往对应文件夹放图,不用改代码。

| 分段 | 关卡范围 | 目录 |
|---|---|---|
| 第一套 | 1~11 关 | `images/themes/set1/` |
| 第二套 | 12~23 关 | `images/themes/set2/` |
| 第三套 | 24~39 关 | `images/themes/set3/` |
| 第四套 | 40~47 关 | `images/themes/set4/` |
| 第五套 | 48~50 关(年兽终局) | `images/themes/set5/` |

## 目录结构与命名

```
images/themes/setN/
  sky.svg|.png      本段游戏内天空(仅铺 #scene 棋盘视口,拉伸到 100%×100% 与 #scene 对齐),可选
  background.svg|.png  天空的旧名/兼容名,优先 sky.*,再回退 background.*
  board.png|.svg    本段棋盘底面(9×9 地面),可选
  tiles/             格子平铺纹理(直接铺满整格;格子已取消顶面/侧面),可选
    normal.svg       普通格(同时也是 增益/怪/宝箱/精英/Boss 格的打底纹理)
    start.svg        起点格
    trap.svg         陷阱格
    cloud.svg        云雾格
    sleep.svg        沉睡格
    portal.svg       传送门
    coin.svg         金币格
    dice.svg         骰子格
    branch.svg       岔路格
  entities/          立体贴图(立在格上,始终正对镜头),可选
    mob.svg          普通怪(通用)
    elite.svg        精英怪(通用)
    chest.svg        宝箱
    boss_dog.svg     生肖 Boss 立绘(12 生肖 + 年兽)
    boss_rat.svg ... boss_pig.svg
    boss_nian.svg    年兽(终局)
```

**实体变体(怪/精英支持多张,放 `entities/` 或 `tiles/` 均可):**
- `mob1.svg` / `mob2.svg` / `mob3.svg` — 普通怪 3 种,每关每格按「关卡id+格序号」稳定随机分配一格一种
- `elite1.svg` / `elite2.svg` — 精英怪 2 种,同上稳定随机分配
- 宝箱 = `chest.svg`
- **教程关(1、2关)的 Boss 用本关精英格没用到的另一张精英贴图**(如本关精英=elite2 → Boss=elite1);其余 Boss 关用 `boss_<生肖>.svg`

- 建议透明背景 PNG 或 SVG;实体贴图按正方形设计(约 56×56~76×76 逻辑尺寸,自动等比缩放)
- 增益格没有独立贴图:收益数字直接立在 normal 纹理上(`tiles/normal.svg`)
- 怪/宝箱/精英/Boss 格 = normal 纹理打底 + 上方叠加对应立绘
- 基础天空参考文件:`images/sky.svg`(512×512 渐变天空,替换基础档即改默认天空)

## 回退链(缺图不会报错)

`themes/setN/…` → 缺文件回退项目原有 `images/…` → 再缺回退内置 CSS/emoji 外观。
因此可以逐张替换、随时试玩。

## 页面背景(固定)

**整体游戏背景固定为 `images/background.png`,所有页面(主菜单/选关/商店/对局)一致、不随页面改动。**
`themes/setN/sky.*` 只铺 #scene 棋盘视口,不铺满整页。
