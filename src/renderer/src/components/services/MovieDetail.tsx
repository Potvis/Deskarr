import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getRadarrProfiles,
  searchRadarrMovie,
  refreshRadarrMovie,
  updateRadarrMovieMonitor
} from '../../services/radarr'
import { formatBytes, formatDate, getPosterUrl, getBannerUrl } from '../../lib/utils'
import type { RadarrMovie, QualityProfile, ServiceConfig } from '../../types'
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Film,
  HardDrive,
  Clock,
  Star,
  FileVideo,
  Folder
} from 'lucide-react'

interface Props {
  movie: RadarrMovie
  service: ServiceConfig
  onBack: () => void
}

export default function MovieDetail({ movie, service, onBack }: Props) {
  const queryClient = useQueryClient()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const { data: profilesData } = useQuery({
    queryKey: ['radarr', 'profiles'],
    queryFn: () => getRadarrProfiles(service.url, service.apiKey),
    staleTime: 600000
  })

  const profiles: QualityProfile[] =
    profilesData?.success && Array.isArray(profilesData.data) ? profilesData.data : []
  const qualityProfile = profiles.find((p) => p.id === movie.qualityProfileId)

  const posterUrl = getPosterUrl(movie.images, service.url, service.apiKey)
  const bannerUrl = getBannerUrl(movie.images, service.url, service.apiKey)

  const handleAction = async (action: string) => {
    setActionLoading(action)
    try {
      if (action === 'search') {
        await searchRadarrMovie(service.url, service.apiKey, [movie.id])
      } else if (action === 'refresh') {
        await refreshRadarrMovie(service.url, service.apiKey, movie.id)
      } else if (action === 'monitor') {
        await updateRadarrMovieMonitor(service.url, service.apiKey, movie, !movie.monitored)
        queryClient.invalidateQueries({ queryKey: ['radarr'] })
      }
    } finally {
      setActionLoading(null)
    }
  }

  const rating = movie.ratings?.imdb?.value || movie.ratings?.tmdb?.value || movie.ratings?.value
  const votes = movie.ratings?.imdb?.votes || movie.ratings?.tmdb?.votes
  const mf = movie.movieFile

  return (
    <div className="h-full overflow-auto">
      {/* Banner background */}
      <div className="relative">
        {bannerUrl && (
          <div className="absolute inset-0 h-72 overflow-hidden">
            <img
              src={bannerUrl}
              alt=""
              className="w-full h-full object-cover opacity-20 blur-sm"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 to-slate-950" />
          </div>
        )}

        <div className="relative p-6">
          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </button>

          {/* Hero section */}
          <div className="flex gap-6">
            {/* Poster */}
            <div className="shrink-0">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="w-52 rounded-lg shadow-2xl"
                />
              ) : (
                <div className="w-52 h-80 bg-slate-800 rounded-lg flex items-center justify-center">
                  <Film className="w-12 h-12 text-slate-600" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold mb-1">{movie.title}</h1>
              {movie.originalTitle && movie.originalTitle !== movie.title && (
                <p className="text-sm text-slate-500 mb-2">{movie.originalTitle}</p>
              )}

              <div className="flex items-center gap-3 text-sm text-slate-400 mb-3 flex-wrap">
                <span>{movie.year}</span>
                {movie.studio && (
                  <>
                    <span className="text-slate-600">&middot;</span>
                    <span>{movie.studio}</span>
                  </>
                )}
                {movie.runtime && (
                  <>
                    <span className="text-slate-600">&middot;</span>
                    <span>{movie.runtime} min</span>
                  </>
                )}
                {movie.certification && (
                  <span className="px-2 py-0.5 rounded border border-slate-700 text-xs">
                    {movie.certification}
                  </span>
                )}
                {/* Status badge */}
                {movie.hasFile ? (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">
                    Downloaded
                  </span>
                ) : movie.monitored ? (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">
                    Missing
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-400">
                    Unmonitored
                  </span>
                )}
              </div>

              {/* Rating */}
              {rating && rating > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium text-yellow-400">
                    {rating.toFixed(1)}
                  </span>
                  {votes && votes > 0 && (
                    <span className="text-xs text-slate-500">
                      ({votes.toLocaleString()} votes)
                    </span>
                  )}
                </div>
              )}

              {series_genres(movie)}

              {movie.overview && (
                <p className="text-sm text-slate-300 leading-relaxed mb-5 max-w-2xl">
                  {movie.overview}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm mb-5">
                {movie.sizeOnDisk > 0 && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <HardDrive className="w-4 h-4" />
                    <span>{formatBytes(movie.sizeOnDisk)}</span>
                  </div>
                )}
                {qualityProfile && (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                    {qualityProfile.name}
                  </span>
                )}
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <Clock className="w-3 h-3" />
                  Added {formatDate(movie.added)}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAction('monitor')}
                  disabled={actionLoading === 'monitor'}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    movie.monitored
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  {actionLoading === 'monitor' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : movie.monitored ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                  {movie.monitored ? 'Monitored' : 'Unmonitored'}
                </button>
                <button
                  onClick={() => handleAction('search')}
                  disabled={actionLoading === 'search'}
                  className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {actionLoading === 'search' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </button>
                <button
                  onClick={() => handleAction('refresh')}
                  disabled={actionLoading === 'refresh'}
                  className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {actionLoading === 'refresh' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File info */}
      {mf && (
        <div className="px-6 py-4">
          <h2 className="text-lg font-semibold mb-3">File Info</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <FileVideo className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{mf.relativePath}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
                  <span className="bg-slate-800 px-2 py-0.5 rounded">
                    {mf.quality?.quality?.name}
                  </span>
                  <span>{formatBytes(mf.size)}</span>
                  {mf.mediaInfo?.videoCodec && <span>{mf.mediaInfo.videoCodec}</span>}
                  {mf.mediaInfo?.audioCodec && (
                    <span>
                      {mf.mediaInfo.audioCodec}
                      {mf.mediaInfo.audioChannels ? ` ${mf.mediaInfo.audioChannels}.0` : ''}
                    </span>
                  )}
                  {mf.mediaInfo?.resolution && <span>{mf.mediaInfo.resolution}</span>}
                  {mf.languages && mf.languages.length > 0 && (
                    <span>{mf.languages.map((l) => l.name).join(', ')}</span>
                  )}
                  <span>Added {formatDate(mf.dateAdded)}</span>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
            </div>
          </div>
        </div>
      )}

      {/* Path */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Folder className="w-3 h-3" />
          <span className="truncate">{movie.path}</span>
        </div>
      </div>
    </div>
  )
}

function series_genres(movie: RadarrMovie) {
  if (!movie.genres || movie.genres.length === 0) return null
  return (
    <div className="flex gap-2 mb-3 flex-wrap">
      {movie.genres.map((g) => (
        <span key={g} className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">
          {g}
        </span>
      ))}
    </div>
  )
}
