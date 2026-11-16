"use client";

import { useState } from "react";
import type { Draw } from "@/data/draws";
import type { DrawsInfo } from "@/lib/draws";
import { normalizeDraw } from "@/lib/draws";
import { IconBack, IconCheck, IconTrash } from "./icons";

const ORIGIN_LABEL: Record<DrawsInfo["origin"], string> = {
  builtin: "内置快照",
  remote: "云端同步",
  local: "本地补录",
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  inputMode = "numeric",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLength?: number;
  inputMode?: "numeric" | "text";
}) {
  return (
    <label className="flex flex-1 flex-col gap-[0.05rem]">
      <span className="text-[0.11rem] leading-none text-[#888]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        className="h-[0.32rem] w-full rounded-[0.08rem] bg-[#EFEFF1] px-[0.09rem] text-[0.14rem] text-[#333] outline-none transition-shadow focus:bg-white focus:shadow-[0_0_0_2px_rgba(253,61,68,0.25)]"
      />
    </label>
  );
}

type Props = {
  info: DrawsInfo;
  manual: Draw[];
  onClose: () => void;
  onRefresh: () => void;
  onManual: (list: Draw[]) => void;
};

export default function DataAdmin({ info, manual, onClose, onRefresh, onManual }: Props) {
  const [period, setPeriod] = useState("");
  const [date, setDate] = useState("");
  const [num, setNum] = useState("");
  const [tip, setTip] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const flash = (msg: string) => {
    setTip(msg);
    window.setTimeout(() => setTip(null), 2000);
  };

  const submit = () => {
    const d = normalizeDraw({ period, num, date });
    if (!d) {
      flash("期号 5 位、号码 5 位、日期 YYYY-MM-DD");
      return;
    }
    onManual([...manual.filter((x) => x.period !== d.period), d]);
    setPeriod("");
    setDate("");
    setNum("");
    flash(`已补录 ${d.period}`);
  };

  const refresh = async () => {
    setBusy(true);
    await onRefresh();
    setBusy(false);
    flash("已尝试同步云端数据");
  };

  return (
    <div className="sheet-enter absolute inset-0 z-[60] flex flex-col bg-[#F2F2F7] text-[0.12rem]">
      <header className="glass-sheet relative flex h-[0.538rem] shrink-0 items-center justify-center border-b border-black/5">
        <button
          type="button"
          onClick={onClose}
          aria-label="返回"
          className="absolute left-[0.08rem] flex h-[0.34rem] w-[0.34rem] items-center justify-center rounded-full bg-black/5"
        >
          <IconBack size={20} color="#333" />
        </button>
        <h2 className="text-[0.165rem] font-bold tracking-wide text-[#1c1c1e]">数据管理</h2>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-[0.135rem] pt-[0.096rem] pb-[0.3rem]">
        <section className="ios-card mb-[0.12rem] px-[0.135rem] py-[0.135rem]">
          <h3 className="mb-[0.1rem] text-[0.14rem] leading-none font-bold text-[#333]">当前数据</h3>
          <div className="grid grid-cols-2 gap-y-[0.08rem] text-[0.12rem] text-[#555]">
            <span>
              来源：
              <b className="text-[#333]">{ORIGIN_LABEL[info.origin]}</b>
            </span>
            <span>
              总期数：<b className="text-[#333]">{info.total}</b>
            </span>
            <span className="col-span-2">
              最新一期：
              <b className="text-[#333]">
                {info.latest ? `${info.latest.period} · ${info.latest.num} · ${info.latest.date}` : "—"}
              </b>
            </span>
            <span className="col-span-2 break-all">
              云端更新时间：
              <b className="text-[#333]">{info.updatedAt ? new Date(info.updatedAt).toLocaleString("zh-CN") : "—"}</b>
            </span>
            {info.error ? <span className="col-span-2 text-[#D9534F]">同步异常：{info.error}</span> : null}
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={busy}
            className="mt-[0.12rem] block h-[0.34rem] w-full rounded-[0.08rem] bg-[#FFE9EA] text-[0.13rem] font-bold text-danger transition-transform active:scale-[0.99] disabled:opacity-50"
          >
            {busy ? "同步中…" : "立即同步云端数据"}
          </button>
          <p className="mt-[0.08rem] text-[0.1rem] leading-[1.5] text-[#999]">
            云端数据由定时任务在每期开奖后自动抓取官方结果并发布；本页刷新只影响当前显示。
          </p>
        </section>

        <section className="ios-card mb-[0.12rem] px-[0.135rem] py-[0.135rem]">
          <h3 className="mb-[0.1rem] text-[0.14rem] leading-none font-bold text-[#333]">手动补录（本机生效）</h3>
          <div className="flex gap-[0.06rem]">
            <Field label="期号" value={period} onChange={setPeriod} placeholder="26306" maxLength={7} />
            <Field label="日期" value={date} onChange={setDate} placeholder="2026-11-16" maxLength={10} inputMode="text" />
            <Field label="号码" value={num} onChange={setNum} placeholder="12345" maxLength={5} />
          </div>
          <button
            type="button"
            onClick={submit}
            className="mt-[0.12rem] block h-[0.34rem] w-full rounded-[0.08rem] bg-danger text-[0.13rem] font-bold text-white shadow-[0_6px_16px_rgba(253,61,68,0.32)] transition-transform active:scale-[0.99]"
          >
            保存补录
          </button>
          <p className="mt-[0.08rem] text-[0.1rem] leading-[1.5] text-[#999]">
            补录只写入本机缓存，用于云端尚未同步时临时查看；换设备或清理缓存后失效。
          </p>
        </section>

        {manual.length ? (
          <section className="ios-card mb-[0.12rem] px-[0.135rem] py-[0.135rem]">
            <div className="mb-[0.08rem] flex items-center justify-between">
              <h3 className="text-[0.14rem] leading-none font-bold text-[#333]">已补录 {manual.length} 期</h3>
              <button
                type="button"
                onClick={() => {
                  onManual([]);
                  flash("已清除本地补录");
                }}
                className="flex items-center gap-[0.03rem] text-[0.11rem] text-[#D9534F]"
              >
                <IconTrash size={12} />
                全部清除
              </button>
            </div>
            <ul className="flex flex-col">
              {[...manual].reverse().map((d) => (
                <li key={d.period} className="flex items-center justify-between border-t border-[#F0F0F0] py-[0.07rem]">
                  <span className="text-[0.12rem] text-[#333]">
                    {d.period} · {d.num} · {d.date}
                  </span>
                  <button
                    type="button"
                    aria-label={`删除 ${d.period}`}
                    onClick={() => onManual(manual.filter((x) => x.period !== d.period))}
                    className="flex h-[0.24rem] w-[0.24rem] items-center justify-center text-[#bbb]"
                  >
                    <IconTrash size={13} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="px-[0.02rem] text-[0.1rem] leading-[1.6] text-[#aaa]">
          开奖结果以中国体育彩票官方公布为准。数据链：体彩官方接口 → 500.com 静态镜像（校验重叠期） → 静态站点。
        </p>
      </div>

      {tip ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-[0.6rem] z-10 flex justify-center">
          <span className="flex items-center gap-[0.04rem] rounded-full bg-black/75 px-[0.12rem] py-[0.06rem] text-[0.11rem] text-white">
            <IconCheck size={11} />
            {tip}
          </span>
        </div>
      ) : null}
    </div>
  );
}
