declare global {
  interface Window {
    api: {
      getConfig: () => Promise<Record<string, unknown>>
      setConfig: (config: Record<string, unknown>) => Promise<boolean>
      request: (config: {
        baseUrl: string
        endpoint: string
        method?: string
        apiKey?: string
        headers?: Record<string, string>
        data?: unknown
        params?: unknown
        username?: string
        password?: string
        serviceType?: string
      }) => Promise<{ success: boolean; data?: unknown; error?: string; status?: number }>
      testConnection: (config: {
        baseUrl: string
        apiKey: string
        type: string
        username?: string
        password?: string
      }) => Promise<{ success: boolean; error?: string; status?: number; data?: unknown }>
    }
  }
}

export {}
