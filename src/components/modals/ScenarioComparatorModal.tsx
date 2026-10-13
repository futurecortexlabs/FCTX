import React, { useState, useMemo } from 'react';
import type { MorphicWidget } from '../../types/morphic';
import { SHOWCASE_PRESETS } from '../../lib/synthesizer';
import type { HistoryEntry } from './HistoryDrawer';
import { soundEngine } from '../../lib/soundEngine';
import confetti from 'canvas-confetti';
import {
  ArrowLeftRight,
  Check,
  Copy,
  GitCompare,
  GitFork,
  Printer,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentWidgets: MorphicWidget[];
  history: HistoryEntry[];
  onApplyScenario: (widgets: MorphicWidget[], label: string) => void;
}

interface ScenarioOption {
  id: string;
  name: string;
  category: 'current' | 'history' | 'preset';
  description: string;
  widgets: MorphicWidget[];
}

export const ScenarioComparatorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentWidgets,
  history,
  onApplyScenario,
}) => {
  // Build scenario options catalog
  const scenarioOptions = useMemo<ScenarioOption[]>(() => {
    const list: ScenarioOption[] = [];

    // 1. Current Active Workspace
    list.push({
      id: 'current',
      name: '⚡ 現在のアクティブ・ワークスペース',
      category: 'current',
      description: `現在編集中の状態 (${currentWidgets.length} モジュール)`,
      widgets: currentWidgets,
    });

    // 2. History Snapshots
    history.forEach((h, idx) => {
      list.push({
        id: `history_${h.id}`,
        name: `🕒 履歴: ${h.prompt.slice(0, 24)}${h.prompt.length > 24 ? '...' : ''}`,
        category: 'history',
        description: `${new Date(h.timestamp).toLocaleTimeString('ja-JP')} 保存 (スナップショット #${idx + 1})`,
        widgets: h.widgetSnapshot,
      });
    });

    // 3. Showcase Presets
    SHOWCASE_PRESETS.forEach((p) => {
      list.push({
        id: `preset_${p.id}`,
        name: `🌐 プリセット: ${p.name}`,
        category: 'preset',
        description: p.tagline,
        widgets: p.widgets,
      });
    });

    return list;
  }, [currentWidgets, history]);

  const [worldAId, setWorldAId] = useState<string>('current');
  const [worldBId, setWorldBId] = useState<string>(() => {
    return history.length > 0 ? `history_${history[0].id}` : 'preset_preset_ai_startup';
  });
  const [copiedMemo, setCopiedMemo] = useState(false);

  if (!isOpen) return null;

  const worldA = scenarioOptions.find((o) => o.id === worldAId) || scenarioOptions[0];
  const worldB = scenarioOptions.find((o) => o.id === worldBId) || scenarioOptions[scenarioOptions.length - 1];

  // Helper to safely calculate formula
  const evalFormula = (expr: string, vars: { name: string; value: number }[]): number => {
    try {
      let sanitized = expr;
      vars.forEach((v) => {
        const regex = new RegExp(`\\b${v.name}\\b`, 'g');
        sanitized = sanitized.replace(regex, v.value.toString());
      });
      if (/^[\d\s+\-*/().%]+$/.test(sanitized)) {
        // eslint-disable-next-line no-eval
        const res = Function(`'use strict'; return (${sanitized})`)();
        return isFinite(res) ? Math.round(res * 100) / 100 : 0;
      }
      return 0;
    } catch {
      return 0;
    }
  };

  // Metrics Extractor
  const extractMetrics = (widgetsList: MorphicWidget[]) => {
    // 1. Financial Primary Formula
    let finLabel = '主要収益指標';
    let finValue = 0;
    let finUnit = '円';
    const simWidget = widgetsList.find((w) => w.type === 'simulation');
    if (simWidget?.data.formulas && simWidget.data.formulas.length > 0 && simWidget.data.variables) {
      const f = simWidget.data.formulas[simWidget.data.formulas.length - 1];
      finLabel = f.label;
      finUnit = f.unit || '円';
      finValue = evalFormula(
        f.calculate,
        simWidget.data.variables.map((v) => ({ name: v.name, value: v.value }))
      );
    }

    // 2. Decision Tree EMV & Downside Risk
    let emv = 0;
    let downsideRisk = 0;
    let hasTree = false;
    const treeWidget = widgetsList.find((w) => w.type === 'decision_tree');
    if (treeWidget?.data.decisionNodes && treeWidget.data.rootNodeId) {
      hasTree = true;
      const nodes = treeWidget.data.decisionNodes;
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      const computeEMV = (nodeId: string): number => {
        const node = nodeMap.get(nodeId);
        if (!node) return 0;
        if (node.type === 'outcome') return node.payoff ?? 0;

        const children = (node.childrenIds || []).map((cid) => nodeMap.get(cid)).filter(Boolean);
        if (children.length === 0) return (node.payoff ?? 0) - (node.cost ?? 0);

        if (node.type === 'chance') {
          let sum = 0;
          children.forEach((c) => {
            if (c) sum += (c.probability ?? 1) * computeEMV(c.id);
          });
          return sum - (node.cost ?? 0);
        }

        let maxChild = -Infinity;
        children.forEach((c) => {
          if (c) {
            const val = computeEMV(c.id);
            if (val > maxChild) maxChild = val;
          }
        });
        return (maxChild === -Infinity ? 0 : maxChild) - (node.cost ?? 0);
      };

      emv = computeEMV(treeWidget.data.rootNodeId);

      // Downside risk
      const outcomes = nodes.filter((n) => n.type === 'outcome');
      const negativeOutcomes = outcomes.filter((n) => (n.payoff ?? 0) < 0);
      const totalProb = outcomes.reduce((acc, n) => acc + (n.probability ?? 1), 0) || 1;
      const negProb = negativeOutcomes.reduce((acc, n) => acc + (n.probability ?? 1), 0);
      downsideRisk = Math.round((negProb / totalProb) * 100);
    }

    // 3. Pipeline Progress
    let totalTasks = 0;
    let completedTasks = 0;
    widgetsList
      .filter((w) => w.type === 'pipeline')
      .forEach((pw) => {
        (pw.data.stages || []).forEach((stg) => {
          (stg.items || []).forEach((item) => {
            totalTasks++;
            if (item.done) completedTasks++;
          });
        });
      });
    const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 4. Matrix Centroid
    let matrixItemCount = 0;
    let sumX = 0;
    let sumY = 0;
    widgetsList
      .filter((w) => w.type === 'matrix')
      .forEach((mw) => {
        (mw.data.matrixItems || []).forEach((mi) => {
          matrixItemCount++;
          sumX += mi.x;
          sumY += mi.y;
        });
      });
    const centroidX = matrixItemCount > 0 ? Math.round(sumX / matrixItemCount) : 50;
    const centroidY = matrixItemCount > 0 ? Math.round(sumY / matrixItemCount) : 50;

    return {
      finLabel,
      finValue,
      finUnit,
      hasTree,
      emv,
      downsideRisk,
      totalTasks,
      completedTasks,
      taskPct,
      matrixItemCount,
      centroidX,
      centroidY,
      widgetCount: widgetsList.length,
      simWidget,
    };
  };

  const metricsA = useMemo(() => extractMetrics(worldA.widgets), [worldA]);
  const metricsB = useMemo(() => extractMetrics(worldB.widgets), [worldB]);

  // Delta calculations
  const finDelta = metricsB.finValue - metricsA.finValue;
  const finDeltaPct = metricsA.finValue !== 0 ? Math.round((finDelta / Math.abs(metricsA.finValue)) * 100) : 0;

  const emvDelta = metricsB.emv - metricsA.emv;
  const taskDeltaPct = metricsB.taskPct - metricsA.taskPct;
  const riskDelta = metricsB.downsideRisk - metricsA.downsideRisk;

  // Swap Worlds
  const handleSwapWorlds = () => {
    soundEngine.playClick();
    setWorldAId(worldBId);
    setWorldBId(worldAId);
  };

  // Copy Markdown Memo
  const handleCopyMemo = () => {
    soundEngine.playMorph();
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    } catch {
      // ignore
    }

    let memo = `# FCTX // 多元並行世界シナリオ比較レポート (Multiverse Scenario Comparator)\n`;
    memo += `*生成日時: ${new Date().toLocaleString('ja-JP')}*\n\n`;
    memo += `## 比較対象\n`;
    memo += `- **世界 A (基準)**: ${worldA.name} (${worldA.description})\n`;
    memo += `- **世界 B (対照)**: ${worldB.name} (${worldB.description})\n\n`;

    memo += `## 主要エグゼクティブKPI 差異\n`;
    memo += `| 指標名 | 世界 A | 世界 B | 差分 (B - A) | 変動率 |\n`;
    memo += `| :--- | :--- | :--- | :--- | :--- |\n`;
    memo += `| ${metricsA.finLabel} | ${metricsA.finValue.toLocaleString('ja-JP')} ${metricsA.finUnit} | ${metricsB.finValue.toLocaleString('ja-JP')} ${metricsB.finUnit} | ${finDelta > 0 ? '+' : ''}${finDelta.toLocaleString('ja-JP')} ${metricsA.finUnit} | ${finDeltaPct >= 0 ? '+' : ''}${finDeltaPct}% |\n`;

    if (metricsA.hasTree || metricsB.hasTree) {
      memo += `| 意思決定期待値 (EMV) | ${metricsA.emv.toLocaleString('ja-JP')} 円 | ${metricsB.emv.toLocaleString('ja-JP')} 円 | ${emvDelta > 0 ? '+' : ''}${emvDelta.toLocaleString('ja-JP')} 円 | - |\n`;
      memo += `| ダウンサイド・リスク率 | ${metricsA.downsideRisk}% | ${metricsB.downsideRisk}% | ${riskDelta > 0 ? '+' : ''}${riskDelta}pt | - |\n`;
    }

    memo += `| タスク実行進捗 | ${metricsA.taskPct}% (${metricsA.completedTasks}/${metricsA.totalTasks}) | ${metricsB.taskPct}% (${metricsB.completedTasks}/${metricsB.totalTasks}) | ${taskDeltaPct > 0 ? '+' : ''}${taskDeltaPct}pt | - |\n`;
    memo += `| 戦略重心 (X, Y) | (${metricsA.centroidX}%, ${metricsA.centroidY}%) | (${metricsB.centroidX}%, ${metricsB.centroidY}%) | - | - |\n`;
    memo += `| 稼働モジュール数 | ${metricsA.widgetCount} 件 | ${metricsB.widgetCount} 件 | ${metricsB.widgetCount - metricsA.widgetCount} 件 | - |\n\n`;

    memo += `## 変数パラメータ比較 (シミュレーション)\n`;
    if (metricsA.simWidget?.data.variables && metricsB.simWidget?.data.variables) {
      memo += `| 変数名 | 世界 A | 世界 B | 単位 |\n`;
      memo += `| :--- | :--- | :--- | :--- |\n`;
      const allVarsMap = new Map<string, { label: string; unit?: string }>();
      metricsA.simWidget.data.variables.forEach((v) => allVarsMap.set(v.id, { label: v.label, unit: v.unit }));
      metricsB.simWidget.data.variables.forEach((v) => allVarsMap.set(v.id, { label: v.label, unit: v.unit }));

      allVarsMap.forEach((meta, id) => {
        const va = metricsA.simWidget?.data.variables?.find((v) => v.id === id)?.value ?? '-';
        const vb = metricsB.simWidget?.data.variables?.find((v) => v.id === id)?.value ?? '-';
        memo += `| ${meta.label} | ${va} | ${vb} | ${meta.unit || ''} |\n`;
      });
      memo += `\n`;
    }

    navigator.clipboard.writeText(memo);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/10">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-950 to-indigo-950 border border-cyan-800/60 text-cyan-400">
              <GitCompare className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-slate-100 font-mono tracking-wide">
                  MULTIVERSE // 並行世界シナリオ比較エンジン
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  並行差分分析
                </span>
              </div>
              <p className="text-xs text-slate-400">
                異なるタイムライン、スナップショット、またはプリセット間のKPI・数値を多次元比較
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual Selector & Quick Switcher */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 space-y-3">
          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto text-[11px] font-mono pb-1">
            <span className="text-slate-500 whitespace-nowrap">クイック比較:</span>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setWorldAId('current');
                  setWorldBId(`history_${history[0].id}`);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors whitespace-nowrap"
              >
                現在 vs 直近スナップショット
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setWorldAId('preset_preset_ai_startup');
                setWorldBId('preset_preset_cloud_migration');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors whitespace-nowrap"
            >
              AIスタートアップ vs クラウド意思決定
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setWorldAId('preset_preset_saas_roadmap');
                setWorldBId('preset_preset_ma_tradeoff');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors whitespace-nowrap"
            >
              SaaSロードマップ vs M&A多属性
            </button>
          </div>

          {/* World A vs World B Selector Bar */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
            {/* World A Selector (Left) */}
            <div className="md:col-span-5 bg-slate-900/90 p-3 rounded-2xl border border-indigo-900/50 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  世界 A (基準タイムライン)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{worldA.widgets.length} モジュール</span>
              </div>
              <select
                value={worldAId}
                onChange={(e) => {
                  soundEngine.playClick();
                  setWorldAId(e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {scenarioOptions.map((opt) => (
                  <option key={`a_${opt.id}`} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 truncate">{worldA.description}</p>
            </div>

            {/* Center Swap Button */}
            <div className="md:col-span-1 flex justify-center">
              <button
                type="button"
                onClick={handleSwapWorlds}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-all hover:scale-105 shadow-md"
                title="世界 A と 世界 B を入れ替える"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* World B Selector (Right) */}
            <div className="md:col-span-5 bg-slate-900/90 p-3 rounded-2xl border border-cyan-900/50 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  世界 B (対照タイムライン)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{worldB.widgets.length} モジュール</span>
              </div>
              <select
                value={worldBId}
                onChange={(e) => {
                  soundEngine.playClick();
                  setWorldBId(e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {scenarioOptions.map((opt) => (
                  <option key={`b_${opt.id}`} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 truncate">{worldB.description}</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content: KPI Diff Cards & Deep Dive */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Executive KPI Delta Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              エグゼクティブ主要指標 差異マトリクス (Key Performance Deltas)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Financial Primary KPI */}
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 relative overflow-hidden group">
                <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>{metricsA.finLabel}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      finDelta >= 0
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {finDeltaPct >= 0 ? `+${finDeltaPct}%` : `${finDeltaPct}%`}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-indigo-400 block">世界 A</span>
                    <span className="text-sm font-bold text-slate-300">
                      {metricsA.finValue.toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-cyan-400 block">世界 B</span>
                    <span className="text-base font-extrabold text-cyan-200">
                      {metricsB.finValue.toLocaleString('ja-JP')}
                    </span>
                  </div>
                </div>
                <div className="mt-1 text-[10px] text-slate-500 font-mono text-right">
                  差分: {finDelta > 0 ? `+${finDelta.toLocaleString('ja-JP')}` : finDelta.toLocaleString('ja-JP')}{' '}
                  {metricsA.finUnit}
                </div>
              </div>

              {/* EMV (Expected Monetary Value) */}
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>意思決定期待値 (EMV)</span>
                  {metricsA.hasTree || metricsB.hasTree ? (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        emvDelta >= 0
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {emvDelta >= 0 ? `+${emvDelta.toLocaleString('ja-JP')}` : emvDelta.toLocaleString('ja-JP')} 円
                    </span>
                  ) : (
                    <span className="text-slate-600">非搭載</span>
                  )}
                </div>
                <div className="mt-2 flex items-baseline justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-indigo-400 block">世界 A</span>
                    <span className="text-sm font-bold text-slate-300">
                      {metricsA.hasTree ? `${metricsA.emv.toLocaleString('ja-JP')} 円` : '-'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-cyan-400 block">世界 B</span>
                    <span className="text-base font-extrabold text-cyan-200">
                      {metricsB.hasTree ? `${metricsB.emv.toLocaleString('ja-JP')} 円` : '-'}
                    </span>
                  </div>
                </div>
                <div className="mt-1 text-[10px] text-slate-500 font-mono text-right">
                  {metricsA.hasTree || metricsB.hasTree ? '分岐確率加重平均' : '意思決定樹なし'}
                </div>
              </div>

              {/* Downside Risk */}
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>ダウンサイド・リスク率</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      riskDelta <= 0
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {riskDelta <= 0 ? `${riskDelta}pt (改善)` : `+${riskDelta}pt (悪化)`}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-indigo-400 block">世界 A</span>
                    <span className="text-sm font-bold text-slate-300">{metricsA.downsideRisk}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-cyan-400 block">世界 B</span>
                    <span className="text-base font-extrabold text-cyan-200">{metricsB.downsideRisk}%</span>
                  </div>
                </div>
                <div className="mt-1 text-[10px] text-slate-500 font-mono text-right">マイナス損失発生確率</div>
              </div>

              {/* Task Progress % */}
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>実行パイプライン進捗</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      taskDeltaPct >= 0
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {taskDeltaPct >= 0 ? `+${taskDeltaPct}pt` : `${taskDeltaPct}pt`}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-indigo-400 block">世界 A</span>
                    <span className="text-sm font-bold text-slate-300">
                      {metricsA.taskPct}% ({metricsA.completedTasks}/{metricsA.totalTasks})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-cyan-400 block">世界 B</span>
                    <span className="text-base font-extrabold text-cyan-200">
                      {metricsB.taskPct}% ({metricsB.completedTasks}/{metricsB.totalTasks})
                    </span>
                  </div>
                </div>
                <div className="mt-1 text-[10px] text-slate-500 font-mono text-right">完了タスク比率</div>
              </div>
            </div>
          </div>

          {/* Deep Dive: Simulation Parameter Diff Table */}
          {metricsA.simWidget?.data.variables && metricsB.simWidget?.data.variables && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5 text-indigo-400" />
                シミュレーション変数パラメータ 並行対照表 (Variables Side-by-Side)
              </h3>

              <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="grid grid-cols-12 p-2.5 text-[11px] font-mono text-slate-400 border-b border-slate-800 bg-slate-900/60">
                  <div className="col-span-5 font-bold">パラメータ名</div>
                  <div className="col-span-3 text-right text-indigo-300 font-bold">世界 A (基準)</div>
                  <div className="col-span-1 text-center text-slate-600">vs</div>
                  <div className="col-span-3 text-right text-cyan-300 font-bold">世界 B (対照)</div>
                </div>

                <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
                  {metricsA.simWidget.data.variables.map((va) => {
                    const vb = metricsB.simWidget?.data.variables?.find((v) => v.id === va.id || v.name === va.name);
                    const valA = va.value;
                    const valB = vb ? vb.value : null;
                    const isDiff = valB !== null && valA !== valB;
                    const diff = valB !== null ? valB - valA : 0;

                    return (
                      <div
                        key={va.id}
                        className={`grid grid-cols-12 p-2 text-xs font-mono items-center transition-colors ${
                          isDiff ? 'bg-indigo-950/20' : 'hover:bg-slate-900/40'
                        }`}
                      >
                        <div className="col-span-5 flex items-center gap-1.5">
                          {isDiff ? (
                            diff > 0 ? (
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                            )
                          ) : (
                            <span className="w-3.5 h-3.5 flex-shrink-0" />
                          )}
                          <span className="font-sans text-slate-200 truncate">{va.label}</span>
                        </div>
                        <div className="col-span-3 text-right text-slate-300">
                          {valA.toLocaleString('ja-JP')} <span className="text-[10px] text-slate-500">{va.unit}</span>
                        </div>
                        <div className="col-span-1 text-center text-slate-600 font-sans">→</div>
                        <div className="col-span-3 text-right">
                          {valB !== null ? (
                            <span className={isDiff ? 'font-bold text-cyan-300' : 'text-slate-400'}>
                              {valB.toLocaleString('ja-JP')}{' '}
                              <span className="text-[10px] text-slate-500">{va.unit}</span>
                              {isDiff && (
                                <span className="ml-1 text-[10px] text-amber-400 block font-sans">
                                  ({diff > 0 ? `+${diff}` : diff})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Module Architecture Comparison */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              モジュール構成・空間トポロジー比較
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* World A Modules */}
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-indigo-900/40 space-y-2">
                <span className="text-xs font-bold text-indigo-300 font-mono block">
                  世界 A 稼働モジュール ({worldA.widgets.length})
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {worldA.widgets.map((w) => (
                    <div
                      key={w.id}
                      className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] flex items-center justify-between"
                    >
                      <span className="text-slate-200 font-medium truncate">{w.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
                        {w.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* World B Modules */}
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-cyan-900/40 space-y-2">
                <span className="text-xs font-bold text-cyan-300 font-mono block">
                  世界 B 稼働モジュール ({worldB.widgets.length})
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {worldB.widgets.map((w) => (
                    <div
                      key={w.id}
                      className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] flex items-center justify-between"
                    >
                      <span className="text-slate-200 font-medium truncate">{w.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                        {w.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMemo}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl transition-all font-mono"
            >
              {copiedMemo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMemo ? 'コピー完了！' : '比較メモをMarkdownコピー'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                window.print();
              }}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl transition-all font-mono"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>印刷 / PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playMorph();
                onApplyScenario(worldA.widgets, worldA.name);
                onClose();
              }}
              className="flex items-center gap-1.5 text-xs bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700 px-3 py-2 rounded-xl transition-all font-semibold"
            >
              <span>← 世界 A を採用・展開</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playMorph();
                onApplyScenario(worldB.widgets, worldB.name);
                onClose();
              }}
              className="flex items-center gap-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3.5 py-2 rounded-xl shadow-lg shadow-cyan-600/30 transition-all transform active:scale-98"
            >
              <span>世界 B を採用・展開 →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
