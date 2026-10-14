import type { MorphicWidget, SynapseLink, CortexThoughtLog, WorkspaceTheme } from '../types/morphic';

const STORAGE_KEYS = {
  WIDGETS: 'fctx_morphic_widgets_v1',
  SYNAPSES: 'fctx_morphic_synapses_v1',
  THOUGHT_LOGS: 'fctx_morphic_thought_logs_v1',
  API_KEY: 'fctx_gemini_api_key',
  SETTINGS: 'fctx_morphic_settings',
};

export interface WorkspaceSettings {
  soundEnabled: boolean;
  ambientFrequency: 'alpha' | 'theta' | 'gamma' | 'deepspace' | 'delta';
  ambientVolume: number;
  synapticGlow: boolean;
  autoMorphOnInput: boolean;
  theme: WorkspaceTheme;
}

export const defaultSettings: WorkspaceSettings = {
  soundEnabled: true,
  ambientFrequency: 'alpha',
  ambientVolume: 0.3,
  synapticGlow: true,
  autoMorphOnInput: true,
  theme: 'void',
};

export function loadSavedWidgets(): MorphicWidget[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WIDGETS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveWidgets(widgets: MorphicWidget[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(widgets));
  } catch (e) {
    console.error('Failed to save widgets', e);
  }
}

export function loadSavedSynapses(): SynapseLink[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNAPSES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSynapses(synapses: SynapseLink[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SYNAPSES, JSON.stringify(synapses));
  } catch (e) {
    console.error('Failed to save synapses', e);
  }
}

export function loadThoughtLogs(): CortexThoughtLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THOUGHT_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveThoughtLogs(logs: CortexThoughtLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THOUGHT_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save logs', e);
  }
}

export function loadSettings(): WorkspaceSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: WorkspaceSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export type AiProvider = 'local_heuristic' | 'ollama' | 'gemini';

export interface AiConfig {
  provider: AiProvider;
  geminiApiKey: string;
  ollamaEndpoint: string;
  ollamaModel: string;
}

export function getApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  } catch {
    return '';
  }
}

export function setApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key);
  } catch (e) {
    console.error('Failed to save api key', e);
  }
}

export function getAiConfig(): AiConfig {
  try {
    const geminiApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
    const storedProvider = localStorage.getItem('fctx_ai_provider') as AiProvider | null;
    const ollamaEndpoint = localStorage.getItem('fctx_ollama_endpoint') || 'http://localhost:11434';
    const ollamaModel = localStorage.getItem('fctx_ollama_model') || 'qwen2.5:7b';

    let provider: AiProvider = 'ollama'; // Default to Ollama since user has local models!
    if (storedProvider) {
      provider = storedProvider;
    } else if (geminiApiKey) {
      provider = 'gemini';
    }

    return {
      provider,
      geminiApiKey,
      ollamaEndpoint,
      ollamaModel,
    };
  } catch {
    return {
      provider: 'ollama',
      geminiApiKey: '',
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'qwen2.5:7b',
    };
  }
}

export function saveAiConfig(config: AiConfig): void {
  try {
    localStorage.setItem('fctx_ai_provider', config.provider);
    localStorage.setItem(STORAGE_KEYS.API_KEY, config.geminiApiKey || '');
    localStorage.setItem('fctx_ollama_endpoint', config.ollamaEndpoint || 'http://localhost:11434');
    localStorage.setItem('fctx_ollama_model', config.ollamaModel || 'qwen2.5:7b');
  } catch (e) {
    console.error('Failed to save AI config', e);
  }
}

