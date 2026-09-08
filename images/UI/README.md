# UI 美术资源规范（换皮 = 往 images/UI/ 放图）

把游戏内**以黑色渐变为主的 UI 组件**拆成可替换的美术资源。放入同名图片即可覆盖默认 CSS 外观，缺图自动回退，不改代码。

## 目录结构与命名

```
images/UI/
  topbar/           顶栏（返回按钮 / 音效按钮 / 金币袋 / 游戏标题区）
    back.png        返回按钮「‹ 选关」
    mute.png        音效开关圆形按钮
    coinbag.png     金币袋
    titlebar.png    游戏标题栏
  stat/             顶部 4 个状态卡（行动点/骰子/距Boss/已行动）
    stat-card.png   状态卡底板（四张同用）
  controls/         底部控制按钮（掷骰 / 地图 / 重开）
    btn-map.png     地图按钮
    btn-roll.png    掷骰子按钮（主按钮）
    btn-reset.png   重开按钮
  modal/            弹窗
    modal-bg.png    弹窗底板（.mbox）
    toast-bg.png    Toast 提示条
    announce-bg.png 战斗/增益通告横幅
  panel/            列表面板（武器/符咒卡、选关面板内底色等）
    card.png        商店/准备 物品卡（.pw/.pc）
  level/            选关界面
    lv-cell.png     关卡格子底板
    lv-banner.png   选关标题红绸横幅
  shop/             商店入口
    shop-btn.png    商店按钮
  prep/             出战准备
    slot.png        武器/符咒槽（.lo-slot）
    bigbtn.png      出战大按钮
  icons/            小型图标（已有基础图）
    coin.png        金币图标（.mini-coin）
    dice.png        骰子图标
    flag.png        旗帜图标
    move.png        步数图标
```

## 使用方法

- 图片建议 **PNG/SVG，透明底**；尺寸按各自组件逻辑尺寸等比（会自动 `background-size:100% 100%` / `object-fit:contain` 拉伸贴合）。
- 放到 `images/UI/<子目录>/<文件名>.png` 即可，**同名覆盖**。
- 例如替换「掷骰子」主按钮：放 `images/UI/controls/btn-roll.png`。
- 替换所有统计卡：放 `images/UI/stat/stat-card.png`。

## 回退链

`images/UI/…` 有图 → 用图；无图 → 保持现有 CSS 黑色渐变外观。逐张替换、随时试玩，缺图不影响运行。

## 注意

- `topbar/coinbag.png` 只替换金币袋底图；金币数字仍由游戏文本显示。
- `icons/coin.png` 等用于各处小图标（金币/骰子/旗帜/步数），替换后所有用到的地方统一生效。
- 主菜单（`images/UI_cut.png`）与棋盘场景（`images/themes/`）是独立的资源线，不在此目录。
