import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import axios from 'axios'

const configPath = join(app.getPath('userData'), 'deskarr-config.json')

// qBittorrent session cookie store: baseUrl -> SID cookie
const qbitSessions: Record<string, string> = {}

async function qbitLogin(baseUrl: string, username: string, password: string): Promise<string> {
  const response = await axios({
    method: 'POST',
    url: `${baseUrl}/api/v2/auth/login`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
    timeout: 10000
  })
  const setCookie = response.headers['set-cookie']
  if (setCookie) {
    for (const cookie of setCookie) {
      const match = cookie.match(/SID=([^;]+)/)
      if (match) {
        qbitSessions[baseUrl] = match[1]
        return match[1]
      }
    }
  }
  if (response.data === 'Ok.') {
    return ''
  }
  throw new Error('Login failed: invalid credentials')
}

async function qbitRequestWithAuth(
  baseUrl: string,
  endpoint: string,
  method: string = 'GET',
  username?: string,
  password?: string,
  data?: unknown,
  headers?: Record<string, string>
): Promise<{ success: boolean; data?: unknown; error?: string; status?: number }> {
  const makeRequest = async (sid?: string) => {
    const reqHeaders: Record<string, string> = { ...headers }
    if (sid) reqHeaders['Cookie'] = `SID=${sid}`
    return axios({
      method,
      url: `${baseUrl}${endpoint}`,
      headers: reqHeaders,
      data,
      timeout: 15000
    })
  }

  try {
    const sid = qbitSessions[baseUrl]
    if (!sid && username && password) {
      const newSid = await qbitLogin(baseUrl, username, password)
      const response = await makeRequest(newSid)
      return { success: true, data: response.data, status: response.status }
    }
    const response = await makeRequest(sid)
    return { success: true, data: response.data, status: response.status }
  } catch (error: unknown) {
    const err = error as { response?: { status: number; data: unknown }; message: string }
    if (err.response?.status === 403 && username && password) {
      try {
        const newSid = await qbitLogin(baseUrl, username, password)
        const response = await makeRequest(newSid)
        return { success: true, data: response.data, status: response.status }
      } catch (loginError: unknown) {
        const le = loginError as { message: string; response?: { status: number; data: unknown } }
        return { success: false, error: le.message, status: le.response?.status }
      }
    }
    return { success: false, error: err.message, status: err.response?.status, data: err.response?.data }
  }
}

function getConfig(): Record<string, unknown> {
  try {
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, 'utf-8'))
    }
  } catch (e) {
    console.error('Failed to read config:', e)
  }
  return { services: {} }
}

function setConfig(config: Record<string, unknown>): void {
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2))
  } catch (e) {
    console.error('Failed to write config:', e)
  }
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: 'Deskarr',
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// IPC: Config management
ipcMain.handle('get-config', () => getConfig())
ipcMain.handle('set-config', (_event, config) => {
  setConfig(config)
  return true
})

// IPC: API proxy (avoids CORS in renderer)
ipcMain.handle('api-request', async (_event, { baseUrl, endpoint, method, apiKey, headers, data, params, username, password, serviceType }) => {
  // Route qBittorrent requests through session-based auth
  if (serviceType === 'qbittorrent') {
    return qbitRequestWithAuth(baseUrl, endpoint, method || 'GET', username, password, data, headers)
  }

  try {
    const reqHeaders: Record<string, string> = { ...headers }
    if (apiKey) {
      reqHeaders['X-Api-Key'] = apiKey
    }
    const response = await axios({
      method: method || 'GET',
      url: `${baseUrl}${endpoint}`,
      headers: reqHeaders,
      data,
      params,
      timeout: 15000
    })
    return { success: true, data: response.data, status: response.status }
  } catch (error: unknown) {
    const err = error as { message: string; response?: { status: number; data: unknown } }
    return {
      success: false,
      error: err.message,
      status: err.response?.status,
      data: err.response?.data
    }
  }
})

// IPC: Test connection for a service
ipcMain.handle('test-connection', async (_event, { baseUrl, apiKey, type, username, password }) => {
  try {
    let endpoint = ''
    const headers: Record<string, string> = {}

    switch (type) {
      case 'sonarr':
      case 'radarr':
      case 'lidarr':
      case 'readarr':
        endpoint = '/api/v3/system/status'
        headers['X-Api-Key'] = apiKey
        break
      case 'prowlarr':
        endpoint = '/api/v1/system/status'
        headers['X-Api-Key'] = apiKey
        break
      case 'sabnzbd':
        endpoint = `/api?mode=version&apikey=${encodeURIComponent(apiKey)}&output=json`
        break
      case 'qbittorrent': {
        // qBittorrent uses session auth with username/password
        const qbitResult = await qbitRequestWithAuth(
          baseUrl, '/api/v2/app/version', 'GET', username, password
        )
        return qbitResult
      }
      case 'deluge':
        endpoint = '/json'
        break
      case 'transmission':
        endpoint = '/transmission/rpc'
        break
      case 'tautulli':
        endpoint = `/api/v2?apikey=${encodeURIComponent(apiKey)}&cmd=arnold`
        break
      case 'overseerr':
        endpoint = '/api/v1/status'
        headers['X-Api-Key'] = apiKey
        break
      case 'plex':
        endpoint = '/identity'
        if (apiKey) headers['X-Plex-Token'] = apiKey
        break
      case 'jellyfin':
        endpoint = '/System/Info/Public'
        break
      default:
        endpoint = '/'
    }

    const response = await axios({
      method: 'GET',
      url: `${baseUrl}${endpoint}`,
      headers,
      timeout: 10000
    })
    return { success: true, status: response.status, data: response.data }
  } catch (error: unknown) {
    const err = error as { message: string; response?: { status: number } }
    return { success: false, error: err.message, status: err.response?.status }
  }
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
