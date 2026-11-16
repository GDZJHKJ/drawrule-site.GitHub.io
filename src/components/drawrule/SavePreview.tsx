"use client";

import { IconClose, IconDownload } from "./icons";

type Props = {
  src: string;
  fileName: string;
  onClose: () => void;
};

/**
 * 分享预览：把当前画板渲染成一张长图，
 * 手机上长按图片即可「存储到照片」或转发；桌面提供下载按钮兜底。
 */
export default function SavePreview({ src, fileName, onClose }: Props) {
  return (
    <div className="glass-overlay absolute inset-0 z-[80] flex flex-col items-center justify-center px-[0.2rem]" onClick={onClose} role="presentation">
      <div
        className="glass-sheet sheet-enter flex max-h-full w-full flex-col overflow-hidden rounded-[0.2rem] shadow-[0_24px_60px_rgba(0,0,0,0.28)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="分享图片"
      >
        <div className="relative flex h-[0.42rem] shrink-0 items-center justify-center">
          <h3 className="text-[0.14rem] font-bold text-[#222]">长按图片保存或分享</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="absolute right-[0.08rem] flex h-[0.28rem] w-[0.28rem] items-center justify-center rounded-full bg-black/6 text-[#555]"
          >
            <IconClose size={13} strokeWidth={2.2} />
          </button>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-[0.1rem] pb-[0.1rem]">
          <img src={src} alt="走势画板长图" className="longpress-img block w-full rounded-[0.08rem]" draggable={false} />
        </div>

        <div className="flex shrink-0 items-center justify-between gap-[0.1rem] border-t border-black/6 px-[0.12rem] py-[0.09rem]">
          <p className="text-[0.1rem] leading-[1.4] text-[#8e8e93]">长按上方图片即可保存到相册或转发给好友</p>
          <a
            href={src}
            download={fileName}
            className="flex h-[0.3rem] shrink-0 items-center gap-[0.04rem] rounded-full bg-danger px-[0.12rem] text-[0.11rem] font-bold text-white shadow-[0_4px_12px_rgba(253,61,68,0.35)]"
          >
            <IconDownload size={13} strokeWidth={2.2} />
            下载
          </a>
        </div>
      </div>
    </div>
  );
}
