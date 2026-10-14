import React, { useState, useEffect } from 'react';
import type { WorkspaceSettings, AiConfig } from '../../lib/storage';
import { getAiConfig, saveAiConfig } from '../../lib/storage';
import { fetchOllamaModels } from '../../lib/ollama';
import { soundEngine } from '../../lib/soundEngine';
import {
  Brain,
  Check,
  HelpCircle,
  Key,
  Palette,
  RefreshCw,
  Save,
  Server,
  Sparkles,
  Volume2,
  X,
  Zap,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: WorkspaceSettings;
  onSaveSettings: (settings: WorkspaceSettings) => void;
}

export const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [aiConfig, setAiConfigState] = useState<AiConfig>(getAiConfig());
  const [localSettings, setLocalSettings] = useState(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Ollama model detection state
  const [isDetectingOllama, setIsDetectingOllama] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [detectedModels, setDetectedModels] = useState<string[]>([
    'qwen2.5:7b',
    'qwen2.5:14b',
    'qwen3.5:9b',
    'gemma4:12b',
  ]);
  const [isCustomModel, setIsCustomModel] = useState(false);

  // Auto-detect Ollama models on modal open
  useEffect(() => {
    if (!isOpen) return;
    setAiConfigState(getAiConfig());
    setLocalSettings(settings);

    // Ping Ollama in background to see if active
    fetchOllamaModels(aiConfig.ollamaEndpoint).then((res) => {
      if (res.ok && res.models.length > 0) {
        setDetectedModels(res.models);
        setOllamaStatus({ ok: true, msg: `${res.models.length} 個のローカルモデルを検出` });
        if (!res.models.includes(aiConfig.ollamaModel)) {
          // Keep current if valid or fallback
        }
      } else {
        setOllamaStatus({ ok: false, msg: res.error || '未接続' });
      }
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDetectOllama = async () => {
    soundEngine.playClick();
    setIsDetectingOllama(true);
    const res = await fetchOllamaModels(aiConfig.ollamaEndpoint);
    setIsDetectingOllama(false);

    if (res.ok && res.models.length > 0) {
      soundEngine.playSynapsePulse();
      setDetectedModels(res.models);
      setOllamaStatus({ ok: true, msg: `${res.models.length} 個のローカルモデルを検出` });
      if (!res.models.includes(aiConfig.ollamaModel)) {
        setAiConfigState((prev) => ({ ...prev, ollamaModel: res.models[0] }));
      }
    } else {
      setOllamaStatus({ ok: false, msg: res.error || 'Ollama に接続できませんでした' });
    }
  };

  const handleSave = () => {
    soundEngine.playClick();
    saveAiConfig(aiConfig);
    onSaveSettings(localSettings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative ring-1 ring-white/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          FCTX 環境設定 & AI推論エンジン
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          ローカルLLM(Ollama)、クラウドGemini、または内蔵超高速ヒューリスティックの選択
        </p>

        <div className="space-y-5">
          {/* AI Engine Provider Selector */}
          <div className="bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 font-mono">
                <Brain className="w-4 h-4 text-cyan-400" />
                AI 推論プロバイダー (Cognitive Engine)
              </span>
              <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/60">
                {aiConfig.provider === 'ollama'
                  ? '🦙 Ollama ローカル'
                  : aiConfig.provider === 'gemini'
                  ? '☁️ Gemini クラウド'
                  : '⚡ 内蔵0ms自律'}
              </span>
            </div>

            {/* Provider Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setAiConfigState({ ...aiConfig, provider: 'ollama' });
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  aiConfig.provider === 'ollama'
                    ? 'bg-slate-800/90 border-cyan-500 ring-1 ring-cyan-500/50 text-cyan-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1">
                  <span>🦙</span>
                  <span>Ollama</span>
                </div>
                <div className="text-[10px] opacity-75 mt-0.5 leading-snug">ローカルLLM</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setAiConfigState({ ...aiConfig, provider: 'gemini' });
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  aiConfig.provider === 'gemini'
                    ? 'bg-slate-800/90 border-indigo-500 ring-1 ring-indigo-500/50 text-indigo-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1">
                  <span>☁️</span>
                  <span>Gemini</span>
                </div>
                <div className="text-[10px] opacity-75 mt-0.5 leading-snug">クラウドLLM</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setAiConfigState({ ...aiConfig, provider: 'local_heuristic' });
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  aiConfig.provider === 'local_heuristic'
                    ? 'bg-slate-800/90 border-amber-500 ring-1 ring-amber-500/50 text-amber-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1">
                  <span>⚡</span>
                  <span>内蔵自律</span>
                </div>
                <div className="text-[10px] opacity-75 mt-0.5 leading-snug">API不要 (0ms)</div>
              </button>
            </div>

            {/* Provider Details: 1. Ollama Configuration */}
            {aiConfig.provider === 'ollama' && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-200 flex items-center gap-1">
                    <Server className="w-3.5 h-3.5 text-cyan-400" />
                    Ollama ホストエンドポイント
                  </label>
                  {ollamaStatus && (
                    <span
                      className={`text-[10px] font-mono flex items-center gap-1 ${
                        ollamaStatus.ok ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          ollamaStatus.ok ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                      />
                      {ollamaStatus.msg}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={aiConfig.ollamaEndpoint}
                    onChange={(e) =>
                      setAiConfigState({ ...aiConfig, ollamaEndpoint: e.target.value })
                    }
                    placeholder="http://localhost:11434"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleDetectOllama}
                    disabled={isDetectingOllama}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-cyan-300 rounded-xl transition-all disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isDetectingOllama ? 'animate-spin' : ''}`} />
                    <span>検出</span>
                  </button>
                </div>

                {/* Model Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-slate-300 font-medium">使用モデル</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomModel((p) => !p)}
                      className="text-[11px] text-cyan-400 hover:underline font-mono"
                    >
                      {isCustomModel ? 'リストから選ぶ' : '手動入力に変更'}
                    </button>
                  </div>

                  {isCustomModel ? (
                    <input
                      type="text"
                      value={aiConfig.ollamaModel}
                      onChange={(e) =>
                        setAiConfigState({ ...aiConfig, ollamaModel: e.target.value })
                      }
                      placeholder="例: qwen2.5:7b, deepseek-r1, llama3.2"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  ) : (
                    <select
                      value={aiConfig.ollamaModel}
                      onChange={(e) =>
                        setAiConfigState({ ...aiConfig, ollamaModel: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base sm:text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                    >
                      {detectedModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Helpful CORS Note */}
                <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-900/50 text-[11px] text-slate-400 space-y-1">
                  <div className="font-semibold text-cyan-300 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" />
                    Ollamaのブラウザ接続（CORS）について
                  </div>
                  <p className="leading-relaxed">
                    ブラウザから Ollama へのアクセスを許可するため、環境変数 <code className="text-cyan-200 font-mono bg-slate-900 px-1 py-0.5 rounded">OLLAMA_ORIGINS="*"</code> を設定して起動してください。
                  </p>
                  <div className="bg-slate-950 p-2 rounded-lg font-mono text-[10px] text-slate-300 select-all border border-slate-800">
                    set OLLAMA_ORIGINS=* & ollama serve
                  </div>
                </div>
              </div>
            )}

            {/* Provider Details: 2. Gemini Configuration */}
            {aiConfig.provider === 'gemini' && (
              <div className="space-y-2 pt-2 border-t border-slate-800/80 animate-in fade-in duration-150">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Google Gemini API キー
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  Google AI Studio (aistudio.google.com) で無料取得した API キーを入力してください。キーはブラウザのローカルストレージにのみ保存されます。
                </p>
                <input
                  type="password"
                  value={aiConfig.geminiApiKey}
                  onChange={(e) =>
                    setAiConfigState({ ...aiConfig, geminiApiKey: e.target.value })
                  }
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base sm:text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            )}

            {/* Provider Details: 3. Local Heuristic */}
            {aiConfig.provider === 'local_heuristic' && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs text-slate-300 space-y-1 animate-in fade-in duration-150">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  内蔵自律認知エンジン (ゼロレイテンシ)
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  外部サーバーやLLM通信を行わず、自然言語の文脈判定と数理アルゴリズムのみで 0 ミリ秒即座に変形します。オフラインや電波の届かない環境でも完全動作します。
                </p>
              </div>
            )}
          </div>

          {/* Sound & Sensory */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              感覚フィードバック & 音響
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">インタラクション効果音</span>
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({ ...localSettings, soundEnabled: !localSettings.soundEnabled })
                }
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  localSettings.soundEnabled ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {localSettings.soundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">シナプス発光エフェクト</span>
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({ ...localSettings, synapticGlow: !localSettings.synapticGlow })
                }
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  localSettings.synapticGlow ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {localSettings.synapticGlow ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Cybernetic Ambient Theme */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              アンビエント・サイバネティックテーマ
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'void', label: 'Deep Void', desc: 'インディゴ & シアン', border: 'border-indigo-500/50 text-indigo-300' },
                { id: 'matrix', label: 'Cyber Matrix', desc: 'ネオンエメラルド', border: 'border-emerald-500/50 text-emerald-300' },
                { id: 'solaris', label: 'Solaris Horizon', desc: '温熱アンバー & ゴールド', border: 'border-amber-500/50 text-amber-300' },
                { id: 'cyberpunk', label: 'Vapor Retrowave', desc: 'マゼンタ & バイオレット', border: 'border-fuchsia-500/50 text-fuchsia-300' },
              ].map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, theme: th.id as any })}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    (localSettings.theme || 'void') === th.id
                      ? `bg-slate-900 ${th.border} ring-1 ring-current font-bold`
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-semibold">{th.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{th.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 font-medium"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-lg shadow-indigo-950/50"
          >
            {savedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savedSuccess ? '保存完了' : '設定を適用'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
