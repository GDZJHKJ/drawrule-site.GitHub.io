"use client";

function Arrow({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 96"
      fill="none"
      aria-hidden
      style={{ width: "0.24rem", height: "0.6rem", transform: flip ? "rotate(180deg)" : undefined }}
    >
      <path d="M12 4L2.6 22.4h6.2V92h6.4V22.4h6.2L12 4z" fill="#fff" />
    </svg>
  );
}

function Hand({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 56"
      fill="none"
      aria-hidden
      style={{ width: "0.36rem", height: "0.42rem" }}
    >
      <path
        d="M18 30V12a4 4 0 018 0v14m0-3a4 4 0 018 0v4m0-1a4 4 0 018 0v9c0 8-5.6 14-14 14h-3c-6 0-9-2.6-11.6-6.8l-6-9.7a4 4 0 016.6-4.4l3 3.9"
        stroke="#fff"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />
    </svg>
  );
}

export default function TutorialMask({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="absolute inset-0 z-40"
      style={{ top: "0.48rem", background: "rgba(0,0,0,0.45)" }}
      onClick={onDismiss}
      role="presentation"
    >
      <div className="relative mx-auto h-full w-full">
        {/* 上箭头 / 手型 / 下箭头（沿期号列自上而下） */}
        <div className="absolute left-[0.28rem] top-[2.3rem]">
          <Arrow />
        </div>
        <div className="absolute left-[0.24rem] top-[3.98rem]">
          <Hand />
        </div>
        <div className="absolute left-[0.28rem] top-[5.05rem]">
          <Arrow flip />
        </div>

        {/* 竖排提示文字 */}
        <div
          className="vertical-text absolute top-[2.24rem] left-[0.8rem] text-[0.21rem] leading-[1] font-bold text-white"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
        >
          期号列表可上下移动
        </div>

        {/* 知道了 */}
        <div className="absolute inset-x-0 bottom-[0.7rem] flex justify-center">
          <button
            type="button"
            onClick={onDismiss}
            className="h-[0.33rem] w-[1.02rem] rounded-[0.07rem] border-[1.5px] border-white/90 text-[0.15rem] leading-none text-white"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}
