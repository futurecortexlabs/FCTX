import React, { useEffect, useState, useRef } from 'react';
import type { MorphicWidget, SynapseLink } from '../types/morphic';
import { soundEngine } from '../lib/soundEngine';
import { Sliders, Trash2, X, Zap } from 'lucide-react';

interface Props {
  widgets: MorphicWidget[];
  synapses: SynapseLink[];
  onAddSynapse: (link: SynapseLink) => void;
  onRemoveSynapse: (linkId: string) => void;
  onUpdateSynapse?: (updated: SynapseLink) => void;
  isWiringMode: boolean;
  activePort: { widgetId: string; key: string; direction: 'in' | 'out' } | null;
  onSelectPort: (port: { widgetId: string; key: string; direction: 'in' | 'out' } | null) => void;
}

export const SynapseCableOverlay: React.FC<Props> = ({
  widgets,
  synapses,
  onRemoveSynapse,
  onUpdateSynapse,
  isWiringMode,
}) => {
  const [inspectingLinkId, setInspectingLinkId] = useState<string | null>(null);
  const [cableCoords, setCableCoords] = useState<
    Array<{
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      sourceTitle: string;
      targetTitle: string;
      link: SynapseLink;
    }>
  >([]);

  const containerRef = useRef<SVGSVGElement>(null);

  // Recalculate cable endpoints based on DOM widget elements
  const updateCoords = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const coords = synapses
      .map((syn) => {
        const sourceEl = document.getElementById(`widget_${syn.sourceWidgetId}`);
        const targetEl = document.getElementById(`widget_${syn.targetWidgetId}`);

        if (!sourceEl || !targetEl) return null;

        const srcRect = sourceEl.getBoundingClientRect();
        const tgtRect = targetEl.getBoundingClientRect();

        // Source endpoint: bottom-center of source widget
        const x1 = srcRect.left + srcRect.width / 2 - containerRect.left;
        const y1 = srcRect.bottom - containerRect.top;

        // Target endpoint: top-center of target widget
        const x2 = tgtRect.left + tgtRect.width / 2 - containerRect.left;
        const y2 = tgtRect.top - containerRect.top;

        const sourceTitle = widgets.find((w) => w.id === syn.sourceWidgetId)?.title || 'Source';
        const targetTitle = widgets.find((w) => w.id === syn.targetWidgetId)?.title || 'Target';

        return {
          id: syn.id,
          x1,
          y1,
          x2,
          y2,
          sourceTitle,
          targetTitle,
          link: syn,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      sourceTitle: string;
      targetTitle: string;
      link: SynapseLink;
    }>;

    setCableCoords(coords);
  };

  useEffect(() => {
    updateCoords();
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);
    window.addEventListener('canvas-transform', updateCoords);
    const interval = setInterval(updateCoords, 800);

    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('canvas-transform', updateCoords);
      clearInterval(interval);
    };
  }, [synapses, widgets]);

  if (synapses.length === 0 && !isWiringMode) return null;

  const activeInspectingCable = cableCoords.find((c) => c.id === inspectingLinkId);

  return (
    <>
      <svg
        ref={containerRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
        style={{ minHeight: '100%' }}
      >
        <defs>
          {/* Neon glowing filter */}
          <filter id="synapseGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Pulse gradient */}
          <linearGradient id="cableGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {cableCoords.map((c) => {
          // Compute smooth cubic bezier path
          const deltaY = Math.abs(c.y2 - c.y1);
          const curveOffset = Math.max(40, deltaY * 0.45);
          const pathD = `M ${c.x1} ${c.y1} C ${c.x1} ${c.y1 + curveOffset}, ${c.x2} ${c.y2 - curveOffset}, ${c.x2} ${c.y2}`;

          const midX = (c.x1 + c.x2) / 2;
          const midY = (c.y1 + c.y2) / 2;
          const hasFormula = Boolean(c.link.transformFormula);

          return (
            <g key={c.id} className="group pointer-events-auto">
              {/* Background wide transparent hit area */}
              <path d={pathD} fill="none" stroke="transparent" strokeWidth="20" className="cursor-pointer" />

              {/* Glowing outer cable */}
              <path
                d={pathD}
                fill="none"
                stroke={hasFormula ? '#38bdf8' : '#6366f1'}
                strokeWidth={isWiringMode ? '4' : '2'}
                strokeOpacity={isWiringMode ? '0.4' : '0.2'}
                filter="url(#synapseGlow)"
              />

              {/* Core glowing cable */}
              <path
                d={pathD}
                fill="none"
                stroke="url(#cableGrad)"
                strokeWidth={isWiringMode ? '2.5' : '1.5'}
                strokeDasharray="6,4"
                className="animate-[dash_1.5s_linear_infinite]"
              />

              {/* Source node circle */}
              <circle cx={c.x1} cy={c.y1} r="4" fill="#818cf8" />
              {/* Target node circle */}
              <circle cx={c.x2} cy={c.y2} r="4" fill="#38bdf8" />

              {/* Midpoint interactive conduit badge */}
              <foreignObject
                x={midX - 75}
                y={midY - 14}
                width="150"
                height="28"
                className="overflow-visible pointer-events-auto"
              >
                <div className="flex items-center justify-between gap-1 bg-slate-950/95 border border-indigo-500/50 hover:border-cyan-400 rounded-full px-2 py-0.5 shadow-xl text-[10px] font-mono backdrop-blur-md transition-all group-hover:scale-105">
                  <span
                    className="text-slate-300 truncate max-w-[55px]"
                    title={`${c.sourceTitle}: ${c.link.sourceKey} ➔ ${c.targetTitle}: ${c.link.targetKey}`}
                  >
                    {c.link.sourceKey}
                  </span>

                  {/* Multiplier / Formula toggle pill */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEngine.playMorph();
                      setInspectingLinkId(c.id);
                    }}
                    className={`px-1.5 py-0.2 rounded-full font-bold border flex items-center gap-0.5 ${
                      hasFormula
                        ? 'bg-cyan-900/80 text-cyan-200 border-cyan-500/60'
                        : 'bg-indigo-900/70 hover:bg-indigo-700 text-cyan-300 border-indigo-700/60'
                    }`}
                    title="伝導変換インスペクターを開く"
                  >
                    {hasFormula ? 'ƒ(x)' : `×${c.link.multiplier ?? 1.0}`}
                    <Sliders className="w-2.5 h-2.5 opacity-80" />
                  </button>

                  {/* Disconnect button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEngine.playClick();
                      onRemoveSynapse(c.id);
                    }}
                    className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                    title="配線を切断"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>

      {/* Floating Conduit Inspector HUD Popover */}
      {activeInspectingCable && onUpdateSynapse && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.max(20, Math.min(window.innerWidth - 360, (activeInspectingCable.x1 + activeInspectingCable.x2) / 2 - 160))}px`,
            top: `${Math.max(20, (activeInspectingCable.y1 + activeInspectingCable.y2) / 2 + 20)}px`,
          }}
          className="z-50 w-80 bg-slate-900/95 border border-cyan-500/70 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in duration-150 space-y-3 pointer-events-auto ring-1 ring-cyan-500/30"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-cyan-300">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>CONDUIT // 伝導・数式インスペクター</span>
            </div>
            <button
              type="button"
              onClick={() => setInspectingLinkId(null)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Route preview */}
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="truncate max-w-[120px] font-bold text-indigo-300">
                {activeInspectingCable.sourceTitle}
              </span>
              <span>➔</span>
              <span className="truncate max-w-[120px] font-bold text-cyan-300 text-right">
                {activeInspectingCable.targetTitle}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>ポート: {activeInspectingCable.link.sourceKey}</span>
              <span>ポート: {activeInspectingCable.link.targetKey}</span>
            </div>
          </div>

          {/* Multiplier Slider / Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">伝達倍率 (Multiplier)</span>
              <span className="font-bold text-cyan-300">×{activeInspectingCable.link.multiplier ?? 1.0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[0.1, 0.5, 0.8, 1.0, 1.2, 1.5, 2.0].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onUpdateSynapse({ ...activeInspectingCable.link, multiplier: m });
                  }}
                  className={`flex-1 py-1 rounded text-[10px] font-mono transition-colors ${
                    (activeInspectingCable.link.multiplier ?? 1.0) === m
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m}x
                </button>
              ))}
            </div>
          </div>

          {/* Custom Transform Formula */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">カスタム変換式 (val は入力信号)</span>
              {activeInspectingCable.link.transformFormula && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onUpdateSynapse({ ...activeInspectingCable.link, transformFormula: undefined });
                  }}
                  className="text-[10px] text-rose-400 hover:underline"
                >
                  クリア
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder="例: val * 1.25, val / 12"
              value={activeInspectingCable.link.transformFormula || ''}
              onChange={(e) => {
                onUpdateSynapse({
                  ...activeInspectingCable.link,
                  transformFormula: e.target.value.trim() || undefined,
                });
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />

            {/* Quick Formula Presets */}
            <div className="flex flex-wrap gap-1 pt-1">
              {[
                { label: '年→月 (/12)', formula: 'val / 12' },
                { label: '月→年 (*12)', formula: 'val * 12' },
                { label: '税込 (*1.1)', formula: 'val * 1.1' },
                { label: '安全率 (*0.8)', formula: 'val * 0.8' },
              ].map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onUpdateSynapse({ ...activeInspectingCable.link, transformFormula: f.formula });
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono transition-colors"
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onRemoveSynapse(activeInspectingCable.id);
                setInspectingLinkId(null);
              }}
              className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300"
            >
              <Trash2 className="w-3 h-3" />
              <span>結線を切断</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setInspectingLinkId(null);
              }}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium"
            >
              完了
            </button>
          </div>
        </div>
      )}
    </>
  );
};
