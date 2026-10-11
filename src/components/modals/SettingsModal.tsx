import React, { useState } from 'react';
import type { WorkspaceSettings } from '../../lib/storage';
import { getApiKey, setApiKey } from '../../lib/storage';
import { soundEngine } from '../../lib/soundEngine';
import { Key, Save, Sparkles, Volume2, X } from 'lucide-react';

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
  const [apiKey, setKey] = useState(getApiKey());
  const [localSettings, setLocalSettings] = useState(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    soundEngine.playClick();
    setApiKey(apiKey.trim());
    onSaveSettings(localSettings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
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
          FCTX 環境設定
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          思考共生エンジンとアンビエント音響のパーソナライズ
        </p>

        <div className="space-y-5">
          {/* Gemini API Key */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 mb-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Google Gemini API キー (任意)
            </label>
            <p className="text-[11px] text-slate-400 mb-3">
              APIキーを設定すると、オフライン推論に加えGeminiモデルによる自由度の高い動的ウィジェット自動生成が稼働します。キーはブラウザローカルにのみ保存されます。
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
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
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 font-medium"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {savedSuccess ? '保存完了' : '設定を適用'}
          </button>
        </div>
      </div>
    </div>
  );
};
