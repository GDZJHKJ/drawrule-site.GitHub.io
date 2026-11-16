export type Skin = "classic" | "eyecare" | "night" | "vintage";
export type FontSize = "standard" | "large" | "xlarge";
export type DividerMode = "four" | "year" | "all";
export type NumberStyle = "text" | "hollowSquare" | "hollowCircle" | "solidSquare" | "solidCircle";
export type ToolMode = "line" | "poly" | "free";

export type Settings = {
  rows: 20 | 40 | 60 | 80;
  fontSize: FontSize;
  skin: Skin;
  zoom: number; // 50 - 100
  divider: DividerMode;
  numStyle: NumberStyle;
};

/** 号码标记：形状来自设置里的「号码样式」，颜色跟随当前画笔颜色 */
export type Marker = { style: NumberStyle; color: string };

export type Point = { x: number; y: number; row?: number; col?: number };

export type Stroke = {
  id: string;
  mode: ToolMode;
  color: string;
  width: number;
  points: Point[];
  /** 端点是否带数字徽标（直线/折线） */
  badges: boolean;
};

// 源站默认「大号」时号码字号实测 31.2px（= 0.3rem × 104），基准按大号=1 折算
export const FONT_SCALE: Record<FontSize, number> = {
  standard: 0.87,
  large: 1,
  xlarge: 1.15,
};

export const SKINS: { key: Skin; label: string }[] = [
  { key: "classic", label: "经典皮肤" },
  { key: "eyecare", label: "护眼皮肤" },
  { key: "night", label: "夜间皮肤" },
  { key: "vintage", label: "怀旧皮肤" },
];

export const PALETTE = [
  { color: "#FE0000", label: "红" },
  { color: "#1E3FE0", label: "蓝" },
  { color: "#8B2FD0", label: "紫" },
  { color: "#F2701D", label: "橙" },
  { color: "#5CB85C", label: "绿" },
  { color: "#A0522D", label: "棕" },
  { color: "#17C3C0", label: "青" },
  { color: "#111111", label: "黑" },
];

export const DEFAULT_SETTINGS: Settings = {
  rows: 60,
  fontSize: "large",
  skin: "eyecare",
  zoom: 100,
  divider: "four",
  numStyle: "text",
};
