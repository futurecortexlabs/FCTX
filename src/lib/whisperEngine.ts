// FCTX Cortex Ambient Whisper Engine
// Analyzes active workspace state and generates contextual insights, warnings, and opportunities
import type { MorphicWidget, CortexWhisper } from '../types/morphic';

export function analyzeWorkspaceState(widgets: MorphicWidget[]): CortexWhisper[] {
  const whispers: CortexWhisper[] = [];

  // 1. Simulation Analysis
  const simWidgets = widgets.filter((w) => w.type === 'simulation');
  simWidgets.forEach((sim) => {
    const vars = sim.data.variables || [];
    const varMap: Record<string, number> = {};
    vars.forEach((v) => (varMap[v.name] = v.value));

    // High churn check
    if (varMap['churn'] && varMap['churn'] >= 3.0) {
      whispers.push({
        id: `wh_churn_${sim.id}`,
        title: '解約率 (Churn) の警戒水準',
        message: `月次解約率が${varMap['churn']}%と高水準です。年間に換算すると顧客ベースの約3割が喪失するため、LTVが急速に毀損します。`,
        severity: 'warning',
        actionLabel: 'オンボーディング改善パイプラインを追加',
        actionPrompt: 'ユーザーの離脱を防ぐオンボーディング改善とCSサクセス計画の策定',
      });
    }

    // High CAC or Low CVR check
    if (varMap['cvr'] && varMap['cvr'] < 1.5) {
      whispers.push({
        id: `wh_cvr_${sim.id}`,
        title: '有料転換率 (CVR) のボトルネック',
        message: `有料転換率が${varMap['cvr']}%と控えめです。フリーミアムの機能制限やプライシングティアの再設計により、2.5%以上への引き上げ余地があります。`,
        severity: 'opportunity',
        actionLabel: 'プライシングティア見直しマトリクスを生成',
        actionPrompt: '有料会員転換率向上のためのプライシング階層とインセンティブ設計',
      });
    }

    // Profit vs Opex
    if (varMap['opex'] && varMap['price'] && varMap['mau'] && varMap['cvr']) {
      const estimatedRev = varMap['mau'] * (varMap['cvr'] / 100) * varMap['price'];
      if (estimatedRev < varMap['opex']) {
        whispers.push({
          id: `wh_deficit_${sim.id}`,
          title: '営業損益の赤字リスク',
          message: `現在のパラメータ設定では月次売上（約${Math.round(estimatedRev).toLocaleString()}円）が固定費OPEXを下回り、赤字構造になっています。`,
          severity: 'warning',
          actionLabel: 'コスト最適化と黒字化シナリオを模索',
          actionPrompt: '損益分岐点を達成するためのコスト削減とユニットエコノミクス最適化',
        });
      }
    }
  });

  // 2. Matrix Radar Analysis
  const matrixWidgets = widgets.filter((w) => w.type === 'matrix');
  matrixWidgets.forEach((mat) => {
    const items = mat.data.matrixItems || [];
    // Items in top-right critical quadrant (X > 50, Y > 50)
    const criticalItems = items.filter((it) => it.x >= 50 && it.y >= 50);

    if (criticalItems.length >= 2) {
      whispers.push({
        id: `wh_crit_mat_${mat.id}`,
        title: `重大事案の重複集約 (${criticalItems.length}件)`,
        message: `「${criticalItems.map((c) => c.label).join('」「')}」が最高脅威・高インパクト象限に集中しています。同時対処が困難なため、優先トリアージが必要です。`,
        severity: 'warning',
        actionLabel: '優先トリアージ計画を生成',
        actionPrompt: '最優先対応事項のトリアージと迅速なリソース再配分計画',
      });
    }
  });

  // 3. Tradeoff Engine Analysis
  const tradeoffWidgets = widgets.filter((w) => w.type === 'tradeoff');
  tradeoffWidgets.forEach((tr) => {
    const criteria = tr.data.criteria || [];
    const speedCrit = criteria.find((c) => c.name.includes('スピード') || c.name.includes('工期'));
    const qualityCrit = criteria.find(
      (c) => c.name.includes('スケーラビリティ') || c.name.includes('品質') || c.name.includes('セキュリティ')
    );

    if (speedCrit && qualityCrit && speedCrit.weight >= 4 && qualityCrit.weight <= 2) {
      whispers.push({
        id: `wh_trade_bias_${tr.id}`,
        title: '短期バイアス（技術的負債リスク）の検知',
        message: '短期スピードの重みが極めて高く、長期スケーラビリティや保守性が軽視されています。半年後にリファクタリング危機に陥る典型パターンです。',
        severity: 'insight',
        actionLabel: '技術的負債ヘッジのトレードオフ再評価',
        actionPrompt: '短期速度と長期保守性のバランスをとるアーキテクチャ選定の比較検討',
      });
    }
  });

  // 4. Default Ambient Wisdom if few alerts
  if (whispers.length === 0 && widgets.length > 0) {
    whispers.push({
      id: 'wh_ambient_harmony',
      title: '認知バランス安定',
      message: '現在展開されているモジュール群に致命的な矛盾は検出されていません。スライダーを操作するか、新しい仮説をプロンプターに投下してください。',
      severity: 'insight',
    });
  }

  return whispers;
}
