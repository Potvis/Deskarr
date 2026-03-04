import { apiRequest } from './api'
import {
  SonarrSeries,
  SonarrEpisode,
  SonarrQueueItem,
  SonarrCalendarEntry,
  QualityProfile,
  ApiResponse
} from '../types'

export async function getSonarrSeries(
  baseUrl: string,
  apiKey: string
): Promise<ApiResponse<SonarrSeries[]>> {
  return apiRequest<SonarrSeries[]>({ baseUrl, endpoint: '/api/v3/series', apiKey })
}

export async function getSonarrSeriesById(
  baseUrl: string,
  apiKey: string,
  seriesId: number
): Promise<ApiResponse<SonarrSeries>> {
  return apiRequest<SonarrSeries>({ baseUrl, endpoint: `/api/v3/series/${seriesId}`, apiKey })
}

export async function getSonarrEpisodes(
  baseUrl: string,
  apiKey: string,
  seriesId: number
): Promise<ApiResponse<SonarrEpisode[]>> {
  return apiRequest<SonarrEpisode[]>({
    baseUrl,
    endpoint: '/api/v3/episode',
    apiKey,
    params: { seriesId }
  })
}

export async function getSonarrQueue(
  baseUrl: string,
  apiKey: string
): Promise<ApiResponse<{ records: SonarrQueueItem[] }>> {
  return apiRequest({
    baseUrl,
    endpoint: '/api/v3/queue',
    apiKey,
    params: { pageSize: 100, includeUnknownSeriesItems: false }
  })
}

export async function getSonarrCalendar(
  baseUrl: string,
  apiKey: string,
  days: number = 7
): Promise<ApiResponse<SonarrCalendarEntry[]>> {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setDate(end.getDate() + days)
  return apiRequest<SonarrCalendarEntry[]>({
    baseUrl,
    endpoint: '/api/v3/calendar',
    apiKey,
    params: {
      start: start.toISOString(),
      end: end.toISOString(),
      includeSeries: true
    }
  })
}

export async function getSonarrProfiles(
  baseUrl: string,
  apiKey: string
): Promise<ApiResponse<QualityProfile[]>> {
  return apiRequest<QualityProfile[]>({ baseUrl, endpoint: '/api/v3/qualityprofile', apiKey })
}

export async function getSonarrStatus(
  baseUrl: string,
  apiKey: string
): Promise<ApiResponse<{ version: string }>> {
  return apiRequest({ baseUrl, endpoint: '/api/v3/system/status', apiKey })
}

// Commands
export async function searchSonarrSeries(
  baseUrl: string,
  apiKey: string,
  seriesId: number
): Promise<ApiResponse> {
  return apiRequest({
    baseUrl,
    endpoint: '/api/v3/command',
    apiKey,
    method: 'POST',
    data: { name: 'SeriesSearch', seriesId }
  })
}

export async function refreshSonarrSeries(
  baseUrl: string,
  apiKey: string,
  seriesId: number
): Promise<ApiResponse> {
  return apiRequest({
    baseUrl,
    endpoint: '/api/v3/command',
    apiKey,
    method: 'POST',
    data: { name: 'RefreshSeries', seriesId }
  })
}

// Toggle monitoring
export async function updateSonarrSeriesMonitor(
  baseUrl: string,
  apiKey: string,
  series: SonarrSeries,
  monitored: boolean
): Promise<ApiResponse<SonarrSeries>> {
  return apiRequest<SonarrSeries>({
    baseUrl,
    endpoint: `/api/v3/series/${series.id}`,
    apiKey,
    method: 'PUT',
    data: { ...series, monitored }
  })
}

export async function updateSonarrEpisodeMonitor(
  baseUrl: string,
  apiKey: string,
  episodeIds: number[],
  monitored: boolean
): Promise<ApiResponse> {
  return apiRequest({
    baseUrl,
    endpoint: '/api/v3/episode/monitor',
    apiKey,
    method: 'PUT',
    data: { episodeIds, monitored }
  })
}

// Search for season
export async function searchSonarrSeason(
  baseUrl: string,
  apiKey: string,
  seriesId: number,
  seasonNumber: number
): Promise<ApiResponse> {
  return apiRequest({
    baseUrl,
    endpoint: '/api/v3/command',
    apiKey,
    method: 'POST',
    data: { name: 'SeasonSearch', seriesId, seasonNumber }
  })
}

// Lookup for adding
export async function lookupSonarrSeries(
  baseUrl: string,
  apiKey: string,
  term: string
): Promise<ApiResponse<SonarrSeries[]>> {
  return apiRequest<SonarrSeries[]>({
    baseUrl,
    endpoint: '/api/v3/series/lookup',
    apiKey,
    params: { term }
  })
}
