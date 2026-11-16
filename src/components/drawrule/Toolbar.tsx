"use client";

import {
  IconClose,
  IconDownload,
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
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-tool w-[0.519rem] flex-col items-center justify-center gap-[0.03rem] text-white transition-opacity duration-120 active:opacity-60 disabled:opacity-40"
    >
      {children}
      <span className="text-label leading-none font-bold">{label}</span>
    </button>
  );
}

export default function Toolbar({
  canUndo,
  canRedo,
  canClear,
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
      <Item label="保存" onClick={onSave}>
        <IconDownload size={17} />
      </Item>
      <Item label="设置" onClick={onSettings}>
        <IconGear size={17} />
      </Item>
    </div>
  );
}
