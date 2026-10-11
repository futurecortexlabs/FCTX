import React, { useState } from 'react';
import type { MorphicWidget } from '../../types/morphic';
import { soundEngine } from '../../lib/soundEngine';
import confetti from 'canvas-confetti';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';

interface Props {
  widget: MorphicWidget;
  onUpdate: (updated: MorphicWidget) => void;
}

export const FlowPipelineWidget: React.FC<Props> = ({ widget, onUpdate }) => {
  const stages = widget.data.stages || [];
  const [addingToStageId, setAddingToStageId] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');

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

    const updated = {
      ...widget,
      data: { ...widget.data, stages: updatedStages },
    };
    onUpdate(updated);
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
            priority: 'med' as const,
          },
        ],
      };
    });

    const updated = {
      ...widget,
      data: { ...widget.data, stages: updatedStages },
    };
    onUpdate(updated);
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

    const updated = {
      ...widget,
      data: { ...widget.data, stages: updatedStages },
    };
    onUpdate(updated);
  };

  // Calculate total progress
  const totalItems = stages.reduce((acc, s) => acc + s.items.length, 0);
  const doneItems = stages.reduce((acc, s) => acc + s.items.filter((i) => i.done).length, 0);
  const percentComplete = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Overall Progress Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">パイプライン総合進捗</span>
          <span className="text-[11px] font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            {percentComplete}%
          </span>
        </div>
        <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* Stages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {stages.map((stage) => {
          const stageTotal = stage.items.length;
          const stageDone = stage.items.filter((i) => i.done).length;

          return (
            <div
              key={stage.id}
              className="bg-slate-900/60 rounded-xl border border-slate-800/90 p-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/60">
                  <h4 className="text-xs font-bold text-slate-200">{stage.title}</h4>
                  <span className="text-[10px] font-mono text-slate-500">
                    {stageDone}/{stageTotal}
                  </span>
                </div>

                <div className="space-y-1.5 mb-3">
                  {stage.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleItemDone(stage.id, item.id)}
                      className={`group flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        item.done ? 'bg-slate-950/40 opacity-60' : 'bg-slate-800/40 hover:bg-slate-800/80'
                      }`}
                    >
                      <button className="mt-0.5 text-slate-500 group-hover:text-cyan-400 transition-colors">
                        {item.done ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Circle className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span
                        className={`text-xs flex-1 leading-snug ${
                          item.done ? 'line-through text-slate-500' : 'text-slate-300'
                        }`}
                      >
                        {item.text}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(stage.id, item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {stage.items.length === 0 && (
                    <div className="text-[11px] text-slate-600 text-center py-4">タスクなし</div>
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
                    <div className="flex gap-1 justify-end">
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
