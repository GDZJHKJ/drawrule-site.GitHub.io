"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ChartBoard, { useGeometry, type Geometry } from "@/components/drawrule/ChartBoard";
import Toolbar from "@/components/drawrule/Toolbar";
import BottomBar from "@/components/drawrule/BottomBar";
import SettingsSheet from "@/components/drawrule/SettingsSheet";
import TutorialMask from "@/components/drawrule/TutorialMask";
import DataAdmin from "@/components/drawrule/DataAdmin";
import SavePreview from "@/components/drawrule/SavePreview";
import { DEFAULT_SETTINGS, type NumberStyle, type Settings, type Stroke, type ToolMode } from "@/components/drawrule/types";
import { paintChart } from "@/components/drawrule/render";
import { useDraws } from "@/lib/draws";

const STORE_KEY = "drawrule:settings:v1";
const TUT_KEY = "drawrule:tutorial:v1";

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
  const [markers, setMarkers] = useState<Record<string, NumberStyle>>({});
  const [saveImg, setSaveImg] = useState<{ src: string; name: string } | null>(null);

  /* 读取本地设置 */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      if (!localStorage.getItem(TUT_KEY)) setTutorial(true);
    } catch {
      /* ignore */
    }
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
      if (had) flash("开奖数据已更新，画板已重置");
    }
    lastPeriodRef.current = p;
  }, [draws, flash]);

  const commit = useCallback((s: Stroke) => {
    setStrokes((prev) => [...prev, s]);
    setRedo([]);
  }, []);

  const undo = () => {
    setStrokes((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setRedo((r) => [...r, last]);
      return prev.slice(0, -1);
    });
  };

  const redoOne = () => {
    setRedo((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setStrokes((s) => [...s, last]);
      return prev.slice(0, -1);
    });
  };

  /* 清除：画线 + 号码标记一起清 */
  const clearAll = () => {
    const hadStroke = strokes.length > 0;
    const hadMarker = Object.keys(markers).length > 0;
    if (!hadStroke && !hadMarker) return;
    if (hadStroke) setRedo((r) => [...r, ...strokes]);
    setStrokes([]);
    setMarkers({});
    flash(hadMarker && !hadStroke ? "已清除号码标记" : hadMarker ? "已清除画线与标记" : "已清除全部画线");
  };

  const save = async () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = geo.boardW;
    const total = Math.min(settings.rows, draws.length) + 6;
    const h = geo.rowH * total;
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

  const share = async () => {
    const data = { title: "走势画规 · 排列五走势画板", text: "排列五走势画板", url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      flash("链接已复制");
    } catch {
      flash("分享已取消");
    }
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

  /* 单击号码：按当前「号码样式」打标记，再点一次取消 */
  const toggleMarker = useCallback((period: string, col: number) => {
    const key = `${period}:${col}`;
    setMarkers((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = settings.numStyle;
      return next;
    });
  }, [settings.numStyle]);

  return (
    <main className="app-shell" data-skin={settings.skin}>
      <div className="absolute inset-0">
        <ChartBoard
          draws={draws}
          settings={settings}
          strokes={strokes}
          markers={markers}
          onCommit={commit}
          onUpdateStroke={(id, points) =>
            setStrokes((prev) => prev.map((s) => (s.id === id ? { ...s, points } : s)))
          }
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
        onClose={close}
        onUndo={undo}
        onRedo={redoOne}
        onClear={clearAll}
        onShare={share}
        onSave={save}
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
