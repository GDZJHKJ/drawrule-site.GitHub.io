type P = { className?: string; size?: number; strokeWidth?: number; color?: string };

/** 全部图标为自绘 SVG（不复制源站 iconfont / PNG） */
export function IconClose({ className, size = 17, strokeWidth = 1.9, color = "currentColor" }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 5l14 14M19 5L5 19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconUndo({ className, size = 17, strokeWidth = 1.9, color = "currentColor" }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 6L4 11l5 5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 11h9a6 6 0 016 6v1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconRedo({ className, size = 17, strokeWidth = 1.9, color = "currentColor" }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M15 6l5 5-5 5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 11h-9a6 6 0 00-6 6v1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconTrash({ className, size = 17, strokeWidth = 1.9, color = "currentColor" }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M9 7V5h6v2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 7l1 12h10l1-12" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M10 11v5M14 11v5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconShare({ className, size = 17, strokeWidth = 1.9, color = "currentColor" }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="18" cy="6" r="2.6" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="6" cy="12" r="2.6" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="18" cy="18" r="2.6" stroke={color} strokeWidth={strokeWidth} />
      <path d="M8.3 10.7l7.4-3.4M8.3 13.3l7.4 3.4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconDownload({ className, size = 17, strokeWidth = 1.9, color = "currentColor" }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 4v11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M7.5 10.5L12 15l4.5-4.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconGear({ className, size = 17, strokeWidth = 1.7, color = "currentColor" }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth={strokeWidth} />
      <path
        d="M12 3.2l1.5 2.2 2.6-.6.4 2.6 2.4 1.1-1.3 2.3 1.3 2.3-2.4 1.1-.4 2.6-2.6-.6L12 20.8l-1.5-2.2-2.6.6-.4-2.6-2.4-1.1 1.3-2.3-1.3-2.3 2.4-1.1.4-2.6 2.6.6z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconLock({ className, size = 25, color = "#ffffff", open = false }: P & { open?: boolean }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.4" stroke={color} strokeWidth="1.8" />
      <path
        d={open ? "M8.6 10.5V8.2a3.4 3.4 0 016.6-1.1" : "M8.6 10.5V8.2a3.4 3.4 0 016.8 0v2.3"}
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15.2" r="1.4" fill={color} />
    </svg>
  );
}

/** 画笔/自由曲线 */
export function IconScribble({ className, size = 20, color = "currentColor" }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 15.5c2.4-6.2 4.6-2.1 6.4-5.6 1.3-2.5 3-.9 4.2-2.9 1-1.7 2.4-1 3 .7.7 2.1-.4 4.5-2.2 4.2-2-.3-1.4-4.2 1.2-5.6 1.5-.8 3.1-.6 4.4.4"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCurve({ className, size = 20, color = "currentColor" }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3.5 17c4.4 0 5.6-10 9-10 2.6 0 3.4 4.6 8 4.6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function IconStraight({ className, size = 20, color = "currentColor" }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 18L19 6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="5" cy="18" r="1.8" fill={color} />
      <circle cx="19" cy="6" r="1.8" fill={color} />
    </svg>
  );
}

export function IconCheck({ className, size = 14, color = "#ffffff" }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4.5 12.5l5 5L20 7" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconBack({ className, size = 20, color = "currentColor" }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14.5 5.5L8 12l6.5 6.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
