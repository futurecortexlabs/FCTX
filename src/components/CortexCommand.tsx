import React, { useState } from 'react';
import { soundEngine } from '../lib/soundEngine';
import { SHOWCASE_PRESETS } from '../lib/synthesizer';
import type { ThoughtPreset } from '../types/morphic';
import {
  Bot,
  Brain,
  Compass,
  Flame,
  GitBranch,
  GitFork,
  Lightbulb,
  Loader2,
  Mic,
  MicOff,
  Rocket,
  Scale,
  ShieldAlert,
  Sparkles,
  Wand2,
} from 'lucide-react';

interface Props {
  onMorph: (prompt: string) => void;
  onApplyPreset: (preset: ThoughtPreset) => void;
  isSynthesizing: boolean;
  activeReasoning?: string;
}

export const CortexCommand: React.FC<Props> = ({
  onMorph,
  onApplyPreset,
  isSynthesizing,
  activeReasoning,
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('お使いのブラウザはWeb Speech API音声入力に対応していません。(Chrome/Edge等でご利用いただけます)');
      return;
    }

    soundEngine.playClick();
    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          soundEngine.playMorph();
          onMorph(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSynthesizing) return;
    soundEngine.playMorph();
    onMorph(input.trim());
  };

  const handlePresetClick = (preset: ThoughtPreset) => {
    soundEngine.playMorph();
    setInput(preset.prompt);
    onApplyPreset(preset);
  };

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'Rocket':
        return <Rocket className="w-3.5 h-3.5 text-indigo-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
      case 'Brain':
        return <Brain className="w-3.5 h-3.5 text-purple-400" />;
      case 'GitBranch':
        return <GitBranch className="w-3.5 h-3.5 text-cyan-400" />;
      case 'GitFork':
        return <GitFork className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Scale':
        return <Scale className="w-3.5 h-3.5 text-amber-400" />;
      case 'Compass':
        return <Compass className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Flame className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Prompter Form */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-70 group-hover:opacity-100 transition duration-500 pointer-events-none" />

        <div className="relative flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 sm:p-2 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-2 pl-3 text-indigo-400">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="思考の断片や目的を入力してください... (例: 「新規SaaSの価格弾力性と獲得チャネル」「サイバーインシデント対策」)"
            className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2 rounded-lg transition-colors mr-1 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/50'
                : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60'
            }`}
            title={isListening ? '音声認識中... (クリックで停止)' : '音声で思考を入力 (Web Speech API)'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            type="submit"
            disabled={!input.trim() || isSynthesizing}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-medium text-xs px-4 py-2.5 rounded-lg shadow-lg shadow-indigo-950/40 transition-all font-mono"
          >
            {isSynthesizing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>自己変形中...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>変形 (Morph)</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Preset Inspirations */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mr-1">
          <Lightbulb className="w-3 h-3 text-amber-400" />
          即時プリセット:
        </span>
        {SHOWCASE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset)}
            className="flex items-center gap-1.5 text-xs bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg transition-all"
          >
            {getPresetIcon(preset.icon)}
            <span>{preset.name}</span>
          </button>
        ))}
      </div>

      {/* Active Cortex Reasoning Feedback */}
      {activeReasoning && (
        <div className="flex items-start gap-2 bg-indigo-950/30 border border-indigo-900/40 rounded-xl px-3.5 py-2.5 text-xs text-indigo-200">
          <Bot className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold text-indigo-300 font-mono text-[11px] mr-1.5">
              [CORTEX SYNTHESIS REASONING]
            </span>
            <span>{activeReasoning}</span>
          </div>
        </div>
      )}
    </div>
  );
};
