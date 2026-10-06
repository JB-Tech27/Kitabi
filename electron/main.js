const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./db');

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 640,
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  if (isDev) win.loadURL('http://localhost:5173');
  else win.loadFile(path.join(__dirname, '../dist/index.html'));
}

const handlers = {
  'books:list': (q) => db.booksList(q),
  'books:save': (b) => db.booksSave(b),
  'books:delete': (id) => db.remove('books', id),
  'members:list': (q) => db.membersList(q),
  'members:save': (m) => db.membersSave(m),
  'members:delete': (id) => db.remove('members', id),
  'loans:list': () => db.loansList(),
  'loans:create': (l) => db.loansCreate(l),
  'loans:return': (id) => db.loansReturn(id),
  'stats:get': () => db.stats(),
};

app.whenReady().then(() => {
  db.init();
  for (const [channel, fn] of Object.entries(handlers)) {
    ipcMain.handle(channel, async (_e, payload) => {
      try {
        return { ok: true, data: fn(payload) };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    });
  }
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
