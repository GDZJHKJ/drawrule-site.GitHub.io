"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DRAWS, type Draw } from "@/data/draws";

/** 与 next.config.ts 的 basePath 保持一致（静态导出后资源都挂在这个前缀下） */
const BASE_PATH = "/drawrule-site";
export const DATA_URL = `${BASE_PATH}/data/draws.json`;
export const MANUAL_KEY = "drawrule:manual-draws:v1";
const POLL_MS = 5 * 60 * 1000;

export type DrawOrigin = "builtin" | "remote" | "local";

export type DrawsInfo = {
  origin: DrawOrigin;
  /** 远程数据文件的生成时间 */
  updatedAt: string | null;
  source: string | null;
  loading: boolean;
  error: string | null;
  /** 本地补录的期数 */
  manualCount: number;
  /** 当前实际展示的最新一期 */
  latest: Draw | null;
  /** 当前可用总期数 */
  total: number;
};

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

export function normalizeDraw(input: Partial<Draw> & { period?: string; num?: string; date?: string }): Draw | null {
  const period = String(input.period ?? "").replace(/\D/g, "").slice(-5);
  const num = String(input.num ?? "").replace(/\D/g, "").slice(0, 5);
  const date = String(input.date ?? "").slice(0, 10);
  if (period.length !== 5 || num.length !== 5 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const d = new Date(`${date}T00:00:00Z`);
  return {
    period,
    date,
    mmdd: date.slice(5).replace("-", "/"),
    week: WEEK[d.getUTCDay()] ?? "",
    num,
  };
}

function sortByPeriod(list: Draw[]) {
  return [...list].sort((a, b) => Number(a.period) - Number(b.period));
}

function readManual(): Draw[] {
  try {
    const raw = localStorage.getItem(MANUAL_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => normalizeDraw(x)).filter((x): x is Draw => !!x);
  } catch {
    return [];
  }
}

function mergeDraws(base: Draw[], manual: Draw[]) {
  if (!manual.length) return base;
  const map = new Map(base.map((d) => [d.period, d]));
  for (const d of manual) map.set(d.period, d);
  return sortByPeriod([...map.values()]);
}

/**
 * 开奖数据：内置数据打底 → 远程 /data/draws.json（GitHub Actions 每日同步）→ 本地补录覆盖。
 * 页面打开时拉一次，之后每 5 分钟 & 每次切回前台再拉。
 */
export function useDraws() {
  const [remote, setRemote] = useState<Draw[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManualState] = useState<Draw[]>([]);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    setManualState(readManual());
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${DATA_URL}?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list = Array.isArray(json?.list) ? json.list : Array.isArray(json?.draws) ? json.draws : [];
      const clean = sortByPeriod(list.map((x: Draw) => normalizeDraw(x)).filter((x: Draw | null): x is Draw => !!x));
      if (!aliveRef.current) return;
      if (!clean.length) throw new Error("数据为空");
      setRemote(clean);
      setUpdatedAt(typeof json?.updatedAt === "string" ? json.updatedAt : null);
      setSource(typeof json?.source === "string" ? json.source : null);
      setError(null);
    } catch (e) {
      if (!aliveRef.current) return;
      setError(e instanceof Error ? e.message : "拉取失败");
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const setManual = useCallback((list: Draw[]) => {
    const clean = sortByPeriod(list.map((x) => normalizeDraw(x)).filter((x): x is Draw => !!x));
    setManualState(clean);
    try {
      if (clean.length) localStorage.setItem(MANUAL_KEY, JSON.stringify(clean));
      else localStorage.removeItem(MANUAL_KEY);
    } catch {
      /* 忽略存储失败 */
    }
  }, []);

  const draws = useMemo(() => mergeDraws(remote ?? DRAWS, manual), [remote, manual]);

  const info: DrawsInfo = {
    origin: manual.length ? "local" : remote ? "remote" : "builtin",
    updatedAt,
    source,
    loading,
    error,
    manualCount: manual.length,
    latest: draws.length ? draws[draws.length - 1] : null,
    total: draws.length,
  };

  return { draws, info, refresh, manual, setManual };
}
