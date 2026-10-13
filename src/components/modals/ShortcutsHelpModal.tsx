import React from 'react';
import { Keyboard, X } from 'lucide-react';
import { soundEngine } from '../../lib/soundEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsHelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Cmd / Ctrl + K', desc: 'コマンドパレット起動 (全機能・プリセット検索)' },
    { key: 'Esc', desc: '没入ゼンモード / プレゼン / モーダルの終了' },
    { key: 'Space / → / ←', desc: 'プレゼンテーションモードのスライド送り / 戻し' },
    { key: 'W', desc: 'シナプス配線モードのトグル (モジュール間データ直結)' },
    { key: 'G', desc: 'グリッド表示 と 空間2Dキャンバス の切り替え' },
    { key: '?', desc: 'このショートカットガイドを表示' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1">
          <Keyboard className="w-4 h-4 text-cyan-400" />
          キーボードショートカット
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          FCTXを思考スピードで操作するためのホットキー一覧
        </p>

        <div className="space-y-2.5">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs"
            >
              <span className="text-slate-300">{sc.desc}</span>
              <kbd className="font-mono text-[11px] font-bold text-cyan-300 bg-slate-900 px-2 py-1 rounded-lg border border-cyan-900/60 shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
