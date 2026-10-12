import React, { useState, useEffect } from 'react';
import type { MorphicWidget, ThoughtPreset } from './types/morphic';
import {
  loadSavedWidgets,
  saveWidgets,
  loadSettings,
  saveSettings,
  getApiKey,
  type WorkspaceSettings,
} from './lib/storage';
import { synthesizeWidgetsFromPrompt, SHOWCASE_PRESETS } from './lib/synthesizer';
import { generateWidgetsWithGemini } from './lib/gemini';
import { soundEngine } from './lib/soundEngine';
import { Header } from './components/Header';
import { CortexCommand } from './components/CortexCommand';
import { SynapseBusViewer } from './components/SynapseBusViewer';
import { WidgetContainer } from './components/WidgetContainer';
import { SettingsModal } from './components/modals/SettingsModal';
import { SnapshotModal } from './components/modals/SnapshotModal';
import { AddWidgetModal } from './components/modals/AddWidgetModal';
import { HistoryDrawer, type HistoryEntry } from './components/modals/HistoryDrawer';
import { CortexWhisperBar } from './components/CortexWhisperBar';
import { analyzeWorkspaceState } from './lib/whisperEngine';
import { Eye, Layers, Plus, Sparkles, X } from 'lucide-react';

export const App: React.FC = () => {
  const [settings, setSettingsState] = useState<WorkspaceSettings>(loadSettings());
  const [widgets, setWidgets] = useState<MorphicWidget[]>(() => {
    const saved = loadSavedWidgets();
    return saved && saved.length > 0 ? saved : SHOWCASE_PRESETS[0].widgets;
  });

  const [zenWidget, setZenWidget] = useState<MorphicWidget | null>(null);

  const [busState, setBusState] = useState<Record<string, number | string>>({
    annual_profit: 6920000,
  });

  const [activeReasoning, setActiveReasoning] = useState<string>(
    '初期ワークスペース: 次世代AIスタートアップの価格弾力性シミュレーションとGTM実行パイプラインが稼働中。'
  );
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // History timeline
  const [history, setHistory] = useState<HistoryEntry[]>(() => [
    {
      id: 'init_hist',
      timestamp: Date.now(),
      prompt: '次世代AIスタートアップ成長戦略',
      reasoning: '初期ワークスペース: 価格弾力性シミュレーションとGTM実行パイプラインを展開。',
      widgetSnapshot: SHOWCASE_PRESETS[0].widgets,
    },
  ]);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Sync settings with SoundEngine
  useEffect(() => {
    soundEngine.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Persist widgets
  useEffect(() => {
    saveWidgets(widgets);
  }, [widgets]);

  const whispers = analyzeWorkspaceState(widgets);

  // Keyboard shortcut: Escape to close Zen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setZenWidget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Morphing Trigger
  const handleMorph = async (prompt: string) => {
    setIsSynthesizing(true);
    soundEngine.playMorph();

    const apiKey = getApiKey();
    let result: { widgets: MorphicWidget[]; reasoning: string } | null = null;

    if (apiKey) {
      result = await generateWidgetsWithGemini(prompt, apiKey, widgets);
    }

    if (!result) {
      // Local cognitive synthesizer
      result = synthesizeWidgetsFromPrompt(prompt, widgets);
    }

    // Keep pinned widgets, replace unpinned ones
    const pinnedWidgets = widgets.filter((w) => w.isPinned);
    const newWidgets = [...pinnedWidgets, ...result.widgets];

    setWidgets(newWidgets);
    setActiveReasoning(result.reasoning);
    setIsSynthesizing(false);

    // Record into history timeline
    setHistory((prev) => [
      {
        id: `hist_${Date.now()}`,
        timestamp: Date.now(),
        prompt,
        reasoning: result.reasoning,
        widgetSnapshot: newWidgets,
      },
      ...prev,
    ]);
  };

  const handleApplyPreset = (preset: ThoughtPreset) => {
    soundEngine.playMorph();
    const pinnedWidgets = widgets.filter((w) => w.isPinned);
    const newWidgets = [...pinnedWidgets, ...preset.widgets];
    setWidgets(newWidgets);
    setActiveReasoning(`プリセット「${preset.name}」をロードしました: ${preset.tagline}`);

    // Record into history timeline
    setHistory((prev) => [
      {
        id: `hist_${Date.now()}`,
        timestamp: Date.now(),
        prompt: preset.name,
        reasoning: preset.tagline,
        widgetSnapshot: newWidgets,
      },
      ...prev,
    ]);
  };

  const handleRestoreHistory = (entry: HistoryEntry) => {
    soundEngine.playMorph();
    setWidgets(entry.widgetSnapshot);
    setActiveReasoning(`タイムライン「${entry.prompt}」の状態を復元しました。`);
  };

  const handleUpdateWidget = (updated: MorphicWidget) => {
    setWidgets((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const handleEmitOutput = (key: string, value: number) => {
    setBusState((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetWorkspace = () => {
    soundEngine.playMorph();
    setWidgets(SHOWCASE_PRESETS[0].widgets);
    setActiveReasoning('ワークスペースを初期状態にリセットしました。');
  };

  const handleAddBlankNoteWidget = () => {
    soundEngine.playClick();
    const newWidget: MorphicWidget = {
      id: `note_${Date.now()}`,
      title: '新規 思考断片メモ',
      type: 'synapse_notes',
      category: 'User Scratchpad',
      description: '自由な記述用メモパッド',
      iconName: 'FileText',
      accentColor: 'indigo',
      size: 'normal',
      createdAt: Date.now(),
      data: {
        content: '',
      },
    };
    setWidgets((prev) => [newWidget, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Neural Ambient Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <Header
        widgetCount={widgets.length}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => {
          const nextVal = !settings.soundEnabled;
          const updated = { ...settings, soundEnabled: nextVal };
          setSettingsState(updated);
          saveSettings(updated);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSnapshot={() => setIsSnapshotOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onResetWorkspace={handleResetWorkspace}
      />

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Prompter Command Bar */}
        <CortexCommand
          onMorph={handleMorph}
          onApplyPreset={handleApplyPreset}
          isSynthesizing={isSynthesizing}
          activeReasoning={activeReasoning}
        />

        {/* Synapse State Bus Data Conduit */}
        <SynapseBusViewer busState={busState} />

        {/* Morphic Widget Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold text-slate-300">アクティブ変形キャンバス</span>
              <span className="text-slate-500 text-[11px]">
                ({widgets.filter((w) => w.isPinned).length} 個ピン留め保護中)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setIsAddWidgetOpen(true);
                }}
                className="flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 hover:bg-cyan-950 border border-cyan-800/60 px-2.5 py-1 rounded-lg transition-colors font-medium"
              >
                <Plus className="w-3 h-3 text-cyan-400" />
                モジュール追加
              </button>

              <button
                onClick={handleAddBlankNoteWidget}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 px-2.5 py-1 rounded-lg transition-colors font-medium"
              >
                <Plus className="w-3 h-3 text-indigo-400" />
                メモを追加
              </button>
            </div>
          </div>

          {/* Dynamic Grid Layout */}
          {widgets.length === 0 ? (
            <div className="py-20 text-center glass-panel rounded-2xl border border-slate-800/80 space-y-3">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto animate-pulse" />
              <h3 className="text-sm font-bold text-slate-200">現在稼働中のモジュールはありません</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                上部のコマンドバーに思考や目的を入力するか、プリセットを選択して新しい作業空間を自己生成させてください。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {widgets.map((widget) => (
                <WidgetContainer
                  key={widget.id}
                  widget={widget}
                  onUpdate={handleUpdateWidget}
                  onRemove={handleRemoveWidget}
                  onEmitOutput={handleEmitOutput}
                  onZenFocus={(w) => setZenWidget(w)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-800/60 py-4 px-6 text-center text-xs text-slate-400 font-mono">
        FCTX // Future Cortex Labs — Morphic Ambient Workspace © 2026
      </footer>

      {/* Ambient Cortex Whisper Bar */}
      <CortexWhisperBar whispers={whispers} onApplyAction={handleMorph} />

      {/* Zen Focus Mode Overlay */}
      {zenWidget && (
        <div className="fixed inset-0 z-50 bg-[#06080e]/95 backdrop-blur-2xl flex flex-col p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="max-w-5xl w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Eye className="w-5 h-5 text-cyan-400 animate-pulse" />
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold tracking-wider">[ZEN FOCUS MODE]</span>
                <h2 className="text-base font-bold text-slate-100">{zenWidget.title}</h2>
              </div>
            </div>

            <button
              onClick={() => {
                soundEngine.playClick();
                setZenWidget(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
              <span>没入を終了 (Esc)</span>
            </button>
          </div>

          <div className="max-w-5xl w-full mx-auto flex-1 py-6 overflow-y-auto">
            <WidgetContainer
              widget={zenWidget}
              onUpdate={(updated) => {
                handleUpdateWidget(updated);
                setZenWidget(updated);
              }}
              onRemove={(id) => {
                handleRemoveWidget(id);
                setZenWidget(null);
              }}
              onEmitOutput={handleEmitOutput}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(st) => {
          setSettingsState(st);
          saveSettings(st);
        }}
      />

      <SnapshotModal
        isOpen={isSnapshotOpen}
        onClose={() => setIsSnapshotOpen(false)}
        widgets={widgets}
        onImportWidgets={(w) => setWidgets(w)}
      />

      <AddWidgetModal
        isOpen={isAddWidgetOpen}
        onClose={() => setIsAddWidgetOpen(false)}
        onAddWidget={(w) => setWidgets((prev) => [w, ...prev])}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onRestore={handleRestoreHistory}
      />
    </div>
  );
};

export default App;
