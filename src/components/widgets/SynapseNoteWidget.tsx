import React, { useState, useEffect } from 'react';
import type { MorphicWidget } from '../../types/morphic';
import { soundEngine } from '../../lib/soundEngine';
import {
  Copy,
  Tag,
  Eye,
  Edit3,
  Bold,
  List,
  CheckSquare,
  Quote,
  Heading,
  Code,
  Check,
} from 'lucide-react';

interface Props {
  widget: MorphicWidget;
  onUpdate: (updated: MorphicWidget) => void;
  onEmitOutput?: (key: string, value: number) => void;
}

export const SynapseNoteWidget: React.FC<Props> = ({ widget, onUpdate, onEmitOutput }) => {
  const content = widget.data.content || '';
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [copied, setCopied] = useState(false);

  // Extract simple hashtag keywords
  const detectedTags = Array.from(
    new Set(content.match(/#[a-zA-Z0-9_\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]+/g) || [])
  );

  // Count checklists
  const checklistChecked = (content.match(/- \[[xX]\]/g) || []).length;
  const checklistUnchecked = (content.match(/- \[ \]/g) || []).length;
  const checklistTotal = checklistChecked + checklistUnchecked;

  // Emit outputs to Synaptic Bus
  useEffect(() => {
    if (!onEmitOutput) return;
    onEmitOutput('char_count', content.length);
    onEmitOutput('word_count', content.trim().split(/\s+/).filter(Boolean).length);
    if (checklistTotal > 0) {
      onEmitOutput('checklist_done_count', checklistChecked);
    }
  }, [content, checklistChecked, checklistTotal, onEmitOutput]);

  const handleChange = (newContent: string) => {
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

  const insertSnippet = (prefix: string, suffix: string = '') => {
    soundEngine.playClick();
    handleChange(content ? `${content}\n${prefix}${suffix}` : `${prefix}${suffix}`);
  };

  // Toggle checklist item directly from preview mode
  const handleToggleCheckboxInPreview = (lineIndex: number) => {
    soundEngine.playClick();
    const lines = content.split('\n');
    const targetLine = lines[lineIndex];
    if (targetLine.includes('- [ ]')) {
      lines[lineIndex] = targetLine.replace('- [ ]', '- [x]');
    } else if (targetLine.includes('- [x]') || targetLine.includes('- [X]')) {
      lines[lineIndex] = targetLine.replace(/- \[[xX]\]/, '- [ ]');
    }
    handleChange(lines.join('\n'));
  };

  // Render markdown lines
  const renderMarkdown = () => {
    const lines = content.split('\n');

    return (
      <div className="space-y-1 text-xs text-slate-200 leading-relaxed font-sans min-h-[140px]">
        {lines.map((line, idx) => {
          // Headers
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="font-bold text-slate-100 text-sm mt-3 mb-1 text-cyan-300">
                {line.substring(4)}
              </h3>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={idx} className="font-bold text-slate-100 text-base mt-3 mb-1 text-indigo-300">
                {line.substring(3)}
              </h2>
            );
          }
          if (line.startsWith('# ')) {
            return (
              <h1 key={idx} className="font-bold text-slate-100 text-lg mt-4 mb-2 text-white border-b border-slate-800 pb-1">
                {line.substring(2)}
              </h1>
            );
          }

          // Checkboxes
          if (line.startsWith('- [ ] ') || line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
            const isDone = line.startsWith('- [x] ') || line.startsWith('- [X] ');
            const taskText = line.substring(6);

            return (
              <div
                key={idx}
                onClick={() => handleToggleCheckboxInPreview(idx)}
                className="flex items-start gap-2 py-0.5 cursor-pointer hover:bg-slate-900/60 rounded px-1 -mx-1 transition-colors group"
              >
                <div
                  className={`mt-0.5 w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                    isDone
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                      : 'border-slate-600 bg-slate-950 group-hover:border-cyan-400'
                  }`}
                >
                  {isDone && <Check className="w-2.5 h-2.5" />}
                </div>
                <span className={`text-xs ${isDone ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                  {taskText}
                </span>
              </div>
            );
          }

          // Bullet points
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-2 ml-2 py-0.5">
                <span className="text-cyan-400 text-sm leading-none">•</span>
                <span className="text-slate-300">{line.substring(2)}</span>
              </div>
            );
          }

          // Blockquotes
          if (line.startsWith('> ')) {
            return (
              <blockquote
                key={idx}
                className="border-l-2 border-indigo-500 pl-2.5 py-0.5 italic text-slate-400 bg-indigo-950/20 rounded-r text-xs my-1"
              >
                {line.substring(2)}
              </blockquote>
            );
          }

          // Code blocks or inline code
          if (line.startsWith('`') && line.endsWith('`') && line.length > 2) {
            return (
              <div key={idx} className="bg-slate-950 font-mono text-[11px] text-cyan-300 px-2 py-1 rounded border border-slate-800 my-1">
                {line.slice(1, -1)}
              </div>
            );
          }

          // Empty line
          if (!line.trim()) {
            return <div key={idx} className="h-2" />;
          }

          // Regular paragraph
          return (
            <p key={idx} className="text-slate-300">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Top Action Toolbar & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => {
                soundEngine.playClick();
                setMode('edit');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                mode === 'edit'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>編集</span>
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                setMode('preview');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                mode === 'preview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>プレビュー</span>
            </button>
          </div>

          <span className="font-mono text-[10px] text-slate-500 hidden sm:inline">
            {content.length}文字
            {checklistTotal > 0 && ` (${checklistChecked}/${checklistTotal}タスク)`}
          </span>

          {detectedTags.length > 0 && (
            <div className="flex items-center gap-1 hidden md:flex">
              <Tag className="w-3 h-3 text-indigo-400" />
              {detectedTags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] bg-indigo-950/60 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/40"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Formatting Quick Buttons */}
        <div className="flex items-center gap-1">
          {mode === 'edit' && (
            <div className="flex items-center gap-0.5 mr-1 bg-slate-900/80 rounded-lg p-0.5 border border-slate-800">
              <button
                onClick={() => insertSnippet('### ')}
                className="p-1 hover:text-cyan-300 rounded hover:bg-slate-800 transition-colors"
                title="見出し (### )"
              >
                <Heading className="w-3 h-3" />
              </button>
              <button
                onClick={() => insertSnippet('**太字テキスト**')}
                className="p-1 hover:text-cyan-300 rounded hover:bg-slate-800 transition-colors"
                title="太字 (**テキスト**)"
              >
                <Bold className="w-3 h-3" />
              </button>
              <button
                onClick={() => insertSnippet('- ')}
                className="p-1 hover:text-cyan-300 rounded hover:bg-slate-800 transition-colors"
                title="箇条書き (- )"
              >
                <List className="w-3 h-3" />
              </button>
              <button
                onClick={() => insertSnippet('- [ ] ')}
                className="p-1 hover:text-cyan-300 rounded hover:bg-slate-800 transition-colors"
                title="チェックリスト (- [ ] )"
              >
                <CheckSquare className="w-3 h-3" />
              </button>
              <button
                onClick={() => insertSnippet('> ')}
                className="p-1 hover:text-cyan-300 rounded hover:bg-slate-800 transition-colors"
                title="引用 (> )"
              >
                <Quote className="w-3 h-3" />
              </button>
              <button
                onClick={() => insertSnippet('`', '`')}
                className="p-1 hover:text-cyan-300 rounded hover:bg-slate-800 transition-colors"
                title="コード (`code`)"
              >
                <Code className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="text-[11px] text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
            title="クリップボードにコピー"
          >
            <Copy className="w-3 h-3" />
            <span>{copied ? 'コピー完了' : 'コピー'}</span>
          </button>
        </div>
      </div>

      {/* Editor or Preview Stage */}
      {mode === 'edit' ? (
        <textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="思考やアイデア、前提条件を自由に言語化してください... (Markdown記法対応: ### 見出し, - [ ] タスク, **太字**)"
          rows={7}
          className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 font-mono leading-relaxed resize-y transition-all"
        />
      ) : (
        <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 min-h-[160px] overflow-y-auto">
          {content.trim() ? (
            renderMarkdown()
          ) : (
            <div className="text-slate-600 text-xs italic py-6 text-center">
              メモ内容がありません。「編集」タブから入力してください。
            </div>
          )}
        </div>
      )}
    </div>
  );
};
