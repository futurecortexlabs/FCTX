import React, { useState, useMemo } from 'react';
import type { MorphicWidget, ScenarioType } from '../../types/morphic';
import { soundEngine } from '../../lib/soundEngine';
import { Dices, GitFork, LineChart, RefreshCw, Sliders, Sparkles, TrendingUp } from 'lucide-react';

interface Props {
  widget: MorphicWidget;
  onUpdate: (updated: MorphicWidget) => void;
  onEmitOutput?: (key: string, value: number) => void;
}

export const MetricSimulationWidget: React.FC<Props> = ({ widget, onUpdate, onEmitOutput }) => {
  const variables = widget.data.variables || [];
  const formulas = widget.data.formulas || [];

  const [activeAnalysisMode, setActiveAnalysisMode] = useState<'curve' | 'monte_carlo'>('curve');
  const [monteCarloSeed, setMonteCarloSeed] = useState(0);

  const [activeScenario, setActiveScenario] = useState<ScenarioType>('base');
  const [baseValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    variables.forEach((v) => {
      initial[v.id] = v.value;
    });
    return initial;
  });

  const [varValues, setVarValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    variables.forEach((v) => {
      initial[v.id] = v.value;
    });
    return initial;
  });

  const handleSliderChange = (id: string, newVal: number) => {
    const updatedValues = { ...varValues, [id]: newVal };
    setVarValues(updatedValues);
    soundEngine.playClick();

    // Update widget state
    const updatedVars = variables.map((v) => (v.id === id ? { ...v, value: newVal } : v));
    const updatedWidget = {
      ...widget,
      data: { ...widget.data, variables: updatedVars },
    };
    onUpdate(updatedWidget);

    // Calculate primary output if needed
    if (widget.outputKey && onEmitOutput) {
      const primaryResult = calculateFormula(formulas[formulas.length - 1]?.calculate || '', updatedValues);
      onEmitOutput(widget.outputKey, primaryResult);
    }
  };

  const calculateFormula = (expr: string, values: Record<string, number>): number => {
    try {
      // Safe replacement of variable names with values
      let sanitized = expr;
      variables.forEach((v) => {
        const val = values[v.id] ?? v.value;
        const regex = new RegExp(`\\b${v.name}\\b`, 'g');
        sanitized = sanitized.replace(regex, val.toString());
      });
      // Evaluate sanitized arithmetic expression safely
      // Only digits, decimals, operators, parentheses allowed
      if (/^[\d\s+\-*/().%]+$/.test(sanitized)) {
        // eslint-disable-next-line no-eval
        const result = Function(`'use strict'; return (${sanitized})`)();
        return isFinite(result) ? Math.round(result * 100) / 100 : 0;
      }
      return 0;
    } catch {
      return 0;
    }
  };

  const formatNumber = (num: number, unit?: string) => {
    let formatted = num.toLocaleString('ja-JP');
    if (num >= 100000000) {
      formatted = `${(num / 100000000).toFixed(2)} 億`;
    } else if (num >= 10000) {
      formatted = `${(num / 10000).toFixed(1)} 万`;
    }
    return `${formatted} ${unit || ''}`;
  };

  const getScenarioValues = (type: ScenarioType): Record<string, number> => {
    const result: Record<string, number> = {};
    variables.forEach((v) => {
      const base = baseValues[v.id] ?? v.value;
      let factor = 1.0;
      if (type === 'bull') {
        if (v.name.includes('churn') || v.name.includes('opex') || v.name.includes('cost')) factor = 0.8;
        else factor = 1.35;
      } else if (type === 'bear') {
        if (v.name.includes('churn') || v.name.includes('opex') || v.name.includes('cost')) factor = 1.25;
        else factor = 0.7;
      }
      const calculated = Math.min(v.max, Math.max(v.min, Math.round(base * factor * 10) / 10));
      result[v.id] = calculated;
    });
    return result;
  };

  const handleSwitchScenario = (type: ScenarioType) => {
    soundEngine.playClick();
    setActiveScenario(type);
    const scenarioVals = type === 'base' ? baseValues : getScenarioValues(type);
    setVarValues(scenarioVals);
    const updatedVars = variables.map((v) => ({ ...v, value: scenarioVals[v.id] ?? v.value }));
    onUpdate({ ...widget, data: { ...widget.data, variables: updatedVars } });
    if (widget.outputKey && onEmitOutput) {
      const primaryResult = calculateFormula(formulas[formulas.length - 1]?.calculate || '', scenarioVals);
      onEmitOutput(widget.outputKey, primaryResult);
    }
  };

  const primaryFormula = formulas[formulas.length - 1];
  const bearOutput = primaryFormula ? calculateFormula(primaryFormula.calculate, getScenarioValues('bear')) : 0;
  const baseOutput = primaryFormula ? calculateFormula(primaryFormula.calculate, baseValues) : 0;
  const bullOutput = primaryFormula ? calculateFormula(primaryFormula.calculate, getScenarioValues('bull')) : 0;

  const monteCarloData = useMemo(() => {
    if (activeAnalysisMode !== 'monte_carlo' || !primaryFormula) return null;
    const trialCount = 100;
    const trials: number[] = [];
    for (let i = 0; i < trialCount; i++) {
      const sampleVals: Record<string, number> = {};
      variables.forEach((v) => {
        const base = varValues[v.id] ?? v.value;
        const jitter = (Math.random() + Math.random() + Math.random() - 1.5) * 0.22;
        const sample = Math.max(v.min, Math.min(v.max, base * (1 + jitter)));
        sampleVals[v.id] = sample;
      });
      const res = calculateFormula(primaryFormula.calculate, sampleVals);
      trials.push(res);
    }
    trials.sort((a, b) => a - b);
    const p10 = trials[Math.floor(trialCount * 0.1)];
    const p50 = trials[Math.floor(trialCount * 0.5)];
    const p90 = trials[Math.floor(trialCount * 0.9)];

    const minVal = trials[0];
    const maxVal = trials[trials.length - 1];
    const binRange = (maxVal - minVal) || 1;
    const bins = Array(8).fill(0);
    trials.forEach((t) => {
      const bIdx = Math.min(7, Math.floor(((t - minVal) / binRange) * 8));
      bins[bIdx]++;
    });
    const maxBinCount = Math.max(...bins, 1);

    return { trials, p10, p50, p90, minVal, maxVal, bins, maxBinCount };
  }, [activeAnalysisMode, varValues, monteCarloSeed, primaryFormula]);

  return (
    <div className="space-y-6">
      {/* Multiverse Scenario Parallel Worlds Bar */}
      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-indigo-400" />
            多元未来分岐 (Multiverse Branching)
          </span>
          <span className="text-[10px] text-slate-500 font-mono">3並行世界シミュレーション</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Bear */}
          <button
            onClick={() => handleSwitchScenario('bear')}
            className={`p-2 rounded-lg border text-left transition-all ${
              activeScenario === 'bear'
                ? 'bg-rose-950/50 border-rose-500/70 text-rose-200 ring-1 ring-rose-500/30'
                : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
              <span>🔴 Bear (弱気想定)</span>
            </div>
            <div className="text-xs font-mono font-bold mt-0.5">
              {formatNumber(bearOutput, primaryFormula?.unit)}
            </div>
          </button>

          {/* Base */}
          <button
            onClick={() => handleSwitchScenario('base')}
            className={`p-2 rounded-lg border text-left transition-all ${
              activeScenario === 'base'
                ? 'bg-indigo-950/50 border-indigo-500/70 text-indigo-200 ring-1 ring-indigo-500/30'
                : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="text-[10px] font-bold text-indigo-300 flex items-center gap-1">
              <span>🔵 Base (基準計画)</span>
            </div>
            <div className="text-xs font-mono font-bold mt-0.5">
              {formatNumber(baseOutput, primaryFormula?.unit)}
            </div>
          </button>

          {/* Bull */}
          <button
            onClick={() => handleSwitchScenario('bull')}
            className={`p-2 rounded-lg border text-left transition-all ${
              activeScenario === 'bull'
                ? 'bg-emerald-950/50 border-emerald-500/70 text-emerald-200 ring-1 ring-emerald-500/30'
                : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
              <span>🟢 Bull (強気成長)</span>
            </div>
            <div className="text-xs font-mono font-bold mt-0.5">
              {formatNumber(bullOutput, primaryFormula?.unit)}
            </div>
          </button>
        </div>
      </div>

      {/* Parameter Sliders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            動的コントロールパラメータ [{activeScenario.toUpperCase()}]
          </span>
          <span className="text-[10px] text-slate-500">スライダーで即時連動</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {variables.map((v) => {
            const currentVal = varValues[v.id] ?? v.value;

            return (
              <div
                key={v.id}
                className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-colors"
              >
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-300">{v.label}</label>
                  <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                    {currentVal.toLocaleString('ja-JP')} {v.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={v.min}
                  max={v.max}
                  step={v.step}
                  value={currentVal}
                  onChange={(e) => handleSliderChange(v.id, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>{v.min}{v.unit}</span>
                  <span>{v.max}{v.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calculated Output Formula Cards */}
      {formulas.length > 0 && (
        <div className="pt-2 border-t border-slate-800/60">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            リアルタイム算出結果
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {formulas.map((f, idx) => {
              const res = calculateFormula(f.calculate, varValues);
              const isHighlight = idx === formulas.length - 1;

              return (
                <div
                  key={f.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isHighlight
                      ? 'bg-gradient-to-br from-indigo-950/50 to-purple-950/40 border-indigo-500/40 shadow-lg shadow-indigo-950/30'
                      : 'bg-slate-900/40 border-slate-800/80'
                  }`}
                >
                  <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                    <span>{f.label}</span>
                    {isHighlight && <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />}
                  </div>
                  <div
                    className={`text-lg sm:text-xl font-bold font-mono tracking-tight ${
                      isHighlight ? 'text-indigo-200' : 'text-slate-200'
                    }`}
                  >
                    {formatNumber(res, f.unit)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Analysis Engine: Sensitivity Curve vs Monte Carlo Stochastic Simulation */}
          {variables.length > 0 && formulas.length > 0 && (() => {
            const primaryVar = variables[0];
            const primaryFormula = formulas[formulas.length - 1];

            return (
              <div className="mt-4 p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2.5">
                {/* Mode Selector Tabs */}
                <div className="flex items-center justify-between text-[11px] font-mono border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setActiveAnalysisMode('curve');
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                        activeAnalysisMode === 'curve'
                          ? 'bg-indigo-950 text-indigo-300 font-bold border border-indigo-700/60'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <LineChart className="w-3 h-3 text-indigo-400" />
                      <span>感度投影曲線</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setActiveAnalysisMode('monte_carlo');
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                        activeAnalysisMode === 'monte_carlo'
                          ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Dices className="w-3 h-3 text-cyan-400" />
                      <span>モンテカルロ試算 (100試行)</span>
                    </button>
                  </div>

                  {activeAnalysisMode === 'monte_carlo' && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playSynapsePulse();
                        setMonteCarloSeed((s) => s + 1);
                      }}
                      className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50 transition-colors"
                      title="100回の確率試行を再実行"
                    >
                      <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" />
                      <span>再試行</span>
                    </button>
                  )}
                </div>

                {/* Tab 1: Sensitivity Projection Curve */}
                {activeAnalysisMode === 'curve' && (() => {
                  const sampleSteps = 8;
                  const points: { x: number; y: number; val: number; result: number }[] = [];
                  const stepDelta = (primaryVar.max - primaryVar.min) / (sampleSteps - 1);

                  let maxRes = 1;
                  let minRes = 0;

                  for (let i = 0; i < sampleSteps; i++) {
                    const testVal = primaryVar.min + stepDelta * i;
                    const simValues = { ...varValues, [primaryVar.id]: testVal };
                    const res = calculateFormula(primaryFormula.calculate, simValues);
                    if (res > maxRes) maxRes = res;
                    if (res < minRes) minRes = res;
                    points.push({ x: i, y: 0, val: testVal, result: res });
                  }

                  const range = maxRes - minRes || 1;
                  const width = 460;
                  const height = 90;
                  const padding = 20;

                  const coords = points.map((p, idx) => {
                    const svgX = padding + (idx / (sampleSteps - 1)) * (width - padding * 2);
                    const normalizedY = (p.result - minRes) / range;
                    const svgY = height - padding - normalizedY * (height - padding * 2);
                    return { svgX, svgY };
                  });

                  const pathD = coords.reduce(
                    (acc, pt, idx) => (idx === 0 ? `M ${pt.svgX} ${pt.svgY}` : `${acc} L ${pt.svgX} ${pt.svgY}`),
                    ''
                  );

                  const areaD = `${pathD} L ${coords[coords.length - 1].svgX} ${height} L ${coords[0].svgX} ${height} Z`;

                  return (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>{primaryVar.label} 変動に伴う {primaryFormula.label} 推移</span>
                        <span className="text-indigo-400 font-bold">Dynamic Projection</span>
                      </div>
                      <div className="w-full overflow-hidden">
                        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
                          <defs>
                            <linearGradient id={`grad_${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <path d={areaD} fill={`url(#grad_${widget.id})`} />
                          <path d={pathD} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
                          {coords.map((pt, i) => (
                            <circle
                              key={i}
                              cx={pt.svgX}
                              cy={pt.svgY}
                              r="3"
                              className="fill-cyan-400 stroke-slate-950 stroke-2"
                            />
                          ))}
                        </svg>
                      </div>
                    </div>
                  );
                })()}

                {/* Tab 2: Monte Carlo Stochastic Distribution */}
                {activeAnalysisMode === 'monte_carlo' && monteCarloData && (
                  <div className="space-y-3">
                    {/* Percentile Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center font-mono">
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-rose-900/40">
                        <span className="text-[10px] text-rose-400 block font-sans">P10 (下振れ確率90%防衛)</span>
                        <span className="text-xs font-bold text-rose-300">
                          {formatNumber(monteCarloData.p10, primaryFormula.unit)}
                        </span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-cyan-900/40">
                        <span className="text-[10px] text-cyan-400 block font-sans">P50 (中央値・最確値)</span>
                        <span className="text-xs font-bold text-cyan-300">
                          {formatNumber(monteCarloData.p50, primaryFormula.unit)}
                        </span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-emerald-900/40">
                        <span className="text-[10px] text-emerald-400 block font-sans">P90 (上振れポテンシャル)</span>
                        <span className="text-xs font-bold text-emerald-300">
                          {formatNumber(monteCarloData.p90, primaryFormula.unit)}
                        </span>
                      </div>
                    </div>

                    {/* Frequency Histogram Bars */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>100回 確率分布ヒストグラム (±15% ガウス揺らぎ)</span>
                        <span className="text-cyan-400">正規分布密度</span>
                      </div>
                      <div className="flex items-end gap-1.5 h-16 pt-2 px-1 bg-slate-900/40 rounded-lg border border-slate-800">
                        {monteCarloData.bins.map((count: number, bIdx: number) => {
                          const heightPct = Math.max(8, Math.round((count / monteCarloData.maxBinCount) * 100));
                          const isMedianBin = bIdx === 3 || bIdx === 4;

                          return (
                            <div
                              key={bIdx}
                              className="flex-1 flex flex-col items-center h-full justify-end group relative"
                            >
                              <div
                                style={{ height: `${heightPct}%` }}
                                className={`w-full rounded-t transition-all duration-300 ${
                                  isMedianBin
                                    ? 'bg-cyan-400 shadow-md shadow-cyan-500/30'
                                    : 'bg-indigo-500/70 hover:bg-indigo-400'
                                }`}
                              />
                              {/* Hover Tooltip */}
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-6 bg-slate-900 border border-slate-700 text-[9px] font-mono px-1.5 py-0.5 rounded text-white pointer-events-none transition-opacity z-20 whitespace-nowrap">
                                {count} 回 ({count}%)
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
