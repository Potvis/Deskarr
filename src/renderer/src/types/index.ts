export type ServiceType =
  | 'sonarr'
  | 'radarr'
  | 'lidarr'
  | 'readarr'
  | 'prowlarr'
  | 'sabnzbd'
  | 'nzbget'
  | 'qbittorrent'
  | 'deluge'
  | 'transmission'
  | 'tautulli'
  | 'overseerr'
  | 'plex'
  | 'jellyfin'

export interface ServiceConfig {
  name: string
  url: string
  apiKey: string
  enabled: boolean
  type: ServiceType
}

export interface AppConfig {
  services: Record<string, ServiceConfig>
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  status?: number
}

// Sonarr types
export interface SonarrSeries {
  id: number
  title: string
  sortTitle: string
  status: string
  overview?: string
  network?: string
  year: number
  seasonCount: number
  totalEpisodeCount: number
  episodeCount: number
  episodeFileCount: number
  sizeOnDisk: number
  monitored: boolean
  images: Array<{ coverType: string; remoteUrl: string; url?: string }>
  genres: string[]
  added: string
  qualityProfileId: number
  path: string
  statistics: {
    seasonCount: number
    episodeFileCount: number
    episodeCount: number
    totalEpisodeCount: number
    sizeOnDisk: number
    percentOfEpisodes: number
  }
}

export interface SonarrCalendarEntry {
  id: number
  seriesId: number
  episodeNumber: number
  seasonNumber: number
  title: string
  airDateUtc: string
  overview?: string
  series: {
    title: string
    images: Array<{ coverType: string; remoteUrl: string }>
  }
  hasFile: boolean
  monitored: boolean
}

export interface SonarrQueueItem {
  id: number
  title: string
  status: string
  trackedDownloadStatus?: string
  trackedDownloadState?: string
  size: number
  sizeleft: number
  timeleft?: string
  estimatedCompletionTime?: string
  series?: { title: string }
  episode?: { title: string; seasonNumber: number; episodeNumber: number }
  quality?: { quality: { name: string } }
  protocol: string
}

// Radarr types
export interface RadarrMovie {
  id: number
  title: string
  sortTitle: string
  year: number
  overview?: string
  studio?: string
  status: string
  monitored: boolean
  hasFile: boolean
  sizeOnDisk: number
  images: Array<{ coverType: string; remoteUrl: string; url?: string }>
  genres: string[]
  added: string
  qualityProfileId: number
  path: string
  ratings?: { value: number }
}

export interface RadarrQueueItem {
  id: number
  title: string
  status: string
  trackedDownloadStatus?: string
  trackedDownloadState?: string
  size: number
  sizeleft: number
  timeleft?: string
  movie?: { title: string; year: number }
  quality?: { quality: { name: string } }
  protocol: string
}

// SABnzbd types
export interface SabnzbdSlot {
  nzo_id: string
  filename: string
  status: string
  mb: string
  mbleft: string
  percentage: string
  timeleft: string
  eta: string
  cat: string
}

export interface SabnzbdHistorySlot {
  nzo_id: string
  name: string
  status: string
  size: string
  completed: number
  category: string
  fail_message?: string
}

// qBittorrent types
export interface QbitTorrent {
  hash: string
  name: string
  state: string
  progress: number
  size: number
  dlspeed: number
  upspeed: number
  eta: number
  num_seeds: number
  num_leechs: number
  category: string
  added_on: number
  completion_on: number
  ratio: number
}
