import React, { useState } from 'react';
import type { MorphicWidget } from '../../types/morphic';
import { soundEngine } from '../../lib/soundEngine';
import { Sliders, Sparkles, TrendingUp } from 'lucide-react';

interface Props {
  widget: MorphicWidget;
  onUpdate: (updated: MorphicWidget) => void;
  onEmitOutput?: (key: string, value: number) => void;
}

export const MetricSimulationWidget: React.FC<Props> = ({ widget, onUpdate, onEmitOutput }) => {
  const variables = widget.data.variables || [];
  const formulas = widget.data.formulas || [];

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

  return (
    <div className="space-y-6">
      {/* Parameter Sliders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            動的コントロールパラメータ
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
        </div>
      )}
    </div>
  );
};
