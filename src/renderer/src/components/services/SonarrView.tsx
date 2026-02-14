import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useConfigStore } from '../../stores/configStore'
import { getSonarrSeries, getSonarrQueue, getSonarrCalendar } from '../../services/sonarr'
import { formatBytes, formatDateTime, progressPercent } from '../../lib/utils'
import { Tv, Search, Loader2, Calendar, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import type { SonarrSeries, SonarrQueueItem, SonarrCalendarEntry } from '../../types'

type Tab = 'series' | 'queue' | 'calendar'

export default function SonarrView() {
  const { config } = useConfigStore()
  const sonarr = Object.values(config.services).find((s) => s.type === 'sonarr' && s.enabled)
  const [activeTab, setActiveTab] = useState<Tab>('series')
  const [searchQuery, setSearchQuery] = useState('')

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

  const series: SonarrSeries[] =
    seriesData?.success && Array.isArray(seriesData.data) ? seriesData.data : []
  const queue: SonarrQueueItem[] =
    queueData?.success && queueData.data
      ? (queueData.data as { records: SonarrQueueItem[] }).records || []
      : []
  const calendar: SonarrCalendarEntry[] =
    calendarData?.success && Array.isArray(calendarData.data) ? calendarData.data : []

  const filteredSeries = series.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.network && s.network.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const tabs: { id: Tab; label: string; icon: typeof Tv; count?: number }[] = [
    { id: 'series', label: 'Series', icon: Tv, count: series.length },
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

      {activeTab === 'series' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search series..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          {seriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-950">
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 pr-4">Title</th>
                    <th className="pb-3 pr-4">Network</th>
                    <th className="pb-3 pr-4">Seasons</th>
                    <th className="pb-3 pr-4">Episodes</th>
                    <th className="pb-3 pr-4">Size</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredSeries.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/50">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${s.monitored ? 'bg-green-500' : 'bg-slate-600'}`}
                          />
                          <div>
                            <p className="text-sm font-medium">{s.title}</p>
                            <p className="text-xs text-slate-500">{s.year}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-sm text-slate-400">{s.network || '—'}</td>
                      <td className="py-3 pr-4 text-sm text-slate-400">
                        {s.statistics?.seasonCount || s.seasonCount}
                      </td>
                      <td className="py-3 pr-4 text-sm">
                        <span className="text-slate-300">
                          {s.statistics?.episodeFileCount || 0}
                        </span>
                        <span className="text-slate-600">
                          /{s.statistics?.episodeCount || 0}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-sm text-slate-400">
                        {formatBytes(s.statistics?.sizeOnDisk || s.sizeOnDisk)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            s.status === 'continuing'
                              ? 'bg-green-500/20 text-green-400'
                              : s.status === 'ended'
                                ? 'bg-slate-700 text-slate-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSeries.length === 0 && !seriesLoading && (
                <p className="text-center text-slate-500 py-8 text-sm">No series found</p>
              )}
            </div>
          )}
        </div>
      )}

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
                        <p className="text-sm font-medium">{item.series?.title || item.title}</p>
                        {item.episode && (
                          <p className="text-xs text-slate-400">
                            S{String(item.episode.seasonNumber).padStart(2, '0')}E
                            {String(item.episode.episodeNumber).padStart(2, '0')} -{' '}
                            {item.episode.title}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
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
                      <span className="text-xs text-slate-400 w-10 text-right">{percent}%</span>
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
            <div className="space-y-2">
              {calendar.map((ep) => (
                <div
                  key={ep.id}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${ep.hasFile ? 'bg-green-500' : ep.monitored ? 'bg-blue-500' : 'bg-slate-600'}`}
                    />
                    <div>
                      <p className="text-sm font-medium">{ep.series?.title}</p>
                      <p className="text-xs text-slate-400">
                        S{String(ep.seasonNumber).padStart(2, '0')}E
                        {String(ep.episodeNumber).padStart(2, '0')} - {ep.title}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{formatDateTime(ep.airDateUtc)}</p>
                    {ep.hasFile && (
                      <span className="text-xs text-green-400">Downloaded</span>
                    )}
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
