import { contextBridge, ipcRenderer } from 'electron'

const api = {
  getConfig: (): Promise<Record<string, unknown>> => ipcRenderer.invoke('get-config'),
  setConfig: (config: Record<string, unknown>): Promise<boolean> =>
    ipcRenderer.invoke('set-config', config),
  request: (config: {
    baseUrl: string
    endpoint: string
    method?: string
    apiKey?: string
    headers?: Record<string, string>
    data?: unknown
    params?: unknown
  }): Promise<{ success: boolean; data?: unknown; error?: string; status?: number }> =>
    ipcRenderer.invoke('api-request', config),
  testConnection: (config: {
    baseUrl: string
    apiKey: string
    type: string
  }): Promise<{ success: boolean; error?: string; status?: number; data?: unknown }> =>
    ipcRenderer.invoke('test-connection', config)
}

contextBridge.exposeInMainWorld('api', api)
