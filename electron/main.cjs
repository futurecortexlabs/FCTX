const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#08090d',
    title: 'FCTX // Morphic Workspace — Self-Evolving Ambient Interface',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allows direct zero-CORS communication with local Ollama
    },
  });

  // Determine whether to load dev server or local dist file
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5174';
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    // Check if dev server is accessible
    const req = http.get(devUrl, (res) => {
      mainWindow.loadURL(devUrl);
    });
    req.on('error', () => {
      // Fallback to local dist file
      const distPath = path.join(__dirname, '../dist/index.html');
      if (fs.existsSync(distPath)) {
        mainWindow.loadFile(distPath);
      } else {
        mainWindow.loadURL(devUrl);
      }
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Open external links in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for Native Local Workspace File Operations (.fctx)
ipcMain.handle('workspace:saveToFile', async (event, { data, suggestedName }) => {
  if (!mainWindow) return { success: false, error: 'No active window' };

  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'FCTX ワークスペースをローカルに保存',
    defaultPath: suggestedName || `fctx_workspace_${new Date().toISOString().slice(0, 10)}.fctx`,
    filters: [
      { name: 'FCTX Workspace File (*.fctx)', extensions: ['fctx'] },
      { name: 'JSON File (*.json)', extensions: ['json'] },
      { name: 'All Files (*.*)', extensions: ['*'] },
    ],
  });

  if (canceled || !filePath) {
    return { success: false, canceled: true };
  }

  try {
    await fs.promises.writeFile(filePath, data, 'utf-8');
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('workspace:loadFromFile', async () => {
  if (!mainWindow) return { success: false, error: 'No active window' };

  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'FCTX ワークスペースファイルを開く',
    filters: [
      { name: 'FCTX Workspace File (*.fctx, *.json)', extensions: ['fctx', 'json'] },
      { name: 'All Files (*.*)', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (canceled || filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  try {
    const content = await fs.promises.readFile(filePaths[0], 'utf-8');
    return { success: true, data: content, filePath: filePaths[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// App Lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
