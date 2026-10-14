import React, { useState } from 'react';
import { soundEngine } from '../lib/soundEngine';
import type { WorkspaceViewMode } from '../types/morphic';
import {
  Brain,
  Cpu,
  Download,
  Flame,
  GitCompare,
  HelpCircle,
  History,
  LayoutGrid,
  Menu,
  Network,
  Orbit,
  Presentation,
  RefreshCw,
  Settings,
  Share2,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';

interface Props {
  widgetCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onOpenSnapshot: () => void;
  onOpenHistory: () => void;
  onOpenPresentationDeck: () => void;
  onOpenScenarioComparator?: () => void;
  onOpenHypothesisLab?: () => void;
  onOpenTopology?: () => void;
  onOpenCopilot?: () => void;
  onOpenShortcutsHelp?: () => void;
  onResetWorkspace: () => void;
  isWiringMode: boolean;
  onToggleWiring: () => void;
  viewMode: WorkspaceViewMode;
  onToggleViewMode: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<Props> = ({
  widgetCount,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
  onOpenSnapshot,
  onOpenHistory,
  onOpenPresentationDeck,
  onOpenScenarioComparator,
  onOpenHypothesisLab,
  onOpenTopology,
  onOpenCopilot,
  onOpenShortcutsHelp,
  onResetWorkspace,
  isWiringMode,
  onToggleWiring,
  viewMode,
  onToggleViewMode,
  isMobileMenuOpen,
  onToggleMobileMenu,
}) => {
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const menuOpen = isMobileMenuOpen !== undefined ? isMobileMenuOpen : internalMenuOpen;
  const toggleMenu = onToggleMobileMenu || (() => setInternalMenuOpen((prev) => !prev));

  const handleMobileAction = (action: () => void) => {
    soundEngine.playClick();
    action();
    if (onToggleMobileMenu) {
      onToggleMobileMenu();
    } else {
      setInternalMenuOpen(false);
    }
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-900/30 flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-wider text-slate-100 font-mono truncate">
                FCTX <span className="text-indigo-400">//</span> MORPHIC
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 hidden sm:inline-block">
                v1.0 Ambient OS
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5 font-sans truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span className="truncate">自己変形型アンビエント・インターフェース</span>
            </div>
          </div>
        </div>

        {/* Desktop Action Controls (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-2 lg:gap-2.5">
          {/* Active Widgets Pill */}
          <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hidden lg:flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>稼働モジュール:</span>
            <span className="font-bold text-indigo-300">{widgetCount}</span>
          </div>

          {/* View Mode Toggle (Grid vs Spatial Canvas) */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onToggleViewMode();
            }}
            className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 ${
              viewMode === 'canvas'
                ? 'bg-purple-950/80 border-purple-500/80 text-purple-200 shadow-md shadow-purple-950/40 ring-1 ring-purple-500/50'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={viewMode === 'canvas' ? 'グリッド表示に切り替え' : '空間キャンバス表示に切り替え (パン & ズーム)'}
          >
            {viewMode === 'canvas' ? <Orbit className="w-4 h-4 text-purple-400 animate-spin-slow" /> : <LayoutGrid className="w-4 h-4" />}
            <span className="text-xs font-mono hidden xl:inline">
              {viewMode === 'canvas' ? '空間キャンバス' : 'グリッド'}
            </span>
          </button>

          {/* Wiring Mode Toggle */}
          <button
            onClick={() => {
              soundEngine.playMorph();
              onToggleWiring();
            }}
            className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 ${
              isWiringMode
                ? 'bg-cyan-950/90 border-cyan-500 text-cyan-200 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-500 animate-pulse'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-400'
            }`}
            title={isWiringMode ? '配線モード終了' : 'シナプス配線モード (モジュール間データ直結)'}
          >
            <Share2 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold hidden lg:inline">
              {isWiringMode ? '配線中' : 'シナプス配線'}
            </span>
          </button>

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

          {/* Cortex Copilot AI Drawer */}
          {onOpenCopilot && (
            <button
              onClick={() => {
                soundEngine.playMorph();
                onOpenCopilot();
              }}
              className="flex items-center gap-1.5 text-xs bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 text-cyan-300 hover:text-white px-3 py-2 rounded-lg transition-colors font-medium shadow-sm"
              title="Cortex Copilot (ワークスペース共生AI診断・対話)"
            >
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Cortex AI</span>
            </button>
          )}

          {/* Presentation Deck Mode */}
          <button
            onClick={() => {
              soundEngine.playMorph();
              onOpenPresentationDeck();
            }}
            className="flex items-center gap-1.5 text-xs bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-700/60 text-indigo-200 hover:text-white px-3 py-2 rounded-lg transition-colors font-medium shadow-sm"
            title="生きた対話型プレゼンテーションモード (全画面スライド)"
          >
            <Presentation className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline">プレゼン</span>
          </button>

          {/* Multiverse Parallel Scenario Comparator */}
          {onOpenScenarioComparator && (
            <button
              onClick={() => {
                soundEngine.playMorph();
                onOpenScenarioComparator();
              }}
              className="flex items-center gap-1.5 text-xs bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-700/60 text-cyan-200 hover:text-white px-3 py-2 rounded-lg transition-colors font-medium shadow-sm"
              title="多元並行世界シナリオ比較 (現在・履歴・プリセット間のKPI・差分分析)"
            >
              <GitCompare className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden lg:inline">並行比較</span>
            </button>
          )}

          {/* Hypothesis Stress Lab */}
          {onOpenHypothesisLab && (
            <button
              onClick={() => {
                soundEngine.playMorph();
                onOpenHypothesisLab();
              }}
              className="flex items-center gap-1.5 text-xs bg-amber-950/70 hover:bg-amber-900/80 border border-amber-700/60 text-amber-200 hover:text-white px-3 py-2 rounded-lg transition-colors font-medium shadow-sm"
              title="仮説ストレステスト・ラボ (極限ショック注入 & 堅牢度・破綻ライン分析)"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden lg:inline">仮説ラボ</span>
            </button>
          )}

          {/* Cognitive Topology Neural Network Map */}
          {onOpenTopology && (
            <button
              onClick={() => {
                soundEngine.playMorph();
                onOpenTopology();
              }}
              className="flex items-center gap-1.5 text-xs bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-700/60 text-indigo-200 hover:text-white px-3 py-2 rounded-lg transition-colors font-medium shadow-sm"
              title="思考相関トポロジー・マップ (因果ネットワーク & 神経結線グラフ)"
            >
              <Network className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="hidden lg:inline">相関マップ</span>
            </button>
          )}

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
            <span className="hidden lg:inline">保存 & 出力</span>
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

          {/* Shortcuts Help */}
          {onOpenShortcutsHelp && (
            <button
              onClick={() => {
                soundEngine.playClick();
                onOpenShortcutsHelp();
              }}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-300 rounded-lg transition-colors"
              title="キーボードショートカット一覧 (?)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

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

        {/* Mobile Header Compact Controls (visible on screens < md) */}
        <div className="flex md:hidden items-center gap-2">
          {/* View mode toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onToggleViewMode();
            }}
            className={`p-2 rounded-lg border transition-all ${
              viewMode === 'canvas'
                ? 'bg-purple-950/80 border-purple-500/80 text-purple-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="グリッド / 空間キャンバス切替"
          >
            {viewMode === 'canvas' ? <Orbit className="w-4 h-4 text-purple-400" /> : <LayoutGrid className="w-4 h-4" />}
          </button>

          {/* Sound toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onToggleSound();
            }}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-slate-900 border-slate-800 text-cyan-400'
                : 'bg-slate-900/60 border-slate-800 text-slate-500'
            }`}
            title="音響効果"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Hamburger Menu Trigger */}
          <button
            onClick={() => {
              soundEngine.playClick();
              toggleMenu();
            }}
            className={`p-2 rounded-xl border transition-all ${
              menuOpen
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/40'
                : 'bg-slate-900 border-slate-800 text-slate-200 hover:text-white'
            }`}
            title={menuOpen ? 'メニューを閉じる' : '機能メニュー'}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer Overlay (visible on < md when menuOpen is true) */}
      {menuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-50 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 overflow-y-auto animate-in slide-in-from-top-4 duration-200 p-4 space-y-5 pb-28">
          {/* Status bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <span className="flex items-center gap-2 text-slate-300">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>稼働モジュール: <b className="text-indigo-400">{widgetCount}</b> 件</span>
            </span>
            <span className="text-[11px] text-cyan-300 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded">
              {viewMode === 'canvas' ? '空間キャンバス' : 'グリッド配置'}
            </span>
          </div>

          {/* Category 1: AI & Advanced Analytics */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider px-1">
              AI & 高度認知分析
            </div>
            <div className="grid grid-cols-2 gap-2">
              {onOpenCopilot && (
                <button
                  onClick={() => handleMobileAction(onOpenCopilot)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 text-left transition-all active:scale-98"
                >
                  <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-cyan-300 flex-shrink-0">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Cortex AI</span>
                    <span className="text-[10px] text-slate-400">全体診断・対話</span>
                  </div>
                </button>
              )}

              {onOpenHypothesisLab && (
                <button
                  onClick={() => handleMobileAction(onOpenHypothesisLab)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/60 text-left transition-all active:scale-98"
                >
                  <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-800/60 text-amber-400 flex-shrink-0">
                    <Flame className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">仮説ラボ</span>
                    <span className="text-[10px] text-slate-400">ストレステスト</span>
                  </div>
                </button>
              )}

              {onOpenScenarioComparator && (
                <button
                  onClick={() => handleMobileAction(onOpenScenarioComparator)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 text-left transition-all active:scale-98"
                >
                  <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 flex-shrink-0">
                    <GitCompare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">並行比較</span>
                    <span className="text-[10px] text-slate-400">マルチバース</span>
                  </div>
                </button>
              )}

              {onOpenTopology && (
                <button
                  onClick={() => handleMobileAction(onOpenTopology)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/60 text-left transition-all active:scale-98"
                >
                  <div className="p-2 rounded-lg bg-purple-950/80 border border-purple-800/60 text-purple-400 flex-shrink-0">
                    <Network className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">相関マップ</span>
                    <span className="text-[10px] text-slate-400">思考トポロジー</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Category 2: Workspace Modes & Presentation */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider px-1">
              ワークスペース操作 & 発表
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleMobileAction(onToggleViewMode)}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-left transition-all active:scale-98"
              >
                <div className="p-2 rounded-lg bg-slate-800 text-indigo-400 flex-shrink-0">
                  {viewMode === 'canvas' ? <LayoutGrid className="w-4 h-4" /> : <Orbit className="w-4 h-4" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200 block">表示切替</span>
                  <span className="text-[10px] text-slate-400">{viewMode === 'canvas' ? 'グリッドへ' : '空間へ'}</span>
                </div>
              </button>

              <button
                onClick={() => handleMobileAction(onToggleWiring)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all active:scale-98 ${
                  isWiringMode
                    ? 'bg-cyan-950/90 border-cyan-500 text-cyan-200'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 flex-shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200 block">シナプス配線</span>
                  <span className="text-[10px] text-slate-400">{isWiringMode ? '配線中' : '結線モード'}</span>
                </div>
              </button>

              <button
                onClick={() => handleMobileAction(onOpenPresentationDeck)}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-left transition-all active:scale-98 col-span-2"
              >
                <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 flex-shrink-0">
                  <Presentation className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200 block">対話型プレゼンテーション</span>
                  <span className="text-[10px] text-slate-400">全画面スライドデッキを起動</span>
                </div>
              </button>
            </div>
          </div>

          {/* Category 3: Data, History & System */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider px-1">
              データ & 環境設定
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleMobileAction(onOpenSnapshot)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-left"
              >
                <Download className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-xs text-slate-300 truncate">保存 & 出力</span>
              </button>

              <button
                onClick={() => handleMobileAction(onOpenHistory)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-left"
              >
                <History className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span className="text-xs text-slate-300 truncate">タイムライン</span>
              </button>

              {onOpenShortcutsHelp && (
                <button
                  onClick={() => handleMobileAction(onOpenShortcutsHelp)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-left"
                >
                  <HelpCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-xs text-slate-300 truncate">ショートカット</span>
                </button>
              )}

              <button
                onClick={() => handleMobileAction(onOpenSettings)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-left"
              >
                <Settings className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-300 truncate">環境設定</span>
              </button>

              <button
                onClick={() => handleMobileAction(onResetWorkspace)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-rose-900/40 text-left col-span-2 text-rose-300 hover:bg-rose-950/40"
              >
                <RefreshCw className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span className="text-xs font-semibold">ワークスペースを初期化</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
