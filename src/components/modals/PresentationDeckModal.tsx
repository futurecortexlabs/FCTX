import React, { useState, useEffect } from 'react';
import type { MorphicWidget } from '../../types/morphic';
import { WidgetContainer } from '../WidgetContainer';
import { soundEngine } from '../../lib/soundEngine';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Presentation,
  X,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  widgets: MorphicWidget[];
  onUpdateWidget: (updated: MorphicWidget) => void;
  onRemoveWidget: (id: string) => void;
  onEmitOutput?: (key: string, value: number) => void;
}

export const PresentationDeckModal: React.FC<Props> = ({
  isOpen,
  onClose,
  widgets,
  onUpdateWidget,
  onRemoveWidget,
  onEmitOutput,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation: Left/Right arrows, Escape
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
  }, [isOpen, widgets.length]);

  if (!isOpen || widgets.length === 0) return null;

  const currentWidget = widgets[currentIndex];

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
    <div className="fixed inset-0 z-50 bg-[#05070d]/98 backdrop-blur-2xl flex flex-col p-4 sm:p-8 animate-in fade-in duration-200 select-none">
      {/* Top Deck Navigation Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-800/60 shadow-lg shadow-indigo-950/50">
            <Presentation className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-indigo-300 font-bold tracking-wider">
                [INTERACTIVE DECK MODE]
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                SLIDE {currentIndex + 1} / {widgets.length}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>{currentWidget.title}</span>
              <span className="text-xs font-normal text-slate-400 font-mono">({currentWidget.category})</span>
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="フルスクリーン表示切替"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">デッキを閉じる (Esc)</span>
          </button>
        </div>
      </div>

      {/* Main Slide Interactive Stage */}
      <div className="max-w-6xl w-full mx-auto flex-1 py-6 flex flex-col justify-center overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto shadow-2xl">
          <WidgetContainer
            widget={{ ...currentWidget, size: 'wide', isCollapsed: false }}
            onUpdate={onUpdateWidget}
            onRemove={onRemoveWidget}
            onEmitOutput={onEmitOutput}
          />
        </div>
      </div>

      {/* Bottom Deck Navigation Controller */}
      <div className="max-w-6xl w-full mx-auto pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4">
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
