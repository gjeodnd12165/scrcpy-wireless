import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getDevices: () => ipcRenderer.invoke('get-devices'),
  pairDevice: (hostPort: string, pairingCode: string) =>
    ipcRenderer.invoke('pair-device', hostPort, pairingCode),
  connectDevice: (hostPort: string) => ipcRenderer.invoke('connect-device', hostPort),
  startScrcpy: (deviceId: string, options: string) =>
    ipcRenderer.invoke('start-scrcpy', deviceId, options),
  enableTcpip: (deviceId: string) => ipcRenderer.invoke('enable-tcpip', deviceId),
  disconnectDevice: (deviceId: string) => ipcRenderer.invoke('disconnect-device', deviceId)
})
