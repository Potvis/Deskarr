import { ApiResponse } from '../types'

export async function apiRequest<T = unknown>(config: {
  baseUrl: string
  endpoint: string
  method?: string
  apiKey?: string
  headers?: Record<string, string>
  data?: unknown
  params?: Record<string, string | number | boolean>
}): Promise<ApiResponse<T>> {
  const result = await window.api.request(config)
  return result as ApiResponse<T>
}
