import React, { useState, useEffect } from 'react';
import type { MorphicWidget, ThoughtPreset } from '../../types/morphic';
import { WidgetContainer } from '../WidgetContainer';
import { soundEngine } from '../../lib/soundEngine';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Presentation,
  X,
  Play,
  Pause,
  RotateCcw,
  Timer,
  Sparkles,
  BookOpen,
  Film,
  Check,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  widgets: MorphicWidget[];
  onUpdateWidget: (updated: MorphicWidget) => void;
  onRemoveWidget: (id: string) => void;
  onEmitOutput?: (key: string, value: number) => void;
  presets?: ThoughtPreset[];
  onApplyPreset?: (preset: ThoughtPreset) => void;
}

export const PresentationDeckModal: React.FC<Props> = ({
  isOpen,
  onClose,
  widgets,
  onUpdateWidget,
  onRemoveWidget,
  onEmitOutput,
  presets,
  onApplyPreset,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
  const [showFilmstrip, setShowFilmstrip] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);

  // Presentation stopwatch
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Touch swipe tracking for mobile
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX < -50) {
      // Swiped left -> next
      soundEngine.playClick();
      setCurrentIndex((prev) => (prev + 1) % (widgets.length || 1));
    } else if (deltaX > 50) {
      // Swiped right -> prev
      soundEngine.playClick();
      setCurrentIndex((prev) => (prev - 1 + widgets.length) % (widgets.length || 1));
    }
    setTouchStartX(null);
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setTimerSeconds(0);
      setIsTimerRunning(true);
    }
  }, [isOpen]);

  // Stopwatch interval
  useEffect(() => {
    if (!isOpen || !isTimerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isTimerRunning]);

  // Auto-play presentation carousel (advances every 8 seconds)
  useEffect(() => {
    if (!isOpen || !isAutoPlay || widgets.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % widgets.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isOpen, isAutoPlay, widgets.length]);

  // Keyboard navigation: Left/Right arrows, Space, Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        soundEngine.playClick();
        setCurrentIndex((prev) => (prev + 1) % (widgets.length || 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        soundEngine.playClick();
        setCurrentIndex((prev) => (prev - 1 + widgets.length) % (widgets.length || 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, widgets.length, onClose]);

  if (!isOpen || widgets.length === 0) return null;

  const currentWidget = widgets[currentIndex] || widgets[0];

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const renderPresetIcon = (icon: string) => {
    switch (icon) {
      case 'Rocket':
        return '🚀';
      case 'ShieldAlert':
        return '🛡️';
      case 'Brain':
        return '🧠';
      case 'GitBranch':
        return '⚡';
      case 'GitFork':
        return '🌳';
      case 'Scale':
        return '⚖️';
      case 'Compass':
        return '🧭';
      default:
        return icon.length <= 2 ? icon : '✨';
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#05070d]/98 backdrop-blur-2xl flex flex-col p-3 sm:p-6 animate-in fade-in duration-200 select-none">
      {/* Top Deck Navigation Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
        {/* Left: Presentation Branding & Current Slide Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-800/60 shadow-lg shadow-indigo-950/50 flex-shrink-0">
            <Presentation className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-indigo-300 font-bold tracking-wider hidden sm:inline">
                [EXECUTIVE DECK MODE]
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800 flex-shrink-0">
                SLIDE {currentIndex + 1} / {widgets.length}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2 truncate">
              <span className="truncate">{currentWidget.title}</span>
              <span className="text-[11px] font-normal text-slate-400 font-mono hidden md:inline">
                ({currentWidget.category})
              </span>
            </h2>
          </div>
        </div>

        {/* Center: Live Pitch Stopwatch */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs text-slate-300">
          <Timer className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold tracking-wider">{formatTimer(timerSeconds)}</span>
          <button
            onClick={() => setIsTimerRunning((prev) => !prev)}
            className="p-1 hover:text-white transition-colors"
            title={isTimerRunning ? 'タイマー停止' : 'タイマー再開'}
          >
            {isTimerRunning ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
          </button>
          <button
            onClick={() => setTimerSeconds(0)}
            className="p-1 hover:text-white transition-colors"
            title="タイマーリセット"
          >
            <RotateCcw className="w-3 h-3 text-slate-500 hover:text-slate-300" />
          </button>
        </div>

        {/* Right Action Controls: Preset Picker, AutoPlay, Fullscreen, Close */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Preset Selector Dropdown */}
          {presets && presets.length > 0 && onApplyPreset && (
            <div className="relative">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setIsPresetMenuOpen((prev) => !prev);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-950 border border-indigo-700/60 text-xs text-indigo-200 transition-colors"
                title="プリセットをロード"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">プリセット</span>
              </button>

              {isPresetMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-1.5 space-y-1">
                  <div className="text-[10px] font-mono text-slate-500 px-2 py-1 uppercase tracking-wider">
                    プリセット切り替え
                  </div>
                  {presets.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onApplyPreset(p);
                        setIsPresetMenuOpen(false);
                        setCurrentIndex(0);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800/80 transition-colors flex items-start gap-2 text-xs"
                    >
                      <span className="text-base leading-none">{renderPresetIcon(p.icon)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-200">{p.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{p.tagline}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AutoPlay Toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              setIsAutoPlay((prev) => !prev);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors flex items-center gap-1.5 ${
              isAutoPlay
                ? 'bg-cyan-950 border-cyan-500/80 text-cyan-200 font-bold animate-pulse'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="自動スライドショー (8秒毎に進行)"
          >
            {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">自動進行</span>
          </button>

          {/* Speaker Notes Toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              setShowNotes((prev) => !prev);
            }}
            className={`p-2 rounded-lg border transition-colors ${
              showNotes
                ? 'bg-purple-950/80 border-purple-500/80 text-purple-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="発表者メモ・要点解説トグル"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Filmstrip Toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              setShowFilmstrip((prev) => !prev);
            }}
            className={`p-2 rounded-lg border transition-colors ${
              showFilmstrip
                ? 'bg-indigo-950/80 border-indigo-500/80 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="スライド一覧フィルムストリップ"
          >
            <Film className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="フルスクリーン表示切替"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">閉じる</span>
          </button>
        </div>
      </div>

      {/* Main Slide Interactive Stage */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="max-w-6xl w-full mx-auto flex-1 py-4 flex flex-col justify-center overflow-y-auto"
      >
        <div className="w-full max-w-4xl mx-auto shadow-2xl">
          <WidgetContainer
            widget={{ ...currentWidget, size: 'wide', isCollapsed: false }}
            onUpdate={onUpdateWidget}
            onRemove={onRemoveWidget}
            onEmitOutput={onEmitOutput}
          />
        </div>

        {/* Presenter Speaker Notes Drawer (Expandable) */}
        {showNotes && (
          <div className="w-full max-w-4xl mx-auto mt-4 p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/60 shadow-xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                発表者ハイライト & 戦略コンテキスト
              </span>
              <span className="text-[10px] font-mono text-purple-400">
                Type: {currentWidget.type}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-2">
              {currentWidget.description || 'このモジュールは現在の意思決定仮説をリアルタイムに定量化します。'}
            </p>
            {currentWidget.data.variables && currentWidget.data.variables.length > 0 && (
              <div className="flex flex-wrap gap-2 text-[10px] font-mono text-purple-200">
                {currentWidget.data.variables.map((v) => (
                  <span key={v.id} className="bg-purple-900/40 px-2 py-0.5 rounded border border-purple-700/40">
                    {v.label}: <strong className="text-cyan-300">{v.value.toLocaleString()} {v.unit || ''}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slide Filmstrip Thumbnail Bar (Expandable) */}
      {showFilmstrip && (
        <div className="max-w-6xl w-full mx-auto py-2 flex items-center gap-2 overflow-x-auto border-t border-slate-800/80 animate-in fade-in duration-200">
          {widgets.map((w, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={w.id}
                onClick={() => {
                  soundEngine.playClick();
                  setCurrentIndex(idx);
                }}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-indigo-950/90 border-indigo-500 shadow-md shadow-indigo-500/40 ring-1 ring-indigo-400'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                }`}
                style={{ width: '160px' }}
              >
                <div className="text-[9px] font-mono text-slate-500 flex items-center justify-between">
                  <span>SLIDE 0{idx + 1}</span>
                  {isSelected && <Check className="w-2.5 h-2.5 text-indigo-400" />}
                </div>
                <div className="text-xs font-bold text-slate-200 truncate mt-0.5">{w.title}</div>
                <div className="text-[10px] text-slate-400 truncate">{w.category}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Deck Navigation Controller */}
      <div className="max-w-6xl w-full mx-auto pt-3 border-t border-slate-800/80 flex items-center justify-between gap-4">
        {/* Previous Button */}
        <button
          onClick={() => {
            soundEngine.playClick();
            setCurrentIndex((prev) => (prev - 1 + widgets.length) % widgets.length);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">前へ (←)</span>
        </button>

        {/* Slide Dots Indicator */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-md py-1">
          {widgets.map((w, idx) => (
            <button
              key={w.id}
              onClick={() => {
                soundEngine.playClick();
                setCurrentIndex(idx);
              }}
              className={`transition-all rounded-full ${
                idx === currentIndex
                  ? 'w-8 h-2 bg-indigo-500 shadow-md shadow-indigo-500/50'
                  : 'w-2 h-2 bg-slate-800 hover:bg-slate-600'
              }`}
              title={w.title}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={() => {
            soundEngine.playClick();
            setCurrentIndex((prev) => (prev + 1) % widgets.length);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-lg shadow-indigo-950/40"
        >
          <span className="hidden sm:inline">次へ (Space / →)</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
