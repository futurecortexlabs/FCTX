import React, { useState, useEffect } from 'react';
import type { MorphicWidget } from '../../types/morphic';
import { soundEngine } from '../../lib/soundEngine';
import { Headphones, Pause, Play, Volume2 } from 'lucide-react';

interface Props {
  widget: MorphicWidget;
  onUpdate: (updated: MorphicWidget) => void;
}

export const AmbientAudioWidget: React.FC<Props> = ({ widget, onUpdate }) => {
  const currentPreset = widget.data.soundPreset || 'alpha';
  const currentVolume = widget.data.volume ?? 0.3;

  const [isPlaying, setIsPlaying] = useState(soundEngine.getIsAmbientPlaying());

  useEffect(() => {
    setIsPlaying(soundEngine.getIsAmbientPlaying());
  }, []);

  const handleTogglePlay = () => {
    soundEngine.playClick();
    if (isPlaying) {
      soundEngine.stopAmbient();
      setIsPlaying(false);
    } else {
      soundEngine.startAmbient(currentPreset, currentVolume);
      setIsPlaying(true);
    }
  };

  const handlePresetChange = (preset: 'alpha' | 'theta' | 'gamma' | 'deepspace') => {
    soundEngine.playClick();
    const updated = {
      ...widget,
      data: { ...widget.data, soundPreset: preset },
    };
    onUpdate(updated);

    if (isPlaying) {
      soundEngine.startAmbient(preset, currentVolume);
    }
  };

  const handleVolumeChange = (vol: number) => {
    soundEngine.setAmbientVolume(vol);
    const updated = {
      ...widget,
      data: { ...widget.data, volume: vol },
    };
    onUpdate(updated);
  };

  const presets = [
    { id: 'alpha', label: 'アルファ波 (10Hz)', desc: 'リラックス集中・学習' },
    { id: 'theta', label: 'シータ波 (6Hz)', desc: '深い瞑想・直感ひらめき' },
    { id: 'gamma', label: 'ガンマ波 (40Hz)', desc: '知覚同期・高次情報処理' },
    { id: 'deepspace', label: 'ディープスペース (4.5Hz)', desc: '無重力感・概念抽象' },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Sound Visualizer & Play Bar */}
      <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleTogglePlay}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              isPlaying
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
          <div>
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-cyan-400" />
              {presets.find((p) => p.id === currentPreset)?.label}
            </div>
            <div className="text-[10px] text-slate-400">
              {isPlaying ? 'Web Audio バイノーラル共鳴 再生中' : '停止中（イヤホン推奨）'}
            </div>
          </div>
        </div>

        {/* Animated Sound Bars */}
        <div className="flex items-end gap-1 h-8">
          {[40, 75, 55, 90, 60, 80, 45].map((height, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-300 ${
                isPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700 opacity-40'
              }`}
              style={{
                height: isPlaying ? `${height}%` : '20%',
                animationDelay: `${i * 120}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Preset Selectors */}
      <div className="grid grid-cols-2 gap-2">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => handlePresetChange(p.id)}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              currentPreset === p.id
                ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="text-xs font-semibold">{p.label}</div>
            <div className="text-[10px] opacity-70 mt-0.5">{p.desc}</div>
          </button>
        ))}
      </div>

      {/* Volume Slider */}
      <div className="flex items-center gap-3 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80">
        <Volume2 className="w-3.5 h-3.5 text-slate-400" />
        <input
          type="range"
          min={0.05}
          max={1.0}
          step={0.05}
          value={currentVolume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
          {Math.round(currentVolume * 100)}%
        </span>
      </div>
    </div>
  );
};
