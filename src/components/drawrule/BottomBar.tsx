"use client";

import { useEffect, useRef, useState } from "react";
import { PALETTE } from "./types";
import { IconCheck, IconCurve, IconLock, IconScribble, IconStraight } from "./icons";

type Props = {
  color: string;
  onColor: (c: string) => void;
  locked: boolean;
  onToggleLock: () => void;
  onSettings: () => void;
  tool: "line" | "poly" | "free";
  onTool: (t: "line" | "poly" | "free") => void;
};

export default function BottomBar({ color, onColor, locked, onToggleLock, onSettings, tool, onTool }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  const tools: { key: "line" | "poly" | "free"; label: string; icon: React.ReactNode }[] = [
    { key: "line", label: "直线", icon: <IconStraight size={20} color="#fff" /> },
    { key: "poly", label: "折线", icon: <IconCurve size={20} color="#fff" /> },
    { key: "free", label: "自由", icon: <IconScribble size={20} color="#fff" /> },
  ];

  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-x-0 bottom-[0.144rem] z-30">
      {/* 色板 + 工具（展开态） */}
      <div className="pointer-events-auto absolute left-[0.2rem] bottom-[0.55rem] flex items-end">
        {open ? (
          <div className="glass-dark flex w-[0.3rem] flex-col items-center gap-[0.103rem] rounded-full py-[0.08rem]">
            {PALETTE.map((p) => (
              <button
                key={p.color}
                type="button"
                aria-label={p.label}
                onClick={() => {
                  onColor(p.color);
                  setOpen(false);
                }}
                className="flex h-[0.298rem] w-[0.298rem] items-center justify-center rounded-full"
                style={{ background: p.color }}
              >
                {color.toLowerCase() === p.color.toLowerCase() ? <IconCheck size={13} /> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className={`absolute bottom-0 left-[0.545rem] flex items-center gap-[0.005rem] ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
          {tools.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onTool(t.key)}
              aria-label={t.label}
              className={`flex h-[0.404rem] w-[0.404rem] items-center justify-center rounded-full transition-all ${tool === t.key ? "shadow-[0_4px_12px_rgba(0,0,0,0.28)]" : "glass-dark"}`}
              style={tool === t.key ? { background: color } : undefined}
            >
              {t.icon}
            </button>
          ))}
        </div>

      {/* 当前色按钮 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="颜色"
        className="glass-dark pointer-events-auto absolute bottom-0 left-[0.154rem] flex h-[0.404rem] w-[0.404rem] items-center justify-center rounded-full"
      >
        <span
          className="flex h-[0.298rem] w-[0.298rem] items-center justify-center rounded-full transition-transform"
          style={{ background: color, transform: open ? "scale(0.92)" : "scale(1)" }}
        />
      </button>

      {/* 锁定 */}
      <button
        type="button"
        onClick={onToggleLock}
        aria-label={locked ? "解锁" : "锁定"}
        className={`glass-dark pointer-events-auto absolute bottom-0 left-1/2 flex h-[0.404rem] w-[0.404rem] -translate-x-1/2 items-center justify-center rounded-full transition-opacity ${open ? "opacity-0" : "opacity-100"}`}
      >
        <IconLock size={25} color={locked ? "#FE0000" : "#ffffff"} open={!locked} />
      </button>

      {/* 设置 */}
      <button
        type="button"
        onClick={onSettings}
        className="glass-dark pointer-events-auto absolute right-[0.519rem] bottom-0 flex h-[0.5rem] items-center rounded-l-[0.5rem] pr-[0.28rem] pl-[0.115rem] text-white"
      >
        <span className="text-[0.14rem] leading-none">设置</span>
        <span className="mx-[0.1rem] h-[0.16rem] w-px bg-white/80" />
      </button>
      <button
        type="button"
        onClick={onSettings}
        aria-label="画笔设置"
        className="glass-dark pointer-events-auto absolute right-[0.115rem] bottom-[0.01rem] flex h-[0.404rem] w-[0.404rem] items-center justify-center rounded-full"
      >
        <IconScribble size={22} color="#fff" />
      </button>
    </div>
  );
}
