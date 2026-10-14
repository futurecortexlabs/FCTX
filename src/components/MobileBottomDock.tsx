import React from 'react';
import type { WorkspaceViewMode } from '../types/morphic';
import { soundEngine } from '../lib/soundEngine';
import {
  Brain,
  Flame,
  LayoutGrid,
  Menu,
  Orbit,
  Sparkles,
  X,
} from 'lucide-react';

interface Props {
  viewMode: WorkspaceViewMode;
  onToggleViewMode: () => void;
  onOpenHypothesisLab?: () => void;
  onOpenCopilot?: () => void;
  onToggleMenu: () => void;
  onFocusCommandBar: () => void;
  isMenuOpen: boolean;
}

export const MobileBottomDock: React.FC<Props> = ({
  viewMode,
  onToggleViewMode,
  onOpenHypothesisLab,
  onOpenCopilot,
  onToggleMenu,
  onFocusCommandBar,
  isMenuOpen,
}) => {
  return (
    <nav
      aria-label="モバイル・ナビゲーション"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-slate-950/90 backdrop-blur-2xl border-t border-slate-800/90 shadow-[0_-8px_30px_rgba(0,0,0,0.7)] px-2 py-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+6px)] transition-all"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. View Mode (Grid vs Spatial Canvas) */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onToggleViewMode();
          }}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl text-slate-400 hover:text-white active:scale-95 transition-all flex-1"
          title={viewMode === 'canvas' ? 'グリッド表示に切替' : '空間キャンバスに切替'}
        >
          <div
            className={`p-1.5 rounded-lg border transition-all ${
              viewMode === 'canvas'
                ? 'bg-purple-950/80 border-purple-500/70 text-purple-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {viewMode === 'canvas' ? (
              <Orbit className="w-4 h-4 text-purple-400" />
            ) : (
              <LayoutGrid className="w-4 h-4" />
            )}
          </div>
          <span className="text-[10px] font-mono mt-1 text-slate-400">
            {viewMode === 'canvas' ? '空間' : 'グリッド'}
          </span>
        </button>

        {/* 2. Hypothesis Lab (H) */}
        {onOpenHypothesisLab && (
          <button
            onClick={() => {
              soundEngine.playMorph();
              onOpenHypothesisLab();
            }}
            className="flex flex-col items-center justify-center p-1.5 rounded-xl text-slate-400 hover:text-amber-300 active:scale-95 transition-all flex-1"
            title="仮説ストレステスト・ラボ"
          >
            <div className="p-1.5 rounded-lg bg-amber-950/70 border border-amber-600/60 text-amber-400 shadow-sm shadow-amber-950/50">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
            <span className="text-[10px] font-mono mt-1 text-amber-300 font-medium">仮説ラボ</span>
          </button>
        )}

        {/* 3. Central Morph / Command Input Button (Elevated Action Pill) */}
        <button
          onClick={() => {
            soundEngine.playMorph();
            onFocusCommandBar();
          }}
          className="flex flex-col items-center justify-center -mt-4 px-2 active:scale-95 transition-all group flex-1"
          title="思考プロンプト・音声入力を起動"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-900/60 group-hover:shadow-indigo-500/50 transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center border border-indigo-400/40">
              <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
            </div>
          </div>
          <span className="text-[10px] font-mono mt-1 text-indigo-300 font-bold">思考変形</span>
        </button>

        {/* 4. Cortex AI Copilot */}
        {onOpenCopilot && (
          <button
            onClick={() => {
              soundEngine.playMorph();
              onOpenCopilot();
            }}
            className="flex flex-col items-center justify-center p-1.5 rounded-xl text-slate-400 hover:text-cyan-300 active:scale-95 transition-all flex-1"
            title="Cortex Copilot AI"
          >
            <div className="p-1.5 rounded-lg bg-indigo-950/70 border border-indigo-600/60 text-cyan-300 shadow-sm shadow-indigo-950/50">
              <Brain className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono mt-1 text-cyan-300">AI診断</span>
          </button>
        )}

        {/* 5. Mobile Menu Drawer Toggle */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onToggleMenu();
          }}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl text-slate-400 hover:text-white active:scale-95 transition-all flex-1"
          title={isMenuOpen ? 'メニューを閉じる' : '機能メニューを開く'}
        >
          <div
            className={`p-1.5 rounded-lg border transition-all ${
              isMenuOpen
                ? 'bg-rose-950/80 border-rose-500/70 text-rose-300'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </div>
          <span className="text-[10px] font-mono mt-1 text-slate-400">
            {isMenuOpen ? '閉じる' : 'メニュー'}
          </span>
        </button>
      </div>
    </nav>
  );
};
