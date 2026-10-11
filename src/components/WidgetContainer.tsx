import React from 'react';
import type { MorphicWidget } from '../types/morphic';
import { soundEngine } from '../../src/lib/soundEngine';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Compass,
  FileText,
  GitBranch,
  Maximize2,
  Minimize2,
  Pin,
  PinOff,
  Scale,
  Sliders,
  Sparkles,
  X,
} from 'lucide-react';
import { MetricSimulationWidget } from './widgets/MetricSimulationWidget';
import { MatrixRadarWidget } from './widgets/MatrixRadarWidget';
import { FlowPipelineWidget } from './widgets/FlowPipelineWidget';
import { DecisionTradeoffWidget } from './widgets/DecisionTradeoffWidget';
import { SynapseNoteWidget } from './widgets/SynapseNoteWidget';
import { AmbientAudioWidget } from './widgets/AmbientAudioWidget';
import { GenericCustomWidget } from './widgets/GenericCustomWidget';

interface Props {
  widget: MorphicWidget;
  onUpdate: (updated: MorphicWidget) => void;
  onRemove: (id: string) => void;
  onEmitOutput?: (key: string, value: number) => void;
}

export const WidgetContainer: React.FC<Props> = ({ widget, onUpdate, onRemove, onEmitOutput }) => {
  const getIcon = () => {
    switch (widget.type) {
      case 'simulation':
        return <Sliders className="w-4 h-4 text-indigo-400" />;
      case 'matrix':
        return <Compass className="w-4 h-4 text-cyan-400" />;
      case 'pipeline':
        return <GitBranch className="w-4 h-4 text-emerald-400" />;
      case 'tradeoff':
        return <Scale className="w-4 h-4 text-purple-400" />;
      case 'synapse_notes':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'ambient_audio':
        return <Activity className="w-4 h-4 text-cyan-300" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getAccentBorderClass = () => {
    if (widget.isPinned) return 'border-indigo-500/50 shadow-indigo-500/10';
    switch (widget.accentColor) {
      case 'cyan':
        return 'border-cyan-500/30 hover:border-cyan-500/50';
      case 'emerald':
        return 'border-emerald-500/30 hover:border-emerald-500/50';
      case 'amber':
        return 'border-amber-500/30 hover:border-amber-500/50';
      case 'rose':
        return 'border-rose-500/30 hover:border-rose-500/50';
      case 'purple':
        return 'border-purple-500/30 hover:border-purple-500/50';
      default:
        return 'border-indigo-500/30 hover:border-indigo-500/50';
    }
  };

  const togglePin = () => {
    soundEngine.playClick();
    onUpdate({ ...widget, isPinned: !widget.isPinned });
  };

  const toggleCollapse = () => {
    soundEngine.playClick();
    onUpdate({ ...widget, isCollapsed: !widget.isCollapsed });
  };

  const toggleSize = () => {
    soundEngine.playClick();
    const nextSize = widget.size === 'normal' ? 'wide' : widget.size === 'wide' ? 'full' : 'normal';
    onUpdate({ ...widget, size: nextSize });
  };

  const handleDissolve = () => {
    soundEngine.playClick();
    onRemove(widget.id);
  };

  const sizeClasses = {
    normal: 'col-span-1',
    wide: 'col-span-1 lg:col-span-2',
    full: 'col-span-1 lg:col-span-3',
  }[widget.size || 'normal'];

  return (
    <div
      className={`glass-panel rounded-2xl overflow-hidden transition-all duration-300 flex flex-col border ${getAccentBorderClass()} ${sizeClasses} shadow-xl`}
    >
      {/* Header Bar */}
      <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-slate-800/90 border border-slate-700/60 flex-shrink-0">
            {getIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate tracking-tight">
                {widget.title}
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hidden sm:inline-block">
                {widget.category}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">{widget.description}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Size toggle */}
          <button
            onClick={toggleSize}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors hidden sm:block"
            title={`幅切り替え (現在: ${widget.size || 'normal'})`}
          >
            {widget.size === 'full' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {/* Pin toggle */}
          <button
            onClick={togglePin}
            className={`p-1.5 rounded-lg transition-colors ${
              widget.isPinned
                ? 'text-indigo-400 bg-indigo-950/60 border border-indigo-800/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title={widget.isPinned ? 'ピン留め解除' : 'ピン留め (自動再編成から保護)'}
          >
            {widget.isPinned ? <Pin className="w-3.5 h-3.5 fill-current" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={toggleCollapse}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
            title={widget.isCollapsed ? '展開' : '折りたたむ'}
          >
            {widget.isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {/* Dissolve */}
          <button
            onClick={handleDissolve}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
            title="ウィジェットを消滅"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Widget Body */}
      {!widget.isCollapsed && (
        <div className="p-4 sm:p-5 flex-1 bg-slate-950/40">
          {widget.type === 'simulation' && (
            <MetricSimulationWidget widget={widget} onUpdate={onUpdate} onEmitOutput={onEmitOutput} />
          )}
          {widget.type === 'matrix' && <MatrixRadarWidget widget={widget} onUpdate={onUpdate} />}
          {widget.type === 'pipeline' && <FlowPipelineWidget widget={widget} onUpdate={onUpdate} />}
          {widget.type === 'tradeoff' && <DecisionTradeoffWidget widget={widget} onUpdate={onUpdate} />}
          {widget.type === 'synapse_notes' && <SynapseNoteWidget widget={widget} onUpdate={onUpdate} />}
          {widget.type === 'ambient_audio' && <AmbientAudioWidget widget={widget} onUpdate={onUpdate} />}
          {widget.type === 'custom' && <GenericCustomWidget widget={widget} onUpdate={onUpdate} />}
        </div>
      )}
    </div>
  );
};
