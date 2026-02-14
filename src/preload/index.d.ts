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
      }) => Promise<{ success: boolean; data?: unknown; error?: string; status?: number }>
      testConnection: (config: {
        baseUrl: string
        apiKey: string
        type: string
      }) => Promise<{ success: boolean; error?: string; status?: number; data?: unknown }>
    }
  }
}

export {}
