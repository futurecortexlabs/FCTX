import React, { useState } from 'react';
import type { CortexWhisper } from '../types/morphic';
import { soundEngine } from '../lib/soundEngine';
import { AlertTriangle, Bot, ChevronDown, ChevronUp, Lightbulb, Sparkles, Wand2 } from 'lucide-react';

interface Props {
  whispers: CortexWhisper[];
  onApplyAction: (actionPrompt: string) => void;
}

export const CortexWhisperBar: React.FC<Props> = ({ whispers, onApplyAction }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (whispers.length === 0) return null;

  const warningCount = whispers.filter((w) => w.severity === 'warning').length;

  const getSeverityIcon = (sev: CortexWhisper['severity']) => {
    switch (sev) {
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />;
      case 'opportunity':
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />;
      default:
        return <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />;
    }
  };

  const getSeverityBadgeClass = (sev: CortexWhisper['severity']) => {
    switch (sev) {
      case 'warning':
        return 'bg-rose-950/60 border-rose-800/60 text-rose-300';
      case 'opportunity':
        return 'bg-cyan-950/60 border-cyan-800/60 text-cyan-300';
      default:
        return 'bg-indigo-950/60 border-indigo-800/60 text-indigo-300';
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-5 right-3 md:right-5 z-30 md:z-40 max-w-sm sm:max-w-md w-full px-2 sm:px-0 pointer-events-none">
      {/* Floating Trigger Pill */}
      {!isOpen && (
        <button
          onClick={() => {
            soundEngine.playClick();
            setIsOpen(true);
          }}
          className="ml-auto pointer-events-auto flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 group"
        >
          <div className="relative">
            <Bot className="w-4 h-4 text-indigo-400 group-hover:text-cyan-400 transition-colors" />
            {warningCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <span className="text-xs font-semibold text-slate-200">
            Cortex Whispers
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
            {whispers.length} 件の洞察
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        </button>
      )}

      {/* Expanded Whispers Popover Drawer */}
      {isOpen && (
        <div className="pointer-events-auto bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl animate-in slide-in-from-bottom duration-200">
          {/* Header */}
          <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold text-slate-200 font-mono">
                [CORTEX WHISPERS] 自律的思考インサイト
              </h4>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsOpen(false);
              }}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Whispers List */}
          <div className="max-h-80 overflow-y-auto p-3 space-y-2.5">
            {whispers.map((w) => (
              <div
                key={w.id}
                className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 space-y-2 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {getSeverityIcon(w.severity)}
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {w.title}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border font-semibold ${getSeverityBadgeClass(
                      w.severity
                    )}`}
                  >
                    {w.severity}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {w.message}
                </p>

                {w.actionLabel && w.actionPrompt && (
                  <div className="pt-1.5 border-t border-slate-800/60 flex justify-end">
                    <button
                      onClick={() => {
                        soundEngine.playMorph();
                        onApplyAction(w.actionPrompt!);
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-1 text-[10px] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium px-2.5 py-1 rounded-lg transition-all shadow font-mono"
                    >
                      <Wand2 className="w-3 h-3" />
                      {w.actionLabel}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
