import { apiRequest } from './api'
import { SonarrSeries, SonarrQueueItem, SonarrCalendarEntry, ApiResponse } from '../types'

export async function getSonarrSeries(
  baseUrl: string,
  apiKey: string
): Promise<ApiResponse<SonarrSeries[]>> {
  return apiRequest<SonarrSeries[]>({ baseUrl, endpoint: '/api/v3/series', apiKey })
}

export async function getSonarrQueue(
  baseUrl: string,
  apiKey: string
): Promise<ApiResponse<{ records: SonarrQueueItem[] }>> {
  return apiRequest({ baseUrl, endpoint: '/api/v3/queue', apiKey, params: { pageSize: 100 } })
}

export async function getSonarrCalendar(
  baseUrl: string,
  apiKey: string
): Promise<ApiResponse<SonarrCalendarEntry[]>> {
  const start = new Date()
  const end = new Date()
  end.setDate(end.getDate() + 7)
  return apiRequest<SonarrCalendarEntry[]>({
    baseUrl,
    endpoint: '/api/v3/calendar',
    apiKey,
    params: {
      start: start.toISOString(),
      end: end.toISOString()
    }
  })
}

export async function getSonarrStatus(
  baseUrl: string,
  apiKey: string
): Promise<ApiResponse<{ version: string }>> {
  return apiRequest({ baseUrl, endpoint: '/api/v3/system/status', apiKey })
}
