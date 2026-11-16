"use client";

import {
  IconBookmark,
  IconClose,
  IconGear,
  IconRedo,
  IconShare,
  IconTrash,
  IconUndo,
} from "./icons";

type Props = {
  canUndo: boolean;
  canRedo: boolean;
  canClear: boolean;
  /** 有未保存的画规改动 */
  dirty?: boolean;
  onClose: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onShare: () => void;
  onSave: () => void;
  onSettings: () => void;
};

function Item({
  label,
  children,
  onClick,
  disabled,
  badge,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  badge?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="relative flex h-tool w-[0.519rem] flex-col items-center justify-center gap-[0.03rem] text-white transition-opacity duration-120 active:opacity-60 disabled:opacity-40"
    >
      {children}
      {badge ? (
        <span className="absolute top-[0.1rem] right-[0.1rem] h-[0.05rem] w-[0.05rem] rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.18)]" />
      ) : null}
      <span className="text-label leading-none font-bold">{label}</span>
    </button>
  );
}

export default function Toolbar({
  canUndo,
  canRedo,
  canClear,
  dirty = false,
  onClose,
  onUndo,
  onRedo,
  onClear,
  onShare,
  onSave,
  onSettings,
}: Props) {
  return (
    <div className="glass-toolbar toolbar-text absolute inset-x-0 top-0 z-40 flex h-tool w-full items-center font-bold text-white">
      <div className="ml-[0.048rem]">
        <Item label="关闭" onClick={onClose}>
          <IconClose size={17} />
        </Item>
      </div>
      <div className="mx-[0.01rem] h-[0.144rem] w-px shrink-0 bg-white/90" />
      <Item label="撤销" onClick={onUndo} disabled={!canUndo}>
        <IconUndo size={17} />
      </Item>
      <Item label="恢复" onClick={onRedo} disabled={!canRedo}>
        <IconRedo size={17} />
      </Item>
      <Item label="清除" onClick={onClear} disabled={!canClear}>
        <IconTrash size={17} />
      </Item>
      <Item label="分享" onClick={onShare}>
        <IconShare size={17} />
      </Item>
      <Item label="保存" onClick={onSave} badge={dirty}>
        <IconBookmark size={17} />
      </Item>
      <Item label="设置" onClick={onSettings}>
        <IconGear size={17} />
      </Item>
    </div>
  );
}
