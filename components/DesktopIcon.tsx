'use client';
import React, { useRef } from 'react';

interface DesktopIconProps {
  id: string;
  label: string;
  iconSrc: string;
  isSelected: boolean;
  isOpen: boolean;
  position?: { x: number; y: number };
  onClick: (id: string) => void;
  onDoubleClick: (id: string) => void;
  onMove?: (id: string, pos: { x: number; y: number }) => void;
}

export default function DesktopIcon({
  id, label, iconSrc, isSelected, isOpen, position, onClick, onDoubleClick, onMove,
}: DesktopIconProps) {
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number; moved: boolean } | null>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.button !== 0) return;

    const initX = position?.x ?? 0;
    const initY = position?.y ?? 0;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX,
      initY,
      moved: false,
    };

    const handleMouseMove = (me: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = me.clientX - dragRef.current.startX;
      const dy = me.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragRef.current.moved = true;
        if (onMove) {
          onMove(id, {
            x: Math.max(10, Math.min(window.innerWidth - 90, dragRef.current.initX + dx)),
            y: Math.max(10, Math.min(window.innerHeight - 100, dragRef.current.initY + dy)),
          });
        }
      }
    };

    const handleMouseUp = () => {
      const moved = dragRef.current?.moved ?? false;
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      if (!moved) {
        if (clickTimer.current) {
          clearTimeout(clickTimer.current);
          clickTimer.current = null;
          onDoubleClick(id);
        } else {
          onClick(id);
          clickTimer.current = setTimeout(() => {
            clickTimer.current = null;
          }, 280);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`desktop-icon ${isSelected ? 'selected' : ''}`}
      style={position ? { position: 'absolute', left: position.x, top: position.y } : undefined}
      onMouseDown={handleMouseDown}
    >
      <img src={iconSrc} alt={label} draggable={false} />
      <span className="desktop-icon-label">{label}</span>
    </div>
  );
}

