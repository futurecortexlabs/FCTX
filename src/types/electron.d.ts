export interface FCTXDesktopAPI {
  isElectron: boolean;
  platform: string;
  saveWorkspaceFile: (data: string, suggestedName?: string) => Promise<{
    success: boolean;
    filePath?: string;
    canceled?: boolean;
    error?: string;
  }>;
  loadWorkspaceFile: () => Promise<{
    success: boolean;
    data?: string;
    filePath?: string;
    canceled?: boolean;
    error?: string;
  }>;
}

declare global {
  interface Window {
    fctxDesktop?: FCTXDesktopAPI;
  }
}
