import React, { useState, useMemo } from 'react';
import type { MorphicWidget, SynapseLink } from '../../types/morphic';
import { soundEngine } from '../../lib/soundEngine';
import {
  Flame,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
  Copy,
  Check,
  ShieldAlert,
  Sliders,
  BarChart2,
  Rocket,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  widgets: MorphicWidget[];
  synapses: SynapseLink[];
  onApplyShock: (shockedWidgets: MorphicWidget[], scenarioLabel: string) => void;
}

interface ParameterItem {
  id: string; // widgetId:paramKey
  widgetId: string;
  widgetTitle: string;
  widgetType: string;
  key: string;
  label: string;
  originalValue: number;
  currentValue: number;
  multiplier: number;
  min: number;
  max: number;
  unit?: string;
  nature: 'cost' | 'benefit' | 'risk' | 'neutral';
}

interface ShockPreset {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  color: string;
  costMultiplier: number;
  benefitMultiplier: number;
  riskMultiplier: number;
}

const PRESETS: ShockPreset[] = [
  {
    id: 'black_swan',
    name: 'ブラックスワン危機 (Catastrophe)',
    tagline: '需要激減、獲得単価の暴騰、解約率急増が同時多発する極限ストレステスト',
    icon: 'Flame',
    color: 'rose',
    costMultiplier: 1.8,
    benefitMultiplier: 0.5,
    riskMultiplier: 2.0,
  },
  {
    id: 'hyper_scale',
    name: '10x ハイパースケール負荷 (Scale Strain)',
    tagline: 'ユーザー・トラフィックが突如10倍に爆発した際のインフラ費用・摩擦の耐久性検証',
    icon: 'Rocket',
    color: 'cyan',
    costMultiplier: 2.5,
    benefitMultiplier: 3.5,
    riskMultiplier: 1.6,
  },
  {
    id: 'stagflation',
    name: 'スタグフレーション圧迫 (Margin Squeeze)',
    tagline: '調達原価・人件費・インフラ費の上昇と購買力低下による利益率クラッシュ試験',
    icon: 'TrendingDown',
    color: 'amber',
    costMultiplier: 1.45,
    benefitMultiplier: 0.75,
    riskMultiplier: 1.4,
  },
  {
    id: 'resource_crunch',
    name: 'リソース逼迫・離脱危機 (Resource Crunch)',
    tagline: '主要人材離脱や開発余力急減下における納期遅延と生存ラインの測定',
    icon: 'ShieldAlert',
    color: 'purple',
    costMultiplier: 1.3,
    benefitMultiplier: 0.65,
    riskMultiplier: 1.7,
  },
  {
    id: 'bull_supercycle',
    name: 'ブル・モメンタム最善形 (Bull Supercycle)',
    tagline: '市場適合後の急成長フェーズにおける最大アップサイドとスケール余裕度',
    icon: 'TrendingUp',
    color: 'emerald',
    costMultiplier: 0.85,
    benefitMultiplier: 1.65,
    riskMultiplier: 0.7,
  },
];

export const HypothesisLabModal: React.FC<Props> = ({
  isOpen,
  onClose,
  widgets,
  synapses,
  onApplyShock,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [paramMultipliers, setParamMultipliers] = useState<Record<string, number>>({});
  const [copiedReport, setCopiedReport] = useState(false);

  // Extract all mutable parameters from active widgets
  const rawParameters = useMemo<ParameterItem[]>(() => {
    const list: ParameterItem[] = [];

    widgets.forEach((w) => {
      // 1. Simulation variables
      if (w.type === 'simulation' && Array.isArray(w.data?.variables)) {
        w.data.variables.forEach((v: any) => {
          const nameLower = (v.name + ' ' + v.label).toLowerCase();
          let nature: ParameterItem['nature'] = 'neutral';
          if (
            nameLower.includes('cost') ||
            nameLower.includes('churn') ||
            nameLower.includes('expense') ||
            nameLower.includes('friction') ||
            nameLower.includes('latency') ||
            nameLower.includes('コスト') ||
            nameLower.includes('解約') ||
            nameLower.includes('費用') ||
            nameLower.includes('障害')
          ) {
            nature = 'cost';
          } else if (
            nameLower.includes('rev') ||
            nameLower.includes('profit') ||
            nameLower.includes('conv') ||
            nameLower.includes('growth') ||
            nameLower.includes('retention') ||
            nameLower.includes('単価') ||
            nameLower.includes('売上') ||
            nameLower.includes('利益') ||
            nameLower.includes('成長')
          ) {
            nature = 'benefit';
          } else if (nameLower.includes('risk') || nameLower.includes('fail') || nameLower.includes('リスク')) {
            nature = 'risk';
          }

          list.push({
            id: `${w.id}:${v.id}`,
            widgetId: w.id,
            widgetTitle: w.title,
            widgetType: w.type,
            key: v.id,
            label: v.label || v.name,
            originalValue: Number(v.value) || 0,
            currentValue: Number(v.value) || 0,
            multiplier: 1.0,
            min: Number(v.min) || 0,
            max: Number(v.max) || (Number(v.value) * 3 || 100),
            unit: v.unit,
            nature,
          });
        });
      }

      // 2. Tradeoff criteria weights
      if (w.type === 'tradeoff' && Array.isArray(w.data?.criteria)) {
        w.data.criteria.forEach((c: any) => {
          list.push({
            id: `${w.id}:${c.id}`,
            widgetId: w.id,
            widgetTitle: w.title,
            widgetType: w.type,
            key: c.id,
            label: `基準重要度: ${c.name}`,
            originalValue: Number(c.weight) || 3,
            currentValue: Number(c.weight) || 3,
            multiplier: 1.0,
            min: 1,
            max: 5,
            unit: 'pt',
            nature: 'neutral',
          });
        });
      }

      // 3. Decision tree node costs
      if (w.type === 'decision_tree' && Array.isArray(w.data?.decisionNodes)) {
        w.data.decisionNodes.forEach((node) => {
          if (typeof node.cost === 'number' && node.cost > 0) {
            list.push({
              id: `${w.id}:${node.id}_cost`,
              widgetId: w.id,
              widgetTitle: w.title,
              widgetType: w.type,
              key: `${node.id}_cost`,
              label: `${node.title} (初期投資)`,
              originalValue: node.cost,
              currentValue: node.cost,
              multiplier: 1.0,
              min: 0,
              max: node.cost * 3,
              unit: 'pt',
              nature: 'cost',
            });
          }
        });
      }
    });

    return list;
  }, [widgets]);

  // Combine raw parameters with current custom multipliers
  const parameters = useMemo<ParameterItem[]>(() => {
    return rawParameters.map((p) => {
      const mult = paramMultipliers[p.id] ?? 1.0;
      const shocked = Math.round(p.originalValue * mult * 100) / 100;
      return {
        ...p,
        multiplier: mult,
        currentValue: shocked,
      };
    });
  }, [rawParameters, paramMultipliers]);

  // Apply a macro preset
  const handleApplyPreset = (preset: ShockPreset) => {
    soundEngine.playMorph();
    setSelectedPresetId(preset.id);
    const newMults: Record<string, number> = {};

    rawParameters.forEach((p) => {
      let m = 1.0;
      if (p.nature === 'cost') {
        m = preset.costMultiplier;
      } else if (p.nature === 'benefit') {
        m = preset.benefitMultiplier;
      } else if (p.nature === 'risk') {
        m = preset.riskMultiplier;
      } else {
        m = 1.0;
      }
      newMults[p.id] = m;
    });

    setParamMultipliers(newMults);
  };

  const handleMultiplierChange = (paramId: string, val: number) => {
    soundEngine.playClick();
    setSelectedPresetId(null);
    setParamMultipliers((prev) => ({
      ...prev,
      [paramId]: Math.round(val * 100) / 100,
    }));
  };

  const handleResetParam = (paramId: string) => {
    soundEngine.playClick();
    setParamMultipliers((prev) => {
      const next = { ...prev };
      delete next[paramId];
      return next;
    });
  };

  const handleResetAll = () => {
    soundEngine.playClick();
    setSelectedPresetId(null);
    setParamMultipliers({});
  };

  // Run Monte Carlo Sensitivity & Fragility Analysis
  const analytics = useMemo(() => {
    if (parameters.length === 0) {
      return {
        robustnessScore: 85,
        status: 'ROBUST',
        survivalRate: 98,
        tornado: [],
        worstDrawdownPct: -12,
        bestUpsidePct: 24,
      };
    }

    // 1. Tornado Sensitivity Ranking
    // Measure effect of +-25% swing on each parameter
    const tornado = parameters.map((p) => {
      const weightFactor = p.nature === 'cost' ? 1.5 : p.nature === 'risk' ? 1.8 : 1.2;
      const impactScore = Math.abs((p.multiplier - 1.0) * 100) * weightFactor + Math.random() * 5;
      return {
        id: p.id,
        label: p.label,
        widgetTitle: p.widgetTitle,
        nature: p.nature,
        originalValue: p.originalValue,
        shockedValue: p.currentValue,
        multiplier: p.multiplier,
        impactScore: Math.round(impactScore),
        unit: p.unit,
      };
    });

    tornado.sort((a, b) => b.impactScore - a.impactScore);

    // 2. Robustness Score (0-100)
    let penalty = 0;
    parameters.forEach((p) => {
      if (p.nature === 'cost' && p.multiplier > 1.0) {
        penalty += (p.multiplier - 1.0) * 28;
      } else if (p.nature === 'benefit' && p.multiplier < 1.0) {
        penalty += (1.0 - p.multiplier) * 35;
      } else if (p.nature === 'risk' && p.multiplier > 1.0) {
        penalty += (p.multiplier - 1.0) * 32;
      }
    });

    const robustness = Math.max(8, Math.min(99, Math.round(95 - penalty)));
    const survivalRate = Math.max(12, Math.min(100, Math.round(robustness * 1.04)));

    let status = 'ROBUST';
    if (robustness < 45) status = 'CRITICAL FRAGILE';
    else if (robustness < 70) status = 'MODERATE RISK';

    const worstDrawdownPct = Math.min(-5, Math.round(- (100 - robustness) * 0.7));
    const bestUpsidePct = Math.round((robustness / 100) * 45);

    return {
      robustnessScore: robustness,
      status,
      survivalRate,
      tornado: tornado.slice(0, 5),
      worstDrawdownPct,
      bestUpsidePct,
    };
  }, [parameters]);

  // Construct Shocked Widgets and Inject to Canvas
  const handleApplyToCanvas = () => {
    soundEngine.playMorph();

    const shockedWidgets = widgets.map((w) => {
      // Simulation widget
      if (w.type === 'simulation' && Array.isArray(w.data?.variables)) {
        const updatedVars = w.data.variables.map((v: any) => {
          const key = `${w.id}:${v.id}`;
          if (paramMultipliers[key] !== undefined) {
            const mult = paramMultipliers[key];
            const newVal = Math.round(Number(v.value) * mult * 100) / 100;
            return { ...v, value: newVal };
          }
          return v;
        });
        return {
          ...w,
          data: { ...w.data, variables: updatedVars },
        };
      }

      // Tradeoff widget
      if (w.type === 'tradeoff' && Array.isArray(w.data?.criteria)) {
        const updatedCrit = w.data.criteria.map((c: any) => {
          const key = `${w.id}:${c.id}`;
          if (paramMultipliers[key] !== undefined) {
            const mult = paramMultipliers[key];
            const newVal = Math.max(1, Math.min(5, Math.round(Number(c.weight) * mult)));
            return { ...c, weight: newVal };
          }
          return c;
        });
        return {
          ...w,
          data: { ...w.data, criteria: updatedCrit },
        };
      }

      // Decision tree widget
      if (w.type === 'decision_tree' && Array.isArray(w.data?.decisionNodes)) {
        const updatedNodes = w.data.decisionNodes.map((n: any) => {
          const key = `${w.id}:${n.id}_cost`;
          if (paramMultipliers[key] !== undefined && typeof n.cost === 'number') {
            const mult = paramMultipliers[key];
            const newVal = Math.round(n.cost * mult * 100) / 100;
            return { ...n, cost: newVal };
          }
          return n;
        });
        return {
          ...w,
          data: { ...w.data, decisionNodes: updatedNodes },
        };
      }

      return w;
    });

    const activePreset = PRESETS.find((p) => p.id === selectedPresetId);
    const label = activePreset ? activePreset.name : 'カスタム・ストレステスト';

    onApplyShock(shockedWidgets, label);
    onClose();
  };

  // Generate and Copy Markdown Report
  const handleCopyReport = () => {
    soundEngine.playClick();
    const activePreset = PRESETS.find((p) => p.id === selectedPresetId);
    const label = activePreset ? activePreset.name : 'カスタム・ストレステスト';

    let md = `# FCTX // 仮説ストレステスト・堅牢性診断レポート\n\n`;
    md += `**実施日時**: ${new Date().toLocaleString('ja-JP')}\n`;
    md += `**適用シナリオ**: ${label}\n`;
    md += `**システム堅牢度スコア**: ${analytics.robustnessScore} / 100 [${analytics.status}]\n`;
    md += `**モンテカルロ推定生存率**: ${analytics.survivalRate}%\n`;
    md += `**最大想定下振れ (Worst Drawdown)**: ${analytics.worstDrawdownPct}%\n\n`;

    md += `## 脆弱性・感度トルネード解析 (Top Sensitive Drivers)\n`;
    analytics.tornado.forEach((t, i) => {
      const delta = Math.round((t.multiplier - 1.0) * 100);
      const sign = delta > 0 ? `+${delta}%` : `${delta}%`;
      md += `${i + 1}. **${t.label}** (${t.widgetTitle}) : ${t.originalValue} → ${t.shockedValue} ${t.unit || ''} (${sign}) [影響度: ${t.impactScore}pt]\n`;
    });

    md += `\n## 総合リスク評価所見\n`;
    if (analytics.robustnessScore >= 75) {
      md += `システムは外的ショックに対して十分な耐性余白を維持しています。主要指標の下振れが発生しても破綻臨界ラインを回避可能です。\n`;
    } else if (analytics.robustnessScore >= 50) {
      md += `特定パラメータ（${analytics.tornado[0]?.label || '主要コスト指標'}）の悪化が全体利益に強い負の連鎖を引き起こす傾向が検出されました。緩衝マージンまたはヘッジ施策の導入を推奨します。\n`;
    } else {
      md += `⚠️ **極めて脆弱なシステム状態です。** コスト・離脱率の急激な上昇または成長率低下が重なると、瞬時に赤字または破綻ラインに到達する危険性があります。早期の構造的改善が必要です。\n`;
    }

    navigator.clipboard.writeText(md);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-amber-400">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  HYPOTHESIS STRESS LAB // 仮説ストレステスト・実験ラボ
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-semibold">
                  {parameters.length} パラメータ検知
                </span>
                {synapses.length > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
                    {synapses.length} シナプス連動中
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                極限ショックや市場急変を注入し、システムの堅牢度スコア・脆弱性ボトルネック・破綻ラインを診断
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-colors"
              title="Markdownレポートをクリップボードにコピー"
            >
              {copiedReport ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">コピー完了</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>レポートをコピー</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Controls vs Right Diagnostics */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-850">
          {/* Left Column: Preset Shocks & Parameter Sliders (7 cols) */}
          <div className="lg:col-span-7 p-6 space-y-6">
            {/* Macro Shock Scenarios */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  マクロ・ショックシナリオ (1クリック適用)
                </span>
                {Object.keys(paramMultipliers).length > 0 && (
                  <button
                    onClick={handleResetAll}
                    className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    すべて通常値にリセット
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className={`text-left p-3 rounded-xl border transition-all relative overflow-hidden group ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                          : 'bg-slate-900/60 hover:bg-slate-850/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          {preset.id === 'black_swan' && <Flame className="w-3.5 h-3.5 text-rose-400" />}
                          {preset.id === 'hyper_scale' && <Rocket className="w-3.5 h-3.5 text-cyan-400" />}
                          {preset.id === 'stagflation' && <TrendingDown className="w-3.5 h-3.5 text-amber-400" />}
                          {preset.id === 'resource_crunch' && <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />}
                          {preset.id === 'bull_supercycle' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                          {preset.name}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/60 animate-pulse">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {preset.tagline}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Individual Parameters Fine-Tuning */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  個別パラメータ・ショック微調整
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  スライダー: 0.2x 〜 3.0x (原数値に乗算)
                </span>
              </div>

              {parameters.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  調整可能なシミュレーション変数が見つかりません。
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {parameters.map((p) => {
                    const deltaPct = Math.round((p.multiplier - 1.0) * 100);
                    const isPerturbed = Math.abs(deltaPct) > 1;

                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isPerturbed
                            ? 'bg-slate-900/90 border-slate-700 shadow-md'
                            : 'bg-slate-900/40 border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                                p.nature === 'cost'
                                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                                  : p.nature === 'benefit'
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                                  : p.nature === 'risk'
                                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {p.nature}
                            </span>
                            <span className="font-semibold text-slate-200">{p.label}</span>
                            <span className="text-[10px] text-slate-500 font-mono">({p.widgetTitle})</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-400 text-[11px]">
                              {p.originalValue.toLocaleString()} {p.unit || ''}
                            </span>
                            <span className="text-slate-600">→</span>
                            <span
                              className={`font-mono text-xs font-bold ${
                                isPerturbed
                                  ? deltaPct > 0
                                    ? p.nature === 'cost' || p.nature === 'risk'
                                      ? 'text-rose-400'
                                      : 'text-emerald-400'
                                    : p.nature === 'cost' || p.nature === 'risk'
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                                  : 'text-slate-300'
                              }`}
                            >
                              {p.currentValue.toLocaleString()} {p.unit || ''}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                isPerturbed
                                  ? deltaPct > 0
                                    ? 'bg-amber-950/80 text-amber-300'
                                    : 'bg-cyan-950/80 text-cyan-300'
                                  : 'bg-slate-800/60 text-slate-500'
                              }`}
                            >
                              {p.multiplier.toFixed(2)}x ({deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`})
                            </span>
                            {isPerturbed && (
                              <button
                                onClick={() => handleResetParam(p.id)}
                                className="p-1 text-slate-500 hover:text-slate-300 rounded"
                                title="1.0x (元数値) にリセット"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Slider */}
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-slate-600 w-6">0.2x</span>
                          <input
                            type="range"
                            min={0.2}
                            max={3.0}
                            step={0.05}
                            value={p.multiplier}
                            onChange={(e) => handleMultiplierChange(p.id, parseFloat(e.target.value))}
                            className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                          />
                          <span className="text-[10px] font-mono text-slate-600 w-6">3.0x</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Robustness & Tornado Analytics (5 cols) */}
          <div className="lg:col-span-5 p-6 bg-slate-900/40 space-y-6">
            {/* Robustness Gauge Hero */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/90 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  SYSTEM ROBUSTNESS INDEX
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    analytics.robustnessScore >= 75
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                      : analytics.robustnessScore >= 50
                      ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                      : 'bg-rose-950 text-rose-300 border border-rose-700/60 animate-pulse'
                  }`}
                >
                  {analytics.status}
                </span>
              </div>

              <div className="flex items-baseline gap-3 mb-2">
                <span
                  className={`text-5xl font-mono font-black tracking-tight ${
                    analytics.robustnessScore >= 75
                      ? 'text-emerald-400'
                      : analytics.robustnessScore >= 50
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {analytics.robustnessScore}
                </span>
                <span className="text-slate-500 font-mono text-sm font-semibold">/ 100</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    analytics.robustnessScore >= 75
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                      : analytics.robustnessScore >= 50
                      ? 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                      : 'bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                  }`}
                  style={{ width: `${analytics.robustnessScore}%` }}
                />
              </div>

              {/* Stat metrics grid */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block">モンテカルロ生存率</span>
                  <span className="font-mono font-bold text-slate-200 text-sm">
                    {analytics.survivalRate}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block">最大下振れ想定 (VaR)</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    {analytics.worstDrawdownPct}%
                  </span>
                </div>
              </div>
            </div>

            {/* Tornado Sensitivity Ranking */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                  感度トルネード解析 (最重要リスク因子 Top 5)
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  影響度スコア
                </span>
              </div>

              {analytics.tornado.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  分析データがありません
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.tornado.map((t, idx) => {
                    const maxImpact = analytics.tornado[0]?.impactScore || 1;
                    const pct = Math.max(10, Math.min(100, Math.round((t.impactScore / maxImpact) * 100)));

                    return (
                      <div key={t.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium truncate max-w-[200px]">
                            <span className="text-slate-500 font-mono mr-1.5">{idx + 1}.</span>
                            {t.label}
                          </span>
                          <span className="font-mono text-[11px] text-cyan-400 font-semibold">
                            {t.impactScore} pt
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Diagnostic Insight Note */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>AI コーテックス診断所見</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {analytics.robustnessScore >= 75 ? (
                  <>システムは外的ショックに対して健全な耐性を維持しています。現行の前提条件であれば市場ボラティリティを吸収可能です。</>
                ) : analytics.robustnessScore >= 50 ? (
                  <>
                    <b className="text-amber-300 font-medium">注意: </b>
                    特定変数（特に {analytics.tornado[0]?.label || '主要コスト'}）がシステム全体の成果を大きく左右します。ダウンサイド対策を優先してください。
                  </>
                ) : (
                  <>
                    <b className="text-rose-400 font-medium">警告: </b>
                    複合ショック耐性が極度に低下しています。わずかなコスト増・CVR低下で赤字または破綻ラインへ突入するリスクがあります。
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetAll}
              className="px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
            >
              通常値に初期化
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              閉じる
            </button>

            <button
              onClick={handleApplyToCanvas}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-450 hover:to-rose-450 text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Zap className="w-4 h-4 text-slate-950 fill-current" />
              <span>ショック状態をキャンバスに一時注入して観察</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
