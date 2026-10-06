const { contextBridge, ipcRenderer } = require('electron');

const allowed = [
  'books:list', 'books:save', 'books:delete',
  'members:list', 'members:save', 'members:delete',
  'loans:list', 'loans:create', 'loans:return', 'stats:get',
];

contextBridge.exposeInMainWorld('api', {
  invoke: (channel, payload) => {
    if (!allowed.includes(channel)) return Promise.reject(new Error('channel not allowed'));
    return ipcRenderer.invoke(channel, payload);
  },
});
