import React, { useState, useRef, useEffect } from 'react';
import type { MorphicWidget, MatrixItem } from '../../types/morphic';
import { soundEngine } from '../../lib/soundEngine';
import {
  Compass,
  Plus,
  Trash2,
  Crosshair,
  Flame,
  Target,
  Sparkles,
} from 'lucide-react';

interface Props {
  widget: MorphicWidget;
  onUpdate: (updated: MorphicWidget) => void;
  onEmitOutput?: (key: string, value: number) => void;
}

export const MatrixRadarWidget: React.FC<Props> = ({ widget, onUpdate, onEmitOutput }) => {
  const axes = widget.data.matrixAxes || {
    xLabel: 'X軸 (低 → 高)',
    yLabel: 'Y軸 (低 → 高)',
    quadrants: ['第2象限 (低X・高Y)', '第1象限 (高X・高Y: 最重要)', '第3象限 (低X・低Y)', '第4象限 (高X・低Y)'],
  };
  const items = widget.data.matrixItems || [];

  const [activeItem, setActiveItem] = useState<MatrixItem | null>(null);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showCentroid, setShowCentroid] = useState(true);
  const [quadrantFilter, setQuadrantFilter] = useState<'all' | 'q1' | 'q2' | 'q3' | 'q4'>('all');

  const canvasRef = useRef<HTMLDivElement>(null);

  // Helper to determine quadrant for an item
  const getItemQuadrant = (item: MatrixItem): 'q1' | 'q2' | 'q3' | 'q4' => {
    if (item.x >= 50 && item.y >= 50) return 'q1';
    if (item.x < 50 && item.y >= 50) return 'q2';
    if (item.x < 50 && item.y < 50) return 'q3';
    return 'q4';
  };

  // Centroid (Center of Strategic Mass)
  const centroidX = items.length > 0 ? Math.round(items.reduce((acc, it) => acc + it.x, 0) / items.length) : 50;
  const centroidY = items.length > 0 ? Math.round(items.reduce((acc, it) => acc + it.y, 0) / items.length) : 50;

  // Quadrant distribution statistics
  const q1Items = items.filter((it) => it.x >= 50 && it.y >= 50);
  const q2Items = items.filter((it) => it.x < 50 && it.y >= 50);
  const q3Items = items.filter((it) => it.x < 50 && it.y < 50);
  const q4Items = items.filter((it) => it.x >= 50 && it.y < 50);

  // Emit outputs to Synapse bus
  useEffect(() => {
    if (!onEmitOutput) return;
    onEmitOutput('item_count', items.length);
    onEmitOutput('critical_count', q1Items.length);
  }, [items.length, q1Items.length, onEmitOutput]);

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

  const handleAddSampleMatrix = () => {
    soundEngine.playMorph();
    const sampleItems: MatrixItem[] = [
      { id: `item_${Date.now()}_1`, label: '⚡ 即効施策: サブスク価格最適化', x: 82, y: 88 },
      { id: `item_${Date.now()}_2`, label: '🚀 コア基盤: 自律エージェントAI刷新', x: 35, y: 92 },
      { id: `item_${Date.now()}_3`, label: '🎯 拡大戦略: エンタープライズ専任営業', x: 70, y: 65 },
      { id: `item_${Date.now()}_4`, label: '⏳ 業務改善: CI/CDパイプライン高速化', x: 78, y: 32 },
      { id: `item_${Date.now()}_5`, label: '⚠️ 低優先: 旧管理画面の再デザイン', x: 25, y: 20 },
    ];
    onUpdate({
      ...widget,
      data: {
        ...widget.data,
        matrixItems: [...items, ...sampleItems],
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Top HUD Controls: Centroid & Heatmap Toggles + Quadrant Stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-800/80 text-[11px]">
        {/* Quadrant Quick Filters */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => {
              soundEngine.playClick();
              setQuadrantFilter('all');
            }}
            className={`px-2 py-0.5 rounded font-mono transition-colors ${
              quadrantFilter === 'all'
                ? 'bg-slate-700 text-white font-bold'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            全表示 ({items.length})
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setQuadrantFilter('q1');
            }}
            className={`px-2 py-0.5 rounded font-mono transition-colors flex items-center gap-1 ${
              quadrantFilter === 'q1'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/80 font-bold'
                : 'bg-slate-900/80 text-slate-400 hover:text-emerald-400'
            }`}
            title="第1象限 (高X・高Y)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Q1 ({q1Items.length})
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setQuadrantFilter('q2');
            }}
            className={`px-2 py-0.5 rounded font-mono transition-colors flex items-center gap-1 ${
              quadrantFilter === 'q2'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/80 font-bold'
                : 'bg-slate-900/80 text-slate-400 hover:text-cyan-400'
            }`}
            title="第2象限 (低X・高Y)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Q2 ({q2Items.length})
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setQuadrantFilter('q3');
            }}
            className={`px-2 py-0.5 rounded font-mono transition-colors flex items-center gap-1 ${
              quadrantFilter === 'q3'
                ? 'bg-slate-800 text-slate-200 border border-slate-600 font-bold'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200'
            }`}
            title="第3象限 (低X・低Y)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Q3 ({q3Items.length})
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setQuadrantFilter('q4');
            }}
            className={`px-2 py-0.5 rounded font-mono transition-colors flex items-center gap-1 ${
              quadrantFilter === 'q4'
                ? 'bg-amber-950 text-amber-300 border border-amber-500/80 font-bold'
                : 'bg-slate-900/80 text-slate-400 hover:text-amber-400'
            }`}
            title="第4象限 (高X・低Y)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Q4 ({q4Items.length})
          </button>
        </div>

        {/* View Mode Switches */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              soundEngine.playClick();
              setShowHeatmap((prev) => !prev);
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border transition-colors ${
              showHeatmap
                ? 'bg-amber-950/70 border-amber-500/60 text-amber-300 font-semibold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="密集度ヒートマップ・ハロー表示切替"
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>熱密度</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setShowCentroid((prev) => !prev);
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border transition-colors ${
              showCentroid
                ? 'bg-indigo-950/70 border-indigo-500/60 text-indigo-300 font-semibold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="重心(Center of Mass)表示切替"
          >
            <Target className="w-3 h-3 text-indigo-400" />
            <span>戦略重心</span>
          </button>
        </div>
      </div>

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

          {/* Quadrant Tinting for Visual Intuition */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-2 grid-rows-2 opacity-10">
            <div className="bg-cyan-500/20" />
            <div className="bg-emerald-500/20" />
            <div className="bg-slate-500/20" />
            <div className="bg-amber-500/20" />
          </div>

          {/* Quadrant Labels */}
          {axes.quadrants && (
            <div className="absolute inset-0 pointer-events-none p-3 grid grid-cols-2 grid-rows-2 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              <div className="flex items-start justify-start opacity-70 text-cyan-400/80 font-bold">{axes.quadrants[0]}</div>
              <div className="flex items-start justify-end opacity-70 text-emerald-400/80 font-bold text-right">{axes.quadrants[1]}</div>
              <div className="flex items-end justify-start opacity-60 text-slate-400">{axes.quadrants[2]}</div>
              <div className="flex items-end justify-end opacity-60 text-amber-400/80 text-right">{axes.quadrants[3]}</div>
            </div>
          )}

          {/* Centroid / Center of Mass Marker */}
          {showCentroid && items.length > 0 && (
            <div
              style={{
                left: `${centroidX}%`,
                bottom: `${centroidY}%`,
                transform: 'translate(-50%, 50%)',
              }}
              className="absolute pointer-events-none z-15 flex flex-col items-center"
            >
              <div className="relative flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border border-indigo-400/50 animate-ping absolute" />
                <div className="w-4 h-4 rounded-full bg-indigo-500/40 border border-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/50">
                  <div className="w-1 h-1 bg-white rounded-full" />
                </div>
              </div>
              <div className="mt-1 whitespace-nowrap px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-950/90 text-indigo-200 border border-indigo-500/50 shadow">
                重心 [X:{centroidX} Y:{centroidY}]
              </div>
            </div>
          )}

          {/* Plotted Node Items */}
          {items.map((item) => {
            const isSelected = activeItem?.id === item.id;
            const q = getItemQuadrant(item);
            const isFilteredOut = quadrantFilter !== 'all' && quadrantFilter !== q;

            // Halo color based on quadrant
            const haloColor =
              q === 'q1'
                ? 'rgba(16, 185, 129, 0.28)'
                : q === 'q2'
                ? 'rgba(6, 182, 212, 0.28)'
                : q === 'q4'
                ? 'rgba(245, 158, 11, 0.25)'
                : 'rgba(148, 163, 184, 0.18)';

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
                className={`absolute group cursor-pointer transition-all duration-200 ${
                  isFilteredOut ? 'opacity-20 pointer-events-none' : 'opacity-100'
                } ${isSelected ? 'scale-110 z-30' : 'hover:scale-105 z-20'}`}
              >
                {/* Density Heatmap Halo */}
                {showHeatmap && !isFilteredOut && (
                  <div
                    className="absolute -inset-6 rounded-full pointer-events-none blur-md animate-pulse"
                    style={{ background: `radial-gradient(circle, ${haloColor} 0%, transparent 70%)` }}
                  />
                )}

                <div
                  className={`relative w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-cyan-400 ring-4 ring-cyan-500/40 shadow-lg shadow-cyan-500/60'
                      : q === 'q1'
                      ? 'bg-emerald-400 hover:bg-emerald-300 ring-2 ring-emerald-500/30'
                      : q === 'q2'
                      ? 'bg-cyan-500 hover:bg-cyan-400 ring-2 ring-cyan-500/30'
                      : q === 'q4'
                      ? 'bg-amber-500 hover:bg-amber-400 ring-2 ring-amber-500/30'
                      : 'bg-indigo-500/80 hover:bg-indigo-400 ring-2 ring-indigo-500/20'
                  }`}
                >
                  <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
                </div>

                <div
                  className={`absolute left-1/2 -translate-x-1/2 bottom-5 whitespace-nowrap px-2 py-0.5 rounded text-[11px] font-medium pointer-events-none transition-all ${
                    isSelected
                      ? 'bg-cyan-950 text-cyan-200 border border-cyan-500/60 shadow-lg'
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
          <span className="flex items-center gap-1">
            <span className="text-cyan-400 font-bold">←</span> {axes.xLabel} <span className="text-cyan-400 font-bold">→</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-indigo-400 font-bold">↓</span> {axes.yLabel} <span className="text-indigo-400 font-bold">↑</span>
          </span>
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
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            要素をクリックして位置調整または詳細確認
          </div>
        )}

        <div className="flex items-center gap-2">
          {items.length === 0 && (
            <button
              onClick={handleAddSampleMatrix}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-850 border border-slate-800 px-2.5 py-1.5 rounded-lg transition-colors font-medium"
              title="サンプル戦略アイテムを展開"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>サンプル展開</span>
            </button>
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
    </div>
  );
};
