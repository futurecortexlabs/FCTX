import React, { useState } from 'react';
import type { MorphicWidget } from '../../types/morphic';
import { soundEngine } from '../../lib/soundEngine';
import { Download, FileSpreadsheet, FileText, GitPullRequest, Globe, Upload, X } from 'lucide-react';

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

  const generateHtmlReport = (): string => {
    const timestamp = new Date().toLocaleString('ja-JP');
    let cardsHtml = '';

    widgets.forEach((w) => {
      let contentHtml = '';

      if (w.type === 'simulation' && w.data.variables) {
        contentHtml += '<div class="section"><h4>変数パラメータ</h4><div class="grid">';
        w.data.variables.forEach((v) => {
          contentHtml += `<div class="pill"><span>${v.label}</span><b>${v.value.toLocaleString()} ${v.unit || ''}</b></div>`;
        });
        contentHtml += '</div></div>';
      }

      if (w.type === 'pipeline' && w.data.stages) {
        contentHtml += '<div class="section"><h4>パイプライン進行</h4>';
        w.data.stages.forEach((s) => {
          contentHtml += `<div class="stage-block"><b>${s.title}</b><ul>`;
          s.items.forEach((item) => {
            contentHtml += `<li class="${item.done ? 'done' : ''}">${item.done ? '✓' : '○'} ${item.text}</li>`;
          });
          contentHtml += '</ul></div>';
        });
        contentHtml += '</div>';
      }

      if (w.type === 'tradeoff' && w.data.options) {
        contentHtml += '<div class="section"><h4>選択肢の比較評価</h4><div class="grid">';
        w.data.options.forEach((opt) => {
          contentHtml += `<div class="opt-card"><b>${opt.title}</b><p>メリット: ${opt.pros.join(', ')}</p><p>懸念: ${opt.cons.join(', ')}</p></div>`;
        });
        contentHtml += '</div></div>';
      }

      if (w.type === 'synapse_notes' && w.data.content) {
        contentHtml += `<div class="section"><h4>メモ & 洞察</h4><pre>${w.data.content}</pre></div>`;
      }

      cardsHtml += `
        <div class="card">
          <div class="card-header">
            <span class="badge">${w.category}</span>
            <h3>${w.title}</h3>
            <p>${w.description}</p>
          </div>
          ${contentHtml}
        </div>
      `;
    });

    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>FCTX // Morphic Workspace Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #07090e; color: #e2e8f0; margin: 0; padding: 40px 20px; }
    .container { max-width: 960px; margin: 0 auto; }
    h1 { font-size: 28px; margin-bottom: 4px; color: #f8fafc; }
    .time { color: #64748b; font-size: 13px; margin-bottom: 30px; font-family: monospace; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; margin-bottom: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    .card-header h3 { margin: 8px 0 4px 0; font-size: 18px; color: #f1f5f9; }
    .card-header p { margin: 0 0 16px 0; font-size: 13px; color: #94a3b8; }
    .badge { font-size: 11px; font-family: monospace; background: #1e1b4b; color: #818cf8; padding: 2px 8px; border-radius: 6px; }
    .section h4 { font-size: 14px; margin: 16px 0 8px 0; color: #cbd5e1; border-bottom: 1px solid #334155; padding-bottom: 4px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
    .pill { background: #090d16; border: 1px solid #1e293b; padding: 10px; border-radius: 8px; display: flex; justify-content: space-between; font-size: 12px; }
    .pill b { color: #818cf8; font-family: monospace; }
    ul { list-style: none; padding-left: 0; }
    li { padding: 4px 0; font-size: 13px; color: #cbd5e1; }
    li.done { text-decoration: line-through; color: #64748b; }
    .opt-card { background: #090d16; border: 1px solid #1e293b; padding: 12px; border-radius: 8px; font-size: 12px; }
    pre { background: #090d16; padding: 12px; border-radius: 8px; font-size: 13px; overflow-x: auto; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <h1>FCTX // Morphic Workspace 意思決定 & 思考結晶レポート</h1>
    <div class="time">生成日時: ${timestamp} | Future Cortex Labs</div>
    ${cardsHtml}
  </div>
</body>
</html>`;
  };

  const generateCsvData = (): string => {
    let csv = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    csv += 'Module ID,Category,Title,Item Key,Item Label,Value / Status,Notes\n';

    widgets.forEach((w) => {
      if (w.type === 'simulation' && w.data.variables) {
        w.data.variables.forEach((v) => {
          csv += `"${w.id}","${w.category}","${w.title}","${v.name}","${v.label}","${v.value} ${v.unit || ''}","Variable Parameter"\n`;
        });
      }
      if (w.type === 'pipeline' && w.data.stages) {
        w.data.stages.forEach((s) => {
          s.items.forEach((item) => {
            csv += `"${w.id}","${w.category}","${w.title}","${item.id}","[${s.title}] ${item.text}","${item.done ? 'DONE' : 'TODO'}","Priority: ${item.priority || 'med'}"\n`;
          });
        });
      }
      if (w.type === 'tradeoff' && w.data.options) {
        w.data.options.forEach((opt) => {
          csv += `"${w.id}","${w.category}","${w.title}","${opt.id}","${opt.title}","Pros: ${opt.pros.join('; ')}","Cons: ${opt.cons.join('; ')}"\n`;
        });
      }
      if (w.type === 'matrix' && w.data.matrixItems) {
        w.data.matrixItems.forEach((m) => {
          csv += `"${w.id}","${w.category}","${w.title}","${m.id}","${m.label}","X: ${m.x}%, Y: ${m.y}%","Matrix Node"\n`;
        });
      }
      if (w.type === 'synapse_notes' && w.data.content) {
        csv += `"${w.id}","${w.category}","${w.title}","content","Note Content","${w.data.content.replace(/"/g, '""')}","Cognitive Pad"\n`;
      }
    });

    return csv;
  };

  const generateGithubIssueTemplate = (): string => {
    let issue = `## 🎯 概要 & 意思決定コンテキスト\n`;
    issue += `*FCTX // Morphic Workspace にて自動生成された実行仕様書*\n\n`;

    const pipelines = widgets.filter((w) => w.type === 'pipeline');
    if (pipelines.length > 0) {
      issue += `### ✅ 実行タスク一覧 (Action Checklist)\n`;
      pipelines.forEach((p) => {
        issue += `#### ${p.title}\n`;
        (p.data.stages || []).forEach((stg) => {
          issue += `##### ${stg.title}\n`;
          stg.items.forEach((item) => {
            issue += `- [${item.done ? 'x' : ' '}] ${item.text} \`${item.priority?.toUpperCase() || 'MED'}\`\n`;
          });
        });
        issue += `\n`;
      });
    }

    const sims = widgets.filter((w) => w.type === 'simulation');
    if (sims.length > 0) {
      issue += `### 📊 前提条件 & シミュレーション変数\n`;
      sims.forEach((s) => {
        issue += `| パラメータ | 設定値 |\n| :--- | :--- |\n`;
        (s.data.variables || []).forEach((v) => {
          issue += `| ${v.label} | ${v.value.toLocaleString()} ${v.unit || ''} |\n`;
        });
        issue += `\n`;
      });
    }

    return issue;
  };

  const handleDownloadCsv = () => {
    soundEngine.playClick();
    const csv = generateCsvData();
    const dataStr = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `fctx_morphic_data_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const [copiedIssue, setCopiedIssue] = useState(false);
  const handleCopyGithubIssue = () => {
    soundEngine.playClick();
    const issue = generateGithubIssueTemplate();
    navigator.clipboard.writeText(issue);
    setCopiedIssue(true);
    setTimeout(() => setCopiedIssue(false), 2000);
  };

  const handleDownloadHtml = () => {
    soundEngine.playClick();
    const html = generateHtmlReport();
    const dataStr = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `fctx_morphic_report_${Date.now()}.html`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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
          現在の変形キャンバス全体の保存、Markdown・CSV・HTMLの書き出し、または過去データの復元
        </p>

        <div className="space-y-4">
          {/* Export Actions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-2 bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-3 rounded-xl text-left transition-all"
            >
              <Download className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200">JSON出力</div>
                <div className="text-[10px] text-slate-400 mt-0.5">完全保存</div>
              </div>
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-2 bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-3 rounded-xl text-left transition-all"
            >
              <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200">
                  {copiedMd ? 'コピー完了' : 'Markdown'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">レポートコピー</div>
              </div>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="flex items-center gap-2 bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-3 rounded-xl text-left transition-all"
            >
              <Globe className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200">HTML保存</div>
                <div className="text-[10px] text-slate-400 mt-0.5">単体Web閲覧</div>
              </div>
            </button>

            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-2 bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-3 rounded-xl text-left transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200">CSV出力</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Excel / Notion</div>
              </div>
            </button>

            <button
              onClick={handleCopyGithubIssue}
              className="flex items-center gap-2 bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-3 rounded-xl text-left transition-all col-span-2 sm:col-span-2"
            >
              <GitPullRequest className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200">
                  {copiedIssue ? 'コピー完了！' : 'GitHub Issue 用 Markdown'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">チェックリスト＆仕様書テンプレート</div>
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
