import { apiRequest } from './api'
import { RadarrMovie, RadarrQueueItem, QualityProfile, ApiResponse } from '../types'

export async function getRadarrMovies(
  baseUrl: string,
  apiKey: string
): Promise<ApiResponse<RadarrMovie[]>> {
  return apiRequest<RadarrMovie[]>({ baseUrl, endpoint: '/api/v3/movie', apiKey })
}

export async function getRadarrMovieById(
  baseUrl: string,
  apiKey: string,
  movieId: number
): Promise<ApiResponse<RadarrMovie>> {
  return apiRequest<RadarrMovie>({ baseUrl, endpoint: `/api/v3/movie/${movieId}`, apiKey })
}

export async function getRadarrQueue(
  baseUrl: string,
  apiKey: string
): Promise<ApiResponse<{ records: RadarrQueueItem[] }>> {
  return apiRequest({
    baseUrl,
    endpoint: '/api/v3/queue',
    apiKey,
    params: { pageSize: 100, includeUnknownMovieItems: false }
  })
}

export async function getRadarrCalendar(
  baseUrl: string,
  apiKey: string,
  days: number = 30
): Promise<ApiResponse<RadarrMovie[]>> {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setDate(end.getDate() + days)
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

export async function getRadarrProfiles(
  baseUrl: string,
  apiKey: string
): Promise<ApiResponse<QualityProfile[]>> {
  return apiRequest<QualityProfile[]>({ baseUrl, endpoint: '/api/v3/qualityprofile', apiKey })
}

export async function getRadarrStatus(
  baseUrl: string,
  apiKey: string
): Promise<ApiResponse<{ version: string }>> {
  return apiRequest({ baseUrl, endpoint: '/api/v3/system/status', apiKey })
}

// Commands
export async function searchRadarrMovie(
  baseUrl: string,
  apiKey: string,
  movieIds: number[]
): Promise<ApiResponse> {
  return apiRequest({
    baseUrl,
    endpoint: '/api/v3/command',
    apiKey,
    method: 'POST',
    data: { name: 'MoviesSearch', movieIds }
  })
}

export async function refreshRadarrMovie(
  baseUrl: string,
  apiKey: string,
  movieId: number
): Promise<ApiResponse> {
  return apiRequest({
    baseUrl,
    endpoint: '/api/v3/command',
    apiKey,
    method: 'POST',
    data: { name: 'RefreshMovie', movieId }
  })
}

// Toggle monitoring
export async function updateRadarrMovieMonitor(
  baseUrl: string,
  apiKey: string,
  movie: RadarrMovie,
  monitored: boolean
): Promise<ApiResponse<RadarrMovie>> {
  return apiRequest<RadarrMovie>({
    baseUrl,
    endpoint: `/api/v3/movie/${movie.id}`,
    apiKey,
    method: 'PUT',
    data: { ...movie, monitored }
  })
}

// Lookup for adding
export async function lookupRadarrMovie(
  baseUrl: string,
  apiKey: string,
  term: string
): Promise<ApiResponse<RadarrMovie[]>> {
  return apiRequest<RadarrMovie[]>({
    baseUrl,
    endpoint: '/api/v3/movie/lookup',
    apiKey,
    params: { term }
  })
}
