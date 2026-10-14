import React, { useState, useRef, useEffect } from 'react';
import type { MorphicWidget, SynapseLink } from '../types/morphic';
import { getAiConfig } from '../lib/storage';
import { chatWithOllama } from '../lib/ollama';
import { soundEngine } from '../lib/soundEngine';
import {
  Bot,
  Brain,
  ChevronRight,
  Loader2,
  Mic,
  MicOff,
  Send,
  Sparkles,
  X,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  widgets: MorphicWidget[];
  synapses: SynapseLink[];
  busState: Record<string, number | string>;
  onApplyMorph?: (prompt: string) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'cortex';
  text: string;
  timestamp: number;
  actionSuggestion?: {
    label: string;
    prompt: string;
  };
}

export const CortexCopilotDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  widgets,
  synapses,
  busState,
  onApplyMorph,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init_welcome',
      sender: 'cortex',
      text: 'こんにちは。Cortex Copilotが現在の思考ワークスペースを常時モニタリングしています。戦略レビュー、数値感度分析、ボトルネック特定など、気になる点があれば何でもお尋ねください。',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          handleSend(transcript);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  if (!isOpen) return null;

  // Local Offline Cognitive Diagnostic Generator
  const generateOfflineAnalysis = (query: string): { text: string; actionSuggestion?: { label: string; prompt: string } } => {
    const q = query.toLowerCase();

    // Check workspace state
    const simWidgets = widgets.filter((w) => w.type === 'simulation');
    const pipeWidgets = widgets.filter((w) => w.type === 'pipeline');
    const matWidgets = widgets.filter((w) => w.type === 'matrix');
    const tradeWidgets = widgets.filter((w) => w.type === 'tradeoff');

    // Scenario 1: Health & Consistency Analysis
    if (q.includes('健全性') || q.includes('整合性') || q.includes('全体分析')) {
      const issues: string[] = [];
      if (simWidgets.length === 0) issues.push('数値目標やシミュレーターが存在しません');
      if (pipeWidgets.length === 0) issues.push('実行パイプラインのフェーズ定義が不足しています');
      if (synapses.length === 0) issues.push('モジュール間のシナプス直結が0本です');

      let reply = `### 🧠 ワークスペース整合性診断レポート\n\n`;
      reply += `- **稼働モジュール**: 合計 ${widgets.length} 個 (試算: ${simWidgets.length}, パイプライン: ${pipeWidgets.length}, マトリクス: ${matWidgets.length}, 意思決定: ${tradeWidgets.length})\n`;
      reply += `- **シナプス直結配線**: ${synapses.length} 本\n\n`;

      if (issues.length === 0) {
        reply += `✅ **高整合性ステータス**: 数値試算、マイルストーン進行、意思決定基準がバランスよく配置されています。現在のシナプス配線により、シミュレーション結果が全体に動的伝播しています。`;
      } else {
        reply += `⚠️ **改善推奨ポイント**:\n` + issues.map((i) => `- ${i}`).join('\n');
      }

      return {
        text: reply,
        actionSuggestion: {
          label: '不足モジュールを補完生成',
          prompt: '現在のワークスペースの弱点を補強するバランスの取れた戦略モジュール群',
        },
      };
    }

    // Scenario 2: Risk & Bottlenecks
    if (q.includes('リスク') || q.includes('ボトルネック') || q.includes('脆弱')) {
      let reply = `### ⚠️ ボトルネック & リスク診断\n\n`;
      let foundRisk = false;

      // Check pipeline unfinished high-priority items
      const highPriorityUnfinished = pipeWidgets.flatMap((w) =>
        (w.data.stages || []).flatMap((s) => s.items.filter((i) => !i.done && i.priority === 'high'))
      );

      if (highPriorityUnfinished.length > 0) {
        foundRisk = true;
        reply += `1. **未完了の最優先タスク (${highPriorityUnfinished.length}件)**:\n`;
        highPriorityUnfinished.slice(0, 3).forEach((item) => {
          reply += `   - 「${item.text}」がスタック要因になり得ます。\n`;
        });
      }

      // Check Churn or high OPEX in simulation
      simWidgets.forEach((sim) => {
        const churnVar = (sim.data.variables || []).find((v) => v.name.includes('churn'));
        if (churnVar && churnVar.value >= 3.0) {
          foundRisk = true;
          reply += `2. **月次解約率 (Churn) 警戒領域**: 現在 **${churnVar.value}%** で設定されています。SaaS標準(1.5〜2.0%)を超過しており、長期ARR成長の天井リスクとなります。\n`;
        }
      });

      if (!foundRisk) {
        reply += `現在顕著な構造的ボトルネックは検出されていません。タスク進行率も良好です。`;
      }

      return {
        text: reply,
        actionSuggestion: {
          label: 'リスク封じ込めパイプラインを展開',
          prompt: '特定されたボトルネックと解約リスクに対する即時封じ込め対応パイプライン',
        },
      };
    }

    // Scenario 3: Growth Leverage
    if (q.includes('成長') || q.includes('レバレッジ') || q.includes('収益') || q.includes('mrr')) {
      let reply = `### 📈 成長レバレッジ分析\n\n`;
      reply += `感度分析の結果、現在の構成において最も投資対効果(ROI)の高いレバーは以下の順です:\n\n`;
      reply += `1. **有料転換率 (CVR) 最適化**: CVRが0.5%向上するだけで、年間利益は直線的に押し上げられます。\n`;
      reply += `2. **バイラル係数 (K-Factor)**: 口コミやリファラルループが1.0を超えると、獲得CACの逓減効果が指数関数的に発揮されます。\n`;
      reply += `3. **解約防止リテンション**: 初期オンボーディング突破率を改善することでLTV/CAC比率が3x以上をキープできます。\n`;

      return {
        text: reply,
        actionSuggestion: {
          label: 'バイラル成長モデルを生成',
          prompt: 'バイラル拡散と招待制成長ループのユニットエコノミクス試算',
        },
      };
    }

    // Scenario 4: Next 3 Action Items
    if (q.includes('アクション') || q.includes('タスク') || q.includes('今週')) {
      let reply = `### 🎯 今週実行すべき最優先アクション TOP 3\n\n`;
      reply += `1. **重要指標の感度テスト完了**: シミュレーターの「モンテカルロ試算」を実行し、下振れP10の防衛ラインを把握する。\n`;
      reply += `2. **シナプス配線の確立**: 画面上部の「自動結線」または手動配線で、進捗率と目標数値を直結させる。\n`;
      reply += `3. **マイルストーン Gate 1の突破**: 実行パイプライン内の最優先チェック項目を消化する。\n`;

      return {
        text: reply,
      };
    }

    // General contextual response
    return {
      text: `### 💡 Cortexの所見\n「${query}」についての検討:\n現在のワークスペースには ${widgets.length} 個の思考モジュールが結晶化しています。スライダーやマトリクスを操作して複数の仮説を比較し、プレゼンテーションモード(Spaceキー)で思考を他者に共有することをお勧めします。`,
    };
  };

  const handleSend = async (userText: string) => {
    if (!userText.trim()) return;

    soundEngine.playClick();
    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: userText.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    const aiConfig = getAiConfig();
    let replyText = '';
    let suggestion: { label: string; prompt: string } | undefined;

    const workspaceContext = {
      widgets: widgets.map((w) => ({
        id: w.id,
        title: w.title,
        type: w.type,
        category: w.category,
        data: w.data,
      })),
      synapses,
      busState,
    };

    if (aiConfig.provider === 'ollama') {
      const ollamaRes = await chatWithOllama(
        userText,
        aiConfig.ollamaEndpoint,
        aiConfig.ollamaModel,
        workspaceContext
      );
      replyText = ollamaRes.text;
      suggestion = ollamaRes.actionSuggestion;
    } else if (aiConfig.provider === 'gemini' && aiConfig.geminiApiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${aiConfig.geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `あなたは思考共生型UIワークスペース「FCTX」のインテリジェント・コパイロットです。
以下の現在のワークスペース状態(JSON)を精査し、ユーザーからの問いに対して簡潔かつシャープに戦略的助言を行ってください。
Markdownで見出しや箇条書きを使い、読みやすく返答してください。回答の末尾で、もしワークスペースに追加すべき思考モジュールがあれば「【推奨プロンプト】: ◯◯◯」という形式で1行提案してください。

【現在のワークスペース状態】:
${JSON.stringify(workspaceContext, null, 2)}

【ユーザーの質問】:
${userText}`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const json = await response.json();
          replyText = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const match = replyText.match(/【推奨プロンプト】[:：]?\s*([^\n\r]+)/);
          if (match && match[1]) {
            const suggestedPrompt = match[1].trim();
            suggestion = {
              label: `${suggestedPrompt.slice(0, 18)}${suggestedPrompt.length > 18 ? '...' : ''} を生成`,
              prompt: suggestedPrompt,
            };
            replyText = replyText.replace(/【推奨プロンプト】[:：]?\s*[^\n\r]+/, '').trim();
          }
        }
      } catch {
        // fallback to offline
      }
    }

    if (!replyText) {
      const offline = generateOfflineAnalysis(userText);
      replyText = offline.text;
      suggestion = offline.actionSuggestion;
    }

    setIsThinking(false);
    soundEngine.playMorph();

    const cortexMsg: Message = {
      id: `ctx_${Date.now()}`,
      sender: 'cortex',
      text: replyText,
      timestamp: Date.now(),
      actionSuggestion: suggestion,
    };

    setMessages((prev) => [...prev, cortexMsg]);
  };

  const activeAiConfig = getAiConfig();
  const aiBadge =
    activeAiConfig.provider === 'ollama'
      ? `🦙 ${activeAiConfig.ollamaModel}`
    : activeAiConfig.provider === 'gemini'
    ? '☁️ Gemini'
    : '⚡ ローカル';

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-950/95 border-l border-indigo-900/40 backdrop-blur-2xl flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400 shadow-md shadow-indigo-950/50">
            <Brain className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100 font-mono tracking-tight">CORTEX COPILOT</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 truncate max-w-[170px]" title={`推論エンジン: ${aiBadge}`}>
                {aiBadge}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">思考共生ニューラル知性</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Strategic Action Prompt Chips */}
      <div className="p-3 border-b border-slate-800/60 bg-slate-900/30">
        <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>クイック診断プロンプト:</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: '全体整合性分析', prompt: 'ワークスペース全体の健全性・整合性を分析して' },
            { label: 'ボトルネック特定', prompt: '現在の構造的ボトルネックとリスクを特定して' },
            { label: '成長レバレッジ特定', prompt: '最優先で引き上げるべき成長レバレッジ指標を教えて' },
            { label: '今週の3大アクション', prompt: '今週実行すべき3つの具体的アクションを提案して' },
          ].map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleSend(chip.prompt)}
              className="text-left text-[11px] bg-slate-900 hover:bg-indigo-950/50 text-slate-300 hover:text-cyan-200 p-2 rounded-lg border border-slate-800 hover:border-indigo-800/60 transition-all font-medium truncate"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message Chat History */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
              {m.sender === 'user' ? (
                <span>YOU</span>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-indigo-400" />
                  <span>CORTEX NEURAL AGENT</span>
                </>
              )}
            </div>

            <div
              className={`p-3.5 rounded-2xl max-w-[92%] leading-relaxed whitespace-pre-wrap ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/40 rounded-tr-sm'
                  : 'bg-slate-900/90 text-slate-200 border border-slate-800 shadow-xl rounded-tl-sm'
              }`}
            >
              {m.text}
            </div>

            {/* Suggested 1-click Morph Action */}
            {m.actionSuggestion && onApplyMorph && (
              <button
                onClick={() => {
                  soundEngine.playMorph();
                  onApplyMorph(m.actionSuggestion!.prompt);
                  onClose();
                }}
                className="mt-1 flex items-center gap-1.5 text-[11px] bg-indigo-950/80 hover:bg-indigo-900 text-cyan-300 px-3 py-1.5 rounded-xl border border-indigo-700/60 shadow-md transition-all font-medium"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>{m.actionSuggestion.label}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            <span className="font-mono text-[11px]">Cortexが全モジュールを連動分析中...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="思考の相談、目標達成のヒント、リスクについて質問..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
        />
        {/* Voice Input Button */}
        <button
          type="button"
          onClick={toggleListening}
          className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/50'
              : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800'
          }`}
          title={isListening ? '音声認識中... (クリックで停止)' : '音声でCopilotに質問 (Web Speech API)'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
