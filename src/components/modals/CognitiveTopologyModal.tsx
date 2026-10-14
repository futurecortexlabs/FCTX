import React, { useState, useEffect, useRef } from 'react';
import type { MorphicWidget, SynapseLink } from '../../types/morphic';
import { soundEngine } from '../../lib/soundEngine';
import {
  Network,
  X,
  Zap,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  widgets: MorphicWidget[];
  synapses: SynapseLink[];
  busState: Record<string, number | string>;
  onSelectWidget?: (widgetId: string) => void;
}

interface GraphNode {
  id: string;
  label: string;
  type: 'core' | 'widget' | 'port';
  category?: string;
  widgetId?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  value?: string | number;
}

interface GraphEdge {
  sourceId: string;
  targetId: string;
  label?: string;
  color: string;
  multiplier?: number;
}

const WIDGET_TYPE_COLORS: Record<string, string> = {
  simulation: '#6366f1', // Indigo
  matrix: '#10b981',     // Emerald
  pipeline: '#06b6d4',   // Cyan
  tradeoff: '#a855f7',   // Purple
  decision_tree: '#f59e0b', // Amber
  synapse_notes: '#ec4899', // Pink
  ambient_audio: '#3b82f6', // Blue
  custom: '#8b5cf6',
};

export const CognitiveTopologyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  widgets,
  synapses,
  busState,
  onSelectWidget,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [pulseCount, setPulseCount] = useState(0);

  const draggedNodeRef = useRef<GraphNode | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);

  // Initialize or update graph nodes and edges
  useEffect(() => {
    if (!isOpen) return;

    const width = 800;
    const height = 540;
    const cx = width / 2;
    const cy = height / 2;

    const newNodes: GraphNode[] = [];
    const newEdges: GraphEdge[] = [];

    // 1. Central Core Node (Synapse Neural Bus)
    newNodes.push({
      id: 'neural_core',
      label: 'SYNAPSE NEURAL BUS',
      type: 'core',
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      radius: 26,
      color: '#06b6d4',
      value: `${Object.keys(busState).length} 信号`,
    });

    // 2. Widget Nodes placed along an elliptical orbit
    const widgetCount = widgets.length;
    const orbitRadius = Math.min(220, 140 + widgetCount * 12);

    widgets.forEach((w, idx) => {
      const angle = (idx / (widgetCount || 1)) * Math.PI * 2 - Math.PI / 2;
      const wx = cx + orbitRadius * Math.cos(angle);
      const wy = cy + (orbitRadius * 0.8) * Math.sin(angle);
      const color = WIDGET_TYPE_COLORS[w.type] || '#6366f1';

      newNodes.push({
        id: w.id,
        label: w.title,
        type: 'widget',
        category: w.category,
        widgetId: w.id,
        x: wx,
        y: wy,
        vx: 0,
        vy: 0,
        radius: 18,
        color,
        value: w.type,
      });

      // Edge from central core to widget
      newEdges.push({
        sourceId: 'neural_core',
        targetId: w.id,
        color: 'rgba(99, 102, 241, 0.4)',
      });

      // 3. Output Port Satellites if exposed
      if (w.outputKey) {
        const portId = `port_${w.id}_${w.outputKey}`;
        const portAngle = angle + 0.3;
        const px = wx + 48 * Math.cos(portAngle);
        const py = wy + 48 * Math.sin(portAngle);

        newNodes.push({
          id: portId,
          label: w.outputKey,
          type: 'port',
          widgetId: w.id,
          x: px,
          y: py,
          vx: 0,
          vy: 0,
          radius: 9,
          color: '#f59e0b',
          value: busState[w.outputKey] ?? 'active',
        });

        newEdges.push({
          sourceId: w.id,
          targetId: portId,
          color: 'rgba(245, 158, 11, 0.6)',
        });
      }
    });

    // 4. Inter-widget Synapse Edges
    synapses.forEach((syn) => {
      newEdges.push({
        sourceId: syn.sourceWidgetId,
        targetId: syn.targetWidgetId,
        label: `${syn.sourceKey} → ${syn.targetKey}`,
        color: '#22d3ee',
        multiplier: syn.multiplier,
      });
    });

    nodesRef.current = newNodes;
    edgesRef.current = newEdges;
  }, [isOpen, widgets, synapses, busState]);

  // Main Canvas Animation Frame & Physics Simulation
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;
    let shockwaveRadius = 0;
    let isShockwaveActive = false;

    // Trigger shockwave on pulseCount update
    if (pulseCount > 0) {
      shockwaveRadius = 1;
      isShockwaveActive = true;
    }

    const render = () => {
      frame++;

      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Dark background
      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, w, h);

      // Cybernetic Background Grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.25)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Orbital reference rings around core
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      [120, 200, 280].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Simple physics relaxation (spring forces towards target positions)
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      // Keep core at center
      const coreNode = nodeMap.get('neural_core');
      if (coreNode && draggedNodeRef.current !== coreNode) {
        coreNode.x = cx;
        coreNode.y = cy;
      }

      // Node repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const na = nodes[i];
          const nb = nodes[j];
          const dx = nb.x - na.x;
          const dy = nb.y - na.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = na.radius + nb.radius + 30;
          if (dist < minDist) {
            const force = (minDist - dist) * 0.02;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            if (draggedNodeRef.current !== na && na.type !== 'core') {
              na.x -= fx;
              na.y -= fy;
            }
            if (draggedNodeRef.current !== nb && nb.type !== 'core') {
              nb.x += fx;
              nb.y += fy;
            }
          }
        }
      }

      // Shockwave ring animation
      if (isShockwaveActive) {
        shockwaveRadius += 5;
        if (shockwaveRadius > Math.max(w, h)) {
          isShockwaveActive = false;
        } else {
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
          ctx.lineWidth = 3;
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#06b6d4';
          ctx.beginPath();
          ctx.arc(cx, cy, shockwaveRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // Draw Edges
      edges.forEach((edge) => {
        const src = nodeMap.get(edge.sourceId);
        const tgt = nodeMap.get(edge.targetId);
        if (!src || !tgt) return;

        const isHighlighted =
          selectedNode &&
          (selectedNode.id === src.id || selectedNode.id === tgt.id);

        ctx.strokeStyle = isHighlighted ? '#38bdf8' : edge.color;
        ctx.lineWidth = isHighlighted ? 2.5 : 1.2;

        // Draw curved bezier line
        const midX = (src.x + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2;
        const offset = (src.id === 'neural_core' || tgt.id === 'neural_core') ? 0 : 20;

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.quadraticCurveTo(midX + offset, midY - offset, tgt.x, tgt.y);
        ctx.stroke();

        // Draw animated traveling energy photon along edge
        const t = ((frame * 0.015) % 1);
        const px = (1 - t) * (1 - t) * src.x + 2 * (1 - t) * t * (midX + offset) + t * t * tgt.x;
        const py = (1 - t) * (1 - t) * src.y + 2 * (1 - t) * t * (midY - offset) + t * t * tgt.y;

        ctx.fillStyle = isHighlighted ? '#ffffff' : '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#38bdf8';
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Nodes
      nodes.forEach((n) => {
        const isCore = n.type === 'core';
        const isSelected = selectedNode?.id === n.id;
        const isMatchFilter =
          categoryFilter === 'all' || !n.category || n.category === categoryFilter;

        const opacity = isMatchFilter ? 1.0 : 0.25;
        ctx.globalAlpha = opacity;

        // Outer glow
        ctx.shadowBlur = isSelected ? 20 : isCore ? 16 : 8;
        ctx.shadowColor = n.color;

        // Node circle
        ctx.fillStyle = isCore ? '#020617' : '#090d16';
        ctx.strokeStyle = isSelected ? '#ffffff' : n.color;
        ctx.lineWidth = isSelected ? 3 : isCore ? 2.5 : 2;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Core pulsating ring
        if (isCore) {
          const pulseR = n.radius + Math.sin(frame * 0.05) * 4;
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(n.x, n.y, pulseR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Inner icon or dot
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, isCore ? 6 : n.type === 'port' ? 2 : 4, 0, Math.PI * 2);
        ctx.fill();

        // Node Label
        ctx.font = isCore ? 'bold 10px monospace' : '9px sans-serif';
        ctx.fillStyle = isSelected ? '#ffffff' : '#cbd5e1';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const displayLabel = n.label.length > 14 ? `${n.label.slice(0, 13)}…` : n.label;
        ctx.fillText(displayLabel, n.x, n.y + n.radius + 5);

        ctx.globalAlpha = 1.0;
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, selectedNode, categoryFilter, pulseCount]);

  if (!isOpen) return null;

  // Mouse Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hit = nodesRef.current.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 6;
    });

    if (hit) {
      soundEngine.playClick();
      setSelectedNode(hit);
      draggedNodeRef.current = hit;
    } else {
      setSelectedNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedNodeRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    draggedNodeRef.current.x = e.clientX - rect.left;
    draggedNodeRef.current.y = e.clientY - rect.top;
  };

  const handleMouseUp = () => {
    draggedNodeRef.current = null;
  };

  // Touch Interaction Handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;

    const hit = nodesRef.current.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 14;
    });

    if (hit) {
      soundEngine.playClick();
      setSelectedNode(hit);
      draggedNodeRef.current = hit;
    } else {
      setSelectedNode(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!draggedNodeRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    draggedNodeRef.current.x = e.touches[0].clientX - rect.left;
    draggedNodeRef.current.y = e.touches[0].clientY - rect.top;
  };

  const handleTouchEnd = () => {
    draggedNodeRef.current = null;
  };

  // Trigger Pulse Ripple
  const handlePulse = () => {
    soundEngine.playSynapsePulse();
    setPulseCount((c) => c + 1);
  };

  const categories = Array.from(
    new Set(widgets.map((w) => w.category).filter(Boolean))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/10">
        {/* Header */}
        <div className="p-3 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-950 to-indigo-950 border border-cyan-800/60 text-cyan-400 shrink-0">
              <Network className="w-4 h-4 sm:w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-lg text-slate-100 font-mono tracking-wide truncate">
                  COGNITIVE TOPOLOGY // 思考相関マップ
                </h2>
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 shrink-0">
                  因果グラフ & 神経結線
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                モジュール群とシナプス・データバスを直結する全体構造の動的因果ネットワーク
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePulse}
              className="flex items-center gap-1.5 text-xs bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 px-3 py-1.5 rounded-xl transition-all font-mono shadow-sm"
              title="神経波動パルスを発信して空間を活性化"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>波動パルス</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            <span className="text-slate-500 font-mono text-[11px] whitespace-nowrap">カテゴリ絞り込み:</span>
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-0.5 rounded-lg font-mono text-[11px] transition-colors whitespace-nowrap ${
                categoryFilter === 'all'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              全て ({widgets.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-0.5 rounded-lg font-mono text-[11px] transition-colors whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="text-[10px] font-mono text-slate-400 hidden sm:flex items-center gap-2">
            <span>ノードをドラッグして再配置可能</span>
          </div>
        </div>

        {/* Interactive Physics Canvas Area */}
        <div className="relative flex-1 min-h-[360px] sm:min-h-[440px] bg-[#05070d] overflow-hidden select-none">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full h-full block cursor-grab active:cursor-grabbing touch-none"
          />

          {/* Node Inspector Overlay Card (When a node is selected) */}
          {selectedNode && (
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:left-4 sm:bottom-4 sm:max-w-sm bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedNode.color }} />
                  {selectedNode.type} ノード
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100">{selectedNode.label}</h4>
                {selectedNode.category && (
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    カテゴリ: {selectedNode.category}
                  </span>
                )}
              </div>

              {selectedNode.value !== undefined && (
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 font-mono text-xs flex items-center justify-between">
                  <span className="text-slate-500 text-[10px]">ステータス / 出力:</span>
                  <span className="text-cyan-300 font-bold">{String(selectedNode.value)}</span>
                </div>
              )}

              {selectedNode.widgetId && onSelectWidget && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playMorph();
                    onSelectWidget(selectedNode.widgetId!);
                    onClose();
                  }}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-colors"
                >
                  このモジュールに移動
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              神経コア (Bus)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              稼働モジュール ({widgets.length})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              シナプス直結結線 ({synapses.length})
            </span>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
