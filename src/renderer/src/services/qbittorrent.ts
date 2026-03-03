import { apiRequest } from './api'
import { QbitTorrent, ApiResponse } from '../types'

export async function getQbitTorrents(
  baseUrl: string,
  username?: string,
  password?: string
): Promise<ApiResponse<QbitTorrent[]>> {
  return apiRequest<QbitTorrent[]>({
    baseUrl,
    endpoint: '/api/v2/torrents/info',
    serviceType: 'qbittorrent',
    username,
    password
  })
}

export async function getQbitTransferInfo(
  baseUrl: string,
  username?: string,
  password?: string
): Promise<ApiResponse<{ dl_info_speed: number; up_info_speed: number; dl_info_data: number; up_info_data: number }>> {
  return apiRequest({
    baseUrl,
    endpoint: '/api/v2/transfer/info',
    serviceType: 'qbittorrent',
    username,
    password
  })
}

export async function getQbitVersion(
  baseUrl: string,
  username?: string,
  password?: string
): Promise<ApiResponse<string>> {
  return apiRequest<string>({
    baseUrl,
    endpoint: '/api/v2/app/version',
    serviceType: 'qbittorrent',
    username,
    password
  })
}

export async function pauseQbitTorrent(
  baseUrl: string,
  hash: string,
  username?: string,
  password?: string
): Promise<ApiResponse> {
  return apiRequest({
    baseUrl,
    endpoint: '/api/v2/torrents/pause',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: `hashes=${hash}`,
    serviceType: 'qbittorrent',
    username,
    password
  })
}

export async function resumeQbitTorrent(
  baseUrl: string,
  hash: string,
  username?: string,
  password?: string
): Promise<ApiResponse> {
  return apiRequest({
    baseUrl,
    endpoint: '/api/v2/torrents/resume',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: `hashes=${hash}`,
    serviceType: 'qbittorrent',
    username,
    password
  })
}
