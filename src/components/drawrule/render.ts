import type { Draw } from "@/data/draws";
import type { NumberStyle, Settings, Stroke } from "./types";
import { FONT_SCALE } from "./types";

export type Geo = { u: number; stageW: number; statW: number; frontW: number; endW: number; rowH: number };

export const EMPTY_ROWS = 6;

export function midOf(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function handlePoints(s: Stroke) {
  if (s.points.length > 2) return s.points.slice(1, -1);
  return [midOf(s.points[0], s.points[s.points.length - 1])];
}

export function drawBadge(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, fill: string, fs: number) {
  const r = fs * 0.56;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.22)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${fs * 0.52}px Avenir, Helvetica, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + fs * 0.03);
  ctx.restore();
}

export function drawHandle(ctx: CanvasRenderingContext2D, x: number, y: number, fill: string) {
  ctx.save();
  ctx.fillStyle = fill;
  // 中心圆点
  ctx.beginPath();
  ctx.arc(x, y, 4.2, 0, Math.PI * 2);
  ctx.fill();
  // 上下小三角，提示可拖动
  const t = 4.6;
  ctx.beginPath();
  ctx.moveTo(x, y - 7.4);
  ctx.lineTo(x - t, y - 7.4 - t);
  ctx.lineTo(x + t, y - 7.4 - t);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y + 7.4);
  ctx.lineTo(x - t, y + 7.4 + t);
  ctx.lineTo(x + t, y + 7.4 + t);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawStroke(
  ctx: CanvasRenderingContext2D,
  s: Stroke,
  digits: string[],
  numFs: number,
) {
  if (s.points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  s.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  ctx.restore();

  if (!s.badges) return;
  const ends = [s.points[0], s.points[s.points.length - 1]];
  for (const p of ends) {
    if (p.row === undefined || p.col === undefined) continue;
    drawBadge(ctx, p.x, p.y, digits[p.row]?.[p.col] ?? "", s.color, numFs);
  }
  for (const m of handlePoints(s)) drawHandle(ctx, m.x, m.y, s.color);
}

type PaintOpts = {
  width: number;
  height: number;
  geo: Geo;
  draws: Draw[];
  settings: Settings;
  strokes: Stroke[];
  markers?: Record<string, NumberStyle>;
  skin: { brand: string; brandDeep: string; pale: string; paper: string; muted: string; grid: string; ink: string };
};

/** 把整块画板（背景 + 行 + 网格 + 绘线）画到 2D 上下文，用于导出 PNG */
export function paintChart(ctx: CanvasRenderingContext2D, o: PaintOpts) {
  const { geo, draws, settings, strokes, skin, markers } = o;
  const rows = settings.rows;
  const visible = draws.slice(-rows);
  const total = visible.length + EMPTY_ROWS;
  const fs = FONT_SCALE[settings.fontSize] * geo.u * 0.3;

  ctx.fillStyle = skin.paper;
  ctx.fillRect(0, 0, o.width, o.height);
  ctx.fillStyle = skin.brand;
  ctx.fillRect(0, 0, geo.stageW, o.height);
  ctx.fillStyle = skin.pale;
  ctx.fillRect(geo.stageW, 0, geo.statW, o.height);
  ctx.fillRect(geo.stageW + geo.statW + geo.frontW * 4, 0, geo.endW, o.height);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < total; i++) {
    const d = visible[i];
    const y = geo.rowH * i;
    const cy = y + geo.rowH / 2;
    const bold =
      settings.divider === "all" ||
      (settings.divider === "four" && (i + 1) % 4 === 0) ||
      (settings.divider === "year" &&
        i > 0 &&
        !!d &&
        !!visible[i - 1] &&
        d.date.slice(0, 4) !== visible[i - 1].date.slice(0, 4));
    ctx.fillStyle = bold ? skin.brandDeep : skin.grid;
    ctx.fillRect(0, y + geo.rowH - (bold ? 2 : 1), o.width, bold ? 2 : 1);
    if (!d) {
      if (i === visible.length) {
        ctx.fillStyle = "#ffffff";
        ctx.font = `700 ${geo.u * 0.16}px Avenir, Helvetica, Arial, sans-serif`;
        ctx.fillText(String(Number(visible[visible.length - 1].period) + 1), geo.stageW / 2, cy - geo.u * 0.05);
      }
      continue;
    }
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${geo.u * 0.16}px Avenir, Helvetica, Arial, sans-serif`;
    ctx.fillText(d.period, geo.stageW / 2, cy - geo.u * 0.05);
    ctx.font = `${geo.u * 0.1}px Avenir, Helvetica, Arial, sans-serif`;
    ctx.fillText(`${d.mmdd} ${d.week}`, geo.stageW / 2, cy + geo.u * 0.075);
    ctx.fillStyle = skin.muted;
    ctx.font = `700 ${geo.u * 0.16}px Avenir, Helvetica, Arial, sans-serif`;
    const sum = d.num.slice(0, 4).split("").reduce((a, c) => a + Number(c), 0);
    ctx.fillText(String(sum), geo.stageW + geo.statW / 2, cy);
    for (let c = 0; c < 5; c++) {
      const cx =
        c < 4
          ? geo.stageW + geo.statW + geo.frontW * (c + 0.5)
          : geo.stageW + geo.statW + geo.frontW * 4 + geo.endW / 2;
      const mk = markers?.[`${d.period}:${c}`];
      const size = fs * 1.12;
      if (mk && mk !== "text") {
        const solid = mk === "solidCircle" || mk === "solidSquare";
        const circle = mk === "hollowCircle" || mk === "solidCircle";
        ctx.save();
        ctx.lineWidth = Math.max(1.5, fs * 0.07);
        ctx.strokeStyle = "#FD3D44";
        ctx.fillStyle = "#FD3D44";
        ctx.beginPath();
        if (circle) ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
        else {
          const x0 = cx - size / 2;
          const y0 = cy - size / 2;
          if (typeof ctx.roundRect === "function") ctx.roundRect(x0, y0, size, size, fs * 0.12);
          else ctx.rect(x0, y0, size, size);
        }
        if (solid) ctx.fill();
        else ctx.stroke();
        ctx.fillStyle = solid ? "#ffffff" : "#FD3D44";
        ctx.font = `700 ${fs * 0.58}px Avenir, Helvetica, Arial, sans-serif`;
        ctx.fillText(d.num[c], cx, cy);
        ctx.restore();
      } else {
        ctx.fillStyle = mk === "text" ? "#FD3D44" : c < 4 ? skin.ink : skin.muted;
        ctx.font = `700 ${fs * 0.58}px Avenir, Helvetica, Arial, sans-serif`;
        ctx.fillText(d.num[c], cx, cy);
      }
    }
  }

  ctx.fillStyle = skin.brandDeep;
  ctx.fillRect(geo.stageW - 1, 0, 2, o.height);
  ctx.fillRect(geo.stageW + geo.statW - 1, 0, 2, o.height);
  ctx.fillStyle = skin.grid;
  for (let c = 1; c <= 3; c++) ctx.fillRect(geo.stageW + geo.statW + geo.frontW * c, 0, 1, o.height);
  ctx.fillStyle = skin.brandDeep;
  ctx.fillRect(o.width - geo.endW - 1, 0, 2, o.height);

  ctx.save();
  ctx.translate(geo.stageW, 0);
  for (const s of strokes) drawStroke(ctx, s, visible.map((d) => d.num), fs);
  ctx.restore();
}
