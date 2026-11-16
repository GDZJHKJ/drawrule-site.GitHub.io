# 走势画板 ChartBoard

## 结构
```
.board (relative, h = rows×rowH, overflow 由外层滚动)
├─ .bg-stage   absolute left 0              w-stage  bg brand
├─ .bg-stat    absolute left w-stage        w-stat   bg pale
├─ .bg-front   absolute left w-stage+w-stat w-front×4 bg paper
├─ .bg-end     absolute right 0             w-end    bg pale
├─ rows[]      flex, h-row
│   ├─ .stage   w-stage 期号(0.16rem,白,700) + 日期(0.10rem, mt .05rem)
│   ├─ .stat    w-stat  和值(0.16rem, muted)
│   ├─ .front ×4 w-front 数字(0.30rem,700, ink)
│   └─ .end     w-end   个位(0.30rem,700, muted)
├─ .lineV ×4   absolute w-stage右(2px brand-deep) / stat右(2px) / 前3列间(1px grid) / end左(2px)
└─ .lineH[]    absolute w-full 1px grid；每 4 行 2px brand-deep
```
列宽（390 视口实测）：stage 73.84、stat 31、front 57×4、end 56；行高 50。

## 样式
- 行内容垂直居中，数字居中；字体 Avenir/Helvetica/Arial 700
- 行分割线贴行底；粗分割线（四期）间隔 200px = 4 行
- 高度：默认 60 期数据 + 6 行空行 = 66 行 × 50px = 3300px

## 交互
- 外层纵向滚动，初始滚到底（最新一期）
- 期号列（mask 区）拖拽 = 滚动
- 号码区指针拖拽 = 画规（见 drawing-layer.md）
- 点击数字无跳转
