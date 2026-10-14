// Ollama local LLM integration bridge for FCTX Morphic Workspace
import type { MorphicWidget } from '../types/morphic';

export interface OllamaModelTag {
  name: string;
  model: string;
  size?: number;
  details?: {
    format?: string;
    family?: string;
    parameter_size?: string;
    quantization_level?: string;
  };
}

/**
 * Fetch available local models from Ollama server
 */
export async function fetchOllamaModels(endpoint = 'http://localhost:11434'): Promise<{
  ok: boolean;
  models: string[];
  error?: string;
}> {
  try {
    const cleanEndpoint = endpoint.replace(/\/+$/, '');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${cleanEndpoint}/api/tags`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { ok: false, models: [], error: `Ollama HTTP ${res.status}: ${res.statusText}` };
    }

    const data = await res.json();
    const models = (data.models || []).map((m: OllamaModelTag) => m.name || m.model);
    return { ok: true, models };
  } catch (err: any) {
    let msg = err.message || '接続に失敗しました';
    if (err.name === 'AbortError') {
      msg = '接続タイムアウト (4秒)';
    } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      msg = 'Ollama が起動していないか、CORS 設定が必要です';
    }
    return { ok: false, models: [], error: msg };
  }
}

const WIDGET_SYNTHESIS_SYSTEM_PROMPT = `You are FCTX Cortex AI, an autonomous intelligence engine powering a living cognitive workspace.
Analyze the user's intent, hypothesis, or train of thought, and generate 1 to 3 interactive morphic widgets in JSON.

Supported widget types and schemas:
1. "simulation": Multi-variable dynamic calculator with sliders & formulas.
   Data schema: {
     "variables": [ { "id": "var1", "name": "var1", "label": "Label", "value": 100, "min": 10, "max": 1000, "step": 10, "unit": "円" } ],
     "formulas": [ { "id": "form1", "label": "Result Label", "unit": "円", "calculate": "var1 * 1.5" } ]
   }

2. "matrix": 2D quadrant or radar matrix.
   Data schema: {
     "matrixAxes": { "xLabel": "X Axis", "yLabel": "Y Axis", "quadrants": ["Q1", "Q2", "Q3", "Q4"] },
     "matrixItems": [ { "id": "m1", "label": "Item Name", "x": 60, "y": 80, "category": "Tag" } ]
   }

3. "pipeline": Milestone execution flow with stages & items.
   Data schema: {
     "stages": [ { "id": "s1", "title": "Phase 1", "items": [ { "id": "i1", "text": "Task text", "done": false, "priority": "high" | "med" | "low" } ] } ]
   }

4. "tradeoff": Multi-criteria weighted decision engine.
   Data schema: {
     "criteria": [ { "id": "c1", "label": "Criterion Name", "weight": 5 } ],
     "options": [ { "id": "o1", "title": "Option Name", "pros": ["Pro 1"], "cons": ["Con 1"], "scores": { "c1": 8 } } ]
   }

5. "decision_tree": Causal logic decision tree with probabilities & payoffs.
   Data schema: {
     "decisionNodes": [
       { "id": "d1", "label": "Root Strategy", "type": "root", "title": "Main Goal" },
       { "id": "d2", "label": "Option A", "type": "decision", "title": "Path A", "cost": 100000 },
       { "id": "d3", "label": "Success", "type": "chance", "title": "Market Hit", "probability": 0.6, "payoff": 500000 }
     ]
   }

6. "synapse_notes": Cognitive scratchpad with markdown notes.
   Data schema: {
     "content": "# Markdown initial insights with #hashtags"
   }

Respond ONLY with valid JSON conforming strictly to:
{
  "reasoning": "Brief explanation in Japanese of why these tools were synthesized",
  "widgets": [
    {
      "id": "sim_1",
      "title": "Widget Title",
      "type": "simulation" | "matrix" | "pipeline" | "tradeoff" | "decision_tree" | "synapse_notes",
      "category": "Strategy" | "Finance" | "Tech" | "Operations" | "Creative" | "Risk",
      "description": "Short explanation",
      "iconName": "Sliders" | "Compass" | "GitBranch" | "Scale" | "GitFork" | "FileText",
      "accentColor": "indigo" | "cyan" | "emerald" | "amber" | "rose" | "purple",
      "size": "normal" | "wide",
      "data": { ... }
    }
  ]
}`;

/**
 * Generate Morphic Widgets using local Ollama model
 */
export async function generateWidgetsWithOllama(
  prompt: string,
  endpoint: string,
  model: string,
  existingWidgets: MorphicWidget[]
): Promise<{ widgets: MorphicWidget[]; reasoning: string } | null> {
  if (!endpoint || !model) return null;

  try {
    const cleanEndpoint = endpoint.replace(/\/+$/, '');
    const activeWidgetTitles = existingWidgets.map((w) => w.title).join(', ');

    const userPrompt = `既存のアクティブモジュール: ${activeWidgetTitles || 'なし'}
ユーザーの思考・仮説・課題: 「${prompt}」

この思考を定量化・推進するために最も効果的なモジュールを1〜3個生成してください。必ずJSON形式で出力してください。`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for local LLM generation

    const res = await fetch(`${cleanEndpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: WIDGET_SYNTHESIS_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        format: 'json',
        stream: false,
        options: {
          temperature: 0.6,
        },
      }),
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`Ollama chat failed with HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    const rawContent = data.message?.content || data.response || '';
    if (!rawContent) return null;

    // Parse JSON safely
    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      // Try extract JSON substring
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON received from Ollama');
      }
    }

    if (!parsed || !Array.isArray(parsed.widgets) || parsed.widgets.length === 0) {
      return null;
    }

    const timestamp = Date.now();
    const widgets: MorphicWidget[] = parsed.widgets.map((w: any, idx: number) => ({
      id: `ollama_${timestamp}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      title: w.title || 'ローカルLLM生成モジュール',
      type: w.type || 'simulation',
      category: w.category || 'Local AI',
      description: w.description || `${model} により生成された思考モジュール`,
      iconName: w.iconName || 'Sliders',
      accentColor: w.accentColor || 'indigo',
      size: w.size || 'normal',
      data: w.data || {},
      createdAt: timestamp + idx,
    }));

    return {
      reasoning: parsed.reasoning || `ローカルLLM (${model}) により思考コンテキストから動的生成しました`,
      widgets,
    };
  } catch (err: any) {
    console.error('Ollama widget synthesis failed:', err);
    return null;
  }
}

/**
 * Chat with local Ollama model for Cortex Copilot strategic advisor
 */
export async function chatWithOllama(
  query: string,
  endpoint: string,
  model: string,
  workspaceContext: any
): Promise<{ text: string; actionSuggestion?: { label: string; prompt: string } }> {
  try {
    const cleanEndpoint = endpoint.replace(/\/+$/, '');
    const systemPrompt = `あなたは思考共生型ワークスペース「FCTX」のインテリジェント・コパイロットです。ローカルLLM (${model}) として動作しています。
以下の現在のワークスペース状態(JSON)を精査し、ユーザーからの問いに対して簡潔かつシャープに戦略的助言を行ってください。
Markdownで見出しや箇条書きを使い、読みやすく返答してください。回答の末尾で、もしワークスペースに追加すべき思考モジュールがあれば「【推奨プロンプト】: ◯◯◯」という形式で1行提案してください。

【現在のワークスペース状態】:
${JSON.stringify(workspaceContext, null, 2)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const res = await fetch(`${cleanEndpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        stream: false,
        options: {
          temperature: 0.7,
        },
      }),
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Ollama HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    let text = data.message?.content || data.response || '応答を取得できませんでした。';

    // Check for action suggestion in response
    let actionSuggestion: { label: string; prompt: string } | undefined;
    const match = text.match(/【推奨プロンプト】[:：]?\s*([^\n\r]+)/);
    if (match && match[1]) {
      const suggestedPrompt = match[1].trim();
      actionSuggestion = {
        label: `${suggestedPrompt.slice(0, 18)}${suggestedPrompt.length > 18 ? '...' : ''} を生成`,
        prompt: suggestedPrompt,
      };
      // Clean up the marker from text if desired
      text = text.replace(/【推奨プロンプト】[:：]?\s*[^\n\r]+/, '').trim();
    }

    return { text, actionSuggestion };
  } catch (err: any) {
    return {
      text: `⚠️ **ローカルLLM (${model}) への接続エラー**\n\n${err.message || '接続に失敗しました'}\n\n*ヒント: Ollama が起動しているか、または CORS 許可設定 (\`OLLAMA_ORIGINS="*" ollama serve\`) が行われているかご確認ください。*`,
    };
  }
}
