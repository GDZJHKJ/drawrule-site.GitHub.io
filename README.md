# 走势画规 · 排列五走势画板（示例）

移动端 H5 走势画板的复刻件：开奖号码走势表 + 画规标注 + 皮肤/字号/缩放自定义。
技术栈：Next.js 15（App Router）+ React 19 + TypeScript（严格模式）+ Tailwind CSS v4，无组件库、无绘图库（绘图层为原生 Canvas 2D + Pointer Events）。

**在线地址：https://gdhkj.github.io/drawrule-site/**

仓库：https://github.com/gdhkj/drawrule-site（`main` 分支为源码，GitHub Actions 构建后发布到 Pages）

## 运行

```bash
npm install
npm run dev      # http://localhost:3000
npm run check    # lint + typecheck + build
```

`npm run build` 会输出静态站点到 `out/`（`next.config.ts` 已设 `output: "export"` 与 `basePath: "/drawrule-site"`）；
推送到 `main` 后由 `.github/workflows/deploy.yml` 自动重新发布，无需手动上传。

## 功能

| 区块 | 能力 |
|---|---|
| 顶部工具条 | 关闭 / 撤销 / 恢复 / 清除 / 分享 / 保存（导出 PNG）/ 设置 |
| 走势表 | 期号+日期+星期 / 前四位和值 / 万-十 4 列 / 个位（浅底）；每 4 期一条粗分割线 |
| 画规 | 直线（两端吸附号码格，实心圆+白字徽标）、折线（逐格吸附）、自由手绘；**拖线身平移整条线、拖端点折弯/拉直、松开自动吸附号码格** |
| 色板 | 8 色竖排胶囊，展开时显示 3 个工具按钮 |
| 锁定 | 锁定后画板不可编辑 |
| 设置 | 期数 20/40/60/80、字体 标准/大号/超大号、4 套皮肤（全局换色）、缩放 50–100%、分割线（4 期/本年/全部）、号码样式（文本/空心方/空心圆/实心方/实心圆） |
| 号码标记 | 号码样式是**点击标记的形状**：单击表格里的号码即按当前样式打标，再点一次取消；表格数字本身始终为纯文本 |
| 首次引导 | 遮罩 + 竖排提示 + 上下箭头 + 「知道了」，写 localStorage 只出现一次 |

设置项与画线状态分别持久化到 `localStorage`（`drawrule:settings:v1` / `drawrule:tutorial:v1`），画线不进存储（刷新即清空）。

## 目录

```
app/                       # 布局、页面、全局样式（设计 token 在 @theme）
src/components/drawrule/   # Toolbar / ChartBoard / BottomBar / SettingsSheet / TutorialMask / render / icons / types
src/data/draws.ts          # 26246–26305 期开奖数据（公开开奖信息）
docs/research/drawrule/    # 勘查记录：page-brief、asset-map、6 份组件规格
docs/research/design-references/drawrule/  # 原站与克隆版截图（桌面/移动/引导/设置/色板/画线）
SANITIZATION-NOTES.md      # 资产消毒记录与已知偏差
```

## 已知偏差

见 `SANITIZATION-NOTES.md`。要点：桌面端改为居中 390px 画板（原站按 vw 无限放大）、三套皮肤配色为缩略图近似值、分享/保存按浏览器能力实现。
