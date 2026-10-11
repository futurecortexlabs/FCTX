// FCTX Morphic Workspace Types

export type WidgetType =
  | 'simulation'      // Multi-variable interactive simulation & curves
  | 'matrix'          // 2D Matrix / Radar / Quadrant analysis
  | 'pipeline'        // Milestone flow / Kanban / execution pipeline
  | 'tradeoff'        // A/B Dilemma & weighted decision engine
  | 'synapse_notes'   // Living cognitive scratchpad with auto-connections
  | 'ambient_audio'   // Neural frequency / soundscape focus synthesizer
  | 'custom';         // Dynamically synthesized micro-tool

export interface WidgetVariable {
  id: string;
  name: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  description?: string;
}

export interface MetricFormula {
  id: string;
  label: string;
  unit?: string;
  calculate: string; // JavaScript formula expression (e.g., "(val1 * val2) - val3")
}

export interface MatrixItem {
  id: string;
  label: string;
  x: number; // 0 to 100
  y: number; // 0 to 100
  category?: string;
  notes?: string;
}

export interface PipelineStage {
  id: string;
  title: string;
  items: {
    id: string;
    text: string;
    done: boolean;
    priority?: 'low' | 'med' | 'high';
  }[];
}

export interface TradeoffOption {
  id: string;
  title: string;
  pros: string[];
  cons: string[];
  scores: Record<string, number>; // criterionId -> score (1-10)
}

export interface TradeoffCriterion {
  id: string;
  name: string;
  weight: number; // 1-5
}

export interface MorphicWidget {
  id: string;
  title: string;
  type: WidgetType;
  category: string;
  description: string;
  iconName: string;
  createdAt: number;
  isPinned?: boolean;
  isCollapsed?: boolean;
  accentColor: string; // Hex or Tailwind color class
  size: 'normal' | 'wide' | 'full';

  // Output value exposed to Synaptic Bus
  outputKey?: string;
  outputValue?: number | string | Record<string, unknown>;

  // Specific state payloads depending on type
  data: {
    variables?: WidgetVariable[];
    formulas?: MetricFormula[];
    matrixAxes?: { xLabel: string; yLabel: string; quadrants?: string[] };
    matrixItems?: MatrixItem[];
    stages?: PipelineStage[];
    criteria?: TradeoffCriterion[];
    options?: TradeoffOption[];
    content?: string;
    soundPreset?: 'alpha' | 'theta' | 'gamma' | 'rain' | 'deepspace';
    volume?: number;
    customFields?: Array<{
      id: string;
      label: string;
      type: 'text' | 'number' | 'toggle' | 'select';
      value: any;
      options?: string[];
    }>;
  };
}

export interface SynapseLink {
  id: string;
  sourceWidgetId: string;
  sourceKey: string;
  targetWidgetId: string;
  targetKey: string;
  multiplier?: number;
}

export interface ThoughtPreset {
  id: string;
  name: string;
  tagline: string;
  prompt: string;
  icon: string;
  widgets: MorphicWidget[];
}

export interface CortexThoughtLog {
  id: string;
  timestamp: number;
  userInput: string;
  reasoning: string;
  generatedWidgetTitles: string[];
}
