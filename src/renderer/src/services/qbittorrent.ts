import { apiRequest } from './api'
import { QbitTorrent, ApiResponse } from '../types'

export async function getQbitTorrents(baseUrl: string): Promise<ApiResponse<QbitTorrent[]>> {
  return apiRequest<QbitTorrent[]>({
    baseUrl,
    endpoint: '/api/v2/torrents/info'
  })
}

export async function getQbitTransferInfo(
  baseUrl: string
): Promise<ApiResponse<{ dl_info_speed: number; up_info_speed: number; dl_info_data: number; up_info_data: number }>> {
  return apiRequest({
    baseUrl,
    endpoint: '/api/v2/transfer/info'
  })
}

export async function getQbitVersion(baseUrl: string): Promise<ApiResponse<string>> {
  return apiRequest<string>({
    baseUrl,
    endpoint: '/api/v2/app/version'
  })
}

export async function pauseQbitTorrent(baseUrl: string, hash: string): Promise<ApiResponse> {
  return apiRequest({
    baseUrl,
    endpoint: '/api/v2/torrents/pause',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: `hashes=${hash}`
  })
}

export async function resumeQbitTorrent(baseUrl: string, hash: string): Promise<ApiResponse> {
  return apiRequest({
    baseUrl,
    endpoint: '/api/v2/torrents/resume',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: `hashes=${hash}`
  })
}
