import React, { useState } from 'react';
import type { MorphicWidget } from '../../types/morphic';
import { soundEngine } from '../../lib/soundEngine';
import { Award, Minus, Plus, Scale, ThumbsDown, ThumbsUp } from 'lucide-react';

interface Props {
  widget: MorphicWidget;
  onUpdate: (updated: MorphicWidget) => void;
}

export const DecisionTradeoffWidget: React.FC<Props> = ({ widget, onUpdate }) => {
  const criteria = widget.data.criteria || [];
  const options = widget.data.options || [];

  const [activeOptionId, setActiveOptionId] = useState<string>(options[0]?.id || '');
  const [newPro, setNewPro] = useState('');
  const [newCon, setNewCon] = useState('');

  // Calculate weighted scores
  const calculateScore = (optionScores: Record<string, number>): number => {
    let totalScore = 0;
    let totalWeight = 0;
    criteria.forEach((c) => {
      const score = optionScores[c.id] ?? 5;
      totalScore += score * c.weight;
      totalWeight += c.weight;
    });
    return totalWeight > 0 ? Math.round((totalScore / (totalWeight * 10)) * 100) : 0;
  };

  const handleScoreChange = (optionId: string, critId: string, newScore: number) => {
    soundEngine.playClick();
    const updatedOptions = options.map((opt) => {
      if (opt.id !== optionId) return opt;
      return {
        ...opt,
        scores: { ...opt.scores, [critId]: Math.max(1, Math.min(10, newScore)) },
      };
    });

    const updated = {
      ...widget,
      data: { ...widget.data, options: updatedOptions },
    };
    onUpdate(updated);
  };

  const handleWeightChange = (critId: string, newWeight: number) => {
    soundEngine.playClick();
    const updatedCriteria = criteria.map((c) => (c.id === critId ? { ...c, weight: Math.max(1, Math.min(5, newWeight)) } : c));

    const updated = {
      ...widget,
      data: { ...widget.data, criteria: updatedCriteria },
    };
    onUpdate(updated);
  };

  const handleAddPro = (optionId: string) => {
    if (!newPro.trim()) return;
    soundEngine.playClick();
    const updatedOptions = options.map((opt) => {
      if (opt.id !== optionId) return opt;
      return { ...opt, pros: [...opt.pros, newPro.trim()] };
    });
    onUpdate({ ...widget, data: { ...widget.data, options: updatedOptions } });
    setNewPro('');
  };

  const handleAddCon = (optionId: string) => {
    if (!newCon.trim()) return;
    soundEngine.playClick();
    const updatedOptions = options.map((opt) => {
      if (opt.id !== optionId) return opt;
      return { ...opt, cons: [...opt.cons, newCon.trim()] };
    });
    onUpdate({ ...widget, data: { ...widget.data, options: updatedOptions } });
    setNewCon('');
  };

  // Find leading option
  const rankedOptions = [...options]
    .map((opt) => ({ ...opt, totalScore: calculateScore(opt.scores) }))
    .sort((a, b) => b.totalScore - a.totalScore);

  const winningId = rankedOptions[0]?.id;

  return (
    <div className="space-y-6">
      {/* Option Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((opt) => {
          const score = calculateScore(opt.scores);
          const isWinner = opt.id === winningId && options.length > 1;
          const isSelected = opt.id === activeOptionId;

          return (
            <div
              key={opt.id}
              onClick={() => {
                setActiveOptionId(opt.id);
                soundEngine.playClick();
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-900 border-purple-500/60 shadow-lg shadow-purple-950/20 ring-1 ring-purple-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">{opt.title}</h4>
                  <span className="text-[10px] text-slate-500">クリックして配点・論点を編集</span>
                </div>
                {isWinner && (
                  <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                    <Award className="w-3 h-3 text-amber-400" />
                    推奨
                  </span>
                )}
              </div>

              {/* Score Bar */}
              <div className="space-y-1 mt-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">総合スコア適合率</span>
                  <span className="font-mono font-bold text-purple-300">{score} 点 / 100</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isWinner ? 'bg-gradient-to-r from-purple-500 to-amber-400' : 'bg-purple-600/70'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Criteria Weight Tuning */}
      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-purple-400" />
            判断基準の重み付け (Weight 1〜5)
          </span>
          <span className="text-[10px] text-slate-500">意思決定の価値基準</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {criteria.map((c) => (
            <div key={c.id} className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-300 font-medium truncate max-w-[140px]">{c.name}</span>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-mono text-purple-300 mr-1.5">重要度 {c.weight}</span>
                <button
                  onClick={() => handleWeightChange(c.id, c.weight - 1)}
                  disabled={c.weight <= 1}
                  className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded bg-slate-800/60"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={() => handleWeightChange(c.id, c.weight + 1)}
                  disabled={c.weight >= 5}
                  className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded bg-slate-800/60"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Option Details: Pros & Cons */}
      {activeOptionId && (
        <div className="space-y-4 pt-2 border-t border-slate-800/60">
          <div className="text-xs font-bold text-slate-300">
            選択中: {options.find((o) => o.id === activeOptionId)?.title} の得点配分と論点
          </div>

          {/* Scoring Sliders for Active Option */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {criteria.map((c) => {
              const currentScore = options.find((o) => o.id === activeOptionId)?.scores[c.id] ?? 5;
              return (
                <div key={c.id} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-300">{c.name}</span>
                    <span className="font-mono text-purple-300 font-bold">{currentScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={currentScore}
                    onChange={(e) => handleScoreChange(activeOptionId, c.id, parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              );
            })}
          </div>

          {/* Pros & Cons Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Pros */}
            <div className="bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-2">
                <ThumbsUp className="w-3.5 h-3.5" />
                メリット (Pros)
              </div>
              <ul className="space-y-1 mb-2">
                {options.find((o) => o.id === activeOptionId)?.pros.map((p, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newPro}
                  onChange={(e) => setNewPro(e.target.value)}
                  placeholder="利点を追加..."
                  className="flex-1 text-xs bg-slate-900/80 border border-slate-800 px-2 py-1 rounded text-slate-200 placeholder-slate-600 focus:outline-none"
                />
                <button
                  onClick={() => handleAddPro(activeOptionId)}
                  className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-1 rounded font-medium"
                >
                  追加
                </button>
              </div>
            </div>

            {/* Cons */}
            <div className="bg-rose-950/20 border border-rose-900/40 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 mb-2">
                <ThumbsDown className="w-3.5 h-3.5" />
                懸念点・デメリット (Cons)
              </div>
              <ul className="space-y-1 mb-2">
                {options.find((o) => o.id === activeOptionId)?.cons.map((c, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-rose-400 mt-0.5">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newCon}
                  onChange={(e) => setNewCon(e.target.value)}
                  placeholder="懸念を追加..."
                  className="flex-1 text-xs bg-slate-900/80 border border-slate-800 px-2 py-1 rounded text-slate-200 placeholder-slate-600 focus:outline-none"
                />
                <button
                  onClick={() => handleAddCon(activeOptionId)}
                  className="text-xs bg-rose-700 hover:bg-rose-600 text-white px-2 py-1 rounded font-medium"
                >
                  追加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
