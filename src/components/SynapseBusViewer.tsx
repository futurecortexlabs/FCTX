import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Network,
  Plus,
  RefreshCw,
  Sliders,
  Trash2,
  Wand2,
  Zap,
} from 'lucide-react';
import { soundEngine } from '../lib/soundEngine';

interface Props {
  busState: Record<string, number | string>;
  synapseCount?: number;
  onAutoWire?: () => void;
  onClearSynapses?: () => void;
  onInjectSignal?: (key: string, value: number) => void;
}

interface OscilloscopeProps {
  synapseCount: number;
  activeSignalsCount: number;
  surge: number;
  onSurgeTrigger: () => void;
}

const NeuralOscilloscope: React.FC<OscilloscopeProps> = ({
  synapseCount,
  activeSignalsCount,
  surge,
  onSurgeTrigger,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const surgeRef = useRef(surge);
  surgeRef.current = surge;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let offset = 0;
    let localSurge = 0;

    const render = () => {
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const w = canvas.width;
      const h = canvas.height;
      const midY = h / 2;

      if (surgeRef.current > localSurge) {
        localSurge = surgeRef.current;
      }
      localSurge = Math.max(0, localSurge * 0.95 - 0.01);

      // Dark fade trail
      ctx.fillStyle = 'rgba(2, 6, 23, 0.35)';
      ctx.fillRect(0, 0, w, h);

      // Cybernetic Grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);

      // Centerline
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();

      // Vertical tick lines
      for (let x = 40; x < w; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      const baseAmp = Math.min(18, 6 + activeSignalsCount * 2) + localSurge * 14;
      const freq1 = 0.02 + synapseCount * 0.003;
      const speed = 0.03 + (synapseCount > 0 ? 0.02 : 0) + localSurge * 0.05;
      offset += speed;

      // Secondary Harmonic Wave (Amber / Violet)
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#f59e0b';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 0; x < w; x += 3) {
        const y = midY + Math.cos(x * (freq1 * 1.4) - offset * 0.7) * (baseAmp * 0.6);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Primary Carrier Wave (Neon Cyan / Indigo)
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#06b6d4';
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let x = 0; x < w; x += 2) {
        const harmonic = Math.sin(x * (freq1 * 2.2) + offset * 1.8) * (baseAmp * 0.25);
        const y = midY + Math.sin(x * freq1 + offset) * baseAmp + harmonic;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Quantum Data Pulses (sparkling packets travelling on the wave)
      const packetSpacing = 90;
      const packetCount = Math.floor(w / packetSpacing) + 1;
      for (let i = 0; i < packetCount; i++) {
        const px = ((i * packetSpacing + offset * 60) % (w + 40)) - 20;
        const py = midY + Math.sin(px * freq1 + offset) * baseAmp;
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#38bdf8';
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [synapseCount, activeSignalsCount]);

  return (
    <div
      onClick={onSurgeTrigger}
      className="relative w-full h-12 bg-slate-950/80 rounded-xl border border-indigo-950/60 overflow-hidden cursor-pointer group shadow-inner transition-colors hover:border-cyan-500/40"
      title="クリックで神経波動サージ (電気パルス) を注入"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Cybernetic HUD Overlay Badges */}
      <div className="absolute top-1 left-2.5 flex items-center gap-2 pointer-events-none text-[9px] font-mono text-cyan-400/80">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          OSCILLOSCOPE // SYNAPSE-WAVE
        </span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-400">{(420 + synapseCount * 12.5).toFixed(1)} Hz</span>
      </div>

      <div className="absolute top-1 right-2.5 flex items-center gap-2 pointer-events-none text-[9px] font-mono text-slate-400">
        <span className="text-indigo-300 font-bold">FLUX: {Math.min(99.9, 85 + activeSignalsCount * 2.8).toFixed(1)}%</span>
        <span className="text-amber-400 group-hover:text-amber-300 transition-colors hidden sm:inline">
          ⚡ PULSE
        </span>
      </div>
    </div>
  );
};

export const SynapseBusViewer: React.FC<Props> = ({
  busState,
  synapseCount = 0,
  onAutoWire,
  onClearSynapses,
  onInjectSignal,
}) => {
  const [isInjectorOpen, setIsInjectorOpen] = useState(false);
  const [showOscilloscope, setShowOscilloscope] = useState(true);
  const [surge, setSurge] = useState(0);
  const [customKey, setCustomKey] = useState('');
  const [customValue, setCustomValue] = useState<number>(100);

  const keys = Object.keys(busState);

  // Trigger brief pulse when busState keys or values update
  useEffect(() => {
    setSurge(1.2);
  }, [busState]);

  const handleInjectCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customKey.trim() || !onInjectSignal) return;
    soundEngine.playSynapsePulse();
    setSurge(2.0);
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
          {/* Oscilloscope Toggle */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setShowOscilloscope((prev) => !prev);
            }}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all ${
              showOscilloscope
                ? 'bg-cyan-950/80 border-cyan-500/70 text-cyan-300 shadow-sm shadow-cyan-900/30'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={showOscilloscope ? 'オシロスコープ波形を最小化' : 'オシロスコープ波形を展開'}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">波形</span>
          </button>

          {onAutoWire && (
            <button
              onClick={() => {
                soundEngine.playMorph();
                setSurge(2.2);
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

      {/* Real-time Oscilloscope Canvas HUD */}
      {showOscilloscope && (
        <NeuralOscilloscope
          synapseCount={synapseCount}
          activeSignalsCount={keys.length}
          surge={surge}
          onSurgeTrigger={() => {
            soundEngine.playSynapsePulse();
            setSurge(2.2);
          }}
        />
      )}

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
