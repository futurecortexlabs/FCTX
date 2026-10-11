import React, { useState, useRef } from 'react';
import type { MorphicWidget, MatrixItem } from '../../types/morphic';
import { soundEngine } from '../../lib/soundEngine';
import { Compass, Plus, Trash2, Crosshair } from 'lucide-react';

interface Props {
  widget: MorphicWidget;
  onUpdate: (updated: MorphicWidget) => void;
}

export const MatrixRadarWidget: React.FC<Props> = ({ widget, onUpdate }) => {
  const axes = widget.data.matrixAxes || {
    xLabel: 'X軸 (低 → 高)',
    yLabel: 'Y軸 (低 → 高)',
    quadrants: ['第2象限', '第1象限', '第3象限', '第4象限'],
  };
  const items = widget.data.matrixItems || [];

  const [activeItem, setActiveItem] = useState<MatrixItem | null>(null);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemLabel.trim()) return;

    soundEngine.playClick();
    const newItem: MatrixItem = {
      id: `item_${Date.now()}`,
      label: newItemLabel.trim(),
      x: 50,
      y: 50,
    };

    const updated = {
      ...widget,
      data: {
        ...widget.data,
        matrixItems: [...items, newItem],
      },
    };
    onUpdate(updated);
    setNewItemLabel('');
    setIsAdding(false);
    setActiveItem(newItem);
  };

  const handleDeleteItem = (id: string) => {
    soundEngine.playClick();
    const updated = {
      ...widget,
      data: {
        ...widget.data,
        matrixItems: items.filter((item) => item.id !== id),
      },
    };
    onUpdate(updated);
    if (activeItem?.id === id) setActiveItem(null);
  };

  const handlePlaneClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !activeItem) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = (1 - (e.clientY - rect.top) / rect.height) * 100;

    const boundedX = Math.max(5, Math.min(95, Math.round(rawX)));
    const boundedY = Math.max(5, Math.min(95, Math.round(rawY)));

    soundEngine.playSynapsePulse();
    const updatedItems = items.map((it) => (it.id === activeItem.id ? { ...it, x: boundedX, y: boundedY } : it));

    const updated = {
      ...widget,
      data: { ...widget.data, matrixItems: updatedItems },
    };
    onUpdate(updated);
    setActiveItem({ ...activeItem, x: boundedX, y: boundedY });
  };

  return (
    <div className="space-y-4">
      {/* 2D Coordinate Grid */}
      <div className="relative">
        <div
          ref={canvasRef}
          onClick={handlePlaneClick}
          className="relative w-full h-72 sm:h-80 bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden cursor-crosshair select-none"
        >
          {/* Subtle Grid Lines */}
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none opacity-20">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="border border-slate-700/50" />
            ))}
          </div>

          {/* Center Axes (X, Y) */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-700/60 pointer-events-none" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700/60 pointer-events-none" />

          {/* Quadrant Labels */}
          {axes.quadrants && (
            <div className="absolute inset-0 pointer-events-none p-3 grid grid-cols-2 grid-rows-2 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              <div className="flex items-start justify-start opacity-60">{axes.quadrants[0]}</div>
              <div className="flex items-start justify-end opacity-60 text-right">{axes.quadrants[1]}</div>
              <div className="flex items-end justify-start opacity-60">{axes.quadrants[2]}</div>
              <div className="flex items-end justify-end opacity-60 text-right">{axes.quadrants[3]}</div>
            </div>
          )}

          {/* Plotted Node Items */}
          {items.map((item) => {
            const isSelected = activeItem?.id === item.id;
            return (
              <div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  soundEngine.playClick();
                  setActiveItem(item);
                }}
                style={{
                  left: `${item.x}%`,
                  bottom: `${item.y}%`,
                  transform: 'translate(-50%, 50%)',
                }}
                className={`absolute group cursor-pointer transition-transform duration-200 ${
                  isSelected ? 'scale-110 z-20' : 'hover:scale-105 z-10'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-cyan-400 ring-4 ring-cyan-500/30 shadow-lg shadow-cyan-500/50'
                      : 'bg-indigo-500/80 hover:bg-indigo-400 ring-2 ring-indigo-500/20'
                  }`}
                >
                  <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
                </div>

                <div
                  className={`absolute left-1/2 -translate-x-1/2 bottom-5 whitespace-nowrap px-2 py-0.5 rounded text-[11px] font-medium pointer-events-none transition-all ${
                    isSelected
                      ? 'bg-cyan-950 text-cyan-200 border border-cyan-500/60 shadow'
                      : 'bg-slate-900/90 text-slate-300 border border-slate-700/60 opacity-80 group-hover:opacity-100'
                  }`}
                >
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Axis Titles */}
        <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono mt-2 px-1">
          <span>{axes.xLabel}</span>
          <span>{axes.yLabel}</span>
        </div>
      </div>

      {/* Control Strip & Active Item Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
        {activeItem ? (
          <div className="flex items-center gap-3 text-xs bg-slate-900/70 px-3 py-1.5 rounded-lg border border-slate-800">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-200">{activeItem.label}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              (X: {activeItem.x}%, Y: {activeItem.y}%)
            </span>
            <span className="text-[10px] text-slate-500">※マップ上をクリックして移動</span>
            <button
              onClick={() => handleDeleteItem(activeItem.id)}
              className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
              title="削除"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            要素をクリックして位置調整または詳細確認
          </div>
        )}

        {isAdding ? (
          <form onSubmit={handleAddItem} className="flex items-center gap-2">
            <input
              type="text"
              value={newItemLabel}
              onChange={(e) => setNewItemLabel(e.target.value)}
              placeholder="新しい要素名を入力..."
              autoFocus
              className="text-xs bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded-lg font-medium transition-colors"
            >
              配置
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-slate-200 px-1"
            >
              キャンセル
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/80 border border-cyan-800/40 px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            要素を追加
          </button>
        )}
      </div>
    </div>
  );
};
