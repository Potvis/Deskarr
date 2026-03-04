import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useConfigStore } from '../../stores/configStore'
import { getRadarrMovies, getRadarrQueue } from '../../services/radarr'
import { getPosterUrl, formatBytes, progressPercent } from '../../lib/utils'
import MovieDetail from './MovieDetail'
import {
  Film,
  Search,
  Loader2,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Star
} from 'lucide-react'
import type { RadarrMovie, RadarrQueueItem } from '../../types'

type Tab = 'movies' | 'queue'
type MovieFilter = 'all' | 'monitored' | 'unmonitored' | 'downloaded' | 'missing' | 'wanted'
type SortMode = 'title' | 'added' | 'year' | 'size' | 'rating'

export default function RadarrView() {
  const { config } = useConfigStore()
  const radarr = Object.values(config.services).find((s) => s.type === 'radarr' && s.enabled)
  const [activeTab, setActiveTab] = useState<Tab>('movies')
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<MovieFilter>('all')
  const [sortMode, setSortMode] = useState<SortMode>('title')
  const [selectedMovie, setSelectedMovie] = useState<RadarrMovie | null>(null)

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

  // Show detail view if movie selected
  if (selectedMovie) {
    return (
      <MovieDetail
        movie={selectedMovie}
        service={radarr}
        onBack={() => setSelectedMovie(null)}
      />
    )
  }

  const movies: RadarrMovie[] =
    moviesData?.success && Array.isArray(moviesData.data) ? moviesData.data : []
  const queue: RadarrQueueItem[] =
    queueData?.success && queueData.data
      ? (queueData.data as { records: RadarrQueueItem[] }).records || []
      : []

  const filteredMovies = movies
    .filter((m) => {
      if (
        searchQuery &&
        !m.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(m.studio && m.studio.toLowerCase().includes(searchQuery.toLowerCase())) &&
        !m.genres.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()))
      )
        return false
      switch (filter) {
        case 'monitored':
          return m.monitored
        case 'unmonitored':
          return !m.monitored
        case 'downloaded':
          return m.hasFile
        case 'missing':
          return m.monitored && !m.hasFile
        case 'wanted':
          return m.monitored && !m.hasFile && m.status === 'released'
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
        case 'size':
          return b.sizeOnDisk - a.sizeOnDisk
        case 'rating': {
          const ra = a.ratings?.imdb?.value || a.ratings?.tmdb?.value || a.ratings?.value || 0
          const rb = b.ratings?.imdb?.value || b.ratings?.tmdb?.value || b.ratings?.value || 0
          return rb - ra
        }
        default:
          return a.sortTitle.localeCompare(b.sortTitle)
      }
    })

  const tabs: { id: Tab; label: string; icon: typeof Film; count?: number }[] = [
    { id: 'movies', label: 'Library', icon: Film, count: movies.length },
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
      {activeTab === 'movies' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search + Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as MovieFilter)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Movies</option>
              <option value="monitored">Monitored</option>
              <option value="unmonitored">Unmonitored</option>
              <option value="downloaded">Downloaded</option>
              <option value="missing">Missing</option>
              <option value="wanted">Wanted</option>
            </select>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="title">Sort: Title</option>
              <option value="added">Sort: Recently Added</option>
              <option value="year">Sort: Year</option>
              <option value="size">Sort: Size</option>
              <option value="rating">Sort: Rating</option>
            </select>
            <span className="text-xs text-slate-500">
              {filteredMovies.length} movies
            </span>
          </div>

          {moviesLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
                {filteredMovies.map((m) => {
                  const posterUrl = getPosterUrl(m.images, radarr.url, radarr.apiKey)
                  const rating =
                    m.ratings?.imdb?.value || m.ratings?.tmdb?.value || m.ratings?.value

                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMovie(m)}
                      className="group text-left focus:outline-none"
                    >
                      {/* Poster */}
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-slate-800 mb-2">
                        {posterUrl ? (
                          <img
                            src={posterUrl}
                            alt={m.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-10 h-10 text-slate-700" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />

                        {/* Status badge */}
                        <div className="absolute top-2 right-2">
                          {m.hasFile ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-green-500/90 text-white font-medium flex items-center gap-0.5">
                              <CheckCircle className="w-3 h-3" />
                              {m.movieFile?.quality?.quality?.name || 'HD'}
                            </span>
                          ) : m.monitored ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/90 text-white font-medium">
                              Missing
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800/90 text-slate-400 font-medium">
                              Unmon
                            </span>
                          )}
                        </div>

                        {/* Rating badge */}
                        {rating && rating > 0 && (
                          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 rounded px-1.5 py-0.5">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-[10px] text-white font-medium">
                              {rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Title */}
                      <p className="text-sm font-medium truncate group-hover:text-amber-400 transition-colors">
                        {m.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                          {m.year}
                          {m.runtime ? ` \u00b7 ${m.runtime}m` : ''}
                        </p>
                        {m.sizeOnDisk > 0 && (
                          <p className="text-xs text-slate-600">{formatBytes(m.sizeOnDisk)}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
              {filteredMovies.length === 0 && (
                <p className="text-center text-slate-500 py-12 text-sm">No movies found</p>
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
                          {item.movie?.title || item.title}
                          {item.movie?.year && (
                            <span className="text-slate-500 ml-1">({item.movie.year})</span>
                          )}
                        </p>
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
                          className="bg-amber-500 h-2 rounded-full transition-all"
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
    </div>
  )
}
