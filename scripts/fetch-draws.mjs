#!/usr/bin/env node
/**
 * 排列五开奖数据同步（GitHub Actions 里跑，也可本地手动跑）
 *
 * 数据链：
 *   1) 官方接口 webapi.sporttery.cn（境外数据中心 IP 常被 EdgeOne 返回 567）
 *   2) 500.com 静态 XML 镜像（境外可达）
 *   3) 写入前与仓库现有数据做「重叠期逐条校验」，任何一条号码/日期不一致就放弃本次更新
 *
 * 用法：
 *   node scripts/fetch-draws.mjs            # 拉取并写入 public/data/draws.json
 *   node scripts/fetch-draws.mjs --dry      # 只打印结果，不写文件
 *   node scripts/fetch-draws.mjs --check    # 只判断是否有新期号，exit 2 表示有
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const OUT = path.resolve(process.env.OUT_PATH || "public/data/draws.json");
const KEEP = Number(process.env.KEEP || 500);
const MIN_OVERLAP = Number(process.env.MIN_OVERLAP || 20);
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const OFFICIAL_URL =
  "https://webapi.sporttery.cn/gateway/lottery/getHistoryPageListV1.qry?gameNo=350133&provinceId=0&pageSize=100&isVerify=1&pageNo=1";
const MIRROR_URL = process.env.MIRROR_URL || "https://kaijiang.500.com/static/info/kaijiang/xml/plw/list.xml";

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry");
const CHECK = args.has("--check");

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

function normalize(periodRaw, numRaw, dateRaw) {
  const period = String(periodRaw ?? "").replace(/\D/g, "").slice(-5);
  const num = String(numRaw ?? "").replace(/\D/g, "").slice(0, 5);
  const date = String(dateRaw ?? "").slice(0, 10);
  if (period.length !== 5 || num.length !== 5 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const d = new Date(`${date}T00:00:00Z`);
  return { period, date, mmdd: date.slice(5).replace("-", "/"), week: WEEK[d.getUTCDay()] ?? "", num };
}

async function fetchText(url, headers = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "*/*", ...headers },
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fromOfficial() {
  const text = await fetchText(OFFICIAL_URL, {
    Accept: "application/json, text/plain, */*",
    Referer: "https://static.sporttery.cn/",
  });
  const json = JSON.parse(text);
  const list = json?.value?.list;
  if (!Array.isArray(list) || !list.length) throw new Error("官方返回结构异常");
  const rows = list
    .map((it) => normalize(it.lotteryDrawNum, it.lotteryDrawResult, it.lotteryDrawTime))
    .filter(Boolean);
  if (!rows.length) throw new Error("官方无可解析记录");
  return rows;
}

async function fromMirror() {
  const xml = await fetchText(MIRROR_URL, {
    Accept: "application/xml,text/xml,*/*",
    Referer: "https://kaijiang.500.com/plw.shtml",
  });
  const re = /<row\s+expect="(\d+)"\s+opencode="([\d,\s]+)"\s+opentime="([^"]*)"/g;
  const rows = [];
  let m;
  while ((m = re.exec(xml))) {
    const n = normalize(m[1], m[2], m[3]);
    if (n) rows.push(n);
  }
  if (!rows.length) throw new Error("镜像无可解析记录");
  return rows;
}

function sortAsc(list) {
  return [...list].sort((a, b) => Number(a.period) - Number(b.period));
}

async function readExisting() {
  if (!existsSync(OUT)) return null;
  try {
    const json = JSON.parse(await readFile(OUT, "utf8"));
    const list = Array.isArray(json?.list) ? json.list : Array.isArray(json?.draws) ? json.draws : [];
    const clean = list.map((x) => normalize(x.period, x.num, x.date)).filter(Boolean);
    return clean.length ? { ...json, list: sortAsc(clean) } : null;
  } catch {
    return null;
  }
}

/** 与现有数据做重叠期逐条校验 */
function verify(fresh, existing) {
  if (!existing?.list?.length) return { overlap: 0, mismatch: [] };
  const old = new Map(existing.list.map((d) => [d.period, d]));
  let overlap = 0;
  const mismatch = [];
  for (const d of fresh) {
    const o = old.get(d.period);
    if (!o) continue;
    overlap++;
    if (o.num !== d.num || o.date !== d.date) mismatch.push(`${d.period} 现有 ${o.num}/${o.date} vs 抓取 ${d.num}/${d.date}`);
  }
  return { overlap, mismatch };
}

async function main() {
  const existing = await readExisting();
  const baseList = existing?.list ?? [];
  console.log(`[info] 现有 ${baseList.length} 期，最新 ${baseList.at(-1)?.period ?? "—"}`);

  const sources = [
    { name: "official", run: fromOfficial },
    { name: "mirror", run: fromMirror },
  ];

  let fresh = null;
  let sourceName = "";
  const errors = [];
  for (const s of sources) {
    try {
      const rows = await s.run();
      const { overlap, mismatch } = verify(rows, existing);
      console.log(`[${s.name}] 抓到 ${rows.length} 期，重叠 ${overlap} 期，差异 ${mismatch.length} 条`);
      if (mismatch.length) {
        console.error(`[${s.name}] 数据与现有记录不一致，拒绝使用：\n  ${mismatch.slice(0, 10).join("\n  ")}`);
        errors.push(`${s.name}: mismatch`);
        continue;
      }
      if (baseList.length && overlap < Math.min(MIN_OVERLAP, baseList.length)) {
        console.error(`[${s.name}] 重叠期过少（${overlap} < ${MIN_OVERLAP}），无法校验，拒绝使用`);
        errors.push(`${s.name}: low-overlap`);
        continue;
      }
      fresh = rows;
      sourceName = s.name;
      break;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[${s.name}] 拉取失败：${msg}`);
      errors.push(`${s.name}: ${msg}`);
    }
  }

  if (!fresh) {
    console.error(`[fatal] 所有数据源均不可用：${errors.join(" | ")}`);
    process.exit(CHECK ? 1 : 0);
  }

  const merged = sortAsc(
    Array.from(new Map([...baseList, ...fresh].map((d) => [d.period, d])).values()),
  ).slice(-KEEP);

  const latestNew = merged.at(-1);
  const latestOld = baseList.at(-1);
  const changed = !latestOld || latestNew?.period !== latestOld.period;

  if (CHECK) {
    console.log(`[check] 最新 ${latestNew?.period}，${changed ? "有新数据" : "无新数据"}`);
    process.exit(changed ? 2 : 0);
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    source: `${sourceName} → verified`,
    count: merged.length,
    latest: latestNew,
    list: merged,
  };

  if (!changed && existing) {
    // 没有新期号就不动文件，避免每天几十次无意义的提交与重新部署
    console.log(`[ok] 无新期号（最新 ${latestNew?.period}），跳过写入`);
    return;
  }
  if (!changed) {
    console.log(`[ok] 首次写入，共 ${merged.length} 期，最新 ${latestNew?.period}`);
  } else {
    console.log(`[ok] 新增至 ${latestNew?.period}（${latestNew?.num}），共 ${merged.length} 期`);
  }

  if (DRY) {
    console.log(JSON.stringify(payload.latest, null, 2));
    return;
  }

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`[ok] 已写入 ${OUT}`);
}

main().catch((e) => {
  console.error("[fatal]", e);
  process.exit(0); // 不让定时任务因为网络抖动变成失败
});
