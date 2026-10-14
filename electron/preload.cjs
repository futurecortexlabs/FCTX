const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('fctxDesktop', {
  isElectron: true,
  platform: process.platform,
  saveWorkspaceFile: (data, suggestedName) =>
    ipcRenderer.invoke('workspace:saveToFile', { data, suggestedName }),
  loadWorkspaceFile: () =>
    ipcRenderer.invoke('workspace:loadFromFile'),
});
