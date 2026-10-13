import React, { useState } from 'react';
import type { MorphicWidget, WidgetType } from '../../types/morphic';
import { soundEngine } from '../../lib/soundEngine';
import {
  Activity,
  Compass,
  FileText,
  GitBranch,
  GitFork,
  Plus,
  Scale,
  Sliders,
  Sparkles,
  X,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (widget: MorphicWidget) => void;
}

export const AddWidgetModal: React.FC<Props> = ({ isOpen, onClose, onAddWidget }) => {
  const [selectedType, setSelectedType] = useState<WidgetType>('simulation');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Custom Tool');

  if (!isOpen) return null;

  const templates: {
    type: WidgetType;
    label: string;
    desc: string;
    icon: React.ReactNode;
    defaultTitle: string;
    defaultCategory: string;
  }[] = [
    {
      type: 'simulation',
      label: 'パラメータ試算シミュレーター',
      desc: 'スライダーと数式によるリアルタイム感度試算 & 投影曲線',
      icon: <Sliders className="w-4 h-4 text-indigo-400" />,
      defaultTitle: '動的シミュレーター',
      defaultCategory: 'Analysis',
    },
    {
      type: 'matrix',
      label: '2Dマトリクス / 評価レーダー',
      desc: '4象限の2軸平面に要素をドラッグ＆配置して優先度を可視化',
      icon: <Compass className="w-4 h-4 text-cyan-400" />,
      defaultTitle: '優先度評価マトリクス',
      defaultCategory: 'Strategy',
    },
    {
      type: 'pipeline',
      label: 'マイルストーン実行パイプライン',
      desc: 'フェーズ別チェックリストと進捗パーセンテージ追跡',
      icon: <GitBranch className="w-4 h-4 text-emerald-400" />,
      defaultTitle: '実行ロードマップ',
      defaultCategory: 'Execution',
    },
    {
      type: 'tradeoff',
      label: 'マルチクライテリア意思決定エンジン',
      desc: '重み付け配点とPros/Cons比較による客観スコアリング',
      icon: <Scale className="w-4 h-4 text-purple-400" />,
      defaultTitle: 'A/B 意思決定エンジン',
      defaultCategory: 'Decisions',
    },
    {
      type: 'synapse_notes',
      label: '生きた思考結晶ノート',
      desc: 'ハッシュタグ抽出とリアルタイム文字数カウント付きメモパッド',
      icon: <FileText className="w-4 h-4 text-amber-400" />,
      defaultTitle: 'シナプス思考ノート',
      defaultCategory: 'Notes',
    },
    {
      type: 'decision_tree',
      label: '因果ロジック意思決定ツリー',
      desc: '確率分岐と結果損益による期待値(EMV)・下振れリスク自動計算',
      icon: <GitFork className="w-4 h-4 text-cyan-300" />,
      defaultTitle: '戦略意思決定ツリー',
      defaultCategory: 'Causal Logic',
    },
    {
      type: 'ambient_audio',
      label: 'バイノーラル集中音響エンジン',
      desc: 'アルファ・シータ・ガンマ波を純ブラウザ合成する音響空間',
      icon: <Activity className="w-4 h-4 text-cyan-300" />,
      defaultTitle: '認知共鳴音響',
      defaultCategory: 'Focus',
    },
  ];

  const handleCreate = () => {
    soundEngine.playMorph();
    const finalTitle = title.trim() || templates.find((t) => t.type === selectedType)?.defaultTitle || 'カスタムツール';
    const finalCategory = category.trim() || templates.find((t) => t.type === selectedType)?.defaultCategory || 'Custom';

    let data: MorphicWidget['data'] = {};

    switch (selectedType) {
      case 'simulation':
        data = {
          variables: [
            { id: 'v1', name: 'v1', label: '主要パラメータ A', value: 100, min: 10, max: 500, step: 10, unit: 'pt' },
            { id: 'v2', name: 'v2', label: 'レバレッジ係数 B', value: 2.5, min: 1.0, max: 10.0, step: 0.5, unit: 'x' },
          ],
          formulas: [
            { id: 'f1', label: '予測アウトプット指標', unit: 'pt', calculate: 'v1 * v2' },
          ],
        };
        break;
      case 'matrix':
        data = {
          matrixAxes: {
            xLabel: '難易度 (低 → 高)',
            yLabel: '期待リターン (低 → 高)',
            quadrants: ['即効高価値', '戦略的大型施策', '現状維持', '要再検討'],
          },
          matrixItems: [
            { id: 'm1', label: '初期仮説施策', x: 30, y: 70 },
          ],
        };
        break;
      case 'pipeline':
        data = {
          stages: [
            {
              id: 'stg1',
              title: 'フェーズ 1: 着手',
              items: [{ id: 'i1', text: '初期検証アクション', done: false, priority: 'high' }],
            },
            {
              id: 'stg2',
              title: 'フェーズ 2: 完了',
              items: [{ id: 'i2', text: '成果の評価と振り返り', done: false, priority: 'med' }],
            },
          ],
        };
        break;
      case 'tradeoff':
        data = {
          criteria: [
            { id: 'c1', name: '実行スピード', weight: 4 },
            { id: 'c2', name: '期待成果', weight: 5 },
          ],
          options: [
            { id: 'o1', title: '案 A', pros: ['迅速'], cons: ['リソース要'], scores: { c1: 8, c2: 7 } },
            { id: 'o2', title: '案 B', pros: ['堅実'], cons: ['時間がかかる'], scores: { c1: 5, c2: 9 } },
          ],
        };
        break;
      case 'synapse_notes':
        data = {
          content: '### 新規思考メモ\n- ここに仮説や課題を自由に書き留めてください。\n- #アイデア #仮説',
        };
        break;
      case 'decision_tree':
        data = {
          rootNodeId: 'root',
          decisionNodes: [
            {
              id: 'root',
              title: '主要戦略選択',
              type: 'decision',
              cost: 0,
              childrenIds: ['branch_a', 'branch_b'],
            },
            {
              id: 'branch_a',
              title: 'アグレッシブ拡大策',
              type: 'decision',
              cost: 2000000,
              childrenIds: ['outcome_a1', 'outcome_a2'],
            },
            {
              id: 'outcome_a1',
              title: '市場浸透成功',
              type: 'outcome',
              probability: 0.65,
              payoff: 12000000,
            },
            {
              id: 'outcome_a2',
              title: '競合参入・縮小',
              type: 'outcome',
              probability: 0.35,
              payoff: -2000000,
            },
            {
              id: 'branch_b',
              title: '堅実オーガニック展開',
              type: 'decision',
              cost: 500000,
              childrenIds: ['outcome_b'],
            },
            {
              id: 'outcome_b',
              title: '安定成長',
              type: 'outcome',
              probability: 1.0,
              payoff: 4500000,
            },
          ],
        };
        break;
      case 'ambient_audio':
        data = {
          soundPreset: 'alpha',
          volume: 0.3,
        };
        break;
    }

    const newWidget: MorphicWidget = {
      id: `morphic_${Date.now()}`,
      title: finalTitle,
      type: selectedType,
      category: finalCategory,
      description: templates.find((t) => t.type === selectedType)?.desc || '',
      iconName: selectedType,
      accentColor: 'indigo',
      size: selectedType === 'simulation' || selectedType === 'tradeoff' || selectedType === 'decision_tree' ? 'wide' : 'normal',
      createdAt: Date.now(),
      data,
    };

    onAddWidget(newWidget);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          モジュールを手動追加
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          キャンバスに新しい対話型自己生成モジュールを追加します
        </p>

        {/* Template Selector Grid */}
        <div className="space-y-3 mb-5 max-h-72 overflow-y-auto pr-1">
          {templates.map((tpl) => (
            <div
              key={tpl.type}
              onClick={() => {
                soundEngine.playClick();
                setSelectedType(tpl.type);
                if (!title) setTitle(tpl.defaultTitle);
                if (!category) setCategory(tpl.defaultCategory);
              }}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                selectedType === tpl.type
                  ? 'bg-slate-800/90 border-indigo-500 ring-1 ring-indigo-500/40'
                  : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex-shrink-0">
                {tpl.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-200">{tpl.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{tpl.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Title & Category Input */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">モジュール名</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 価格シミュレーター"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">カテゴリ名</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="例: Finance"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 font-medium"
          >
            キャンセル
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            キャンバスに追加
          </button>
        </div>
      </div>
    </div>
  );
};
