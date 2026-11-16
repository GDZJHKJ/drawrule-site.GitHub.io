"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Draw } from "@/data/draws";
import type { Marker, Settings, Stroke, ToolMode, Point } from "./types";
import { FONT_SCALE } from "./types";
import { EMPTY_ROWS, drawHandles, drawStrokeBadges, drawStrokeBody, midOf, pointInCell } from "./render";

export type Geometry = {
  u: number;
  stageW: number;
  statW: number;
  frontW: number;
  endW: number;
  rowH: number;
  /** 整个画板宽度 = stage + stat + 4*front + end */
  boardW: number;
};

/** 源站设计稿的列宽比例之和（0.71 + 0.298 + 0.548*4 + 0.538） */
export const BOARD_RATIO = 0.71 + 0.298 + 0.548 * 4 + 0.538;

/**
 * 几何完全由「容器实际宽度」推导：100% 缩放时画板恰好铺满容器宽度，
 * 手机窄屏、平板、桌面嵌入都能自适应，不再依赖 window.innerWidth。
 */
export function useGeometry(width: number, zoom = 100): Geometry {
  const u = useMemo(() => {
    const basis = width > 0 ? width : 390;
    return (basis * zoom) / 100 / BOARD_RATIO;
  }, [width, zoom]);
  return useMemo(
    () => ({
      u,
      stageW: u * 0.71,
      statW: u * 0.298,
      frontW: u * 0.548,
      endW: u * 0.538,
      rowH: u * 0.48,
      boardW: u * BOARD_RATIO,
    }),
    [u],
  );
}

type Props = {
  draws: Draw[];
  settings: Settings;
  strokes: Stroke[];
  markers: Record<string, Marker>;
  onCommit: (stroke: Stroke) => void;
  onUpdateStroke: (id: string, points: Point[]) => void;
  onToggleMarker: (period: string, col: number) => void;
  locked: boolean;
  color: string;
  tool: ToolMode;
  boardRef: React.RefObject<HTMLDivElement | null>;
  onReady?: () => void;
  onGeometry?: (geo: Geometry) => void;
};

type DragState = {
  id: string;
  /** endpoint = 拖端点改挂靠号码；bend = 拖中点折弯；pan = 自由笔迹整体平移 */
  mode: "endpoint" | "bend" | "pan";
  /** 端点/中间点在线段数组里的下标；-1 表示「两点直线插入新中点」 */
  index: number;
  /** 拖动开始时的原始点，位移始终基于它计算，避免逐帧累积 */
  base: Point[];
  /** 当前（最近一次）位置，松手时用于吸附 */
  points: Point[];
  startX: number;
  startY: number;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export default function ChartBoard({
  draws,
  settings,
  strokes,
  markers,
  onCommit,
  onUpdateStroke,
  onToggleMarker,
  locked,
  color,
  tool,
  boardRef,
  onReady,
  onGeometry,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState<Stroke | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const tapRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [containerW, setContainerW] = useState(0);

  /* ---------- 容器宽度自适应 ---------- */
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const measure = () => setContainerW(Math.round(el.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("orientationchange", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", measure);
    };
  }, []);

  const geo = useGeometry(containerW, settings.zoom);
  const rows = settings.rows;
  const visible = useMemo(() => draws.slice(-rows), [draws, rows]);
  const totalRows = visible.length + EMPTY_ROWS;
  const fontScale = FONT_SCALE[settings.fontSize];
  const boardH = totalRows * geo.rowH;
  const numFs = geo.u * 0.3 * fontScale;
  const boardW = geo.boardW;

  useEffect(() => {
    onGeometry?.(geo);
  }, [geo, onGeometry]);

  /* ---------- 尺寸同步（连线层与徽标层同几何） ---------- */
  const syncSize = (el: HTMLCanvasElement | null, w: number, h: number) => {
    if (!el) return;
    const dpr = window.devicePixelRatio || 1;
    el.width = Math.round(w * dpr);
    el.height = Math.round(h * dpr);
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
  };
  useLayoutEffect(() => {
    const w = Math.max(0, boardW - geo.stageW);
    const h = boardH;
    syncSize(canvasRef.current, w, h);
    syncSize(bgCanvasRef.current, w, h);
    setCanvasSize({ w, h });
  }, [boardW, boardH, geo.stageW]);

  /* ---------- 初始滚到底部 ---------- */
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    onReady?.();
  }, [onReady, rows]);

  /* ---------- 坐标换算（均为 canvas 局部坐标） ---------- */
  const cellCenter = useCallback(
    (row: number, col: number): { x: number; y: number } => {
      const base = geo.statW;
      const x = col < 4 ? base + geo.frontW * (col + 0.5) : base + geo.frontW * 4 + geo.endW / 2;
      return { x, y: geo.rowH * (row + 0.5) };
    },
    [geo],
  );

  const hitCell = useCallback(
    (x: number, y: number): { row: number; col: number } | null => {
      const row = Math.floor(y / geo.rowH);
      if (row < 0 || row >= totalRows) return null;
      if (x < geo.statW) return null;
      let col: number;
      if (x < geo.statW + geo.frontW * 4) col = Math.floor((x - geo.statW) / geo.frontW);
      else col = 4;
      if (col < 0 || col > 4) return null;
      if (row >= visible.length) return null; // 空行不可画
      return { row, col };
    },
    [geo, totalRows, visible.length],
  );

  /** 落点吸附到最近号码格（拖动结束用） */
  const snapPoint = useCallback(
    (p: Point): Point => {
      const row = Math.min(Math.max(Math.round(p.y / geo.rowH - 0.5), 0), visible.length - 1);
      const base = geo.statW;
      let col: number;
      if (p.x < base + geo.frontW * 4) col = Math.min(Math.max(Math.floor((p.x - base) / geo.frontW), 0), 3);
      else col = 4;
      if (!Number.isFinite(row) || row < 0) return { x: p.x, y: p.y };
      if (p.x < base) return { x: p.x, y: p.y }; // 落在期号/和值列，保持自由位置
      return { ...cellCenter(row, col), row, col };
    },
    [cellCenter, geo, visible.length],
  );

  const toLocal = (e: React.PointerEvent): { x: number; y: number } => {
    const el = canvasRef.current!;
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  /* ---------- 绘制：连线层在号码下方，徽标层在号码上方 ---------- */
  const render = useCallback(() => {
    const fg = canvasRef.current;
    const bg = bgCanvasRef.current;
    const cFg = fg?.getContext("2d");
    const cBg = bg?.getContext("2d");
    if (!cFg || !cBg) return;
    const dpr = window.devicePixelRatio || 1;
    cFg.setTransform(dpr, 0, 0, dpr, 0, 0);
    cBg.setTransform(dpr, 0, 0, dpr, 0, 0);
    cFg.clearRect(0, 0, canvasSize.w, canvasSize.h);
    cBg.clearRect(0, 0, canvasSize.w, canvasSize.h);
    const all = draft ? [...strokes, draft] : strokes;
    const digits = visible.map((d) => d.num);
    for (const s of all) {
      drawStrokeBody(cBg, s);
      drawHandles(cBg, s, geo, visible.length);
    }
    for (const s of all) drawStrokeBadges(cFg, s, digits, numFs);
  }, [strokes, draft, canvasSize, numFs, visible, geo]);

  useEffect(() => {
    render();
  }, [render]);

  /* ---------- 命中测试 ----------
   * 优先级：端点徽标（本来就盖在号码格正中）> 号码格 > 折弯把手 > 自由笔迹。
   * 号码格优先于线条：连线可以穿过号码，但不能挡住号码的点击。
   */
  const segDist = (px: number, py: number, a: Point, b: Point) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy || 1;
    const t = Math.min(Math.max(((px - a.x) * dx + (py - a.y) * dy) / len2, 0), 1);
    return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
  };

  const mkDrag = (s: Stroke, mode: DragState["mode"], index: number, x: number, y: number): DragState => {
    const copy = s.points.map((p) => ({ ...p }));
    return { id: s.id, mode, index, base: copy, points: copy, startX: x, startY: y };
  };

  /** 拖端点 = 换挂靠号码（徽标压在号码格正中，半径很小，保持最高优先级） */
  const pickEndpoint = (x: number, y: number): DragState | null => {
    const r = numFs * 0.62 + 6;
    for (let i = strokes.length - 1; i >= 0; i--) {
      const s = strokes[i];
      if (!s.badges || s.points.length < 2) continue;
      const last = s.points.length - 1;
      for (const k of [0, last]) {
        if (Math.hypot(s.points[k].x - x, s.points[k].y - y) < r) return mkDrag(s, "endpoint", k, x, y);
      }
    }
    return null;
  };

  /** 拖中点把手 = 折弯（两点直线首次拖动会插入一个中点）；压在号码格上的把手不可抓 */
  const pickBend = (x: number, y: number): DragState | null => {
    for (let i = strokes.length - 1; i >= 0; i--) {
      const s = strokes[i];
      if (!s.badges || s.points.length < 2) continue;
      const last = s.points.length - 1;
      const cand =
        s.points.length > 2
          ? s.points.slice(1, -1).map((p, k) => ({ p, index: k + 1 }))
          : [{ p: midOf(s.points[0], s.points[last]), index: -1 }];
      for (const c of cand) {
        if (pointInCell(c.p, geo, visible.length)) continue;
        if (Math.hypot(c.p.x - x, c.p.y - y) < 24) return mkDrag(s, "bend", c.index, x, y);
      }
    }
    return null;
  };

  /** 自由笔迹：只能整体平移，且松手前会被夹在画板内 */
  const pickFree = (x: number, y: number): DragState | null => {
    for (let i = strokes.length - 1; i >= 0; i--) {
      const s = strokes[i];
      if (s.badges || s.points.length < 2) continue;
      for (let k = 0; k < s.points.length - 1; k++) {
        if (segDist(x, y, s.points[k], s.points[k + 1]) < 14) return mkDrag(s, "pan", -1, x, y);
      }
    }
    return null;
  };

  /* ---------- 指针交互 ---------- */
  const onPointerDown = (e: React.PointerEvent) => {
    if (locked) return;
    const { x, y } = toLocal(e);
    tapRef.current = { x: e.clientX, y: e.clientY, moved: false };

    // 1) 端点徽标优先：徽标本来就盖在号码格正中，点中徽标 = 拖端点换号
    const ep = pickEndpoint(x, y);
    if (ep) {
      dragRef.current = ep;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    // 2) 号码格优先于线条：即使有连线穿过该号码，点击/起线仍然归号码
    const cell = hitCell(x, y);
    if (cell) {
      const start: Point = { ...cellCenter(cell.row, cell.col), ...cell };
      const stroke: Stroke = {
        id: `s${Date.now()}${Math.random().toString(16).slice(2, 6)}`,
        mode: tool,
        color,
        width: 2.5,
        points: [start],
        badges: tool !== "free",
      };
      setDraft(stroke);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    // 3) 非号码区：折弯把手 → 自由笔迹平移 → 自由画笔起笔
    const bend = pickBend(x, y);
    if (bend) {
      dragRef.current = bend;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
    const pan = pickFree(x, y);
    if (pan) {
      dragRef.current = pan;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
    if (tool !== "free") return;
    setDraft({
      id: `s${Date.now()}${Math.random().toString(16).slice(2, 6)}`,
      mode: "free",
      color,
      width: 2.5,
      points: [{ x, y }],
      badges: false,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const { x, y } = toLocal(e);
    if (tapRef.current && !tapRef.current.moved) {
      if (Math.hypot(e.clientX - tapRef.current.x, e.clientY - tapRef.current.y) > 8) tapRef.current.moved = true;
    }
    if (dragRef.current) {
      const d = dragRef.current;
      const dx = x - d.startX;
      const dy = y - d.startY;
      let next: Point[];

      if (d.mode === "endpoint") {
        next = d.base.map((p, i) =>
          i === d.index ? { ...p, x: clamp(p.x + dx, 0, canvasSize.w), y: clamp(p.y + dy, 0, canvasSize.h), row: undefined, col: undefined } : p,
        );
      } else if (d.mode === "bend") {
        if (d.index < 0) {
          // 两点直线 → 插入中点形成折弯
          const a = d.base[0];
          const b = d.base[d.base.length - 1];
          const m = midOf(a, b);
          next = [
            a,
            { ...m, x: clamp(m.x + dx, 0, canvasSize.w), y: clamp(m.y + dy, 0, canvasSize.h) },
            b,
          ];
        } else {
          next = d.base.map((p, i) =>
            i === d.index ? { ...p, x: clamp(p.x + dx, 0, canvasSize.w), y: clamp(p.y + dy, 0, canvasSize.h) } : p,
          );
        }
      } else {
        // 自由笔迹整体平移：按包围盒夹取，保证整条线留在画板内
        const xs = d.base.map((p) => p.x);
        const ys = d.base.map((p) => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const ddx = clamp(dx, -minX, Math.max(0, canvasSize.w - maxX));
        const ddy = clamp(dy, -minY, Math.max(0, canvasSize.h - maxY));
        next = d.base.map((p) => ({ ...p, x: p.x + ddx, y: p.y + ddy }));
      }

      // 关键：把移动结果写回 dragRef，松手吸附时才能基于最新位置
      dragRef.current = { ...d, points: next };
      onUpdateStroke(d.id, next);
      return;
    }
    if (!draft) return;
    if (draft.mode === "free") {
      setDraft({ ...draft, points: [...draft.points, { x, y }] });
      return;
    }
    const cell = hitCell(x, y);
    const target: Point = cell ? { ...cellCenter(cell.row, cell.col), ...cell } : { x, y };
    if (draft.mode === "line") {
      setDraft({ ...draft, points: [draft.points[0], target] });
    } else {
      const last = draft.points[draft.points.length - 1];
      if (cell && (last.row !== cell.row || last.col !== cell.col)) {
        setDraft({ ...draft, points: [...draft.points, target] });
      }
    }
  };

  const onPointerUp = () => {
    if (dragRef.current) {
      const d = dragRef.current;
      // 端点松手吸附号码格；折弯点保持自由位置
      const snapped = d.mode === "endpoint" ? d.points.map((p, i) => (i === d.index ? snapPoint(p) : p)) : d.points;
      onUpdateStroke(d.id, snapped);
      dragRef.current = null;
      tapRef.current = null;
      return;
    }
    if (!draft) {
      tapRef.current = null;
      return;
    }
    const tapped = tapRef.current && !tapRef.current.moved;
    tapRef.current = null;
    const first = draft.points[0];

    // 单击：给该号码打上/取消「号码样式」标记
    if (tapped && first.row !== undefined && first.col !== undefined) {
      const d = visible[first.row];
      if (d) onToggleMarker(d.period, first.col);
      setDraft(null);
      return;
    }

    const pts = draft.points;
    let ok = false;
    if (draft.mode === "free") ok = pts.length > 2;
    else {
      const a = pts[0];
      const b = pts[pts.length - 1];
      ok = pts.length > 1 && !(a.row === b.row && a.col === b.col);
    }
    if (ok) onCommit(draft);
    setDraft(null);
  };

  const colWidths = [geo.frontW, geo.frontW, geo.frontW, geo.frontW, geo.endW];
  const nextPeriod = visible.length ? String(Number(visible[visible.length - 1].period) + 1) : "";
  const mkSize = numFs * 1.12;

  const digit = (d: Draw, c: number) => {
    const m = markers[`${d.period}:${c}`];
    if (m) {
      const solid = m.style === "solidSquare" || m.style === "solidCircle";
      const circle = m.style === "hollowCircle" || m.style === "solidCircle";
      return (
        <span
          className={`flex items-center justify-center font-bold leading-none ${m.style === "text" || circle ? "" : "rounded-[0.045rem]"} ${circle ? "rounded-full" : ""}`}
          style={{
            fontSize: numFs,
            width: m.style === "text" ? undefined : mkSize,
            height: m.style === "text" ? undefined : mkSize,
            color: solid ? "#ffffff" : m.color,
            background: solid ? m.color : undefined,
            border: m.style === "text" || solid ? undefined : `2px solid ${m.color}`,
          }}
        >
          {d.num[c]}
        </span>
      );
    }
    return (
      <span
        className={`font-bold leading-none ${c === 4 ? "text-muted" : "text-ink"}`}
        style={{ fontSize: numFs }}
      >
        {d.num[c]}
      </span>
    );
  };

  return (
    <div
      ref={scrollerRef}
      className="no-scrollbar relative overflow-x-hidden overflow-y-auto"
      style={{ height: "100%", background: "var(--skin-paper)" }}
    >
      {/* 顶部留白：给浮动玻璃工具栏让位 */}
      <div aria-hidden style={{ height: "0.48rem" }} />
      <div ref={boardRef} className="relative mx-auto" style={{ height: boardH, width: boardW }}>
        {/* 背景层 */}
        <div className="absolute inset-y-0 left-0 bg-brand" style={{ width: geo.stageW }} />
        <div className="absolute inset-y-0 bg-pale" style={{ left: geo.stageW, width: geo.statW }} />
        <div
          className="absolute inset-y-0 bg-paper"
          style={{ left: geo.stageW + geo.statW, width: geo.frontW * 4 }}
        />
        <div className="absolute inset-y-0 right-0 bg-pale" style={{ width: geo.endW }} />

        {/* 连线层：在号码下方 —— 线条穿过号码不遮挡数字 */}
        <canvas
          ref={bgCanvasRef}
          className="pointer-events-none absolute top-0"
          style={{ left: geo.stageW }}
        />

        {/* 行 */}
        <div className="relative flex flex-col">
          {Array.from({ length: totalRows }).map((_, i) => {
            const d = visible[i];
            const sum = d ? d.num.slice(0, 4).split("").reduce((a, c) => a + Number(c), 0) : null;
            const bold =
              settings.divider === "all" ||
              (settings.divider === "four" && (i + 1) % 4 === 0) ||
              (settings.divider === "year" && i > 0 && visible[i] && visible[i - 1] && visible[i].date.slice(0, 4) !== visible[i - 1].date.slice(0, 4));
            return (
              <div
                key={i}
                className="relative flex items-center"
                style={{
                  height: geo.rowH,
                  borderBottom: `${bold ? 2 : 1}px solid var(--skin-${bold ? "brand-deep" : "grid"})`,
                }}
              >
                <div
                  className="flex flex-col items-center justify-center"
                  style={{ width: geo.stageW, height: geo.rowH, color: "#fff" }}
                >
                  <span className="leading-none font-bold" style={{ fontSize: geo.u * 0.16 }}>
                    {d?.period ?? (i === visible.length ? nextPeriod : "")}
                  </span>
                  {d ? (
                    <span className="leading-none" style={{ fontSize: geo.u * 0.1, marginTop: geo.u * 0.05 }}>
                      {d.mmdd} {d.week}
                    </span>
                  ) : null}
                </div>
                <div
                  className="flex items-center justify-center text-muted leading-none font-bold"
                  style={{ width: geo.statW, height: geo.rowH, fontSize: geo.u * 0.16 }}
                >
                  {sum ?? ""}
                </div>
                {[0, 1, 2, 3].map((c) => (
                  <div
                    key={c}
                    className="flex items-center justify-center leading-none"
                    style={{ width: colWidths[c], height: geo.rowH }}
                  >
                    {d ? digit(d, c) : null}
                  </div>
                ))}
                <div
                  className="flex items-center justify-center leading-none"
                  style={{ width: geo.endW, height: geo.rowH }}
                >
                  {d ? digit(d, 4) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* 纵向分割线 */}
        <div
          className="pointer-events-none absolute inset-y-0 bg-brand-deep"
          style={{ left: geo.stageW - 1, width: 2 }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 bg-brand-deep"
          style={{ left: geo.stageW + geo.statW - 1, width: 2 }}
        />
        {[1, 2, 3].map((c) => (
          <div
            key={c}
            className="pointer-events-none absolute inset-y-0 bg-grid"
            style={{ left: geo.stageW + geo.statW + geo.frontW * c, width: 1 }}
          />
        ))}
        <div
          className="pointer-events-none absolute inset-y-0 bg-brand-deep"
          style={{ right: geo.endW - 1, width: 2 }}
        />

        {/* 徽标层（最上）：只画端点徽标；锁定时完全不拦截触摸，滚动交还给容器 */}
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={`absolute top-0 ${locked ? "" : "touch-none"}`}
          style={{
            left: geo.stageW,
            cursor: locked ? "default" : "crosshair",
            pointerEvents: locked ? "none" : "auto",
          }}
        />
      </div>
    </div>
  );
}
