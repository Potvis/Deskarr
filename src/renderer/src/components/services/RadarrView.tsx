import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useConfigStore } from '../../stores/configStore'
import { getRadarrMovies, getRadarrQueue } from '../../services/radarr'
import { formatBytes, progressPercent } from '../../lib/utils'
import { Film, Search, Loader2, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import type { RadarrMovie, RadarrQueueItem } from '../../types'

type Tab = 'movies' | 'queue'

export default function RadarrView() {
  const { config } = useConfigStore()
  const radarr = Object.values(config.services).find((s) => s.type === 'radarr' && s.enabled)
  const [activeTab, setActiveTab] = useState<Tab>('movies')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: moviesData, isLoading: moviesLoading } = useQuery({
    queryKey: ['radarr', 'movies'],
    queryFn: () => getRadarrMovies(radarr!.url, radarr!.apiKey),
    enabled: !!radarr,
    refetchInterval: 60000
  })

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['radarr', 'queue'],
    queryFn: () => getRadarrQueue(radarr!.url, radarr!.apiKey),
    enabled: !!radarr,
    refetchInterval: 10000
  })

  if (!radarr) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <Film className="w-16 h-16 mb-4 text-slate-600" />
        <p className="text-lg font-medium text-slate-300">Radarr is not configured</p>
        <p className="text-sm mt-2">Go to Settings to add your Radarr instance</p>
      </div>
    )
  }

  const movies: RadarrMovie[] =
    moviesData?.success && Array.isArray(moviesData.data) ? moviesData.data : []
  const queue: RadarrQueueItem[] =
    queueData?.success && queueData.data
      ? (queueData.data as { records: RadarrQueueItem[] }).records || []
      : []

  const filteredMovies = movies.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.studio && m.studio.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const tabs: { id: Tab; label: string; icon: typeof Film; count?: number }[] = [
    { id: 'movies', label: 'Movies', icon: Film, count: movies.length },
    { id: 'queue', label: 'Queue', icon: Download, count: queue.length }
  ]

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Movies</h1>
          <p className="text-sm text-slate-400 mt-1">{radarr.name}</p>
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

      {activeTab === 'movies' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          {moviesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-950">
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 pr-4">Title</th>
                    <th className="pb-3 pr-4">Year</th>
                    <th className="pb-3 pr-4">Studio</th>
                    <th className="pb-3 pr-4">Size</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredMovies.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-900/50">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${m.monitored ? 'bg-green-500' : 'bg-slate-600'}`}
                          />
                          <div>
                            <p className="text-sm font-medium">{m.title}</p>
                            {m.genres.length > 0 && (
                              <p className="text-xs text-slate-500">
                                {m.genres.slice(0, 3).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-sm text-slate-400">{m.year}</td>
                      <td className="py-3 pr-4 text-sm text-slate-400">{m.studio || '—'}</td>
                      <td className="py-3 pr-4 text-sm text-slate-400">
                        {m.sizeOnDisk > 0 ? formatBytes(m.sizeOnDisk) : '—'}
                      </td>
                      <td className="py-3">
                        {m.hasFile ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                            Downloaded
                          </span>
                        ) : m.monitored ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                            Monitored
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                            Unmonitored
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMovies.length === 0 && !moviesLoading && (
                <p className="text-center text-slate-500 py-8 text-sm">No movies found</p>
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
                        <p className="text-sm font-medium">
                          {item.movie?.title || item.title}
                          {item.movie?.year && (
                            <span className="text-slate-500 ml-1">({item.movie.year})</span>
                          )}
                        </p>
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
                          className="bg-amber-500 h-2 rounded-full transition-all"
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
    </div>
  )
}
