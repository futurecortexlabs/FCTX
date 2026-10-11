import React, { useState } from 'react';
import type { MorphicWidget } from '../../types/morphic';
import { soundEngine } from '../../lib/soundEngine';
import { Copy, Tag } from 'lucide-react';

interface Props {
  widget: MorphicWidget;
  onUpdate: (updated: MorphicWidget) => void;
}

export const SynapseNoteWidget: React.FC<Props> = ({ widget, onUpdate }) => {
  const content = widget.data.content || '';
  const [copied, setCopied] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const updated = {
      ...widget,
      data: { ...widget.data, content: newContent },
    };
    onUpdate(updated);
  };

  const handleCopy = () => {
    soundEngine.playClick();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertBullet = () => {
    soundEngine.playClick();
    const updated = {
      ...widget,
      data: { ...widget.data, content: content + '\n- ' },
    };
    onUpdate(updated);
  };

  // Extract simple hashtag keywords
  const detectedTags = Array.from(new Set(content.match(/#[a-zA-Z0-9_\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]+/g) || []));

  return (
    <div className="space-y-3">
      {/* Action Toolbar */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-slate-500">
            {content.length} 文字 / {content.trim().split(/\s+/).filter(Boolean).length} 単語
          </span>
          {detectedTags.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3 text-indigo-400" />
              {detectedTags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="text-[10px] bg-indigo-950/60 text-indigo-300 px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={insertBullet}
            className="text-[11px] text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 px-2 py-1 rounded transition-colors"
          >
            + 箇条書き
          </button>
          <button
            onClick={handleCopy}
            className="text-[11px] text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 px-2 py-1 rounded flex items-center gap-1 transition-colors"
          >
            <Copy className="w-3 h-3" />
            {copied ? 'コピー完了' : 'コピー'}
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="思考やアイデア、前提条件を自由に言語化してください..."
        rows={7}
        className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 font-mono leading-relaxed resize-y transition-all"
      />
    </div>
  );
};
