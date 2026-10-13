import React, { useState, useEffect } from 'react';
import type { MorphicWidget } from '../../types/morphic';
import { soundEngine } from '../../lib/soundEngine';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Layers,
} from 'lucide-react';

interface Props {
  widget: MorphicWidget;
  onUpdate: (updated: MorphicWidget) => void;
  onEmitOutput?: (key: string, value: number) => void;
}

export const FlowPipelineWidget: React.FC<Props> = ({ widget, onUpdate, onEmitOutput }) => {
  const stages = widget.data.stages || [];
  const [addingToStageId, setAddingToStageId] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const [newItemPriority, setNewItemPriority] = useState<'low' | 'med' | 'high'>('med');
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [newStageTitle, setNewStageTitle] = useState('');

  // Calculate total progress
  const totalItems = stages.reduce((acc, s) => acc + s.items.length, 0);
  const doneItems = stages.reduce((acc, s) => acc + s.items.filter((i) => i.done).length, 0);
  const percentComplete = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  // Emit outputs to Synaptic Bus
  useEffect(() => {
    if (!onEmitOutput) return;
    onEmitOutput('progress_percent', percentComplete);
    onEmitOutput('done_count', doneItems);
  }, [percentComplete, doneItems, onEmitOutput]);

  const toggleItemDone = (stageId: string, itemId: string) => {
    soundEngine.playClick();
    let justCompletedAll = false;

    const updatedStages = stages.map((stage) => {
      if (stage.id !== stageId) return stage;
      const updatedItems = stage.items.map((it) => {
        if (it.id === itemId) return { ...it, done: !it.done };
        return it;
      });

      const allDone = updatedItems.length > 0 && updatedItems.every((it) => it.done);
      if (allDone) justCompletedAll = true;

      return { ...stage, items: updatedItems };
    });

    if (justCompletedAll) {
      soundEngine.playMorph();
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore
      }
    }

    onUpdate({
      ...widget,
      data: { ...widget.data, stages: updatedStages },
    });
  };

  const handleAddItem = (e: React.FormEvent, stageId: string) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    soundEngine.playClick();
    const updatedStages = stages.map((stage) => {
      if (stage.id !== stageId) return stage;
      return {
        ...stage,
        items: [
          ...stage.items,
          {
            id: `item_${Date.now()}`,
            text: newItemText.trim(),
            done: false,
            priority: newItemPriority,
          },
        ],
      };
    });

    onUpdate({
      ...widget,
      data: { ...widget.data, stages: updatedStages },
    });
    setNewItemText('');
    setAddingToStageId(null);
  };

  const handleDeleteItem = (stageId: string, itemId: string) => {
    soundEngine.playClick();
    const updatedStages = stages.map((stage) => {
      if (stage.id !== stageId) return stage;
      return {
        ...stage,
        items: stage.items.filter((it) => it.id !== itemId),
      };
    });

    onUpdate({
      ...widget,
      data: { ...widget.data, stages: updatedStages },
    });
  };

  // Move task to next or previous stage (Kanban Pipeline Transition)
  const handleShiftItem = (currentStageIndex: number, itemId: string, direction: 'prev' | 'next') => {
    soundEngine.playSynapsePulse();
    const targetStageIndex = direction === 'next' ? currentStageIndex + 1 : currentStageIndex - 1;
    if (targetStageIndex < 0 || targetStageIndex >= stages.length) return;

    const currentStage = stages[currentStageIndex];
    const itemToMove = currentStage.items.find((it) => it.id === itemId);
    if (!itemToMove) return;

    const updatedStages = stages.map((stage, idx) => {
      if (idx === currentStageIndex) {
        return {
          ...stage,
          items: stage.items.filter((it) => it.id !== itemId),
        };
      }
      if (idx === targetStageIndex) {
        return {
          ...stage,
          items: [...stage.items, itemToMove],
        };
      }
      return stage;
    });

    onUpdate({
      ...widget,
      data: { ...widget.data, stages: updatedStages },
    });
  };

  // Cycle item priority
  const handleCyclePriority = (stageId: string, itemId: string) => {
    soundEngine.playClick();
    const nextPriorityMap: Record<string, 'low' | 'med' | 'high'> = {
      low: 'med',
      med: 'high',
      high: 'low',
    };

    const updatedStages = stages.map((stage) => {
      if (stage.id !== stageId) return stage;
      return {
        ...stage,
        items: stage.items.map((it) => {
          if (it.id !== itemId) return it;
          const nextP = nextPriorityMap[it.priority || 'med'];
          return { ...it, priority: nextP };
        }),
      };
    });

    onUpdate({
      ...widget,
      data: { ...widget.data, stages: updatedStages },
    });
  };

  // Add new stage
  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageTitle.trim()) return;
    soundEngine.playMorph();

    const newStage = {
      id: `stage_${Date.now()}`,
      title: newStageTitle.trim(),
      items: [],
    };

    onUpdate({
      ...widget,
      data: {
        ...widget.data,
        stages: [...stages, newStage],
      },
    });
    setNewStageTitle('');
    setIsAddingStage(false);
  };

  return (
    <div className="space-y-4">
      {/* Overall Progress Bar & Pipeline Telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs text-slate-300">パイプライン総合進捗</span>
          <span className="text-[11px] font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            {percentComplete}%
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            ({doneItems} / {totalItems} 完了)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-28 sm:w-36 bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>

          <button
            onClick={() => setIsAddingStage(true)}
            className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 bg-cyan-950/30 hover:bg-cyan-950/80 px-2 py-1 rounded border border-cyan-800/40 transition-colors font-mono"
            title="新規ステージを追加"
          >
            <Plus className="w-2.5 h-2.5" />
            ステージ追加
          </button>
        </div>
      </div>

      {/* Add Stage Form Drawer */}
      {isAddingStage && (
        <form onSubmit={handleAddStage} className="p-2.5 bg-slate-900/90 rounded-xl border border-cyan-800/60 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <input
            type="text"
            value={newStageTitle}
            onChange={(e) => setNewStageTitle(e.target.value)}
            placeholder="新規ステージ名 (例: Phase 4: グローバル展開)..."
            autoFocus
            className="flex-1 text-xs bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            作成
          </button>
          <button
            type="button"
            onClick={() => setIsAddingStage(false)}
            className="text-xs text-slate-400 hover:text-slate-200 px-2"
          >
            取消
          </button>
        </form>
      )}

      {/* Stages Grid with Visual Dependency Flow Connectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
        {stages.map((stage, stageIdx) => {
          const stageTotal = stage.items.length;
          const stageDone = stage.items.filter((i) => i.done).length;
          const isAllDone = stageTotal > 0 && stageDone === stageTotal;
          const isInProgress = stageDone > 0 && stageDone < stageTotal;

          return (
            <div
              key={stage.id}
              className={`rounded-xl border p-3 flex flex-col justify-between transition-all ${
                isAllDone
                  ? 'bg-emerald-950/20 border-emerald-800/60 shadow-lg shadow-emerald-950/20'
                  : isInProgress
                  ? 'bg-slate-900/80 border-cyan-800/60 shadow-md shadow-cyan-950/30'
                  : 'bg-slate-900/60 border-slate-800/90'
              }`}
            >
              <div>
                {/* Stage Header with Status Badge */}
                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      0{stageIdx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-slate-200 truncate max-w-[130px]">
                      {stage.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isAllDone ? (
                      <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/50">
                        完了
                      </span>
                    ) : isInProgress ? (
                      <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/50 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
                        進行中
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        待機
                      </span>
                    )}

                    <span className="text-[10px] font-mono text-slate-500">
                      {stageDone}/{stageTotal}
                    </span>
                  </div>
                </div>

                {/* Stage Items List */}
                <div className="space-y-1.5 mb-3 min-h-[60px]">
                  {stage.items.map((item) => {
                    const priorityColor =
                      item.priority === 'high'
                        ? 'text-rose-400 border-rose-500/40 bg-rose-950/40'
                        : item.priority === 'med'
                        ? 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40'
                        : 'text-slate-400 border-slate-700 bg-slate-900/40';

                    return (
                      <div
                        key={item.id}
                        className={`group flex items-start gap-2 p-2 rounded-lg transition-colors border ${
                          item.done
                            ? 'bg-slate-950/40 border-transparent opacity-60'
                            : 'bg-slate-850/80 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        {/* Done toggle checkbox */}
                        <button
                          onClick={() => toggleItemDone(stage.id, item.id)}
                          className="mt-0.5 text-slate-500 hover:text-cyan-400 transition-colors flex-shrink-0"
                        >
                          {item.done ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Circle className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Task text */}
                        <span
                          onClick={() => toggleItemDone(stage.id, item.id)}
                          className={`text-xs flex-1 leading-snug cursor-pointer select-none ${
                            item.done ? 'line-through text-slate-500' : 'text-slate-300'
                          }`}
                        >
                          {item.text}
                        </span>

                        {/* Priority Badge */}
                        <button
                          onClick={() => handleCyclePriority(stage.id, item.id)}
                          className={`text-[9px] font-mono uppercase px-1 py-0.5 rounded border transition-colors ${priorityColor}`}
                          title="優先度切替 (Low / Med / High)"
                        >
                          {item.priority || 'med'}
                        </button>

                        {/* Quick Kanban Shift Controls */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                          {stageIdx > 0 && (
                            <button
                              onClick={() => handleShiftItem(stageIdx, item.id, 'prev')}
                              className="text-slate-500 hover:text-cyan-300 p-0.5 transition-colors"
                              title="前ステージへ移動"
                            >
                              <ArrowLeft className="w-2.5 h-2.5" />
                            </button>
                          )}
                          {stageIdx < stages.length - 1 && (
                            <button
                              onClick={() => handleShiftItem(stageIdx, item.id, 'next')}
                              className="text-slate-500 hover:text-cyan-300 p-0.5 transition-colors"
                              title="次ステージへ移動"
                            >
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteItem(stage.id, item.id)}
                            className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors"
                            title="削除"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {stage.items.length === 0 && (
                    <div className="text-[11px] text-slate-600 text-center py-5 border border-dashed border-slate-800 rounded-lg">
                      タスクなし
                    </div>
                  )}
                </div>
              </div>

              {/* Add Task to Stage */}
              <div>
                {addingToStageId === stage.id ? (
                  <form onSubmit={(e) => handleAddItem(e, stage.id)} className="space-y-1.5">
                    <input
                      type="text"
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="タスクを入力..."
                      autoFocus
                      className="w-full text-xs bg-slate-950 border border-slate-700 px-2 py-1.5 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <div className="flex items-center justify-between gap-1">
                      <select
                        value={newItemPriority}
                        onChange={(e) => setNewItemPriority(e.target.value as 'low' | 'med' | 'high')}
                        className="text-[10px] bg-slate-950 border border-slate-700 text-slate-300 rounded px-1 py-0.5"
                      >
                        <option value="low">低優先</option>
                        <option value="med">通常</option>
                        <option value="high">高優先</option>
                      </select>

                      <div className="flex gap-1">
                        <button
                          type="submit"
                          className="text-[10px] bg-cyan-600 hover:bg-cyan-500 text-white px-2 py-1 rounded font-medium"
                        >
                          追加
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingToStageId(null)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 px-2 py-1"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setAddingToStageId(stage.id);
                      setNewItemText('');
                    }}
                    className="w-full py-1 text-[11px] text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 rounded flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    タスク追加
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
