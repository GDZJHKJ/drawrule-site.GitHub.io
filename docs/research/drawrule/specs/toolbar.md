# 顶部工具条 Toolbar

## 结构
- fixed 顶栏（h-row=0.48rem，w-full），flex 横排，bg-brand，白字
  - item ×1：icon(0.163rem) + span(0.12rem) → 关闭
  - splitLine：1px×0.144rem，白色，左右各留 5px
  - item ×6（opBtn）：撤销 / 恢复 / 清除 / 分享 / 保存 / 设置
- 每项宽 54px（≈0.519rem），flex-column 居中，gap 3px

## 样式
- 背景 `--color-brand`；文字 `#fff`，font-weight 700
- 图标 17px（0.163rem），标签 12.48px（0.12rem）
- 点击态：opacity .6（原站无过渡，克隆版加 120ms）

## 交互
- 撤销/恢复/清除：操作绘线历史；无历史时置 40% 透明且不可点
- 分享：Web Share API → 复制链接兜底 → toast
- 保存：把画板渲染成 PNG 下载
- 设置：推入设置页
- 关闭：history.back()，无历史时 toast「演示页」
