import { AndroidDevice } from '../../../types'

interface ElectronAPI {
  getDevices: () => Promise<AndroidDevice[]>
  pairDevice: (hostPort: string, pairingCode: string) => Promise<string>
  startScrcpy: (deviceId: string, options: string) => Promise<void>
  connectDevice: (hostPort: string) => Promise<string>
  enableTcpip: (deviceId: string) => Promise<string>
  disconnectDevice: (deviceId: string) => Promise<string>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
