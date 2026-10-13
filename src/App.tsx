import React, { useState, useEffect } from 'react';
import type { MorphicWidget, SynapseLink, ThoughtPreset, WorkspaceViewMode } from './types/morphic';
import {
  loadSavedWidgets,
  saveWidgets,
  loadSavedSynapses,
  saveSynapses,
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
import { SpatialCanvas } from './components/SpatialCanvas';
import { SynapseCableOverlay } from './components/SynapseCableOverlay';
import { CommandPalette } from './components/CommandPalette';
import { SettingsModal } from './components/modals/SettingsModal';
import { SnapshotModal } from './components/modals/SnapshotModal';
import { AddWidgetModal } from './components/modals/AddWidgetModal';
import { HistoryDrawer, type HistoryEntry } from './components/modals/HistoryDrawer';
import { PresentationDeckModal } from './components/modals/PresentationDeckModal';
import { CortexWhisperBar } from './components/CortexWhisperBar';
import { CortexCopilotDrawer } from './components/CortexCopilotDrawer';
import { ShortcutsHelpModal } from './components/modals/ShortcutsHelpModal';
import { analyzeWorkspaceState } from './lib/whisperEngine';
import { autoGenerateSynapses, propagateSynapseValues } from './lib/synapseManager';
import { Eye, Layers, Plus, Sparkles, X } from 'lucide-react';

export const App: React.FC = () => {
  const [settings, setSettingsState] = useState<WorkspaceSettings>(loadSettings());
  const [widgets, setWidgets] = useState<MorphicWidget[]>(() => {
    const saved = loadSavedWidgets();
    return saved && saved.length > 0 ? saved : SHOWCASE_PRESETS[0].widgets;
  });

  const [synapses, setSynapses] = useState<SynapseLink[]>(() => {
    const saved = loadSavedSynapses();
    if (saved && saved.length > 0) return saved;
    // Default initial synapse link: simulation profit -> bus
    return [];
  });

  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('grid');
  const [isWiringMode, setIsWiringMode] = useState(false);
  const [activePort, setActivePort] = useState<{ widgetId: string; key: string; direction: 'in' | 'out' } | null>(
    null
  );

  const [zenWidget, setZenWidget] = useState<MorphicWidget | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

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
  const [isPresentationDeckOpen, setIsPresentationDeckOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);

  // Sync settings with SoundEngine
  useEffect(() => {
    soundEngine.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Persist widgets & synapses
  useEffect(() => {
    saveWidgets(widgets);
  }, [widgets]);

  useEffect(() => {
    saveSynapses(synapses);
  }, [synapses]);

  const whispers = analyzeWorkspaceState(widgets);

  // Reactive Synapse Propagation
  useEffect(() => {
    if (synapses.length > 0) {
      const { updatedWidgets, hasChanges } = propagateSynapseValues(widgets, synapses, busState);
      if (hasChanges) {
        soundEngine.playSynapsePulse();
        setWidgets(updatedWidgets);
      }
    }
  }, [busState, synapses]);

  // Keyboard shortcuts: Cmd+K / Ctrl+K, Escape, ?, W, G
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInputActive = activeTag === 'input' || activeTag === 'textarea';

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        soundEngine.playClick();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (zenWidget) {
          setZenWidget(null);
        } else if (isPresentationDeckOpen) {
          setIsPresentationDeckOpen(false);
        } else if (isCopilotOpen) {
          setIsCopilotOpen(false);
        } else if (isShortcutsHelpOpen) {
          setIsShortcutsHelpOpen(false);
        } else if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
        } else if (isWiringMode) {
          setIsWiringMode(false);
          setActivePort(null);
        }
      } else if (!isInputActive) {
        if (e.key === '?') {
          e.preventDefault();
          soundEngine.playClick();
          setIsShortcutsHelpOpen((prev) => !prev);
        } else if (e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          soundEngine.playMorph();
          setIsWiringMode((prev) => !prev);
          setActivePort(null);
        } else if (e.key === 'g' || e.key === 'G') {
          e.preventDefault();
          soundEngine.playClick();
          setViewMode((prev) => (prev === 'grid' ? 'canvas' : 'grid'));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zenWidget, isPresentationDeckOpen, isCommandPaletteOpen, isWiringMode, isCopilotOpen, isShortcutsHelpOpen]);

  // Handle Synapse Port Connection
  const handleSelectPort = (port: { widgetId: string; key: string; direction: 'in' | 'out' } | null) => {
    if (!port) {
      setActivePort(null);
      return;
    }

    if (!activePort) {
      setActivePort(port);
      return;
    }

    // If clicking same port, deselect
    if (activePort.widgetId === port.widgetId && activePort.key === port.key) {
      setActivePort(null);
      return;
    }

    // Connect if directions are opposite and from different widgets
    if (activePort.direction !== port.direction && activePort.widgetId !== port.widgetId) {
      soundEngine.playMorph();
      const sourcePort = activePort.direction === 'out' ? activePort : port;
      const targetPort = activePort.direction === 'in' ? activePort : port;

      const newLink: SynapseLink = {
        id: `syn_${Date.now()}`,
        sourceWidgetId: sourcePort.widgetId,
        sourceKey: sourcePort.key,
        targetWidgetId: targetPort.widgetId,
        targetKey: targetPort.key,
      };

      setSynapses((prev) => [...prev, newLink]);
      setActivePort(null);
    } else {
      // Switch active port
      setActivePort(port);
    }
  };

  const handleRemoveSynapse = (linkId: string) => {
    soundEngine.playClick();
    setSynapses((prev) => prev.filter((s) => s.id !== linkId));
  };

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
    // Remove links connected to this widget
    setSynapses((prev) => prev.filter((s) => s.sourceWidgetId !== id && s.targetWidgetId !== id));
  };

  const handleDuplicateWidget = (widget: MorphicWidget) => {
    soundEngine.playMorph();
    const cloned: MorphicWidget = {
      ...JSON.parse(JSON.stringify(widget)),
      id: `${widget.type}_${Date.now()}`,
      title: `${widget.title} (複製)`,
      createdAt: Date.now(),
      position: widget.position
        ? { x: widget.position.x + 30, y: widget.position.y + 30 }
        : undefined,
    };
    setWidgets((prev) => [cloned, ...prev]);
    setActiveReasoning(`モジュール「${widget.title}」を複製しました。`);
  };

  const handleAutoWireSynapses = () => {
    soundEngine.playMorph();
    const generated = autoGenerateSynapses(widgets);
    if (generated.length === 0) {
      setActiveReasoning('現在のモジュール構成から適合する直結シナプスを検出できませんでした。');
      return;
    }
    setSynapses((prev) => {
      const existingKeys = new Set(
        prev.map((s) => `${s.sourceWidgetId}:${s.sourceKey}->${s.targetWidgetId}:${s.targetKey}`)
      );
      const newLinks = generated.filter(
        (g) => !existingKeys.has(`${g.sourceWidgetId}:${g.sourceKey}->${g.targetWidgetId}:${g.targetKey}`)
      );
      return [...prev, ...newLinks];
    });
    setActiveReasoning(`🧠 シナプス自動接続: ${generated.length} 本のリアクティブ・データパイプを確立しました。`);
  };

  const handleClearSynapses = () => {
    soundEngine.playClick();
    setSynapses([]);
    setActiveReasoning('すべてのシナプス配線を解除しました。');
  };

  const handleInjectSignal = (key: string, value: number) => {
    setBusState((prev) => ({ ...prev, [key]: value }));
  };

  const handleEmitOutput = (key: string, value: number) => {
    setBusState((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetWorkspace = () => {
    soundEngine.playMorph();
    setWidgets(SHOWCASE_PRESETS[0].widgets);
    setSynapses([]);
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

  const handleUpdateSynapse = (updated: SynapseLink) => {
    setSynapses((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const getThemeBackground = () => {
    switch (settings.theme) {
      case 'matrix':
        return (
          <>
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-1/3 -right-40 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-lime-600/10 rounded-full blur-3xl" />
          </>
        );
      case 'solaris':
        return (
          <>
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-1/3 -right-40 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl" />
          </>
        );
      case 'cyberpunk':
        return (
          <>
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-1/3 -right-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl" />
          </>
        );
      default:
        return (
          <>
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-x-hidden">
      {/* Background Neural Ambient Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {getThemeBackground()}
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
        onOpenPresentationDeck={() => setIsPresentationDeckOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenShortcutsHelp={() => setIsShortcutsHelpOpen(true)}
        onResetWorkspace={handleResetWorkspace}
        isWiringMode={isWiringMode}
        onToggleWiring={() => {
          setIsWiringMode((prev) => !prev);
          setActivePort(null);
        }}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode((prev) => (prev === 'grid' ? 'canvas' : 'grid'))}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 relative">
        {/* Prompter Command Bar */}
        <CortexCommand
          onMorph={handleMorph}
          onApplyPreset={handleApplyPreset}
          isSynthesizing={isSynthesizing}
          activeReasoning={activeReasoning}
        />

        {/* Synapse State Bus Data Conduit */}
        <SynapseBusViewer
          busState={busState}
          synapseCount={synapses.length}
          onAutoWire={handleAutoWireSynapses}
          onClearSynapses={handleClearSynapses}
          onInjectSignal={handleInjectSignal}
        />

        {/* Morphic Workspace Viewport */}
        <div className="space-y-4 relative">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold text-slate-300">
                {viewMode === 'canvas' ? '空間キャンバス・ビュー' : 'アクティブ変形キャンバス (グリッド)'}
              </span>
              <span className="text-slate-500 text-[11px]">
                ({widgets.filter((w) => w.isPinned).length} 個ピン留め保護中
                {synapses.length > 0 && ` / ${synapses.length} 本のシナプス直結`})
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

          {/* Wiring Instructions Banner if active */}
          {isWiringMode && (
            <div className="bg-gradient-to-r from-indigo-950/90 to-cyan-950/90 border border-cyan-500/50 rounded-xl p-3 flex items-center justify-between text-xs text-cyan-200 animate-in fade-in shadow-xl">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>
                  <b>【シナプス配線モード】</b> 各ウィジェットの「▲ OUT」と別のウィジェットの「▼ IN」をクリックしてデータ直結してください。
                  {activePort && (
                    <span className="ml-2 font-mono text-amber-300 font-bold">
                      [選択中: {activePort.direction.toUpperCase()} - {activePort.key}]
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={() => {
                  setIsWiringMode(false);
                  setActivePort(null);
                }}
                className="text-[11px] font-mono bg-cyan-900/60 hover:bg-cyan-800 px-2.5 py-1 rounded text-white"
              >
                完了
              </button>
            </div>
          )}

          {/* Dynamic Grid vs Spatial Canvas View */}
          {widgets.length === 0 ? (
            <div className="py-20 text-center glass-panel rounded-2xl border border-slate-800/80 space-y-3">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto animate-pulse" />
              <h3 className="text-sm font-bold text-slate-200">現在稼働中のモジュールはありません</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                上部のコマンドバーに思考や目的を入力するか、プリセットを選択して新しい作業空間を自己生成させてください。
              </p>
            </div>
          ) : viewMode === 'canvas' ? (
            <div className="relative">
              <SpatialCanvas
                widgets={widgets}
                onUpdateWidget={handleUpdateWidget}
                onRemoveWidget={handleRemoveWidget}
                onDuplicateWidget={handleDuplicateWidget}
                onEmitOutput={handleEmitOutput}
                onZenFocus={(w) => setZenWidget(w)}
                isWiringMode={isWiringMode}
                activePort={activePort}
                onSelectPort={handleSelectPort}
              />
              <SynapseCableOverlay
                widgets={widgets}
                synapses={synapses}
                onAddSynapse={(link) => setSynapses((prev) => [...prev, link])}
                onRemoveSynapse={handleRemoveSynapse}
                onUpdateSynapse={handleUpdateSynapse}
                isWiringMode={isWiringMode}
                activePort={activePort}
                onSelectPort={handleSelectPort}
              />
            </div>
          ) : (
            <div className="relative">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 relative z-10">
                {widgets.map((widget) => (
                  <WidgetContainer
                    key={widget.id}
                    widget={widget}
                    onUpdate={handleUpdateWidget}
                    onRemove={handleRemoveWidget}
                    onDuplicate={handleDuplicateWidget}
                    onEmitOutput={handleEmitOutput}
                    onZenFocus={(w) => setZenWidget(w)}
                    isWiringMode={isWiringMode}
                    activePort={activePort}
                    onSelectPort={handleSelectPort}
                  />
                ))}
              </div>
              <SynapseCableOverlay
                widgets={widgets}
                synapses={synapses}
                onAddSynapse={(link) => setSynapses((prev) => [...prev, link])}
                onRemoveSynapse={handleRemoveSynapse}
                onUpdateSynapse={handleUpdateSynapse}
                isWiringMode={isWiringMode}
                activePort={activePort}
                onSelectPort={handleSelectPort}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-800/60 py-4 px-6 text-center text-xs text-slate-400 font-mono flex items-center justify-between max-w-7xl mx-auto w-full">
        <span>FCTX // Future Cortex Labs — Morphic Ambient Workspace © 2026</span>
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="text-[11px] text-slate-400 hover:text-indigo-300 font-mono flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 transition-colors"
        >
          <span>Cmd+K / Ctrl+K</span>
          <span className="text-slate-400">コマンドパレット</span>
        </button>
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
              onDuplicate={handleDuplicateWidget}
              onEmitOutput={handleEmitOutput}
            />
          </div>
        </div>
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onApplyPreset={handleApplyPreset}
        onOpenAddWidget={() => setIsAddWidgetOpen(true)}
        onToggleWiring={() => setIsWiringMode((prev) => !prev)}
        isWiringMode={isWiringMode}
        onToggleViewMode={() => setViewMode((prev) => (prev === 'grid' ? 'canvas' : 'grid'))}
        viewMode={viewMode}
        onOpenSnapshot={() => setIsSnapshotOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPresentationDeck={() => setIsPresentationDeckOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenShortcutsHelp={() => setIsShortcutsHelpOpen(true)}
        onToggleSound={() => {
          const nextVal = !settings.soundEnabled;
          const updated = { ...settings, soundEnabled: nextVal };
          setSettingsState(updated);
          saveSettings(updated);
        }}
        soundEnabled={settings.soundEnabled}
      />

      {/* Presentation Deck Modal */}
      <PresentationDeckModal
        isOpen={isPresentationDeckOpen}
        onClose={() => setIsPresentationDeckOpen(false)}
        widgets={widgets}
        onUpdateWidget={handleUpdateWidget}
        onRemoveWidget={handleRemoveWidget}
        onEmitOutput={handleEmitOutput}
        presets={SHOWCASE_PRESETS}
        onApplyPreset={handleApplyPreset}
      />

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

      {/* Cortex Copilot AI Drawer */}
      <CortexCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        widgets={widgets}
        synapses={synapses}
        busState={busState}
        onApplyMorph={handleMorph}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <ShortcutsHelpModal
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />
    </div>
  );
};

export default App;
