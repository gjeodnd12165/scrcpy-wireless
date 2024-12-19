declare global {
  interface Window {
    electronAPI: {
      /**
       * Get list of connected Android devices
       * @returns Promise<Array<AndroidDevice>>
       */
      getDevices: () => Promise<
        Array<{
          id: string
          model: string
          status: string
          connectionMode: 'usb' | 'tcpip' | 'unknown'
        }>
      >

      /**
       * Pair a new Android device using host:port and pairing code
       * @param hostPort - The host:port combination (e.g. "192.168.1.100:40001")
       * @param pairingCode - The pairing code shown on Android device
       * @returns Promise<string> - Result message from adb
       */
      pairDevice: (hostPort: string, pairingCode: string) => Promise<string>

      /**
       * Start scrcpy with the specified device and options
       * @param deviceId - The device identifier from adb devices
       * @param options - Additional scrcpy command line options
       * @returns Promise<void>
       */
      startScrcpy: (deviceId: string, options: string) => Promise<void>

      /**
       * Connect to a device using host:port
       * @param hostPort - The host:port combination (e.g. "192.168.1.100:5555")
       * @returns Promise<string> - Result message from adb
       */
      connectDevice: (hostPort: string) => Promise<string>

      /**
       * Enable TCP/IP mode on port 5555
       * @param deviceId - The device identifier from adb devices
       * @returns Promise<string> - Result message from adb
       */
      enableTcpip: (deviceId: string) => Promise<string>
    }
  }
}

export {}
