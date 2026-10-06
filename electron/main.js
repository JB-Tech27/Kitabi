const { app, BrowserWindow, ipcMain, protocol, net, session } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const { ZodError } = require('zod');
const db = require('./db');
const { schemas } = require('./validation');

const isDev = !app.isPackaged && process.env.NODE_ENV === 'development';
const DEV_URL = 'http://localhost:5173';
const APP_ORIGIN = 'app://kitabi';
const DIST = path.join(__dirname, '../dist');

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

function registerAppProtocol() {
  protocol.handle('app', async (request) => {
    try {
      const { pathname } = new URL(request.url);
      const rel = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
      const file = path.normalize(path.join(DIST, rel));
      if (!file.startsWith(DIST + path.sep)) return new Response('Forbidden', { status: 403 });
      const res = await net.fetch(pathToFileURL(file).toString());
      const headers = new Headers(res.headers);
      headers.set('Content-Security-Policy', CSP);
      return new Response(res.body, { status: res.status, headers });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
}

function isTrustedSender(event) {
  const url = event.senderFrame ? event.senderFrame.url : '';
  return isDev ? url.startsWith(DEV_URL) : url.startsWith(`${APP_ORIGIN}/`);
}

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
      sandbox: true,
      webSecurity: true,
    },
  });

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e, url) => {
    const allowed = isDev ? DEV_URL : APP_ORIGIN;
    if (!url.startsWith(allowed)) e.preventDefault();
  });

  if (isDev) win.loadURL(DEV_URL);
  else win.loadURL(`${APP_ORIGIN}/index.html`);
}

const handlers = {
  'books:list': [schemas.query, (q) => db.booksList(q)],
  'books:save': [schemas.book, (b) => db.booksSave(b)],
  'books:delete': [schemas.id, (id) => db.remove('books', id)],
  'members:list': [schemas.query, (q) => db.membersList(q)],
  'members:save': [schemas.member, (m) => db.membersSave(m)],
  'members:delete': [schemas.id, (id) => db.remove('members', id)],
  'loans:list': [schemas.none, () => db.loansList()],
  'loans:create': [schemas.loan, (l) => db.loansCreate(l)],
  'loans:return': [schemas.id, (id) => db.loansReturn(id)],
  'stats:get': [schemas.none, () => db.stats()],
};

function toErrorMessage(err) {
  if (err instanceof ZodError) return err.issues[0]?.message || 'بيانات غير صالحة';
  if (err && err.name === 'AppError') return err.message;
  console.error(err);
  return 'حدث خطأ غير متوقع';
}

function registerIpc() {
  for (const [channel, [schema, fn]] of Object.entries(handlers)) {
    ipcMain.handle(channel, async (event, payload) => {
      if (!isTrustedSender(event)) return { ok: false, error: 'مصدر غير موثوق' };
      try {
        return { ok: true, data: fn(schema.parse(payload)) };
      } catch (err) {
        return { ok: false, error: toErrorMessage(err) };
      }
    });
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
    db.init();
    if (!isDev) registerAppProtocol();
    registerIpc();
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('before-quit', () => db.close());
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
