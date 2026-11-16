"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ChartBoard, { useGeometry, type Geometry } from "@/components/drawrule/ChartBoard";
import Toolbar from "@/components/drawrule/Toolbar";
import BottomBar from "@/components/drawrule/BottomBar";
import SettingsSheet from "@/components/drawrule/SettingsSheet";
import TutorialMask from "@/components/drawrule/TutorialMask";
import DataAdmin from "@/components/drawrule/DataAdmin";
import SavePreview from "@/components/drawrule/SavePreview";
import { DEFAULT_SETTINGS, type Marker, type Point, type Settings, type Stroke, type ToolMode } from "@/components/drawrule/types";
import { paintChart, rangeHeight } from "@/components/drawrule/render";
import { useDraws } from "@/lib/draws";

const STORE_KEY = "drawrule:settings:v1";
const TUT_KEY = "drawrule:tutorial:v1";
const CHART_KEY = "drawrule:chart:v1";

type PackedPoint = { row: number; col: number } | { fx: number; fy: number };
type SavedChart = {
  latest: string;
  rows: number;
  savedAt: string;
  markers: Record<string, Marker>;
  strokes: { id: string; mode: ToolMode; color: string; width: number; badges: boolean; points: PackedPoint[] }[];
};

export default function Page() {
  const { draws, info, refresh, manual, setManual } = useDraws();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const fallbackGeo = useGeometry(390, 100);
  const [geo, setGeo] = useState<Geometry>(fallbackGeo);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redo, setRedo] = useState<Stroke[]>([]);
  const [color, setColor] = useState("#FE0000");
  const [tool, setTool] = useState<ToolMode>("line");
  const [locked, setLocked] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [tutorial, setTutorial] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [markers, setMarkers] = useState<Record<string, Marker>>({});
  const [saveImg, setSaveImg] = useState<{ src: string; name: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [booted, setBooted] = useState(false);

  /* 读取本地设置 */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      if (!localStorage.getItem(TUT_KEY)) setTutorial(true);
    } catch {
      /* ignore */
    }
    setBooted(true);
  }, []);

  const patch = useCallback((p: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...p };
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  /* 开奖数据整体前移后，旧的画线会错行 —— 数据换新时清空画板并提示 */
  const hasContentRef = useRef(false);
  useEffect(() => {
    hasContentRef.current = strokes.length > 0 || Object.keys(markers).length > 0;
  }, [strokes, markers]);

  const lastPeriodRef = useRef<string | null>(null);
  useEffect(() => {
    const p = draws.length ? draws[draws.length - 1].period : null;
    if (!p) return;
    if (lastPeriodRef.current && p !== lastPeriodRef.current) {
      const had = hasContentRef.current;
      setStrokes([]);
      setRedo([]);
      setMarkers({});
      setDirty(false);
      try {
        localStorage.removeItem(CHART_KEY);
      } catch {
        /* ignore */
      }
      if (had) flash("开奖数据已更新，画板已重置");
    }
    lastPeriodRef.current = p;
  }, [draws, flash]);

  /* ---------- 画规存取：归一化坐标，缩放/换设备都能对上号码 ---------- */
  const packPoint = useCallback(
    (p: Point): PackedPoint =>
      p.row !== undefined && p.col !== undefined
        ? { row: p.row, col: p.col }
        : { fx: (p.x - geo.statW) / geo.frontW, fy: p.y / geo.rowH },
    [geo],
  );

  const centerOf = useCallback(
    (row: number, col: number) => ({
      x: col < 4 ? geo.statW + geo.frontW * (col + 0.5) : geo.statW + geo.frontW * 4 + geo.endW / 2,
      y: geo.rowH * (row + 0.5),
    }),
    [geo],
  );

  const unpackPoint = useCallback(
    (q: PackedPoint): Point =>
      "row" in q ? { ...centerOf(q.row, q.col), row: q.row, col: q.col } : { x: geo.statW + q.fx * geo.frontW, y: q.fy * geo.rowH },
    [centerOf, geo],
  );

  /* 打开页面：恢复上次「保存」下来的画规（期号不一致则不恢复，避免错行） */
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current || !booted || !draws.length) return;
    restoredRef.current = true;
    let saved: SavedChart | null = null;
    try {
      const raw = localStorage.getItem(CHART_KEY);
      if (raw) saved = JSON.parse(raw) as SavedChart;
    } catch {
      saved = null;
    }
    if (!saved || !saved.strokes) return;
    const latest = draws[draws.length - 1].period;
    if (saved.latest !== latest || saved.rows !== settings.rows) {
      try {
        localStorage.removeItem(CHART_KEY);
      } catch {
        /* ignore */
      }
      return;
    }
    const rows = saved.strokes.map((s) => ({ ...s, points: s.points.map(unpackPoint) }));
    setStrokes(rows as Stroke[]);
    setMarkers(saved.markers ?? {});
    setRedo([]);
    setDirty(false);
    flash("已恢复上次保存的画规");
  }, [booted, draws, settings.rows, unpackPoint, flash]);

  /* 缩放/窗口宽度变化：按比例缩放已画的线，避免与号码错位 */
  const prevU = useRef<number | null>(null);
  useEffect(() => {
    const u = geo.u;
    const before = prevU.current;
    prevU.current = u;
    if (!before || Math.abs(before - u) < 0.01) return;
    const k = u / before;
    setStrokes((prev) => (prev.length ? prev.map((s) => ({ ...s, points: s.points.map((p) => ({ ...p, x: p.x * k, y: p.y * k })) })) : prev));
  }, [geo.u]);

  /* 期数设置变更：可见行切片变了，行号对不上，画规只能清空 */
  const prevRows = useRef<number | null>(null);
  useEffect(() => {
    const before = prevRows.current;
    prevRows.current = settings.rows;
    if (before === null || before === settings.rows) return;
    setStrokes((prev) => {
      if (prev.length) flash("期数已变更，画规已清空");
      return [];
    });
    setRedo([]);
    setDirty(false);
  }, [settings.rows, flash]);

  const commit = useCallback((s: Stroke) => {
    setStrokes((prev) => [...prev, s]);
    setRedo([]);
    setDirty(true);
  }, []);

  const undo = () => {
    setStrokes((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setRedo((r) => [...r, last]);
      setDirty(true);
      return prev.slice(0, -1);
    });
  };

  const redoOne = () => {
    setRedo((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setStrokes((s) => [...s, last]);
      setDirty(true);
      return prev.slice(0, -1);
    });
  };

  /* 清除：画线 + 号码标记一起清，同时删掉已保存的画规 */
  const clearAll = () => {
    const hadStroke = strokes.length > 0;
    const hadMarker = Object.keys(markers).length > 0;
    if (!hadStroke && !hadMarker) return;
    if (hadStroke) setRedo((r) => [...r, ...strokes]);
    setStrokes([]);
    setMarkers({});
    setDirty(false);
    try {
      localStorage.removeItem(CHART_KEY);
    } catch {
      /* ignore */
    }
    flash(hadMarker && !hadStroke ? "已清除号码标记" : hadMarker ? "已清除画线与标记" : "已清除全部画线");
  };

  /* 保存：把画规（连线 + 标记）存到本机，下次打开自动恢复 */
  const saveChart = () => {
    if (!strokes.length && !Object.keys(markers).length) {
      flash("还没有画规可保存");
      return;
    }
    const payload: SavedChart = {
      latest: draws.length ? draws[draws.length - 1].period : "",
      rows: settings.rows,
      savedAt: new Date().toISOString(),
      markers,
      strokes: strokes.map((s) => ({
        id: s.id,
        mode: s.mode,
        color: s.color,
        width: s.width,
        badges: s.badges,
        points: s.points.map(packPoint),
      })),
    };
    try {
      localStorage.setItem(CHART_KEY, JSON.stringify(payload));
      setDirty(false);
      flash(`画规已保存：${strokes.length} 条连线 · ${Object.keys(markers).length} 个标记`);
    } catch {
      flash("保存失败：浏览器本地存储不可用");
    }
  };

  /* 分享：按画规实际覆盖的期数裁剪出图 —— 画了几期就带几期，
   * 上下各留 3 期上下文；没画内容时只取最近 12 期，避免带出几十期空号 */
  const makeImage = async () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = geo.boardW;
    const visible = draws.slice(-settings.rows);
    if (!visible.length) return;
    const last = visible.length - 1;

    // 画规（连线 + 号码标记）覆盖到的行范围
    let minRow = Infinity;
    let maxRow = -Infinity;
    const touch = (r: number) => {
      const rr = Math.max(0, Math.min(last, Math.floor(r)));
      if (rr < minRow) minRow = rr;
      if (rr > maxRow) maxRow = rr;
    };
    for (const s of strokes) for (const p of s.points) touch(p.y / geo.rowH);
    const rowOfPeriod = new Map(visible.map((d, i) => [d.period, i]));
    for (const key of Object.keys(markers)) {
      const r = rowOfPeriod.get(key.split(":")[0]);
      if (r !== undefined) touch(r);
    }

    let from: number;
    let to: number;
    if (maxRow < 0) {
      to = last;
      from = Math.max(0, last - 11);
    } else {
      from = Math.max(0, minRow - 3);
      to = Math.min(last, maxRow + 3);
      if (to >= last - 5) to = last; // 离最新期很近就直接到底，带上「下一期」
      if (to - from + 1 < 8) {
        to = Math.min(last, from + 7); // 至少 8 行，避免图片过矮
        from = Math.max(0, to - 7);
      }
    }
    const h = rangeHeight(geo, visible.length, { from, to });
    const cv = document.createElement("canvas");
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const css = getComputedStyle(document.querySelector(".app-shell") ?? document.documentElement);
    const c = (n: string, fb: string) => css.getPropertyValue(n).trim() || fb;
    paintChart(ctx, {
      width: w,
      height: h,
      geo,
      draws,
      settings,
      strokes,
      markers,
      rowRange: { from, to },
      skin: {
        brand: c("--skin-brand", "#93c385"),
        brandDeep: c("--skin-brand-deep", "#77a067"),
        pale: c("--skin-pale", "#eff9ca"),
        paper: c("--skin-paper", "#ffffff"),
        muted: c("--skin-muted", "#a3c199"),
        grid: c("--skin-grid", "#cee2cc"),
        ink: c("--skin-ink", "#93c385"),
      },
    });
    setSaveImg({
      src: cv.toDataURL("image/png"),
      name: `走势画规-${draws[draws.length - 1]?.period ?? "chart"}.png`,
    });
  };

  const close = () => {
    if (window.history.length > 1) window.history.back();
    else flash("这是演示页，关闭不会离开");
  };

  const dismissTutorial = () => {
    setTutorial(false);
    try {
      localStorage.setItem(TUT_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  /* 单击号码：用当前画笔颜色给号码打标记（颜色与画规线同一套逻辑）；
   * 同色再点 = 取消，换一种颜色再点 = 直接改色 */
  const toggleMarker = useCallback((period: string, col: number) => {
    const key = `${period}:${col}`;
    setMarkers((prev) => {
      const next = { ...prev };
      const cur = next[key];
      if (cur && cur.color.toLowerCase() === color.toLowerCase()) delete next[key];
      else next[key] = { style: settings.numStyle, color };
      return next;
    });
    setDirty(true);
  }, [settings.numStyle, color]);

  return (
    <main className="app-shell" data-skin={settings.skin}>
      <div className="absolute inset-0">
        <ChartBoard
          draws={draws}
          settings={settings}
          strokes={strokes}
          markers={markers}
          onCommit={commit}
          onUpdateStroke={(id, points) => {
            setStrokes((prev) => prev.map((s) => (s.id === id ? { ...s, points } : s)));
            setDirty(true);
          }}
          onToggleMarker={toggleMarker}
          locked={locked}
          color={color}
          tool={tool}
          boardRef={boardRef}
          onGeometry={setGeo}
        />
      </div>

      <Toolbar
        canUndo={strokes.length > 0}
        canRedo={redo.length > 0}
        canClear={strokes.length > 0 || Object.keys(markers).length > 0}
        dirty={dirty}
        onClose={close}
        onUndo={undo}
        onRedo={redoOne}
        onClear={clearAll}
        onShare={makeImage}
        onSave={saveChart}
        onSettings={() => setSheet(true)}
      />

      <BottomBar
        color={color}
        onColor={setColor}
        locked={locked}
        onToggleLock={() => {
          setLocked((v) => !v);
          flash(locked ? "已解锁，可以继续画线" : "已锁定，可以上下滑动画板");
        }}
        onSettings={() => setSheet(true)}
        tool={tool}
        onTool={setTool}
      />

      {toast ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-[1.1rem] z-40 flex justify-center">
          <span className="glass-dark rounded-full px-[0.14rem] py-[0.06rem] text-[0.12rem] text-white">{toast}</span>
        </div>
      ) : null}

      {saveImg ? <SavePreview src={saveImg.src} fileName={saveImg.name} onClose={() => setSaveImg(null)} /> : null}

      {tutorial ? <TutorialMask onDismiss={dismissTutorial} /> : null}

      <SettingsSheet
        open={sheet}
        settings={settings}
        onChange={patch}
        onClose={() => setSheet(false)}
        onSecret={() => {
          setSheet(false);
          setAdmin(true);
        }}
      />

      {admin ? (
        <DataAdmin
          info={info}
          manual={manual}
          onClose={() => setAdmin(false)}
          onRefresh={refresh}
          onManual={(list) => {
            setManual(list);
            flash("本地补录已更新");
          }}
        />
      ) : null}
    </main>
  );
}
