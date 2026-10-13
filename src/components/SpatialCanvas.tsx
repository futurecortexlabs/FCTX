import React, { useRef, useState, useEffect } from 'react';
import type { MorphicWidget } from '../types/morphic';
import { WidgetContainer } from './WidgetContainer';
import { soundEngine } from '../lib/soundEngine';
import { Compass, Focus, Move, ZoomIn, ZoomOut } from 'lucide-react';

interface Props {
  widgets: MorphicWidget[];
  onUpdateWidget: (updated: MorphicWidget) => void;
  onRemoveWidget: (id: string) => void;
  onEmitOutput?: (key: string, value: number) => void;
  onZenFocus?: (widget: MorphicWidget) => void;
  isWiringMode: boolean;
  activePort: { widgetId: string; key: string; direction: 'in' | 'out' } | null;
  onSelectPort: (port: { widgetId: string; key: string; direction: 'in' | 'out' } | null) => void;
}

export const SpatialCanvas: React.FC<Props> = ({
  widgets,
  onUpdateWidget,
  onRemoveWidget,
  onEmitOutput,
  onZenFocus,
  isWiringMode,
  activePort,
  onSelectPort,
}) => {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = useRef({ x: 0, y: 0 });

  // Widget dragging
  const [draggingWidgetId, setDraggingWidgetId] = useState<string | null>(null);
  const startWidgetDragRef = useRef<{ widgetId: string; startMouseX: number; startMouseY: number; startX: number; startY: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize widget positions if they don't have one
  useEffect(() => {
    widgets.forEach((w, idx) => {
      if (!w.position) {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const posX = 80 + col * 520;
        const posY = 60 + row * 460;
        onUpdateWidget({ ...w, position: { x: posX, y: posY } });
      }
    });
  }, [widgets]);

  // Handle canvas zoom with wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.min(1.8, Math.max(0.4, Math.round((prev + delta) * 10) / 10)));
    } else {
      // Pan with trackpad
      setPan((prev) => ({
        x: prev.x - e.deltaX * 0.8,
        y: prev.y - e.deltaY * 0.8,
      }));
    }
  };

  // Background drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (e.target === containerRef.current || (e.target as HTMLElement).id === 'spatial-bg')) {
      setIsPanning(true);
      startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPanRef.current.x,
        y: e.clientY - startPanRef.current.y,
      });
    } else if (draggingWidgetId && startWidgetDragRef.current) {
      const { widgetId, startMouseX, startMouseY, startX, startY } = startWidgetDragRef.current;
      const dx = (e.clientX - startMouseX) / zoom;
      const dy = (e.clientY - startMouseY) / zoom;
      const target = widgets.find((w) => w.id === widgetId);
      if (target) {
        onUpdateWidget({
          ...target,
          position: {
            x: Math.round(startX + dx),
            y: Math.round(startY + dy),
          },
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (draggingWidgetId) {
      setDraggingWidgetId(null);
      startWidgetDragRef.current = null;
    }
  };

  const handleStartDragWidget = (e: React.MouseEvent, widget: MorphicWidget) => {
    e.stopPropagation();
    soundEngine.playClick();
    setDraggingWidgetId(widget.id);
    startWidgetDragRef.current = {
      widgetId: widget.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: widget.position?.x ?? 100,
      startY: widget.position?.y ?? 100,
    };
  };

  const handleResetView = () => {
    soundEngine.playClick();
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleAutoAlign = () => {
    soundEngine.playMorph();
    widgets.forEach((w, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      onUpdateWidget({
        ...w,
        position: { x: 80 + col * 520, y: 60 + row * 460 },
      });
    });
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative w-full h-[calc(100vh-180px)] min-h-[600px] overflow-hidden rounded-2xl border border-slate-800 bg-[#06080e] select-none cursor-grab active:cursor-grabbing"
    >
      {/* Background Neural Matrix Grid Pattern */}
      <div
        id="spatial-bg"
        className="absolute inset-0 pointer-events-auto"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(99, 102, 241, 0.15) 1px, transparent 1px)`,
          backgroundSize: `${30 * zoom}px ${30 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* Floating Canvas Controls */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl shadow-xl backdrop-blur-md">
        <button
          onClick={() => setZoom((z) => Math.min(1.8, Math.round((z + 0.1) * 10) / 10))}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          title="ズームイン"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono text-slate-300 w-12 text-center font-bold">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, Math.round((z - 0.1) * 10) / 10))}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          title="ズームアウト"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-800 mx-0.5" />
        <button
          onClick={handleResetView}
          className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors"
          title="ビュー初期化"
        >
          <Focus className="w-4 h-4" />
        </button>
        <button
          onClick={handleAutoAlign}
          className="px-2 py-1 text-[11px] font-mono text-indigo-300 hover:text-indigo-200 bg-indigo-950/60 rounded-lg transition-colors"
          title="自動整列"
        >
          整列
        </button>
      </div>

      {/* Minimap preview */}
      <div className="absolute bottom-4 right-4 z-30 w-44 h-32 bg-slate-950/85 border border-slate-800/90 rounded-xl p-2 shadow-2xl backdrop-blur-md hidden sm:block pointer-events-none">
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mb-1">
          <span className="flex items-center gap-1">
            <Compass className="w-2.5 h-2.5 text-indigo-400" />
            MINIMAP
          </span>
          <span>{widgets.length} nodes</span>
        </div>
        <div className="relative w-full h-[85px] bg-slate-900/60 rounded border border-slate-800 overflow-hidden">
          {widgets.map((w) => {
            const px = ((w.position?.x || 100) / 1600) * 100;
            const py = ((w.position?.y || 100) / 1200) * 100;
            return (
              <div
                key={w.id}
                className="absolute w-3 h-2 rounded bg-indigo-500/80 border border-indigo-300/40"
                style={{
                  left: `${Math.max(5, Math.min(85, px))}%`,
                  top: `${Math.max(5, Math.min(80, py))}%`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Freeform World Container */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {widgets.map((w) => {
          const posX = w.position?.x ?? 80;
          const posY = w.position?.y ?? 60;

          return (
            <div
              key={w.id}
              style={{
                position: 'absolute',
                left: `${posX}px`,
                top: `${posY}px`,
                width: w.size === 'wide' ? '680px' : '480px',
              }}
              className="pointer-events-auto"
            >
              {/* Drag handle pill */}
              <div
                onMouseDown={(e) => handleStartDragWidget(e, w)}
                className="mb-1.5 flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded-lg w-max cursor-move shadow transition-colors"
              >
                <Move className="w-3 h-3 text-indigo-400" />
                <span>ドラッグして空間配置</span>
              </div>

              <WidgetContainer
                widget={w}
                onUpdate={onUpdateWidget}
                onRemove={onRemoveWidget}
                onEmitOutput={onEmitOutput}
                onZenFocus={onZenFocus}
                isWiringMode={isWiringMode}
                activePort={activePort}
                onSelectPort={onSelectPort}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
