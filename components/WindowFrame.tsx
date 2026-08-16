'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

export interface WindowConfig {
  id: string;
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  size: { w: number; h: number };
  zIndex: number;
}

interface WindowFrameProps {
  config: WindowConfig;
  isActive: boolean;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onFocus: (id: string) => void;
  onMove: (id: string, pos: { x: number; y: number }) => void;
  children: React.ReactNode;
}

export default function WindowFrame({
  config, isActive, onClose, onMinimize, onFocus, onMove, children,
}: WindowFrameProps) {
  const dragRef = useRef<{ startX: number; startY: number; winX: number; winY: number } | null>(null);

  const handleTitleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.win-ctrl-btn')) return;
    onFocus(config.id);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      winX: config.position.x,
      winY: config.position.y,
    };

    const handleMouseMove = (me: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = me.clientX - dragRef.current.startX;
      const dy = me.clientY - dragRef.current.startY;
      onMove(config.id, {
        x: Math.max(0, dragRef.current.winX + dx),
        y: Math.max(0, dragRef.current.winY + dy),
      });
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [config.id, config.position, onFocus, onMove]);

  if (!config.isOpen) return null;

  return (
    <div
      className={`win-frame ${isActive ? '' : 'inactive'} ${config.isMinimized ? 'minimized' : ''}`}
      style={{
        left: config.position.x,
        top: config.position.y,
        width: config.size.w,
        height: config.size.h,
        zIndex: config.zIndex,
      }}
      onMouseDown={() => onFocus(config.id)}
    >
      {/* Title bar */}
      <div className="win-titlebar" onMouseDown={handleTitleMouseDown}>
        <img className="win-titlebar-icon" src={config.icon} alt="" />
        <span className="win-titlebar-text">{config.title}</span>
        <div className="win-titlebar-btns">
          <button
            className="win-ctrl-btn"
            title="Minimize"
            onClick={() => onMinimize(config.id)}
          >─</button>
          <button
            className="win-ctrl-btn"
            title="Close"
            onClick={() => onClose(config.id)}
            style={{ marginLeft: 2 }}
          >✕</button>
        </div>
      </div>

      {/* Body */}
      <div className="win-body" style={{ height: config.size.h - 20 }}>
        {children}
      </div>
    </div>
  );
}
