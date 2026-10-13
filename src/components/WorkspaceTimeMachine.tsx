import React, { useState } from 'react';
import { soundEngine } from '../lib/soundEngine';
import type { HistoryEntry } from './modals/HistoryDrawer';
import {
  Clock,
  History,
  RotateCcw,
  RotateCw,
  X,
  Zap,
} from 'lucide-react';

interface Props {
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  onUndo: () => void;
  onRedo: () => void;
  history: HistoryEntry[];
  onRestoreHistory: (entry: HistoryEntry) => void;
}

export const WorkspaceTimeMachine: React.FC<Props> = ({
  canUndo,
  canRedo,
  undoCount,
  redoCount,
  onUndo,
  onRedo,
  history,
  onRestoreHistory,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sliderIndex, setSliderIndex] = useState(0);

  const activeHistoryItem = history[sliderIndex] || history[0];

  return (
    <div className="fixed bottom-5 left-5 z-40 flex flex-col items-start gap-2 select-none">
      {/* Expanded Time Scrubber Drawer */}
      {isExpanded && history.length > 0 && (
        <div className="bg-slate-900/95 border border-indigo-500/60 rounded-2xl p-4 shadow-2xl backdrop-blur-xl w-80 sm:w-96 animate-in slide-in-from-bottom duration-200 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-100 font-mono tracking-wider">
                TEMPORAL SCRUBBER
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-white p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>過去 (#{history.length})</span>
              <span className="text-cyan-300 font-bold">
                STEP {history.length - sliderIndex} / {history.length}
              </span>
              <span>最新 (#1)</span>
            </div>
            <input
              type="range"
              min={0}
              max={history.length - 1}
              value={sliderIndex}
              onChange={(e) => {
                soundEngine.playClick();
                setSliderIndex(parseInt(e.target.value, 10));
              }}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Snapshot Info Card */}
          {activeHistoryItem && (
            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>{new Date(activeHistoryItem.timestamp).toLocaleTimeString('ja-JP')}</span>
                <span className="text-indigo-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  {activeHistoryItem.widgetSnapshot.length} モジュール
                </span>
              </div>
              <div className="font-semibold text-slate-200 line-clamp-1">
                「{activeHistoryItem.prompt}」
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {activeHistoryItem.reasoning}
              </p>

              <button
                onClick={() => {
                  soundEngine.playMorph();
                  onRestoreHistory(activeHistoryItem);
                  setIsExpanded(false);
                }}
                className="w-full mt-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-indigo-950/40"
              >
                <RotateCcw className="w-3 h-3" />
                <span>この時点にワークスペースを復元</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating HUD Controller Pill */}
      <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800/90 rounded-2xl px-2.5 py-1.5 backdrop-blur-xl shadow-2xl">
        {/* Undo Button */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono transition-all disabled:opacity-30 disabled:hover:bg-transparent hover:bg-slate-800 text-slate-200 hover:text-white"
          title="元に戻す (Ctrl+Z / Cmd+Z)"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Undo</span>
          {undoCount > 0 && (
            <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1 rounded border border-cyan-800/50">
              {undoCount}
            </span>
          )}
        </button>

        {/* Redo Button */}
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono transition-all disabled:opacity-30 disabled:hover:bg-transparent hover:bg-slate-800 text-slate-200 hover:text-white"
          title="やり直し (Ctrl+Y / Ctrl+Shift+Z)"
        >
          <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Redo</span>
          {redoCount > 0 && (
            <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1 rounded border border-indigo-800/50">
              {redoCount}
            </span>
          )}
        </button>

        <div className="w-px h-4 bg-slate-800 my-auto" />

        {/* Time Machine Scrubber Toggle Button */}
        <button
          onClick={() => {
            soundEngine.playClick();
            setIsExpanded((prev) => !prev);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono transition-all ${
            isExpanded
              ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="時間軸スライダー (Time Scrubber)"
        >
          <History className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Time Machine</span>
        </button>
      </div>
    </div>
  );
};
