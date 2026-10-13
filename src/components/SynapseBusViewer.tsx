import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Network, Plus, RefreshCw, Sliders, Trash2, Wand2, Zap } from 'lucide-react';
import { soundEngine } from '../lib/soundEngine';

interface Props {
  busState: Record<string, number | string>;
  synapseCount?: number;
  onAutoWire?: () => void;
  onClearSynapses?: () => void;
  onInjectSignal?: (key: string, value: number) => void;
}

export const SynapseBusViewer: React.FC<Props> = ({
  busState,
  synapseCount = 0,
  onAutoWire,
  onClearSynapses,
  onInjectSignal,
}) => {
  const [isInjectorOpen, setIsInjectorOpen] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [customValue, setCustomValue] = useState<number>(100);

  const keys = Object.keys(busState);

  const handleInjectCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customKey.trim() || !onInjectSignal) return;
    soundEngine.playSynapsePulse();
    onInjectSignal(customKey.trim().toLowerCase(), Number(customValue));
    setCustomKey('');
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3 backdrop-blur-md space-y-2.5 transition-all shadow-xl">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
            <Network className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-300 tracking-wider">
                [SYNAPSE NEURAL BUS]
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {synapseCount} 結線連動中
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              モジュール間を直結するリアクティブ・データパイプライン
            </p>
          </div>
        </div>

        {/* Bus Controls */}
        <div className="flex items-center gap-2">
          {onAutoWire && (
            <button
              onClick={() => {
                soundEngine.playMorph();
                onAutoWire();
              }}
              className="flex items-center gap-1.5 text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 px-2.5 py-1 rounded-lg transition-colors font-medium shadow-sm"
              title="互換性のある全モジュール間をインテリジェントに自動配線"
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>自動結線</span>
            </button>
          )}

          {synapseCount > 0 && onClearSynapses && (
            <button
              onClick={() => {
                soundEngine.playClick();
                onClearSynapses();
              }}
              className="flex items-center gap-1 text-xs bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/50 px-2 py-1 rounded-lg transition-colors"
              title="全てのシナプス配線を解除"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden md:inline">配線解除</span>
            </button>
          )}

          {onInjectSignal && (
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsInjectorOpen((prev) => !prev);
              }}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                isInjectorOpen
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-300'
              }`}
              title="テスト信号を手動で注入して下流ウィジェットの反応をテスト"
            >
              <Sliders className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">信号注入</span>
              {isInjectorOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Live Stream Badges */}
      {keys.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
          {keys.map((k) => {
            const val = busState[k];
            return (
              <div
                key={k}
                className="flex items-center gap-1.5 text-xs bg-slate-950/90 px-3 py-1 rounded-xl border border-indigo-900/40 text-slate-200 flex-shrink-0 shadow-sm transition-all hover:border-indigo-500/60"
              >
                <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
                <span className="text-slate-400 font-mono text-[10px]">{k}:</span>
                <span className="font-mono font-bold text-indigo-300">
                  {typeof val === 'number' ? val.toLocaleString('ja-JP') : String(val)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-[11px] font-mono text-slate-500 italic py-1">
          現在データバスに発信されている信号はありません。ウィジェットの操作または自動結線を行ってください。
        </div>
      )}

      {/* Signal Injector Drawer */}
      {isInjectorOpen && onInjectSignal && (
        <div className="pt-2 border-t border-slate-800/80 animate-in fade-in duration-200 space-y-3">
          <div className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 animate-spin-slow text-cyan-400" />
            <span>リアルタイム信号インジェクター (手動オーバーライド)</span>
          </div>

          {/* Quick Sliders for existing keys */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {keys.map((k) => {
              const currentVal = typeof busState[k] === 'number' ? (busState[k] as number) : 50;
              return (
                <div key={k} className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400 truncate">{k}</span>
                    <span className="text-cyan-300 font-bold">{currentVal.toLocaleString('ja-JP')}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(currentVal * 2, 100)}
                    step={Math.max(1, Math.round(currentVal / 50))}
                    value={currentVal}
                    onChange={(e) => {
                      onInjectSignal(k, parseFloat(e.target.value));
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              );
            })}
          </div>

          {/* Form to inject new custom key/value */}
          <form onSubmit={handleInjectCustom} className="flex items-center gap-2 text-xs">
            <input
              type="text"
              placeholder="新規シグナル名 (例: churn, mau, budget)"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-600 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
            />
            <input
              type="number"
              placeholder="値"
              value={customValue}
              onChange={(e) => setCustomValue(parseFloat(e.target.value) || 0)}
              className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="flex items-center gap-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/50 px-3 py-1.5 rounded-lg transition-colors font-medium text-[11px]"
            >
              <Plus className="w-3 h-3" />
              <span>注入</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
