'use client';
import React from 'react';

interface DesktopIconProps {
  id: string;
  label: string;
  iconSrc: string;
  isSelected: boolean;
  isOpen: boolean;
  onClick: (id: string) => void;
  onDoubleClick: (id: string) => void;
}

export default function DesktopIcon({
  id, label, iconSrc, isSelected, isOpen, onClick, onDoubleClick,
}: DesktopIconProps) {
  let clickTimer: ReturnType<typeof setTimeout> | null = null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
      onDoubleClick(id);
    } else {
      onClick(id);
      clickTimer = setTimeout(() => { clickTimer = null; }, 300);
    }
  };

  return (
    <div
      className={`desktop-icon ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      <img src={iconSrc} alt={label} draggable={false} />
      <span className="desktop-icon-label">{label}</span>
    </div>
  );
}
