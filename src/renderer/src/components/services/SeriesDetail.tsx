import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getSonarrEpisodes,
  getSonarrProfiles,
  searchSonarrSeries,
  refreshSonarrSeries,
  updateSonarrSeriesMonitor,
  searchSonarrSeason,
  updateSonarrEpisodeMonitor
} from '../../services/sonarr'
import { formatBytes, formatDate, getPosterUrl, getBannerUrl, episodeCode } from '../../lib/utils'
import type { SonarrSeries, SonarrEpisode, QualityProfile, ServiceConfig } from '../../types'
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Download,
  Clock,
  Loader2,
  Tv,
  Calendar,
  HardDrive,
  Film
} from 'lucide-react'

interface Props {
  series: SonarrSeries
  service: ServiceConfig
  onBack: () => void
}

export default function SeriesDetail({ series, service, onBack }: Props) {
  const queryClient = useQueryClient()
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set())
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const { data: episodesData, isLoading: episodesLoading } = useQuery({
    queryKey: ['sonarr', 'episodes', series.id],
    queryFn: () => getSonarrEpisodes(service.url, service.apiKey, series.id)
  })

  const { data: profilesData } = useQuery({
    queryKey: ['sonarr', 'profiles'],
    queryFn: () => getSonarrProfiles(service.url, service.apiKey),
    staleTime: 600000
  })

  const episodes: SonarrEpisode[] =
    episodesData?.success && Array.isArray(episodesData.data) ? episodesData.data : []
  const profiles: QualityProfile[] =
    profilesData?.success && Array.isArray(profilesData.data) ? profilesData.data : []
  const qualityProfile = profiles.find((p) => p.id === series.qualityProfileId)

  const posterUrl = getPosterUrl(series.images, service.url, service.apiKey)
  const bannerUrl = getBannerUrl(series.images, service.url, service.apiKey)

  const seasonNumbers = [...new Set(episodes.map((e) => e.seasonNumber))].sort((a, b) => b - a)

  const toggleSeason = (num: number) => {
    const next = new Set(expandedSeasons)
    if (next.has(num)) next.delete(num)
    else next.add(num)
    setExpandedSeasons(next)
  }

  const handleAction = async (action: string) => {
    setActionLoading(action)
    try {
      if (action === 'search') {
        await searchSonarrSeries(service.url, service.apiKey, series.id)
      } else if (action === 'refresh') {
        await refreshSonarrSeries(service.url, service.apiKey, series.id)
      } else if (action === 'monitor') {
        await updateSonarrSeriesMonitor(service.url, service.apiKey, series, !series.monitored)
        queryClient.invalidateQueries({ queryKey: ['sonarr'] })
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleSeasonSearch = async (seasonNumber: number) => {
    await searchSonarrSeason(service.url, service.apiKey, series.id, seasonNumber)
  }

  const handleEpisodeMonitor = async (episode: SonarrEpisode) => {
    await updateSonarrEpisodeMonitor(service.url, service.apiKey, [episode.id], !episode.monitored)
    queryClient.invalidateQueries({ queryKey: ['sonarr', 'episodes', series.id] })
  }

  const stats = series.statistics
  const pct = stats ? Math.round(stats.percentOfEpisodes) : 0

  return (
    <div className="h-full overflow-auto">
      {/* Banner background */}
      <div className="relative">
        {bannerUrl && (
          <div className="absolute inset-0 h-64 overflow-hidden">
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
                  alt={series.title}
                  className="w-44 rounded-lg shadow-2xl"
                />
              ) : (
                <div className="w-44 h-64 bg-slate-800 rounded-lg flex items-center justify-center">
                  <Tv className="w-12 h-12 text-slate-600" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold mb-1">{series.title}</h1>
              <div className="flex items-center gap-3 text-sm text-slate-400 mb-3 flex-wrap">
                <span>{series.year}</span>
                {series.network && (
                  <>
                    <span className="text-slate-600">&middot;</span>
                    <span>{series.network}</span>
                  </>
                )}
                {series.runtime && (
                  <>
                    <span className="text-slate-600">&middot;</span>
                    <span>{series.runtime} min</span>
                  </>
                )}
                <span className="text-slate-600">&middot;</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    series.status === 'continuing'
                      ? 'bg-green-500/20 text-green-400'
                      : series.status === 'ended'
                        ? 'bg-slate-700 text-slate-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {series.status}
                </span>
                {series.certification && (
                  <span className="px-2 py-0.5 rounded border border-slate-700 text-xs">
                    {series.certification}
                  </span>
                )}
              </div>

              {series.genres.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {series.genres.map((g) => (
                    <span
                      key={g}
                      className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {series.overview && (
                <p className="text-sm text-slate-300 leading-relaxed mb-4 line-clamp-4">
                  {series.overview}
                </p>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-6 text-sm mb-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Film className="w-4 h-4" />
                  <span>
                    {stats?.seasonCount || series.seasonCount} Season
                    {(stats?.seasonCount || series.seasonCount) !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Tv className="w-4 h-4" />
                  <span>
                    {stats?.episodeFileCount || 0}/{stats?.episodeCount || 0} Episodes
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <HardDrive className="w-4 h-4" />
                  <span>{formatBytes(stats?.sizeOnDisk || series.sizeOnDisk)}</span>
                </div>
                {qualityProfile && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                      {qualityProfile.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 bg-slate-800 rounded-full h-2.5 max-w-md">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      pct === 100 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm text-slate-400">{pct}%</span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAction('monitor')}
                  disabled={actionLoading === 'monitor'}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    series.monitored
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  {actionLoading === 'monitor' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : series.monitored ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                  {series.monitored ? 'Monitored' : 'Unmonitored'}
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
                  Search All
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

      {/* Path */}
      <div className="px-6 py-2">
        <p className="text-xs text-slate-600 truncate">{series.path}</p>
      </div>

      {/* Seasons & Episodes */}
      <div className="px-6 pb-6">
        <h2 className="text-lg font-semibold mb-3">Seasons</h2>
        {episodesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-2">
            {seasonNumbers.map((seasonNum) => {
              const seasonEpisodes = episodes
                .filter((e) => e.seasonNumber === seasonNum)
                .sort((a, b) => b.episodeNumber - a.episodeNumber)
              const seasonMeta = series.seasons?.find((s) => s.seasonNumber === seasonNum)
              const fileCount = seasonEpisodes.filter((e) => e.hasFile).length
              const totalCount = seasonEpisodes.length
              const isExpanded = expandedSeasons.has(seasonNum)
              const seasonPct = totalCount > 0 ? Math.round((fileCount / totalCount) * 100) : 0

              return (
                <div
                  key={seasonNum}
                  className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
                >
                  {/* Season header */}
                  <button
                    onClick={() => toggleSeason(seasonNum)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      )}
                      <span className="font-medium text-sm">
                        {seasonNum === 0 ? 'Specials' : `Season ${seasonNum}`}
                      </span>
                      <span className="text-xs text-slate-500">
                        {fileCount}/{totalCount} episodes
                      </span>
                      {seasonMeta?.statistics?.sizeOnDisk ? (
                        <span className="text-xs text-slate-600">
                          {formatBytes(seasonMeta.statistics.sizeOnDisk)}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Season progress */}
                      <div className="w-24 bg-slate-800 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${seasonPct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${seasonPct}%` }}
                        />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSeasonSearch(seasonNum)
                        }}
                        className="text-slate-500 hover:text-blue-400 transition-colors p-1"
                        title="Search season"
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </button>

                  {/* Episodes */}
                  {isExpanded && (
                    <div className="border-t border-slate-800">
                      {seasonEpisodes.map((ep) => (
                        <div
                          key={ep.id}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/30 transition-colors border-b border-slate-800/50 last:border-b-0"
                        >
                          {/* Monitor toggle */}
                          <button
                            onClick={() => handleEpisodeMonitor(ep)}
                            className="shrink-0"
                          >
                            {ep.monitored ? (
                              <Eye className="w-3.5 h-3.5 text-blue-400" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                            )}
                          </button>

                          {/* Episode code */}
                          <span className="text-xs text-slate-500 font-mono w-14 shrink-0">
                            {episodeCode(ep.seasonNumber, ep.episodeNumber)}
                          </span>

                          {/* Title & info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{ep.title || 'TBA'}</p>
                            {ep.airDateUtc && (
                              <p className="text-xs text-slate-600">
                                {formatDate(ep.airDateUtc)}
                              </p>
                            )}
                          </div>

                          {/* File status */}
                          <div className="flex items-center gap-2 shrink-0">
                            {ep.hasFile && ep.episodeFile && (
                              <>
                                <span className="text-xs text-slate-500">
                                  {formatBytes(ep.episodeFile.size)}
                                </span>
                                <span className="text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                  {ep.episodeFile.quality?.quality?.name}
                                </span>
                              </>
                            )}
                            {ep.hasFile ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : ep.airDateUtc && new Date(ep.airDateUtc) < new Date() ? (
                              <XCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-slate-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
