'use client';
import React from 'react';

interface PanelProps {
  icon: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export default function Panel({ icon, title, action, children }: PanelProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-header-left">
          <span className="panel-icon">{icon}</span>
          <h2 className="panel-title">{title}</h2>
        </div>
        {action && <div className="panel-action">{action}</div>}
      </div>
      <div className="panel-body">{children}</div>
    </div>
  );
}
