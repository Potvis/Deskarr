import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useConfigStore } from '../../stores/configStore'
import { getSonarrSeries, getSonarrQueue, getSonarrCalendar } from '../../services/sonarr'
import { getPosterUrl, progressPercent, formatDateTime, groupByDay, episodeCode } from '../../lib/utils'
import SeriesDetail from './SeriesDetail'
import {
  Tv,
  Search,
  Loader2,
  Calendar,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter
} from 'lucide-react'
import type { SonarrSeries, SonarrQueueItem, SonarrCalendarEntry } from '../../types'

type Tab = 'series' | 'queue' | 'calendar'
type SeriesFilter = 'all' | 'monitored' | 'unmonitored' | 'continuing' | 'ended' | 'missing'
type SortMode = 'title' | 'added' | 'year' | 'episodes' | 'size'

export default function SonarrView() {
  const { config } = useConfigStore()
  const sonarr = Object.values(config.services).find((s) => s.type === 'sonarr' && s.enabled)
  const [activeTab, setActiveTab] = useState<Tab>('series')
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<SeriesFilter>('all')
  const [sortMode, setSortMode] = useState<SortMode>('title')
  const [selectedSeries, setSelectedSeries] = useState<SonarrSeries | null>(null)

  const { data: seriesData, isLoading: seriesLoading } = useQuery({
    queryKey: ['sonarr', 'series'],
    queryFn: () => getSonarrSeries(sonarr!.url, sonarr!.apiKey),
    enabled: !!sonarr,
    refetchInterval: 60000
  })

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['sonarr', 'queue'],
    queryFn: () => getSonarrQueue(sonarr!.url, sonarr!.apiKey),
    enabled: !!sonarr,
    refetchInterval: 10000
  })

  const { data: calendarData, isLoading: calendarLoading } = useQuery({
    queryKey: ['sonarr', 'calendar'],
    queryFn: () => getSonarrCalendar(sonarr!.url, sonarr!.apiKey),
    enabled: !!sonarr,
    refetchInterval: 300000
  })

  if (!sonarr) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <Tv className="w-16 h-16 mb-4 text-slate-600" />
        <p className="text-lg font-medium text-slate-300">Sonarr is not configured</p>
        <p className="text-sm mt-2">Go to Settings to add your Sonarr instance</p>
      </div>
    )
  }

  // Show detail view if series selected
  if (selectedSeries) {
    return (
      <SeriesDetail
        series={selectedSeries}
        service={sonarr}
        onBack={() => setSelectedSeries(null)}
      />
    )
  }

  const series: SonarrSeries[] =
    seriesData?.success && Array.isArray(seriesData.data) ? seriesData.data : []
  const queue: SonarrQueueItem[] =
    queueData?.success && queueData.data
      ? (queueData.data as { records: SonarrQueueItem[] }).records || []
      : []
  const calendar: SonarrCalendarEntry[] =
    calendarData?.success && Array.isArray(calendarData.data) ? calendarData.data : []

  const filteredSeries = series
    .filter((s) => {
      // Text search
      if (
        searchQuery &&
        !s.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(s.network && s.network.toLowerCase().includes(searchQuery.toLowerCase()))
      )
        return false
      // Filter
      switch (filter) {
        case 'monitored':
          return s.monitored
        case 'unmonitored':
          return !s.monitored
        case 'continuing':
          return s.status === 'continuing'
        case 'ended':
          return s.status === 'ended'
        case 'missing':
          return s.statistics
            ? s.statistics.episodeFileCount < s.statistics.episodeCount
            : false
        default:
          return true
      }
    })
    .sort((a, b) => {
      switch (sortMode) {
        case 'added':
          return new Date(b.added).getTime() - new Date(a.added).getTime()
        case 'year':
          return b.year - a.year
        case 'episodes':
          return (b.statistics?.episodeCount || 0) - (a.statistics?.episodeCount || 0)
        case 'size':
          return (b.statistics?.sizeOnDisk || 0) - (a.statistics?.sizeOnDisk || 0)
        default:
          return a.sortTitle.localeCompare(b.sortTitle)
      }
    })

  const calendarByDay = groupByDay(calendar, (ep) => ep.airDateUtc)

  const tabs: { id: Tab; label: string; icon: typeof Tv; count?: number }[] = [
    { id: 'series', label: 'Library', icon: Tv, count: series.length },
    { id: 'queue', label: 'Queue', icon: Download, count: queue.length },
    { id: 'calendar', label: 'Calendar', icon: Calendar, count: calendar.length }
  ]

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">TV Shows</h1>
          <p className="text-sm text-slate-400 mt-1">{sonarr.name}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 bg-slate-900 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-slate-600 text-slate-200 text-xs px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* LIBRARY TAB - Poster Grid */}
      {activeTab === 'series' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search + Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search series..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as SeriesFilter)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Series</option>
              <option value="monitored">Monitored</option>
              <option value="unmonitored">Unmonitored</option>
              <option value="continuing">Continuing</option>
              <option value="ended">Ended</option>
              <option value="missing">Missing Episodes</option>
            </select>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="title">Sort: Title</option>
              <option value="added">Sort: Recently Added</option>
              <option value="year">Sort: Year</option>
              <option value="episodes">Sort: Episodes</option>
              <option value="size">Sort: Size</option>
            </select>
            <span className="text-xs text-slate-500">
              {filteredSeries.length} series
            </span>
          </div>

          {seriesLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
                {filteredSeries.map((s) => {
                  const posterUrl = getPosterUrl(s.images, sonarr.url, sonarr.apiKey)
                  const stats = s.statistics
                  const pct = stats ? Math.round(stats.percentOfEpisodes) : 0
                  const epText = stats
                    ? `${stats.episodeFileCount}/${stats.episodeCount}`
                    : ''

                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSeries(s)}
                      className="group text-left focus:outline-none"
                    >
                      {/* Poster */}
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-slate-800 mb-2">
                        {posterUrl ? (
                          <img
                            src={posterUrl}
                            alt={s.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tv className="w-10 h-10 text-slate-700" />
                          </div>
                        )}
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                        {/* Status badge */}
                        <div className="absolute top-2 right-2">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                              s.status === 'continuing'
                                ? 'bg-green-500/90 text-white'
                                : 'bg-slate-800/90 text-slate-300'
                            }`}
                          >
                            {s.status === 'continuing' ? 'Airing' : 'Ended'}
                          </span>
                        </div>
                        {/* Monitor indicator */}
                        {!s.monitored && (
                          <div className="absolute top-2 left-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-yellow-500/90 text-black font-medium">
                              Unmon
                            </span>
                          </div>
                        )}
                        {/* Progress bar at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900/80">
                          <div
                            className={`h-full ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      {/* Title */}
                      <p className="text-sm font-medium truncate group-hover:text-blue-400 transition-colors">
                        {s.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                          {s.year}{s.network ? ` \u00b7 ${s.network}` : ''}
                        </p>
                        {epText && (
                          <p className="text-xs text-slate-600">{epText}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
              {filteredSeries.length === 0 && (
                <p className="text-center text-slate-500 py-12 text-sm">No series found</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* QUEUE TAB */}
      {activeTab === 'queue' && (
        <div className="flex-1 overflow-auto">
          {queueLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-slate-700" />
              <p className="text-sm">Queue is empty</p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((item) => {
                const percent = progressPercent(item.size, item.sizeleft)
                return (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">
                          {item.series?.title || item.title}
                        </p>
                        {item.episode && (
                          <p className="text-xs text-slate-400">
                            {episodeCode(item.episode.seasonNumber, item.episode.episodeNumber)}{' '}
                            - {item.episode.title}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="bg-slate-800 px-2 py-0.5 rounded">
                          {item.protocol === 'usenet' ? 'NZB' : 'Torrent'}
                        </span>
                        {item.quality?.quality?.name && (
                          <span className="bg-slate-800 px-2 py-0.5 rounded">
                            {item.quality.quality.name}
                          </span>
                        )}
                        {item.timeleft && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.timeleft}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-800 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-10 text-right">
                        {percent}%
                      </span>
                    </div>
                    {item.trackedDownloadStatus === 'warning' && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-yellow-400">
                        <AlertCircle className="w-3 h-3" />
                        Download warning
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* CALENDAR TAB - Grouped by day */}
      {activeTab === 'calendar' && (
        <div className="flex-1 overflow-auto">
          {calendarLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : calendar.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-700" />
              <p className="text-sm">No upcoming episodes this week</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(calendarByDay).map(([day, eps]) => (
                <div key={day}>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2 sticky top-0 bg-slate-950 py-1">
                    {day}
                  </h3>
                  <div className="space-y-1.5">
                    {eps.map((ep) => {
                      const posterUrl = getPosterUrl(
                        ep.series?.images || [],
                        sonarr.url,
                        sonarr.apiKey
                      )
                      return (
                        <div
                          key={ep.id}
                          className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center gap-3"
                        >
                          {/* Small poster */}
                          <div className="w-10 h-14 rounded overflow-hidden bg-slate-800 shrink-0">
                            {posterUrl ? (
                              <img
                                src={posterUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Tv className="w-4 h-4 text-slate-700" />
                              </div>
                            )}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {ep.series?.title}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {episodeCode(ep.seasonNumber, ep.episodeNumber)} - {ep.title}
                            </p>
                          </div>
                          {/* Status + time */}
                          <div className="text-right shrink-0">
                            <p className="text-xs text-slate-500">
                              {new Date(ep.airDateUtc).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {ep.hasFile ? (
                              <span className="text-xs text-green-400 flex items-center gap-1 justify-end">
                                <CheckCircle className="w-3 h-3" />
                                On Disk
                              </span>
                            ) : !ep.monitored ? (
                              <span className="text-xs text-slate-600">Unmonitored</span>
                            ) : (
                              <span className="text-xs text-blue-400">Monitored</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
