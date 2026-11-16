# 资源清单 — drawrule

| 类型 | 原始 URL / 形式 | 处置方式 |
|---|---|---|
| 品牌 logo（`images/shichail_logo.png`、apple-touch-icon、启动图 5 张） | `static.shichaisz.com/xcxweb/images/*` | **不搬**，改用中性文字标识 `BRAND` |
| 站点标题 / 品牌名（拾柴排列五） | HTML `<title>`、`application-name` | **替换**为「走势画规 · 示例」 |
| 工具条图标（关闭/撤销/恢复/清除/分享/保存/设置，iconfont 私有字体） | 内联 iconfont 字形 | **重绘**为内联 SVG（自绘路径，功能等价），不复制字体文件 |
| 底部锁图标、笔触图标（base64 PNG） | 内联 base64 | **重绘**为内联 SVG |
| 引导层箭头 / 手型图标 | 页面内绘制 | **重绘**（SVG 箭头 + 手型） |
| 开奖号码数据（期号 / 日期 / 五位号码） | 页面渲染文本 | **保留**（客观事实数据，非版权表达）；克隆版取本地 JSON，来源中国体彩公开开奖信息 |
| 页面 CSS / JS（Vue + Fabric.js 实现） | 打包产物 | **不复制**，全部由 AI 重写（React + 原生 Canvas） |
| 皮肤预览缩略图（设置页 4 张小图） | 内联图片 | **重绘**为 CSS 迷你走势图（同结构、不同像素） |

## 说明

- 原站为微信生态 H5（`xcxweb` 目录、`from=seo` 落地参数）。克隆版不引入任何微信 JS-SDK，分享改为标准 Web Share API / 复制链接。
- 绘图层原站用 Fabric.js；克隆版用原生 Canvas 2D + Pointer Events 重写，不引入第三方绘图库。
