export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-paper px-6 text-center">
      <div className="flex items-center gap-3 rounded-2xl bg-brand px-8 py-6 shadow-md">
        <span className="text-6xl font-bold text-white">404</span>
      </div>
      <p className="mt-6 text-lg font-bold text-ink">页面不存在</p>
      <p className="mt-2 text-sm text-muted">
        你访问的地址不在本站，可能已变更或输入有误
      </p>
      <a
        href="/drawrule-site/"
        className="mt-8 rounded-lg bg-danger px-8 py-3 text-base font-bold text-white transition-transform active:scale-95"
      >
        返回走势画板
      </a>
      <p className="mt-10 text-xs text-muted">走势画规 · 排列五走势画板</p>
    </main>
  );
}
