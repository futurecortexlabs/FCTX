import React, { useState } from 'react';
import type { MorphicWidget } from '../../types/morphic';
import { soundEngine } from '../../lib/soundEngine';
import { Download, FileText, Upload, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  widgets: MorphicWidget[];
  onImportWidgets: (widgets: MorphicWidget[]) => void;
}

export const SnapshotModal: React.FC<Props> = ({
  isOpen,
  onClose,
  widgets,
  onImportWidgets,
}) => {
  const [copiedMd, setCopiedMd] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');

  if (!isOpen) return null;

  // Generate Markdown Executive Report
  const generateMarkdownReport = (): string => {
    let md = `# FCTX // Morphic Workspace 意思決定 & 思考結晶レポート\n`;
    md += `*生成日時: ${new Date().toLocaleString('ja-JP')}*\n\n`;

    widgets.forEach((w) => {
      md += `## [${w.category}] ${w.title}\n`;
      md += `*概要: ${w.description}*\n\n`;

      if (w.type === 'simulation' && w.data.variables) {
        md += `### 変数パラメータ\n`;
        w.data.variables.forEach((v) => {
          md += `- **${v.label}**: ${v.value} ${v.unit || ''}\n`;
        });
        md += `\n`;
      }

      if (w.type === 'matrix' && w.data.matrixItems) {
        md += `### 配置要素\n`;
        w.data.matrixItems.forEach((m) => {
          md += `- **${m.label}** (X: ${m.x}%, Y: ${m.y}%)\n`;
        });
        md += `\n`;
      }

      if (w.type === 'pipeline' && w.data.stages) {
        md += `### パイプライン進行\n`;
        w.data.stages.forEach((s) => {
          md += `#### ${s.title}\n`;
          s.items.forEach((item) => {
            md += `- [${item.done ? 'x' : ' '}] ${item.text}\n`;
          });
        });
        md += `\n`;
      }

      if (w.type === 'tradeoff' && w.data.options) {
        md += `### 選択肢の比較評価\n`;
        w.data.options.forEach((opt) => {
          md += `#### ${opt.title}\n`;
          md += `**メリット**: ${opt.pros.join(', ')}\n`;
          md += `**懸念点**: ${opt.cons.join(', ')}\n`;
        });
        md += `\n`;
      }

      if (w.type === 'synapse_notes' && w.data.content) {
        md += `### メモ & 洞察\n`;
        md += `${w.data.content}\n\n`;
      }

      md += `---\n\n`;
    });

    return md;
  };

  const handleDownloadJson = () => {
    soundEngine.playClick();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(widgets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `fctx_morphic_workspace_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyMarkdown = () => {
    soundEngine.playClick();
    const report = generateMarkdownReport();
    navigator.clipboard.writeText(report);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importJson);
      if (!Array.isArray(parsed)) {
        throw new Error('JSONはウィジェットの配列である必要があります');
      }
      soundEngine.playMorph();
      onImportWidgets(parsed);
      onClose();
    } catch (err: any) {
      setImportError(err.message || '無効なJSONフォーマットです');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1">
          <Download className="w-4 h-4 text-indigo-400" />
          ワークスペースの保存 & エクスポート
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          現在の変形キャンバス全体の保存、Markdownサマリーの書き出し、または過去データの復元
        </p>

        <div className="space-y-4">
          {/* Export Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleDownloadJson}
              className="flex items-center justify-center gap-2 bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-4 rounded-xl text-left transition-all"
            >
              <Download className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200">JSONエクスポート</div>
                <div className="text-[10px] text-slate-400 mt-0.5">全ウィジェット状態の完全保存</div>
              </div>
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="flex items-center justify-center gap-2 bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-4 rounded-xl text-left transition-all"
            >
              <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200">
                  {copiedMd ? 'コピー完了！' : 'Markdownレポート'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">思考結晶サマリーをクリップボードへ</div>
              </div>
            </button>
          </div>

          {/* Import JSON */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 mb-1.5">
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              JSONからワークスペースをインポート
            </label>
            <textarea
              value={importJson}
              onChange={(e) => {
                setImportJson(e.target.value);
                setImportError('');
              }}
              placeholder="エクスポートしたJSONをここに貼り付け..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:border-purple-500"
            />
            {importError && <p className="text-[11px] text-rose-400 mt-1">{importError}</p>}
            <div className="flex justify-end mt-2">
              <button
                onClick={handleImport}
                disabled={!importJson.trim()}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium transition-colors"
              >
                復元・読み込み
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
