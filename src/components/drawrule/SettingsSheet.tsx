"use client";

import { useRef } from "react";
import type { DividerMode, FontSize, NumberStyle, Settings, Skin } from "./types";
import { SKINS } from "./types";
import { IconBack, IconCheck } from "./icons";

const PREVIEW: Record<Skin, { brand: string; paper: string; ink: string; pale: string; grid: string }> = {
  classic: { brand: "#e8615a", paper: "#ffffff", ink: "#e8615a", pale: "#fdeeed", grid: "#f3d9d7" },
  eyecare: { brand: "#93c385", paper: "#ffffff", ink: "#93c385", pale: "#eff9ca", grid: "#cee2cc" },
  night: { brand: "#2a2a2a", paper: "#141414", ink: "#e8e8e8", pale: "#1e1e1e", grid: "#333333" },
  vintage: { brand: "#b5462f", paper: "#fbf3e6", ink: "#b5462f", pale: "#f6e7c9", grid: "#e2cda8" },
};

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-[0.16rem]">
      <h3 className="mb-[0.055rem] px-[0.05rem] text-[0.105rem] leading-none font-medium tracking-wide text-[#8e8e93]">
        {title}
      </h3>
      <div className="ios-card px-[0.125rem] py-[0.125rem]">{children}</div>
    </section>
  );
}

function Pill({
  active,
  children,
  onClick,
  solid,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  solid?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-[0.288rem] flex-1 rounded-[0.08rem] text-[0.13rem] leading-none transition-all ${
        active
          ? solid
            ? "bg-danger font-bold text-white shadow-[0_3px_10px_rgba(253,61,68,0.32)]"
            : "bg-[#FFE9EA] font-bold text-danger"
          : "bg-[#EFEFF1] text-[#3a3a3c]"
      }`}
    >
      {children}
    </button>
  );
}

function Check({ on }: { on: boolean }) {
  return (
    <span
      className={`flex h-[0.173rem] w-[0.173rem] items-center justify-center rounded-full ${
        on ? "bg-danger" : "bg-[#EDEDED]"
      }`}
    >
      {on ? <IconCheck size={11} /> : null}
    </span>
  );
}

function MiniChart({ skin }: { skin: Skin }) {
  const p = PREVIEW[skin];
  const lines = ["17290", "17291", "17292", "17293"];
  return (
    <div className="flex h-[0.52rem] w-full" style={{ background: p.paper }}>
      <div className="flex flex-col" style={{ width: "38%", background: p.brand }}>
        {lines.map((l, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-center">
            <span className="text-[0.036rem] leading-[1.2] text-white">{l}</span>
            <span className="text-[0.03rem] leading-[1.2] text-white/90">11</span>
          </div>
        ))}
      </div>
      <div className="flex flex-1 flex-col" style={{ background: p.pale }}>
        {lines.map((_, i) => (
          <div
            key={i}
            className="flex flex-1 items-center justify-center gap-[0.02rem]"
            style={{ borderBottom: `0.5px solid ${p.grid}` }}
          >
            {["8", "1", "2", "2"].map((n, j) => (
              <span key={j} className="text-[0.044rem] leading-none font-bold" style={{ color: p.ink }}>
                {n}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

type Props = {
  open: boolean;
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onClose: () => void;
  /** 隐藏入口：连续点击版本号 5 次 */
  onSecret?: () => void;
};

export default function SettingsSheet({ open, settings, onChange, onClose, onSecret }: Props) {
  const tapsRef = useRef<number[]>([]);
  if (!open) return null;

  const tapVersion = () => {
    const now = Date.now();
    tapsRef.current = [...tapsRef.current.filter((t) => now - t < 3000), now];
    if (tapsRef.current.length >= 5) {
      tapsRef.current = [];
      onSecret?.();
    }
  };

  const fontOpts: { key: FontSize; label: string }[] = [
    { key: "standard", label: "标准" },
    { key: "large", label: "大号" },
    { key: "xlarge", label: "超大号" },
  ];
  const dividerOpts: { key: DividerMode; label: string }[] = [
    { key: "four", label: "常用分割" },
    { key: "year", label: "本年分割" },
    { key: "all", label: "全部分割" },
  ];
  const numOpts: { key: NumberStyle; label: string }[] = [
    { key: "text", label: "文本" },
    { key: "hollowSquare", label: "空心方" },
    { key: "hollowCircle", label: "空心圆" },
    { key: "solidSquare", label: "实心方" },
    { key: "solidCircle", label: "实心圆" },
  ];

  return (
    <div className="sheet-enter absolute inset-0 z-50 flex flex-col bg-[#F2F2F7]">
      <header className="glass-sheet relative flex h-[0.538rem] shrink-0 items-center justify-center border-b border-black/5">
        <button
          type="button"
          onClick={onClose}
          aria-label="返回"
          className="absolute left-[0.08rem] flex h-[0.34rem] w-[0.34rem] items-center justify-center rounded-full bg-black/5"
        >
          <IconBack size={17} color="#333" />
        </button>
        <h2 className="text-[0.165rem] font-bold tracking-wide text-[#1c1c1e]">设置</h2>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-[0.135rem] pt-[0.096rem] pb-[0.3rem]">
        <Group title="期数">
          <div className="flex gap-[0.077rem]">
            {([20, 40, 60, 80] as const).map((n) => (
              <Pill key={n} active={settings.rows === n} onClick={() => onChange({ rows: n })}>
                {n}
              </Pill>
            ))}
          </div>
        </Group>

        <Group title="字体大小">
          <div className="flex gap-[0.077rem]">
            {fontOpts.map((o) => (
              <Pill key={o.key} active={settings.fontSize === o.key} onClick={() => onChange({ fontSize: o.key })}>
                {o.label}
              </Pill>
            ))}
          </div>
        </Group>

        <Group title="自定义皮肤">
          <div className="grid grid-cols-3 gap-x-[0.077rem] gap-y-[0.115rem]">
            {SKINS.map((s) => (
              <button key={s.key} type="button" onClick={() => onChange({ skin: s.key })} className="relative">
                <div
                  className={`overflow-hidden rounded-[0.06rem] border-[1.5px] transition-all ${
                    settings.skin === s.key
                      ? "border-danger shadow-[0_0_0_3px_rgba(253,61,68,0.14)]"
                      : "border-black/8"
                  }`}
                >
                  <MiniChart skin={s.key} />
                </div>
                {settings.skin === s.key ? (
                  <span className="absolute -right-[0.02rem] -bottom-[0.02rem] flex h-[0.14rem] w-[0.14rem] items-center justify-center rounded-full bg-danger">
                    <IconCheck size={9} />
                  </span>
                ) : null}
                <span
                  className="mt-[0.03rem] block text-[0.11rem] leading-none"
                  style={{ color: settings.skin === s.key ? "#FD3D44" : "#666" }}
                >
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </Group>

        <Group title="画板缩放比例">
          <div className="flex gap-[0.05rem]">
            {[50, 60, 70, 80, 90, 100].map((z) => (
              <Pill key={z} solid active={settings.zoom === z} onClick={() => onChange({ zoom: z })}>
                {z}%
              </Pill>
            ))}
          </div>
          <p className="mt-[0.08rem] text-[0.1rem] leading-[1.5] text-[#999]">
            画板宽度自动适配屏幕，100% 为铺满；缩放只影响画板内容大小。
          </p>
        </Group>

        <Group title="四期分割线">
          <div className="flex items-center gap-[0.115rem]">
            {dividerOpts.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => onChange({ divider: o.key })}
                className="flex items-center gap-[0.04rem]"
              >
                <Check on={settings.divider === o.key} />
                <span className="text-[0.125rem] text-[#333]">{o.label}</span>
              </button>
            ))}
          </div>
        </Group>

        <Group title="号码样式（颜色随画笔）">
          <div className="grid grid-cols-5 gap-[0.04rem]">
            {numOpts.map((o) => {
              const active = settings.numStyle === o.key;
              const shape =
                o.key === "hollowSquare"
                  ? "border border-[#FD3D44] text-[#FD3D44] rounded-[0.02rem]"
                  : o.key === "hollowCircle"
                    ? "border border-[#FD3D44] text-[#FD3D44] rounded-full"
                    : o.key === "solidSquare"
                      ? "bg-[#FD3D44] text-white rounded-[0.02rem]"
                      : o.key === "solidCircle"
                        ? "bg-[#FD3D44] text-white rounded-full"
                        : "text-[#FD3D44]";
              return (
                <button key={o.key} type="button" onClick={() => onChange({ numStyle: o.key })} className="relative">
                  <div
                    className={`flex h-[0.42rem] items-center justify-center rounded-[0.03rem] ${
                      active ? "bg-[#FFE9EA]" : "bg-[#EFEFF1]"
                    }`}
                  >
                    <span className="flex items-center gap-[0.012rem]">
                      <span className={`flex h-[0.17rem] w-[0.17rem] items-center justify-center text-[0.12rem] font-bold leading-none ${shape}`}>
                        8
                      </span>
                      <span className="h-px w-[0.05rem] bg-[#FD3D44]/60" />
                      <span className={`flex h-[0.17rem] w-[0.17rem] items-center justify-center text-[0.12rem] font-bold leading-none ${shape}`}>
                        8
                      </span>
                    </span>
                  </div>
                  <span className="mt-[0.02rem] block text-center text-[0.1rem] leading-none text-[#666]">{o.label}</span>
                  {active ? (
                    <span className="absolute -top-[0.01rem] right-0 flex h-[0.12rem] w-[0.12rem] items-center justify-center rounded-full bg-danger">
                      <IconCheck size={8} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </Group>

        <button
          type="button"
          onClick={tapVersion}
          className="mt-[0.22rem] block w-full select-none py-[0.1rem] text-center text-[0.1rem] leading-none text-[#d8d8d8]"
        >
          数据同步 v2.1
        </button>

      </div>
    </div>
  );
}
