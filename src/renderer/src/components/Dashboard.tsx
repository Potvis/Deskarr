import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useConfigStore } from '../stores/configStore'
import ServiceCard from './ServiceCard'
import {
  Tv,
  Film,
  Download,
  Music,
  BookOpen,
  Search,
  MonitorPlay,
  MessageSquare,
  Activity,
  Settings,
  ArrowRight
} from 'lucide-react'
import { getSonarrSeries, getSonarrQueue } from '../services/sonarr'
import { getRadarrMovies, getRadarrQueue } from '../services/radarr'
import type { LucideIcon } from 'lucide-react'
import type { ServiceType } from '../types'

const SERVICE_ICON_MAP: Record<ServiceType, { icon: LucideIcon; color: string; link?: string }> = {
  sonarr: { icon: Tv, color: 'bg-sky-500/20 text-sky-400', link: '/sonarr' },
  radarr: { icon: Film, color: 'bg-amber-500/20 text-amber-400', link: '/radarr' },
  lidarr: { icon: Music, color: 'bg-green-500/20 text-green-400' },
  readarr: { icon: BookOpen, color: 'bg-purple-500/20 text-purple-400' },
  prowlarr: { icon: Search, color: 'bg-orange-500/20 text-orange-400' },
  sabnzbd: { icon: Download, color: 'bg-yellow-500/20 text-yellow-400', link: '/downloads' },
  nzbget: { icon: Download, color: 'bg-emerald-500/20 text-emerald-400', link: '/downloads' },
  qbittorrent: { icon: Download, color: 'bg-blue-500/20 text-blue-400', link: '/downloads' },
  deluge: { icon: Download, color: 'bg-indigo-500/20 text-indigo-400', link: '/downloads' },
  transmission: { icon: Download, color: 'bg-red-500/20 text-red-400', link: '/downloads' },
  tautulli: { icon: Activity, color: 'bg-orange-500/20 text-orange-400' },
  overseerr: { icon: MessageSquare, color: 'bg-indigo-500/20 text-indigo-400' },
  plex: { icon: MonitorPlay, color: 'bg-amber-500/20 text-amber-400' },
  jellyfin: { icon: MonitorPlay, color: 'bg-purple-500/20 text-purple-400' }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { config } = useConfigStore()
  const services = Object.entries(config.services)

  const sonarr = Object.values(config.services).find((s) => s.type === 'sonarr' && s.enabled)
  const radarr = Object.values(config.services).find((s) => s.type === 'radarr' && s.enabled)

  const { data: sonarrSeries } = useQuery({
    queryKey: ['dashboard', 'sonarr', 'series'],
    queryFn: () => getSonarrSeries(sonarr!.url, sonarr!.apiKey),
    enabled: !!sonarr,
    refetchInterval: 60000
  })

  const { data: sonarrQueue } = useQuery({
    queryKey: ['dashboard', 'sonarr', 'queue'],
    queryFn: () => getSonarrQueue(sonarr!.url, sonarr!.apiKey),
    enabled: !!sonarr,
    refetchInterval: 15000
  })

  const { data: radarrMovies } = useQuery({
    queryKey: ['dashboard', 'radarr', 'movies'],
    queryFn: () => getRadarrMovies(radarr!.url, radarr!.apiKey),
    enabled: !!radarr,
    refetchInterval: 60000
  })

  const { data: radarrQueue } = useQuery({
    queryKey: ['dashboard', 'radarr', 'queue'],
    queryFn: () => getRadarrQueue(radarr!.url, radarr!.apiKey),
    enabled: !!radarr,
    refetchInterval: 15000
  })

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center max-w-md">
          <Settings className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h2 className="text-xl font-semibold text-slate-200 mb-2">Welcome to Deskarr</h2>
          <p className="text-sm mb-6">
            Get started by adding your media server services. Connect Sonarr, Radarr, SABnzbd,
            qBittorrent, and more.
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Configure Services
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  const sonarrMetrics = []
  if (sonarrSeries?.success && Array.isArray(sonarrSeries.data)) {
    const series = sonarrSeries.data
    const monitored = series.filter((s) => s.monitored).length
    sonarrMetrics.push({ label: 'Series', value: series.length })
    sonarrMetrics.push({ label: 'Monitored', value: monitored })
  }
  if (sonarrQueue?.success && sonarrQueue.data) {
    const queue = (sonarrQueue.data as { records: unknown[] }).records || []
    if (queue.length > 0) sonarrMetrics.push({ label: 'In Queue', value: queue.length })
  }

  const radarrMetrics = []
  if (radarrMovies?.success && Array.isArray(radarrMovies.data)) {
    const movies = radarrMovies.data
    const monitored = movies.filter((m) => m.monitored).length
    radarrMetrics.push({ label: 'Movies', value: movies.length })
    radarrMetrics.push({ label: 'Monitored', value: monitored })
  }
  if (radarrQueue?.success && radarrQueue.data) {
    const queue = (radarrQueue.data as { records: unknown[] }).records || []
    if (queue.length > 0) radarrMetrics.push({ label: 'In Queue', value: queue.length })
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">
          Overview of your {services.length} configured service{services.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {services.map(([id, service]) => {
          const meta = SERVICE_ICON_MAP[service.type] || {
            icon: Activity,
            color: 'bg-slate-500/20 text-slate-400'
          }
          let metrics: { label: string; value: string | number }[] = []
          if (service.type === 'sonarr') metrics = sonarrMetrics
          if (service.type === 'radarr') metrics = radarrMetrics

          return (
            <ServiceCard
              key={id}
              service={service}
              icon={meta.icon}
              iconColor={meta.color}
              link={meta.link}
              metrics={metrics}
            />
          )
        })}
      </div>
    </div>
  )
}
