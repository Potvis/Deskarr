import { apiRequest } from './api'
import { SabnzbdSlot, SabnzbdHistorySlot, ApiResponse } from '../types'

export async function getSabnzbdQueue(
  baseUrl: string,
  apiKey: string
): Promise<ApiResponse<{ queue: { slots: SabnzbdSlot[]; speed: string; sizeleft: string; timeleft: string; paused: boolean } }>> {
  return apiRequest({
    baseUrl,
    endpoint: `/api?mode=queue&apikey=${encodeURIComponent(apiKey)}&output=json`
  })
}

export async function getSabnzbdHistory(
  baseUrl: string,
  apiKey: string
): Promise<ApiResponse<{ history: { slots: SabnzbdHistorySlot[] } }>> {
  return apiRequest({
    baseUrl,
    endpoint: `/api?mode=history&apikey=${encodeURIComponent(apiKey)}&output=json&limit=30`
  })
}

export async function getSabnzbdStatus(
  baseUrl: string,
  apiKey: string
): Promise<ApiResponse<{ version: string }>> {
  return apiRequest({
    baseUrl,
    endpoint: `/api?mode=version&apikey=${encodeURIComponent(apiKey)}&output=json`
  })
}

export async function pauseSabnzbd(baseUrl: string, apiKey: string): Promise<ApiResponse> {
  return apiRequest({
    baseUrl,
    endpoint: `/api?mode=pause&apikey=${encodeURIComponent(apiKey)}&output=json`
  })
}

export async function resumeSabnzbd(baseUrl: string, apiKey: string): Promise<ApiResponse> {
  return apiRequest({
    baseUrl,
    endpoint: `/api?mode=resume&apikey=${encodeURIComponent(apiKey)}&output=json`
  })
}
