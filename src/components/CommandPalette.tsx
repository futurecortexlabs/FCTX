import React, { useState, useEffect } from 'react';
import { soundEngine } from '../lib/soundEngine';
import { SHOWCASE_PRESETS } from '../lib/synthesizer';
import type { ThoughtPreset, WorkspaceViewMode } from '../types/morphic';
import {
  Brain,
  Download,
  GitCompare,
  History,
  Keyboard,
  LayoutGrid,
  Orbit,
  Plus,
  Presentation,
  Rocket,
  Search,
  Settings,
  Share2,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (preset: ThoughtPreset) => void;
  onOpenAddWidget: () => void;
  onToggleWiring: () => void;
  isWiringMode: boolean;
  onToggleViewMode: () => void;
  viewMode: WorkspaceViewMode;
  onOpenSnapshot: () => void;
  onOpenHistory: () => void;
  onOpenPresentationDeck: () => void;
  onOpenScenarioComparator?: () => void;
  onOpenSettings: () => void;
  onOpenCopilot?: () => void;
  onOpenShortcutsHelp?: () => void;
  onToggleSound: () => void;
  soundEnabled: boolean;
}

export const CommandPalette: React.FC<Props> = ({
  isOpen,
  onClose,
  onApplyPreset,
  onOpenAddWidget,
  onToggleWiring,
  isWiringMode,
  onToggleViewMode,
  viewMode,
  onOpenSnapshot,
  onOpenHistory,
  onOpenPresentationDeck,
  onOpenScenarioComparator,
  onOpenSettings,
  onOpenCopilot,
  onOpenShortcutsHelp,
  onToggleSound,
  soundEnabled,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const actions = [
    {
      id: 'add_widget',
      title: 'モジュールを手動追加',
      category: 'モジュール',
      icon: <Plus className="w-4 h-4 text-cyan-400" />,
      run: () => onOpenAddWidget(),
    },
    {
      id: 'toggle_wiring',
      title: isWiringMode ? 'シナプス配線モードを終了' : 'シナプス配線モードを開始',
      category: 'シナプス',
      icon: <Share2 className="w-4 h-4 text-indigo-400" />,
      run: () => onToggleWiring(),
    },
    {
      id: 'toggle_view',
      title: viewMode === 'canvas' ? 'グリッド表示に切り替え' : '空間キャンバス表示に切り替え',
      category: '表示レイアウト',
      icon: viewMode === 'canvas' ? <LayoutGrid className="w-4 h-4 text-purple-400" /> : <Orbit className="w-4 h-4 text-purple-400" />,
      run: () => onToggleViewMode(),
    },
    {
      id: 'history',
      title: '思考変形タイムラインを開く',
      category: '履歴',
      icon: <History className="w-4 h-4 text-amber-400" />,
      run: () => onOpenHistory(),
    },
    {
      id: 'presentation_deck',
      title: '生きた対話型プレゼンテーションモード (全画面スライド)',
      category: 'プレゼンテーション',
      icon: <Presentation className="w-4 h-4 text-indigo-400" />,
      run: () => onOpenPresentationDeck(),
    },
    ...(onOpenScenarioComparator
      ? [
          {
            id: 'scenario_comparator',
            title: '多元並行世界シナリオ比較 (Multiverse Comparator)',
            category: '意思決定・分析',
            icon: <GitCompare className="w-4 h-4 text-cyan-400" />,
            run: () => onOpenScenarioComparator(),
          },
        ]
      : []),
    ...(onOpenCopilot
      ? [
          {
            id: 'cortex_copilot',
            title: 'Cortex Copilot AI (全体診断・対話コンサルタント)',
            category: 'AI診断',
            icon: <Brain className="w-4 h-4 text-cyan-400" />,
            run: () => onOpenCopilot(),
          },
        ]
      : []),
    ...(onOpenShortcutsHelp
      ? [
          {
            id: 'shortcuts_help',
            title: 'キーボードショートカット一覧を表示 (?)',
            category: 'ヘルプ',
            icon: <Keyboard className="w-4 h-4 text-amber-400" />,
            run: () => onOpenShortcutsHelp(),
          },
        ]
      : []),
    {
      id: 'export',
      title: 'ワークスペースの保存 & Markdownレポート出力',
      category: 'データ出力',
      icon: <Download className="w-4 h-4 text-emerald-400" />,
      run: () => onOpenSnapshot(),
    },
    {
      id: 'sound',
      title: soundEnabled ? '効果音をミュート' : '効果音を有効化',
      category: '感覚設定',
      icon: soundEnabled ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />,
      run: () => onToggleSound(),
    },
    {
      id: 'settings',
      title: '環境設定 (Gemini APIキー・感覚設定)',
      category: '設定',
      icon: <Settings className="w-4 h-4 text-slate-400" />,
      run: () => onOpenSettings(),
    },
    // Presets
    ...SHOWCASE_PRESETS.map((p) => ({
      id: `preset_${p.id}`,
      title: `プリセット: ${p.name}`,
      category: 'プリセット',
      icon: <Rocket className="w-4 h-4 text-indigo-400" />,
      run: () => onApplyPreset(p),
    })),
  ];

  const filtered = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        soundEngine.playClick();
        filtered[selectedIndex].run();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Input Bar */}
        <div className="p-3.5 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="コマンドまたはアクションを検索... (↑↓ で選択, Enter で実行)"
            autoFocus
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
            Esc
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">一致するコマンドはありません</div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    soundEngine.playClick();
                    item.run();
                    onClose();
                  }}
                  className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-indigo-600/30 text-white border border-indigo-500/40'
                      : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{item.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.category}</div>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-[10px] font-mono text-indigo-300 mr-2 font-bold">↵ 実行</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
