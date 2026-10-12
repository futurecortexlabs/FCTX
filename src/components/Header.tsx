import React from 'react';
import { soundEngine } from '../lib/soundEngine';
import { Cpu, Download, History, RefreshCw, Settings, Volume2, VolumeX, Zap } from 'lucide-react';

interface Props {
  widgetCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onOpenSnapshot: () => void;
  onOpenHistory: () => void;
  onResetWorkspace: () => void;
}

export const Header: React.FC<Props> = ({
  widgetCount,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
  onOpenSnapshot,
  onOpenHistory,
  onResetWorkspace,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-900/30">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-wider text-slate-100 font-mono">
                FCTX <span className="text-indigo-400">//</span> MORPHIC
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 hidden sm:inline-block">
                v1.0 Ambient OS
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>自己変形型アンビエント・インターフェース</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Widgets Pill */}
          <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hidden md:flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>稼働モジュール:</span>
            <span className="font-bold text-indigo-300">{widgetCount}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onToggleSound();
            }}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-slate-900 border-slate-800 text-cyan-400 hover:text-cyan-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title={soundEnabled ? '音響効果: ON (クリックでミュート)' : '音響効果: ミュート (クリックで有効化)'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Export / Snapshot */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenSnapshot();
            }}
            className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-colors font-medium"
            title="ワークスペースのエクスポート / 復元"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">保存 & 出力</span>
          </button>

          {/* History */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenHistory();
            }}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
            title="思考変形タイムライン"
          >
            <History className="w-4 h-4 text-purple-400" />
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenSettings();
            }}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
            title="環境設定 (Gemini APIキー、音響等)"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Reset */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onResetWorkspace();
            }}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
            title="ワークスペースを初期化"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
