import React, { useState, useEffect, useMemo } from 'react';
import type { MorphicWidget } from '../../types/morphic';
import { soundEngine } from '../../lib/soundEngine';
import {
  Award,
  Crown,
  Minus,
  Plus,
  Scale,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Compass,
} from 'lucide-react';

interface Props {
  widget: MorphicWidget;
  onUpdate: (updated: MorphicWidget) => void;
  onEmitOutput?: (key: string, value: number) => void;
}

const OPTION_COLORS = ['#a855f7', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#3b82f6'];

export const DecisionTradeoffWidget: React.FC<Props> = ({ widget, onUpdate, onEmitOutput }) => {
  const criteria = widget.data.criteria || [];
  const options = widget.data.options || [];

  const [activeTab, setActiveTab] = useState<'matrix' | 'radar' | 'sensitivity'>('matrix');
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
    const updatedCriteria = criteria.map((c) =>
      c.id === critId ? { ...c, weight: Math.max(1, Math.min(5, newWeight)) } : c
    );

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
  const rankedOptions = useMemo(() => {
    return [...options]
      .map((opt) => ({ ...opt, totalScore: calculateScore(opt.scores) }))
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [options, criteria]);

  const winningId = rankedOptions[0]?.id;

  // Compute Pareto-Optimal Options (Non-Dominated Solutions)
  const paretoOptimalIds = useMemo(() => {
    const optimal = new Set<string>();
    options.forEach((optA) => {
      let isDominated = false;
      for (const optB of options) {
        if (optA.id === optB.id) continue;
        let bAtLeastAsGood = true;
        let bStrictlyBetter = false;
        for (const c of criteria) {
          const sA = optA.scores[c.id] ?? 5;
          const sB = optB.scores[c.id] ?? 5;
          if (sB < sA) {
            bAtLeastAsGood = false;
            break;
          }
          if (sB > sA) {
            bStrictlyBetter = true;
          }
        }
        if (bAtLeastAsGood && bStrictlyBetter) {
          isDominated = true;
          break;
        }
      }
      if (!isDominated) {
        optimal.add(optA.id);
      }
    });
    return optimal;
  }, [options, criteria]);

  // Compute Sensitivity: How much weight increase on each criterion is needed for Runner-up to beat Leader
  const sensitivityFlips = useMemo(() => {
    if (rankedOptions.length < 2 || criteria.length === 0) return [];
    const leader = rankedOptions[0];
    const challenger = rankedOptions[1];

    // Total weighted score difference
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    const scoreDiff = leader.totalScore - challenger.totalScore;

    return criteria.map((c) => {
      const leaderScore = leader.scores[c.id] ?? 5;
      const challengerScore = challenger.scores[c.id] ?? 5;
      const diff = challengerScore - leaderScore;

      let flipsWithWeight: number | null = null;
      if (diff > 0) {
        // Delta weight needed to close gap
        flipsWithWeight = Math.ceil((scoreDiff * totalWeight) / (diff * 10));
      }

      return {
        criterion: c,
        leaderScore,
        challengerScore,
        challengerAdvantage: diff,
        flipsWithWeight,
      };
    });
  }, [rankedOptions, criteria]);

  // Emit winning score to Synapse Bus
  useEffect(() => {
    if (!onEmitOutput || rankedOptions.length === 0) return;
    onEmitOutput('winning_score', rankedOptions[0].totalScore);
  }, [rankedOptions, onEmitOutput]);

  // Radar Spider Chart Coordinates Generator
  const radarData = useMemo(() => {
    const N = criteria.length;
    if (N < 3) return null;

    const size = 300;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 95;

    // Web polygons (levels 2, 4, 6, 8, 10)
    const levels = [2, 4, 6, 8, 10];
    const webPolygons = levels.map((lvl) => {
      const r = (lvl / 10) * radius;
      const points = criteria.map((_, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      return { level: lvl, path: points.join(' ') };
    });

    // Axis lines and labels
    const axes = criteria.map((c, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      const labelX = cx + (radius + 20) * Math.cos(angle);
      const labelY = cy + (radius + 15) * Math.sin(angle);
      return { id: c.id, name: c.name, x, y, labelX, labelY, angle };
    });

    // Option polygons
    const optionPolygons = options.map((opt, optIdx) => {
      const color = OPTION_COLORS[optIdx % OPTION_COLORS.length];
      const points = criteria.map((c, i) => {
        const score = opt.scores[c.id] ?? 5;
        const r = (score / 10) * radius;
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      return {
        id: opt.id,
        title: opt.title,
        color,
        path: points.join(' '),
      };
    });

    return { size, cx, cy, webPolygons, axes, optionPolygons };
  }, [criteria, options]);

  return (
    <div className="space-y-4">
      {/* View Mode Selector Tabs */}
      <div className="flex items-center justify-between text-[11px] font-mono border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('matrix');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              activeTab === 'matrix'
                ? 'bg-purple-950 text-purple-300 font-bold border border-purple-700/60 shadow-sm shadow-purple-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-3 h-3 text-purple-400" />
            <span>得点配分 & メリット・懸念</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('radar');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              activeTab === 'radar'
                ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60 shadow-sm shadow-cyan-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>多次元レーダー比較</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('sensitivity');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              activeTab === 'sensitivity'
                ? 'bg-amber-950 text-amber-300 font-bold border border-amber-700/60 shadow-sm shadow-amber-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3 h-3 text-amber-400" />
            <span>感度分析 & パレート最適</span>
          </button>
        </div>

        <span className="text-[10px] text-slate-500 font-sans hidden sm:inline">
          {options.length} 選択肢 / {criteria.length} 評価基準
        </span>
      </div>

      {/* Option Score Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((opt, optIdx) => {
          const score = calculateScore(opt.scores);
          const isWinner = opt.id === winningId && options.length > 1;
          const isPareto = paretoOptimalIds.has(opt.id);
          const isSelected = opt.id === activeOptionId;
          const optColor = OPTION_COLORS[optIdx % OPTION_COLORS.length];

          return (
            <div
              key={opt.id}
              onClick={() => {
                setActiveOptionId(opt.id);
                soundEngine.playClick();
              }}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-900 border-purple-500/70 shadow-lg shadow-purple-950/20 ring-1 ring-purple-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: optColor }}
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">{opt.title}</h4>
                    <span className="text-[10px] text-slate-500">クリックして配点・論点を編集</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {isWinner && (
                    <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                      <Award className="w-3 h-3 text-amber-400" />
                      推奨 1位
                    </span>
                  )}
                  {isPareto && (
                    <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded-full font-bold">
                      <Crown className="w-2.5 h-2.5 text-emerald-400" />
                      パレート解
                    </span>
                  )}
                </div>
              </div>

              {/* Score Bar */}
              <div className="space-y-1 mt-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">総合スコア適合率</span>
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

      {/* TAB 1: Criteria Tuning + Option Detail Pros & Cons */}
      {activeTab === 'matrix' && (
        <div className="space-y-4 pt-1 animate-in fade-in duration-150">
          {/* Criteria Weight Tuning */}
          <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between mb-2.5 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-purple-400" />
                判断基準の重み付け (Weight 1〜5)
              </span>
              <span className="text-[10px] text-slate-500">意思決定の価値基準</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {criteria.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-slate-800"
                >
                  <span className="text-xs text-slate-300 font-medium truncate max-w-[130px]">{c.name}</span>
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

          {/* Selected Option Details: Scoring Sliders + Pros & Cons */}
          {activeOptionId && (
            <div className="space-y-3 pt-2 border-t border-slate-800/60">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>選択中: {options.find((o) => o.id === activeOptionId)?.title} の得点配分と論点</span>
                <span className="text-[10px] text-purple-400 font-mono">1〜10 スライダー調整</span>
              </div>

              {/* Scoring Sliders for Active Option */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {criteria.map((c) => {
                  const currentScore = options.find((o) => o.id === activeOptionId)?.scores[c.id] ?? 5;
                  return (
                    <div key={c.id} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 text-[11px] truncate">{c.name}</span>
                        <span className="font-mono text-purple-300 font-bold text-xs">{currentScore}/10</span>
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
                  <ul className="space-y-1 mb-2 max-h-28 overflow-y-auto pr-1">
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
                  <ul className="space-y-1 mb-2 max-h-28 overflow-y-auto pr-1">
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
      )}

      {/* TAB 2: Radar Spider Chart */}
      {activeTab === 'radar' && (
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              多属性スパイダー・レーダーチャート (Spider Radar Polygon)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">各選択肢の強み・弱みの多角形対比</span>
          </div>

          {radarData ? (
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              {/* SVG Spider Chart */}
              <div className="relative w-[300px] h-[300px]">
                <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
                  {/* Web grid polygons */}
                  {radarData.webPolygons.map((web) => (
                    <polygon
                      key={web.level}
                      points={web.path}
                      fill="none"
                      stroke="rgba(51, 65, 85, 0.45)"
                      strokeWidth="1"
                      strokeDasharray={web.level === 10 ? 'none' : '2,3'}
                    />
                  ))}

                  {/* Axes lines */}
                  {radarData.axes.map((axis) => (
                    <line
                      key={axis.id}
                      x1={radarData.cx}
                      y1={radarData.cy}
                      x2={axis.x}
                      y2={axis.y}
                      stroke="rgba(71, 85, 105, 0.6)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Option Polygons */}
                  {radarData.optionPolygons.map((poly) => {
                    const isSelected = poly.id === activeOptionId;
                    return (
                      <polygon
                        key={poly.id}
                        points={poly.path}
                        fill={poly.color}
                        fillOpacity={isSelected ? 0.35 : 0.15}
                        stroke={poly.color}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        className="transition-all duration-300"
                      />
                    );
                  })}

                  {/* Axis Labels */}
                  {radarData.axes.map((axis) => (
                    <text
                      key={axis.id}
                      x={axis.labelX}
                      y={axis.labelY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-[10px] fill-slate-300 font-mono font-bold select-none"
                    >
                      {axis.name}
                    </text>
                  ))}
                </svg>
              </div>

              {/* Legend & Options Switcher */}
              <div className="space-y-2 w-full md:w-56 font-mono text-xs">
                <span className="text-[10px] text-slate-400 block font-sans">選択肢凡例 (クリックで強調表示):</span>
                {options.map((opt, optIdx) => {
                  const color = OPTION_COLORS[optIdx % OPTION_COLORS.length];
                  const isSelected = opt.id === activeOptionId;
                  const score = calculateScore(opt.scores);

                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        soundEngine.playClick();
                        setActiveOptionId(opt.id);
                      }}
                      className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-slate-900 border-purple-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="truncate">{opt.title}</span>
                      </div>
                      <span className="font-bold text-slate-300">{score}点</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 font-mono py-8 text-center">
              レーダーチャートを描画するには 3 つ以上の評価基準が必要です。
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Sensitivity Thresholds & Pareto Analysis */}
      {activeTab === 'sensitivity' && (
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              意思決定の頑健性 & 感度分析 (Sensitivity Flip Thresholds)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">首位 vs 次点 逆転シミュレーション</span>
          </div>

          {rankedOptions.length >= 2 ? (
            <div className="space-y-3">
              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">首位 (Leader)</span>
                  <span className="font-bold text-amber-300">{rankedOptions[0].title} ({rankedOptions[0].totalScore}点)</span>
                </div>
                <div className="text-slate-500 font-mono">VS</div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">追従 2位 (Challenger)</span>
                  <span className="font-bold text-cyan-300">{rankedOptions[1].title} ({rankedOptions[1].totalScore}点)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-slate-400 block">
                  基準別 逆転必要重み（どれだけ重視すれば2位が首位を逆転するか）:
                </span>

                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {sensitivityFlips.map((sf) => (
                    <div
                      key={sf.criterion.id}
                      className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium text-slate-200">{sf.criterion.name}</span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          首位: {sf.leaderScore}点 vs 2位: {sf.challengerScore}点 (重要度: {sf.criterion.weight})
                        </div>
                      </div>

                      <div>
                        {sf.flipsWithWeight !== null ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                            重要度 +{sf.flipsWithWeight} で逆転可能
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800">
                            2位劣後 (逆転不可)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pareto Explanation Box */}
              <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-[11px] text-indigo-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-indigo-300">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  パレート最適性 (Pareto Frontier) 判定結果
                </div>
                <p className="text-slate-300 text-[10px] leading-relaxed">
                  パレート最適解とは、全ての評価基準において他方に劣らない非劣解（妥協不要のフロンティア）です。
                  現在 <strong className="text-emerald-300">{Array.from(paretoOptimalIds).map((id) => options.find((o) => o.id === id)?.title).join(', ')}</strong> がパレート最適解として認定されています。
                </p>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 font-mono py-4 text-center">
              感度分析を行うには 2 つ以上の選択肢が必要です。
            </div>
          )}
        </div>
      )}
    </div>
  );
};
