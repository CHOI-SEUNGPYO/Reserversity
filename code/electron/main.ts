import { app, BrowserWindow, Menu } from 'electron';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// DB를 userData 폴더에 저장 (asar은 읽기전용이라 SQLite가 열지 못함)
// 개발: ./prisma/dev.db, 프로덕션: %APPDATA%/Reserversity/dev.db
let dbPath: string;
if (process.env.VITE_DEV_SERVER_URL) {
  dbPath = path.join(app.getAppPath(), 'prisma', 'dev.db');
} else {
  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, 'dev.db');

  // 최초 실행 시 빈 DB 템플릿을 userData로 복사
  if (!fs.existsSync(dbPath)) {
    const templatePath = path.join(
      process.resourcesPath,
      'app.asar.unpacked',
      'prisma',
      'dev.db'
    );
    if (fs.existsSync(templatePath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
      fs.copyFileSync(templatePath, dbPath);
    }
  }
}
process.env.DATABASE_URL = `file:${dbPath}`;

import { setupIpcHandlers } from '../src/main/adapters/ipc/handlers';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
