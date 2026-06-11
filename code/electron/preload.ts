import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel: string, ...args: any[]) => {
    const validChannels = [
      'ping',
      'category:create',
      'category:list',
      'category:delete',
      'resource:create',
      'resource:list',
      'resource:update',
      'resource:delete',
      'reservation:create',
      'reservation:list',
      'reservation:update',
      'reservation:delete',
      'reservation:export',
      'penalty:create',
      'penalty:list',
      'penalty:delete',
      'user:penalty',
      'dialog:confirm',
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    return Promise.reject(new Error(`Invalid channel: ${channel}`));
  }
});
