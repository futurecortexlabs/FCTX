import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { MorphicWidget, SynapseLink } from '../types/morphic';
import { WidgetContainer } from './WidgetContainer';
import { soundEngine } from '../lib/soundEngine';
import {
  Compass,
  Focus,
  Move,
  ZoomIn,
  ZoomOut,
  Maximize2,
  LayoutGrid,
  Workflow,
  Orbit,
} from 'lucide-react';

interface Props {
  widgets: MorphicWidget[];
  synapses?: SynapseLink[];
  onUpdateWidget: (updated: MorphicWidget) => void;
  onRemoveWidget: (id: string) => void;
  onDuplicateWidget?: (widget: MorphicWidget) => void;
  onEmitOutput?: (key: string, value: number) => void;
  onZenFocus?: (widget: MorphicWidget) => void;
  isWiringMode: boolean;
  activePort: { widgetId: string; key: string; direction: 'in' | 'out' } | null;
  onSelectPort: (port: { widgetId: string; key: string; direction: 'in' | 'out' } | null) => void;
}

export const SpatialCanvas: React.FC<Props> = ({
  widgets,
  synapses = [],
  onUpdateWidget,
  onRemoveWidget,
  onDuplicateWidget,
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
  const startWidgetDragRef = useRef<{
    widgetId: string;
    startMouseX: number;
    startMouseY: number;
    startX: number;
    startY: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Broadcast canvas-transform event whenever pan or zoom changes so cables stay aligned
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('canvas-transform'));
  }, [pan, zoom]);

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

  // Touch handlers for mobile
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(zoom);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (e.target === containerRef.current || (e.target as HTMLElement).id === 'spatial-bg') {
        setIsPanning(true);
        startPanRef.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
      }
    } else if (e.touches.length === 2) {
      // Pinch to zoom start
      setIsPanning(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      touchStartDistRef.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStartZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isPanning) {
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - startPanRef.current.x,
        y: touch.clientY - startPanRef.current.y,
      });
    } else if (e.touches.length === 1 && draggingWidgetId && startWidgetDragRef.current) {
      const touch = e.touches[0];
      const { widgetId, startMouseX, startMouseY, startX, startY } = startWidgetDragRef.current;
      const dx = (touch.clientX - startMouseX) / zoom;
      const dy = (touch.clientY - startMouseY) / zoom;
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
    } else if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      // Pinch to zoom
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = currentDist / touchStartDistRef.current;
      const nextZoom = Math.min(1.8, Math.max(0.4, Math.round(touchStartZoomRef.current * ratio * 10) / 10));
      setZoom(nextZoom);
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    touchStartDistRef.current = null;
    if (draggingWidgetId) {
      setDraggingWidgetId(null);
      startWidgetDragRef.current = null;
    }
  };

  const handleStartTouchDragWidget = (e: React.TouchEvent, widget: MorphicWidget) => {
    e.stopPropagation();
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    soundEngine.playClick();
    setDraggingWidgetId(widget.id);
    startWidgetDragRef.current = {
      widgetId: widget.id,
      startMouseX: touch.clientX,
      startMouseY: touch.clientY,
      startX: widget.position?.x ?? 100,
      startY: widget.position?.y ?? 100,
    };
  };

  const handleResetView = () => {
    soundEngine.playClick();
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  // Fit all widgets comfortably in viewport
  const handleFitToScreen = () => {
    soundEngine.playClick();
    const container = containerRef.current;
    if (!container || widgets.length === 0) return;
    const cW = container.clientWidth;
    const cH = container.clientHeight;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    widgets.forEach((w) => {
      const x = w.position?.x ?? 80;
      const y = w.position?.y ?? 60;
      const wW = w.size === 'wide' ? 680 : 480;
      const wH = 460;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x + wW > maxX) maxX = x + wW;
      if (y + wH > maxY) maxY = y + wH;
    });

    const pad = 70;
    const totalW = maxX - minX + pad * 2;
    const totalH = maxY - minY + pad * 2;
    const targetZoom = Math.min(1.2, Math.max(0.4, Math.min(cW / totalW, cH / totalH)));
    const targetCenterX = (minX + maxX) / 2;
    const targetCenterY = (minY + maxY) / 2;

    const newZoom = Math.round(targetZoom * 100) / 100;
    setZoom(newZoom);
    setPan({
      x: Math.round(cW / 2 - targetCenterX * newZoom),
      y: Math.round(cH / 2 - targetCenterY * newZoom),
    });
  };

  // Layout 1: 2-3 Column Grid
  const handleLayoutGrid = () => {
    soundEngine.playMorph();
    const cols = widgets.length >= 6 ? 3 : 2;
    const colWidth = 540;
    const rowHeight = 490;
    widgets.forEach((w, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      onUpdateWidget({
        ...w,
        position: { x: 80 + col * colWidth, y: 80 + row * rowHeight },
      });
    });
    setTimeout(handleFitToScreen, 60);
  };

  // Layout 2: Causal Flow (Inputs -> Logic/Tradeoffs -> Outcomes/Monitors)
  const handleLayoutCausal = () => {
    soundEngine.playMorph();
    const col0: MorphicWidget[] = [];
    const col1: MorphicWidget[] = [];
    const col2: MorphicWidget[] = [];

    widgets.forEach((w) => {
      const isSrc = synapses.some((s) => s.sourceWidgetId === w.id);
      const isTgt = synapses.some((s) => s.targetWidgetId === w.id);

      if (isSrc && !isTgt) {
        col0.push(w);
      } else if (isTgt && !isSrc) {
        col2.push(w);
      } else if (isSrc && isTgt) {
        col1.push(w);
      } else {
        if (['simulation', 'goal_tracker'].includes(w.type)) {
          col0.push(w);
        } else if (['spark_line', 'markdown_spec'].includes(w.type)) {
          col2.push(w);
        } else {
          col1.push(w);
        }
      }
    });

    const stages = [col0, col1, col2];
    const stageX = [80, 720, 1380];

    stages.forEach((stageList, sIdx) => {
      stageList.forEach((w, rIdx) => {
        onUpdateWidget({
          ...w,
          position: { x: stageX[sIdx], y: 80 + rIdx * 490 },
        });
      });
    });
    setTimeout(handleFitToScreen, 60);
  };

  // Layout 3: Concentric Orbit Layout
  const handleLayoutOrbit = () => {
    soundEngine.playMorph();
    const n = widgets.length;
    if (n === 0) return;
    const radius = Math.max(400, n * 90);
    const cx = 900;
    const cy = 700;

    widgets.forEach((w, idx) => {
      const angle = (idx / n) * 2 * Math.PI - Math.PI / 2;
      const x = Math.round(cx + radius * Math.cos(angle) - (w.size === 'wide' ? 340 : 240));
      const y = Math.round(cy + radius * 0.75 * Math.sin(angle) - 220);
      onUpdateWidget({ ...w, position: { x, y } });
    });
    setTimeout(handleFitToScreen, 60);
  };

  // Minimap World Bounds Computation
  const minimapBounds = useMemo(() => {
    let minX = 0;
    let minY = 0;
    let maxX = 1800;
    let maxY = 1200;

    widgets.forEach((w) => {
      const x = w.position?.x ?? 80;
      const y = w.position?.y ?? 60;
      const wW = w.size === 'wide' ? 680 : 480;
      const wH = 460;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x + wW > maxX) maxX = x + wW;
      if (y + wH > maxY) maxY = y + wH;
    });

    const pad = 120;
    return {
      minX: minX - pad,
      minY: minY - pad,
      maxX: maxX + pad,
      maxY: maxY + pad,
      w: Math.max(800, maxX - minX + pad * 2),
      h: Math.max(600, maxY - minY + pad * 2),
    };
  }, [widgets]);

  // Viewport Camera Coordinates in World
  const containerW = containerRef.current?.clientWidth || 1000;
  const containerH = containerRef.current?.clientHeight || 600;
  const camWorldX = -pan.x / zoom;
  const camWorldY = -pan.y / zoom;
  const camWorldW = containerW / zoom;
  const camWorldH = containerH / zoom;

  const camPctX = Math.max(0, Math.min(100, ((camWorldX - minimapBounds.minX) / minimapBounds.w) * 100));
  const camPctY = Math.max(0, Math.min(100, ((camWorldY - minimapBounds.minY) / minimapBounds.h) * 100));
  const camPctW = Math.max(6, Math.min(100 - camPctX, (camWorldW / minimapBounds.w) * 100));
  const camPctH = Math.max(6, Math.min(100 - camPctY, (camWorldH / minimapBounds.h) * 100));

  // Minimap click-to-pan
  const handleMinimapPan = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickXRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const clickYRatio = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const targetWorldX = minimapBounds.minX + clickXRatio * minimapBounds.w;
    const targetWorldY = minimapBounds.minY + clickYRatio * minimapBounds.h;

    const cW = containerRef.current?.clientWidth || 1000;
    const cH = containerRef.current?.clientHeight || 600;

    setPan({
      x: Math.round(cW / 2 - targetWorldX * zoom),
      y: Math.round(cH / 2 - targetWorldY * zoom),
    });
    soundEngine.playClick();
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="relative w-full h-[calc(100vh-180px)] min-h-[500px] overflow-hidden rounded-2xl border border-slate-800 bg-[#06080e] select-none cursor-grab active:cursor-grabbing shadow-2xl touch-none"
    >
      {/* Background Neural Matrix Grid Pattern */}
      <div
        id="spatial-bg"
        className="absolute inset-0 pointer-events-auto touch-none"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(99, 102, 241, 0.18) 1.2px, transparent 1.2px)`,
          backgroundSize: `${32 * zoom}px ${32 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* Top-Right Floating Canvas Controls & Layout Toolbar */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-30 flex items-center gap-1 sm:gap-2 bg-slate-950/90 border border-slate-800/90 p-1 sm:p-1.5 rounded-xl shadow-2xl backdrop-blur-md max-w-[calc(100%-16px)] overflow-x-auto no-scrollbar">
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(1.8, Math.round((z + 0.1) * 10) / 10))}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors hover:bg-slate-850"
            title="ズームイン (+10%)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 w-11 sm:w-12 text-center font-bold px-1 py-0.5 rounded hover:bg-cyan-950/40 transition-colors"
            title="100%にリセット"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, Math.round((z - 0.1) * 10) / 10))}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors hover:bg-slate-850"
            title="ズームアウト (-10%)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-5 bg-slate-800 mx-0.5" />

        {/* View centering & fit */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleResetView}
            className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors hover:bg-slate-850"
            title="原点にフォーカス (Reset View)"
          >
            <Focus className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitToScreen}
            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg transition-colors hover:bg-slate-850"
            title="全モジュール画面フィット (Fit to Screen)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-5 bg-slate-800 mx-0.5" />

        {/* Auto-Layout Organizers */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleLayoutGrid}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-indigo-300 hover:text-indigo-100 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/60 rounded-lg transition-all"
            title="2〜3列グリッド整列"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">グリッド</span>
          </button>

          <button
            onClick={handleLayoutCausal}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-cyan-300 hover:text-cyan-100 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 rounded-lg transition-all"
            title="因果フロー整列 (入力・前提 → 決定・分析 → 成果・監視)"
          >
            <Workflow className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">因果フロー</span>
          </button>

          <button
            onClick={handleLayoutOrbit}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-purple-300 hover:text-purple-100 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/60 rounded-lg transition-all"
            title="同心円環オービット整列"
          >
            <Orbit className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">円環</span>
          </button>
        </div>
      </div>

      {/* Bottom-Left Coordinate & Mode HUD Pill */}
      <div className="absolute bottom-20 sm:bottom-4 left-2 sm:left-4 z-30 flex items-center gap-1.5 sm:gap-2 bg-slate-950/80 border border-slate-800/80 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl shadow-lg backdrop-blur-md text-[9px] sm:text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span>SPATIAL CANVAS</span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-300">
          X: {Math.round(-pan.x / zoom)}, Y: {Math.round(-pan.y / zoom)}
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-indigo-400 font-semibold">{widgets.length} NODES</span>
        <span className="hidden md:inline text-slate-600">|</span>
        <span className="hidden md:inline text-slate-500">ドラッグで移動 / ピンチでズーム</span>
      </div>

      {/* Interactive Minimap Preview with Viewport Camera Frame */}
      <div className="absolute bottom-4 right-4 z-30 w-52 h-36 bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 shadow-2xl backdrop-blur-md hidden sm:block">
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mb-1.5">
          <span className="flex items-center gap-1 text-indigo-400 font-semibold">
            <Compass className="w-3 h-3 text-cyan-400" />
            RADAR MINIMAP
          </span>
          <span className="text-slate-400 font-bold">{Math.round(zoom * 100)}%</span>
        </div>

        {/* Minimap active surface (click to pan) */}
        <div
          onClick={handleMinimapPan}
          className="relative w-full h-[95px] bg-slate-900/80 rounded-lg border border-slate-800 overflow-hidden cursor-crosshair group hover:border-indigo-500/50 transition-colors"
          title="クリックした位置へカメラを移動"
        >
          {/* Subtle grid in minimap */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
              backgroundSize: '12px 12px',
            }}
          />

          {/* Node thumbnails in minimap */}
          {widgets.map((w) => {
            const posX = w.position?.x ?? 80;
            const posY = w.position?.y ?? 60;
            const px = ((posX - minimapBounds.minX) / minimapBounds.w) * 100;
            const py = ((posY - minimapBounds.minY) / minimapBounds.h) * 100;
            const pw = ((w.size === 'wide' ? 680 : 480) / minimapBounds.w) * 100;
            const ph = (460 / minimapBounds.h) * 100;

            return (
              <div
                key={w.id}
                className={`absolute rounded-sm transition-all ${
                  w.isPinned
                    ? 'bg-cyan-400/90 border border-cyan-200/60 shadow-[0_0_6px_rgba(6,182,212,0.6)]'
                    : 'bg-indigo-500/70 border border-indigo-300/40'
                }`}
                style={{
                  left: `${Math.max(2, Math.min(95, px))}%`,
                  top: `${Math.max(2, Math.min(92, py))}%`,
                  width: `${Math.max(3, pw)}%`,
                  height: `${Math.max(3, ph)}%`,
                }}
                title={w.title}
              />
            );
          })}

          {/* Camera Viewport Bounding Frame */}
          <div
            className="absolute border-2 border-cyan-400/80 bg-cyan-500/15 rounded pointer-events-none transition-[left,top,width,height] duration-75 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
            style={{
              left: `${camPctX}%`,
              top: `${camPctY}%`,
              width: `${camPctW}%`,
              height: `${camPctH}%`,
            }}
          >
            {/* Viewport center reticle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-300/60" />
            </div>
          </div>
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
                onTouchStart={(e) => handleStartTouchDragWidget(e, w)}
                className="mb-1.5 flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded-lg w-max cursor-move shadow transition-colors touch-none"
              >
                <Move className="w-3 h-3 text-indigo-400" />
                <span>ドラッグして空間配置</span>
              </div>

              <WidgetContainer
                widget={w}
                onUpdate={onUpdateWidget}
                onRemove={onRemoveWidget}
                onDuplicate={onDuplicateWidget}
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
