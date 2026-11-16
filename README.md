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
| 顶部工具条 | 关闭 / 撤销 / 恢复 / 清除（画线 + 号码标记一起清）/ 分享 / 保存（导出 PNG）/ 设置 |
| 走势表 | 期号+日期+星期 / 前四位和值 / 万-十 4 列 / 个位（浅底）；每 4 期一条粗分割线 |
| 画规 | 直线（两端吸附号码格，实心圆+白字徽标）、折线（逐格吸附）、自由手绘；**拖端点换号码格、拖中点把手折弯/拉直（两点直线首次拖动自动插入折点），整条线不能被搬走**；拖动结果始终夹在画板内。命中优先级为「端点徽标 > 号码格 > 折弯把手 > 自由笔迹」——**连线可以压过号码，但不挡住号码的点击**，线穿过的号码照样能打标记、照样能起新线。连线绘制在号码**下层**（双 canvas：连线层在行 DOM 之前、徽标层在之后），穿过号码时数字完整可读；折弯把手若落在号码格上则不绘制、不可抓（避免压在数字上） |
| 色板 | 8 色竖排胶囊，展开时显示 3 个工具按钮 |
| 锁定 | 锁定后画板不可编辑 |
| 设置 | 期数 20/40/60/80、字体 标准/大号/超大号、4 套皮肤（全局换色）、画板缩放 50–100%（100% 铺满，画板宽度始终自适应屏幕）、分割线（4 期/本年/全部）、号码样式（文本/空心方/空心圆/实心方/实心圆，颜色跟随当前画笔） |
| 号码标记 | 号码样式是**点击标记的形状**，颜色取当前画笔色（与画规线同一套颜色逻辑）：单击号码即按当前样式+笔色打标；**同色再点取消，换一种颜色再点直接改色**；表格数字本身始终为纯文本 |
| 首次引导 | 遮罩 + 竖排提示 + 上下箭头 + 「知道了」，写 localStorage 只出现一次 |

设置项与画线状态分别持久化到 `localStorage`（`drawrule:settings:v1` / `drawrule:tutorial:v1`），画线不进存储（刷新即清空）。

## 开奖数据同步

| 环节 | 说明 |
|---|---|
| 数据文件 | `public/data/draws.json`（最近 100–500 期，含 `updatedAt` / `source` / `list`） |
| 抓取脚本 | `scripts/fetch-draws.mjs`：官方接口 → 500.com 静态镜像兜底；写入前与仓库现有数据做**重叠期逐条校验**，号码/日期有任何不一致即放弃本次更新 |
| 定时任务 | `.github/workflows/deploy.yml` 每天北京时间 21:00–22:55 每 5 分钟跑一次；有新期号才提交数据并重新构建发布，没有则不产生任何提交 |
| 前端加载 | 页面打开拉一次 `data/draws.json`，之后每 5 分钟 + 每次切回前台再拉；失败自动回落内置快照（`src/data/draws.ts`） |
| 隐藏管理入口 | 设置页最底部「数据同步 v2.1」**连续点击 5 次** → 数据面板：查看数据来源/最新期号/同步时间、立即拉取、手动补录某期（写本机 `localStorage`，仅本设备生效） |

## 目录

```
app/                       # 布局、页面、全局样式（设计 token 在 @theme）
src/components/drawrule/   # Toolbar / ChartBoard / BottomBar / SettingsSheet / TutorialMask / render / icons / types
src/data/draws.ts          # 内置兜底开奖数据（公开开奖信息）
src/lib/draws.ts           # 远程数据加载 / 本地补录合并
scripts/fetch-draws.mjs    # 开奖数据抓取与重叠期校验
public/data/draws.json     # 站点运行时读取的开奖数据（由定时任务更新）
docs/research/drawrule/    # 勘查记录：page-brief、asset-map、6 份组件规格
docs/research/design-references/drawrule/  # 原站与克隆版截图（桌面/移动/引导/设置/色板/画线）
SANITIZATION-NOTES.md      # 资产消毒记录与已知偏差
```

## 已知偏差

见 `SANITIZATION-NOTES.md`。要点：桌面端改为居中 390px 画板（原站按 vw 无限放大）、三套皮肤配色为缩略图近似值、分享/保存按浏览器能力实现。

数据更新的副作用：期号整体前移会让已画的线错行，因此当前端检测到最新期号变化时会清空画线与标记并提示（每天最多一次）。
