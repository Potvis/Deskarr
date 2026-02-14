import { apiRequest } from './api'
import { RadarrMovie, RadarrQueueItem, ApiResponse } from '../types'

export async function getRadarrMovies(
  baseUrl: string,
  apiKey: string
): Promise<ApiResponse<RadarrMovie[]>> {
  return apiRequest<RadarrMovie[]>({ baseUrl, endpoint: '/api/v3/movie', apiKey })
}

export async function getRadarrQueue(
  baseUrl: string,
  apiKey: string
): Promise<ApiResponse<{ records: RadarrQueueItem[] }>> {
  return apiRequest({ baseUrl, endpoint: '/api/v3/queue', apiKey, params: { pageSize: 100 } })
}

export async function getRadarrCalendar(
  baseUrl: string,
  apiKey: string
): Promise<ApiResponse<RadarrMovie[]>> {
  const start = new Date()
  const end = new Date()
  end.setDate(end.getDate() + 30)
  return apiRequest<RadarrMovie[]>({
    baseUrl,
    endpoint: '/api/v3/calendar',
    apiKey,
    params: {
      start: start.toISOString(),
      end: end.toISOString()
    }
  })
}

export async function getRadarrStatus(
  baseUrl: string,
  apiKey: string
): Promise<ApiResponse<{ version: string }>> {
  return apiRequest({ baseUrl, endpoint: '/api/v3/system/status', apiKey })
}
