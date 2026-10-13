import React, { useState, useEffect } from 'react';
import type { MorphicWidget, DecisionNode } from '../../types/morphic';
import { soundEngine } from '../../lib/soundEngine';
import {
  GitFork,
  HelpCircle,
  Flag,
  Plus,
  Trash2,
  DollarSign,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Percent,
} from 'lucide-react';

interface Props {
  widget: MorphicWidget;
  onUpdate: (updated: MorphicWidget) => void;
  onEmitOutput?: (key: string, value: number) => void;
}

export const DecisionTreeWidget: React.FC<Props> = ({ widget, onUpdate, onEmitOutput }) => {
  const nodes: DecisionNode[] = widget.data.decisionNodes || [
    {
      id: 'root',
      title: 'AI基盤インフラ刷新の戦略分岐',
      type: 'decision',
      cost: 0,
      childrenIds: ['branch_cloud', 'branch_onprem'],
    },
    {
      id: 'branch_cloud',
      title: 'マルチクラウド自律分散型へ移行',
      type: 'decision',
      cost: 3000000,
      childrenIds: ['chance_cloud_adoption'],
    },
    {
      id: 'chance_cloud_adoption',
      title: '顧客トラフィック急増の確率',
      type: 'chance',
      childrenIds: ['outcome_cloud_high', 'outcome_cloud_normal'],
    },
    {
      id: 'outcome_cloud_high',
      title: '急成長シナリオ (高負荷耐性達成)',
      type: 'outcome',
      probability: 0.7,
      payoff: 18000000,
    },
    {
      id: 'outcome_cloud_normal',
      title: '通常成長シナリオ',
      type: 'outcome',
      probability: 0.3,
      payoff: 6000000,
    },
    {
      id: 'branch_onprem',
      title: '現行オンプレミスサーバーの延命増強',
      type: 'decision',
      cost: 1000000,
      childrenIds: ['chance_onprem_load'],
    },
    {
      id: 'chance_onprem_load',
      title: 'スパイク負荷発生の確率',
      type: 'chance',
      childrenIds: ['outcome_onprem_fail', 'outcome_onprem_ok'],
    },
    {
      id: 'outcome_onprem_fail',
      title: '大規模障害 & 機会損失',
      type: 'outcome',
      probability: 0.45,
      payoff: -7500000,
    },
    {
      id: 'outcome_onprem_ok',
      title: '安定運用 (保守費用抑制)',
      type: 'outcome',
      probability: 0.55,
      payoff: 2500000,
    },
  ];

  const rootId = widget.data.rootNodeId || 'root';
  const [selectedNodeId, setSelectedNodeId] = useState<string>(rootId);
  const [activeSimulationPath, setActiveSimulationPath] = useState<string[]>([]);
  const [editingNode, setEditingNode] = useState<DecisionNode | null>(null);

  // Helper map
  const nodeMap = new Map<string, DecisionNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // Recursive Expected Monetary Value (EMV) calculation
  const calculateEMV = (nodeId: string): number => {
    const node = nodeMap.get(nodeId);
    if (!node) return 0;

    const cost = node.cost || 0;

    if (node.type === 'outcome') {
      return (node.payoff || 0) - cost;
    }

    const children = (node.childrenIds || [])
      .map((id) => nodeMap.get(id))
      .filter((n): n is DecisionNode => Boolean(n));

    if (children.length === 0) {
      return (node.payoff || 0) - cost;
    }

    if (node.type === 'chance') {
      // Sum of (prob * EMV)
      const expectedChildrenSum = children.reduce((sum, ch) => {
        const prob = ch.probability !== undefined ? ch.probability : 1 / children.length;
        return sum + prob * calculateEMV(ch.id);
      }, 0);
      return Math.round(expectedChildrenSum - cost);
    }

    if (node.type === 'decision') {
      // Max of children EMV
      const maxChild = Math.max(...children.map((ch) => calculateEMV(ch.id)));
      return Math.round(maxChild - cost);
    }

    return 0;
  };

  // Failure / Downside risk calculation (% of outcomes with payoff < 0)
  const calculateDownsideRisk = (): number => {
    const outcomes = nodes.filter((n) => n.type === 'outcome');
    if (outcomes.length === 0) return 0;
    const negative = outcomes.filter((n) => (n.payoff || 0) < 0);
    return Math.round((negative.length / outcomes.length) * 100);
  };

  const rootEMV = calculateEMV(rootId);
  const downsideRiskPercent = calculateDownsideRisk();

  // Emit to Synapse Bus
  useEffect(() => {
    if (!onEmitOutput) return;
    onEmitOutput('tree_expected_value', rootEMV);
    onEmitOutput('tree_risk_rate', downsideRiskPercent);
    onEmitOutput('tree_node_count', nodes.length);
  }, [rootEMV, downsideRiskPercent, nodes.length, onEmitOutput]);

  const handleSelectNode = (node: DecisionNode) => {
    soundEngine.playClick();
    setSelectedNodeId(node.id);
    setEditingNode({ ...node });

    // Path tracing
    if (!activeSimulationPath.includes(node.id)) {
      setActiveSimulationPath((prev) => [...prev, node.id]);
    } else {
      setActiveSimulationPath((prev) => prev.filter((id) => id !== node.id));
    }
  };

  const handleUpdateNode = (updated: DecisionNode) => {
    const newNodes = nodes.map((n) => (n.id === updated.id ? updated : n));
    onUpdate({
      ...widget,
      data: {
        ...widget.data,
        decisionNodes: newNodes,
      },
    });
    setEditingNode(updated);
  };

  const handleAddChild = (parentId: string, type: 'decision' | 'chance' | 'outcome') => {
    soundEngine.playClick();
    const newId = `node_${Date.now()}`;
    const newNode: DecisionNode = {
      id: newId,
      title: type === 'outcome' ? '新規結末シナリオ' : type === 'chance' ? '不確実性分岐' : '選択肢',
      type,
      probability: type === 'outcome' ? 0.5 : undefined,
      payoff: type === 'outcome' ? 5000000 : 0,
      cost: 0,
      childrenIds: [],
    };

    const newNodes = nodes.map((n) => {
      if (n.id === parentId) {
        return {
          ...n,
          childrenIds: [...(n.childrenIds || []), newId],
        };
      }
      return n;
    });

    newNodes.push(newNode);

    onUpdate({
      ...widget,
      data: {
        ...widget.data,
        decisionNodes: newNodes,
      },
    });
    setSelectedNodeId(newId);
    setEditingNode(newNode);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (nodeId === rootId) return; // Cannot delete root
    soundEngine.playClick();

    // Remove from parent childrenIds
    const newNodes = nodes
      .filter((n) => n.id !== nodeId)
      .map((n) => {
        if (n.childrenIds?.includes(nodeId)) {
          return {
            ...n,
            childrenIds: n.childrenIds.filter((id) => id !== nodeId),
          };
        }
        return n;
      });

    onUpdate({
      ...widget,
      data: {
        ...widget.data,
        decisionNodes: newNodes,
      },
    });
    setSelectedNodeId(rootId);
    setEditingNode(null);
  };

  // Node icon helper
  const getNodeIcon = (type: DecisionNode['type']) => {
    switch (type) {
      case 'decision':
        return <GitFork className="w-3.5 h-3.5 text-cyan-400" />;
      case 'chance':
        return <HelpCircle className="w-3.5 h-3.5 text-amber-400" />;
      case 'outcome':
        return <Flag className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  // Recursive Tree Node Renderer
  const renderNodeBranch = (nodeId: string, level = 0): React.ReactNode => {
    const node = nodeMap.get(nodeId);
    if (!node) return null;

    const isSelected = selectedNodeId === node.id;
    const isPathActive = activeSimulationPath.includes(node.id);
    const nodeEMV = calculateEMV(node.id);
    const children = (node.childrenIds || [])
      .map((id) => nodeMap.get(id))
      .filter((n): n is DecisionNode => Boolean(n));

    return (
      <div key={node.id} className="relative pl-3 sm:pl-5 border-l border-slate-800 my-1.5 space-y-1">
        {/* Node Item Pill */}
        <div
          onClick={() => handleSelectNode(node)}
          className={`group flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
            isSelected
              ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30'
              : isPathActive
              ? 'bg-slate-900/90 border-indigo-500/80'
              : 'bg-slate-950/60 border-slate-800/90 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded bg-slate-900 border border-slate-800 flex-shrink-0">
              {getNodeIcon(node.type)}
            </div>

            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5">
                <span>{node.title}</span>
                {node.probability !== undefined && (
                  <span className="text-[10px] font-mono px-1 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
                    {Math.round(node.probability * 100)}%
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {node.type.toUpperCase()}
                {node.cost ? ` | コスト: ¥${node.cost.toLocaleString()}` : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {node.type === 'outcome' ? (
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                  (node.payoff || 0) >= 0
                    ? 'text-emerald-300 bg-emerald-950/70 border-emerald-800/60'
                    : 'text-rose-300 bg-rose-950/70 border-rose-800/60'
                }`}
              >
                {(node.payoff || 0) >= 0 ? '+' : ''}¥{(node.payoff || 0).toLocaleString()}
              </span>
            ) : (
              <span className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                期待値: ¥{nodeEMV.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Children Branches */}
        {children.length > 0 && (
          <div className="pt-0.5">{children.map((child) => renderNodeBranch(child.id, level + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">全体期待値(EMV):</span>
            <span className="font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              ¥{rootEMV.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">下振れ赤字リスク:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded border ${
                downsideRiskPercent > 30
                  ? 'text-rose-300 bg-rose-950/60 border-rose-800/50'
                  : 'text-amber-300 bg-amber-950/60 border-amber-800/50'
              }`}
            >
              {downsideRiskPercent}%
            </span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-500">
          全 {nodes.length} ノード構成
        </div>
      </div>

      {/* Main Decision Tree Visual Stage */}
      <div className="bg-slate-950/70 rounded-xl border border-slate-800/90 p-3 max-h-96 overflow-y-auto">
        {renderNodeBranch(rootId)}
      </div>

      {/* Node Inspector & Editing Sub-panel */}
      {editingNode && (
        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              ノード編集: {editingNode.title}
            </span>

            {editingNode.id !== rootId && (
              <button
                onClick={() => handleDeleteNode(editingNode.id)}
                className="text-slate-500 hover:text-rose-400 p-1 transition-colors flex items-center gap-1 text-[11px]"
                title="ノードを削除"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>削除</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Title */}
            <div>
              <label className="text-[10px] text-slate-400 font-mono mb-1 block">ノード名</label>
              <input
                type="text"
                value={editingNode.title}
                onChange={(e) => handleUpdateNode({ ...editingNode, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            {/* Type */}
            <div>
              <label className="text-[10px] text-slate-400 font-mono mb-1 block">ノード種別</label>
              <select
                value={editingNode.type}
                onChange={(e) =>
                  handleUpdateNode({
                    ...editingNode,
                    type: e.target.value as DecisionNode['type'],
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-200 font-mono"
              >
                <option value="decision">意思決定 (Decision)</option>
                <option value="chance">確率事象 (Chance)</option>
                <option value="outcome">結末/損益 (Outcome)</option>
              </select>
            </div>

            {/* Probability if chance/outcome */}
            {(editingNode.type === 'chance' || editingNode.type === 'outcome') && (
              <div>
                <label className="text-[10px] text-slate-400 font-mono mb-1 block flex items-center gap-1">
                  <Percent className="w-3 h-3 text-amber-400" />
                  発生確率 (0.0〜1.0)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={editingNode.probability !== undefined ? editingNode.probability : 0.5}
                  onChange={(e) =>
                    handleUpdateNode({
                      ...editingNode,
                      probability: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-200 font-mono"
                />
              </div>
            )}

            {/* Payoff if outcome */}
            {editingNode.type === 'outcome' && (
              <div>
                <label className="text-[10px] text-slate-400 font-mono mb-1 block flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-400" />
                  結果損益額 (¥)
                </label>
                <input
                  type="number"
                  step="500000"
                  value={editingNode.payoff || 0}
                  onChange={(e) =>
                    handleUpdateNode({
                      ...editingNode,
                      payoff: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-200 font-mono"
                />
              </div>
            )}

            {/* Cost */}
            <div>
              <label className="text-[10px] text-slate-400 font-mono mb-1 block">初期投入コスト (¥)</label>
              <input
                type="number"
                step="500000"
                value={editingNode.cost || 0}
                onChange={(e) =>
                  handleUpdateNode({
                    ...editingNode,
                    cost: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-200 font-mono"
              />
            </div>
          </div>

          {/* Add Child Node Controls */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
            <span className="text-[11px] text-slate-400 font-mono">子ノードを追加:</span>
            <button
              onClick={() => handleAddChild(editingNode.id, 'decision')}
              className="text-[11px] bg-cyan-950/70 hover:bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium transition-colors"
            >
              <Plus className="w-3 h-3" />
              選択肢
            </button>
            <button
              onClick={() => handleAddChild(editingNode.id, 'chance')}
              className="text-[11px] bg-amber-950/70 hover:bg-amber-950 text-amber-300 border border-amber-800/60 px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium transition-colors"
            >
              <Plus className="w-3 h-3" />
              確率事象
            </button>
            <button
              onClick={() => handleAddChild(editingNode.id, 'outcome')}
              className="text-[11px] bg-emerald-950/70 hover:bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium transition-colors"
            >
              <Plus className="w-3 h-3" />
              結末/損益
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
