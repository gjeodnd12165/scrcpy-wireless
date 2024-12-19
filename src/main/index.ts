import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { exec } from 'child_process'
import { existsSync, mkdirSync, appendFileSync, writeFileSync } from 'fs'
import icon from '../../resources/icon.png?asset'
import { dirname } from 'path'

const appPath = app.isPackaged
  ? process.env.APPIMAGE
    ? dirname(process.env.APPIMAGE)
    : dirname(app.getPath('exe'))
  : app.getAppPath()

const scrcpyPath = join(appPath, 'scrcpy')
const adbPath = join(scrcpyPath, process.platform === 'win32' ? 'adb.exe' : 'adb')
const scrcpyExePath = join(scrcpyPath, process.platform === 'win32' ? 'scrcpy.exe' : 'scrcpy')

// Check required files
function checkRequiredFiles(): boolean {
  const missingFiles: string[] = []
  const debugInfo: string[] = []

  // Use app.getPath('userData') instead of appPath for logs
  const logsDir = join(app.getPath('userData'), 'logs')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const logPath = join(logsDir, `debug-${timestamp}.log`)

  try {
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true })
    }
  } catch (error) {
    dialog.showErrorBox('Error Creating Logs', `Failed to create logs directory: ${error}`)
  }

  function log(message: string) {
    debugInfo.push(message)
    try {
      appendFileSync(logPath, message + '\n')
    } catch (error) {
      console.error('Failed to write log:', error)
    }
  }

  // Write initial log header
  try {
    writeFileSync(logPath, `=== Debug Log Started at ${timestamp} ===\n`)
  } catch (error) {
    console.error('Failed to initialize log file:', error)
  }

  // Rest of your logging code remains the same
  log(`App path: ${appPath}`)
  log(`ADB path: ${adbPath}`)
  log(`Scrcpy path: ${scrcpyExePath}`)
  log(`Platform: ${process.platform}`)
  log(`Process type: ${process.type}`)
  log(`Is packaged: ${app.isPackaged}`)

  if (!existsSync(adbPath)) {
    missingFiles.push('adb')
  }
  if (!existsSync(scrcpyExePath)) {
    missingFiles.push('scrcpy')
  }

  if (missingFiles.length > 0) {
    dialog.showErrorBox(
      'Missing Required Files',
      `Please place the following files in the "scrcpy" folder:\n${missingFiles.join('\n')}\n\nThe app will now exit.`
    )
    return false
  }

  return true
}

// Types
interface AndroidDevice {
  id: string
  model: string
  status: string
  connectionMode: ConnectionMode
}
type ConnectionMode = 'usb' | 'tcpip' | 'unknown'

// Scrcpy Service
class ScrcpyService {
  private adbPath: string
  private scrcpyPath: string

  constructor(adbPath: string, scrcpyPath: string) {
    this.adbPath = adbPath
    this.scrcpyPath = scrcpyPath
  }

  async getDevices(): Promise<AndroidDevice[]> {
    console.log('Getting connected devices...')

    try {
      const stdout = await this.executeAdb('devices -l')
      console.log('Raw ADB devices output:', stdout)

      const devices: AndroidDevice[] = []
      const lines = stdout.split('\n').slice(1)

      for (const line of lines) {
        const match = line.match(/^(\S+)\s+device\s+(.*)$/)
        if (match) {
          const [, id, details] = match
          const modelMatch = details.match(/model:(\S+)/)

          // Check if device is connected via TCP/IP (has IP address in ID)
          const connectionMode: ConnectionMode = id.includes(':5555')
            ? 'tcpip'
            : id.includes('.')
              ? 'tcpip'
              : 'usb'

          const device = {
            id,
            model: modelMatch ? modelMatch[1] : 'Unknown',
            status: 'device',
            connectionMode
          }
          console.log('Found device:', device)
          devices.push(device)
        }
      }

      console.log('Total devices found:', devices.length)
      return devices
    } catch (error) {
      console.error('Failed to get devices:', error)
      throw error
    }
  }

  async pairDevice(hostPort: string, pairingCode: string): Promise<string> {
    const command = `pair "${hostPort}" "${pairingCode}"`
    console.log(`Executing ADB command: ${command}`)

    try {
      const result = await this.executeAdb(command)
      console.log('Pairing result:', result)
      return result
    } catch (error) {
      console.error('Pairing failed:', error)
      throw error
    }
  }

  async startScrcpy(deviceId: string, options: string = ''): Promise<void> {
    const command = options
      ? `"${this.scrcpyPath}" -s ${deviceId} ${options}`
      : `"${this.scrcpyPath}" -s ${deviceId}`

    console.log(`Executing scrcpy command: ${command}`)

    return new Promise((resolve, reject) => {
      const process = exec(command, (error) => {
        if (error) {
          console.error('Scrcpy failed:', error)
          reject(error)
          return
        }
        resolve()
      })

      // Log stdout and stderr
      process.stdout?.on('data', (data) => {
        console.log('Scrcpy output:', data.toString())
      })

      process.stderr?.on('data', (data) => {
        console.error('Scrcpy error:', data.toString())
      })
    })
  }

  async connectDevice(hostPort: string): Promise<string> {
    const command = `connect ${hostPort}`
    console.log(`Executing ADB connect command: ${command}`)

    try {
      const result = await this.executeAdb(command)
      console.log('Connect result:', result)
      return result
    } catch (error) {
      console.error('Connect failed:', error)
      throw error
    }
  }

  async checkWirelessDebugging(deviceId: string): Promise<boolean> {
    try {
      const command = `-s ${deviceId} shell getprop service.adb.tcp.port`
      console.log(`Checking wireless debugging status: ${command}`)
      const result = await this.executeAdb(command)
      console.log('Wireless debugging status:', result)
      return result.trim() === '5555'
    } catch (error) {
      console.error('Failed to check wireless debugging:', error)
      return false
    }
  }

  async enableTcpip(deviceId: string): Promise<string> {
    // First check if it's already enabled
    const isEnabled = await this.checkWirelessDebugging(deviceId)
    if (isEnabled) {
      return 'Wireless debugging is already enabled on port 5555'
    }

    const command = `-s ${deviceId} tcpip 5555`
    console.log(`Enabling TCP/IP on device: ${command}`)

    try {
      const result = await this.executeAdb(command)
      console.log('TCP/IP result:', result)
      return result
    } catch (error) {
      console.error('TCP/IP enable failed:', error)
      throw error
    }
  }

  async disconnectDevice(deviceId: string): Promise<string> {
    const command = `disconnect ${deviceId}`
    console.log(`Executing ADB disconnect command: ${command}`)

    try {
      const result = await this.executeAdb(command)
      console.log('Disconnect result:', result)
      return result
    } catch (error) {
      console.error('Disconnect failed:', error)
      throw error
    }
  }

  private executeAdb(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = exec(`"${this.adbPath}" ${command}`, (error, stdout) => {
        if (error) {
          reject(error)
          return
        }
        resolve(stdout.trim())
      })

      // Log stderr for debugging
      process.stderr?.on('data', (data) => {
        console.error('ADB error:', data.toString())
      })
    })
  }
}

// Initialize service
const scrcpyService = new ScrcpyService(adbPath, scrcpyExePath)

// Setup IPC handlers
function setupScrcpyHandlers(): void {
  ipcMain.handle('get-devices', () => scrcpyService.getDevices())

  ipcMain.handle('pair-device', (_, hostPort: string, pairingCode: string) =>
    scrcpyService.pairDevice(hostPort, pairingCode)
  )

  ipcMain.handle('connect-device', (_, hostPort: string) => scrcpyService.connectDevice(hostPort))

  ipcMain.handle('start-scrcpy', (_, deviceId: string, options: string) =>
    scrcpyService.startScrcpy(deviceId, options)
  )

  ipcMain.handle('enable-tcpip', (_, deviceId: string) => scrcpyService.enableTcpip(deviceId))

  ipcMain.handle('disconnect-device', (_, deviceId: string) =>
    scrcpyService.disconnectDevice(deviceId)
  )
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1600,
    minHeight: 900,
    resizable: false,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Center the window
  mainWindow.center()

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Check required files before starting
  if (!checkRequiredFiles()) {
    app.quit()
    return
  }

  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Setup scrcpy handlers
  setupScrcpyHandlers()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
