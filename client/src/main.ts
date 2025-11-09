import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;

/**
 * Parse command-line arguments for pre-populating connection form
 * Supports: --gateway-url, --space-name, --username, --token
 */
function parseCommandLineArgs(): URLSearchParams {
  const params = new URLSearchParams();
  const args = process.argv.slice(1); // Skip electron executable

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--gateway-url=')) {
      params.set('gatewayUrl', arg.split('=')[1]);
    } else if (arg === '--gateway-url' && args[i + 1]) {
      params.set('gatewayUrl', args[++i]);
    } else if (arg.startsWith('--space-name=')) {
      params.set('spaceName', arg.split('=')[1]);
    } else if (arg === '--space-name' && args[i + 1]) {
      params.set('spaceName', args[++i]);
    } else if (arg.startsWith('--username=')) {
      params.set('username', arg.split('=')[1]);
    } else if (arg === '--username' && args[i + 1]) {
      params.set('username', args[++i]);
    } else if (arg.startsWith('--token=')) {
      params.set('token', arg.split('=')[1]);
    } else if (arg === '--token' && args[i + 1]) {
      params.set('token', args[++i]);
    }
  }

  return params;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: 'Seacat',
    backgroundColor: '#667eea',
  });

  // Parse command-line args and append as query params
  const params = parseCommandLineArgs();
  const indexPath = path.join(__dirname, '../index.html');
  const queryString = params.toString();
  const urlToLoad = queryString ? `file://${indexPath}?${queryString}` : indexPath;

  if (queryString) {
    mainWindow.loadURL(urlToLoad);
    console.log('Loading with pre-populated args:', queryString);
  } else {
    mainWindow.loadFile(indexPath);
  }

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
