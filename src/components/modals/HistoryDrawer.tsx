import React from 'react';
import type { MorphicWidget } from '../../types/morphic';
import { soundEngine } from '../../lib/soundEngine';
import { Clock, History, RotateCcw, X, Zap } from 'lucide-react';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  prompt: string;
  reasoning: string;
  widgetSnapshot: MorphicWidget[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
}

export const HistoryDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  history,
  onRestore,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">思考変形タイムライン</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {history.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              まだ変形履歴はありません
            </div>
          ) : (
            history.map((item, idx) => {
              const dateStr = new Date(item.timestamp).toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {dateStr}
                    </span>
                    <span className="text-indigo-400 font-semibold">#{history.length - idx}</span>
                  </div>

                  <div className="text-xs font-bold text-slate-200 line-clamp-2">
                    「{item.prompt}」
                  </div>

                  <div className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                    {item.reasoning}
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                      <Zap className="w-3 h-3 text-amber-400" />
                      {item.widgetSnapshot.length} モジュール
                    </span>

                    <button
                      onClick={() => {
                        soundEngine.playMorph();
                        onRestore(item);
                        onClose();
                      }}
                      className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-800/40 transition-colors font-medium"
                    >
                      <RotateCcw className="w-3 h-3" />
                      この状態に復元
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
