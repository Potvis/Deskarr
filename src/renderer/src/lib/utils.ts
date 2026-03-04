export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatSpeed(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatEta(seconds: number): string {
  if (seconds < 0 || seconds === 8640000) return '\u221e'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function progressPercent(size: number, sizeleft: number): number {
  if (size === 0) return 0
  return Math.round(((size - sizeleft) / size) * 100)
}

export function getPosterUrl(
  images: Array<{ coverType: string; remoteUrl?: string; url?: string }>,
  baseUrl?: string,
  apiKey?: string
): string | undefined {
  const poster = images?.find((i) => i.coverType === 'poster')
  if (poster?.remoteUrl) return poster.remoteUrl
  if (poster?.url && baseUrl && apiKey) {
    return `${baseUrl}${poster.url}?apikey=${apiKey}`
  }
  return undefined
}

export function getBannerUrl(
  images: Array<{ coverType: string; remoteUrl?: string; url?: string }>,
  baseUrl?: string,
  apiKey?: string
): string | undefined {
  const banner = images?.find((i) => i.coverType === 'fanart' || i.coverType === 'banner')
  if (banner?.remoteUrl) return banner.remoteUrl
  if (banner?.url && baseUrl && apiKey) {
    return `${baseUrl}${banner.url}?apikey=${apiKey}`
  }
  return undefined
}

export function getRelativeDay(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()

  if (isToday) return 'Today'
  if (isTomorrow) return 'Tomorrow'
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

export function groupByDay<T>(items: T[], getDate: (item: T) => string): Record<string, T[]> {
  const grouped: Record<string, T[]> = {}
  for (const item of items) {
    const dateStr = getDate(item)
    const day = getRelativeDay(dateStr)
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(item)
  }
  return grouped
}

export function episodeCode(season: number, episode: number): string {
  return `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`
}

export function ratingDisplay(value: number): string {
  return (value * 10).toFixed(0) + '%'
}
