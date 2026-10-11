// Gemini API bridge for dynamic Morphic tool generation
import type { MorphicWidget } from '../types/morphic';

export async function generateWidgetsWithGemini(
  prompt: string,
  apiKey: string,
  existingWidgets: MorphicWidget[]
): Promise<{ widgets: MorphicWidget[]; reasoning: string } | null> {
  if (!apiKey) return null;

  const systemInstruction = `You are FCTX Cortex AI, an ambient intelligence engine that generates custom interactive morphic widgets for a dynamic workspace.
Given the user's intent or train of thought, you must decide what interactive widgets best serve their cognitive workflow.
Available widget types:
- 'simulation': Multi-variable calculator with sliders and formulas.
- 'matrix': 2D quadrant or radar matrix with x/y coordinate items (0-100).
- 'pipeline': Milestone execution flow with stages and checklist items.
- 'tradeoff': Decision matrix comparing options across weighted criteria.
- 'synapse_notes': Cognitive synthesis markdown pad with initial insights.
- 'custom': Custom interactive form/tool.

Return a JSON object conforming strictly to this format:
{
  "reasoning": "Brief explanation of why these tools were synthesized",
  "widgets": [
    {
      "id": "unique_string",
      "title": "Widget Title",
      "type": "simulation" | "matrix" | "pipeline" | "tradeoff" | "synapse_notes" | "custom",
      "category": "Strategy" | "Finance" | "Tech" | "Operations" | "Creative",
      "description": "Short description",
      "iconName": "Sliders" | "Compass" | "GitBranch" | "Scale" | "FileText" | "Activity",
      "accentColor": "indigo" | "cyan" | "emerald" | "amber" | "rose" | "purple",
      "size": "normal" | "wide" | "full",
      "data": { ... appropriate data schema for the type ... }
    }
  ]
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${systemInstruction}\n\nExisting active widgets: ${existingWidgets.map((w) => w.title).join(', ')}\n\nUser train of thought: "${prompt}"\n\nGenerate 1 to 3 highly useful morphic widgets tailored to this exact request. Respond ONLY with valid JSON.`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);
    const widgets: MorphicWidget[] = (parsed.widgets || []).map((w: any) => ({
      ...w,
      id: `morphic_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    }));

    return {
      reasoning: parsed.reasoning || 'Synthesized via Gemini Cortex Engine',
      widgets,
    };
  } catch (err) {
    console.warn('Gemini request failed, falling back to local synthesizer', err);
    return null;
  }
}
