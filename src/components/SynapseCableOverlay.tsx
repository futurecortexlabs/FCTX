import React, { useEffect, useState, useRef } from 'react';
import type { MorphicWidget, SynapseLink } from '../types/morphic';
import { soundEngine } from '../lib/soundEngine';
import { Trash2 } from 'lucide-react';

interface Props {
  widgets: MorphicWidget[];
  synapses: SynapseLink[];
  onAddSynapse: (link: SynapseLink) => void;
  onRemoveSynapse: (linkId: string) => void;
  isWiringMode: boolean;
  activePort: { widgetId: string; key: string; direction: 'in' | 'out' } | null;
  onSelectPort: (port: { widgetId: string; key: string; direction: 'in' | 'out' } | null) => void;
}

export const SynapseCableOverlay: React.FC<Props> = ({
  widgets,
  synapses,
  onRemoveSynapse,
  isWiringMode,
}) => {
  const [cableCoords, setCableCoords] = useState<
    Array<{
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      sourceTitle: string;
      targetTitle: string;
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
    }>;

    setCableCoords(coords);
  };

  useEffect(() => {
    updateCoords();
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);
    const interval = setInterval(updateCoords, 800);

    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
      clearInterval(interval);
    };
  }, [synapses, widgets]);

  if (synapses.length === 0 && !isWiringMode) return null;

  return (
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

        return (
          <g key={c.id} className="group pointer-events-auto">
            {/* Background wide transparent hit area */}
            <path d={pathD} fill="none" stroke="transparent" strokeWidth="20" className="cursor-pointer" />

            {/* Glowing outer cable */}
            <path
              d={pathD}
              fill="none"
              stroke="#6366f1"
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

            {/* Midpoint badge with delete action when in wiring mode */}
            {isWiringMode && (
              <g transform={`translate(${midX - 12}, ${midY - 12})`} className="cursor-pointer">
                <circle
                  cx="12"
                  cy="12"
                  r="12"
                  fill="#1e1b4b"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  className="hover:scale-110 transition-transform"
                  onClick={() => {
                    soundEngine.playClick();
                    onRemoveSynapse(c.id);
                  }}
                />
                <foreignObject x="4" y="4" width="16" height="16">
                  <div
                    className="w-full h-full flex items-center justify-center text-rose-400 hover:text-white"
                    onClick={() => {
                      soundEngine.playClick();
                      onRemoveSynapse(c.id);
                    }}
                    title="シナプス配線を切断"
                  >
                    <Trash2 className="w-3 h-3" />
                  </div>
                </foreignObject>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};
