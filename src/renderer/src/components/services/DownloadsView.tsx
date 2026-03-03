import { useQuery } from '@tanstack/react-query'
import { useConfigStore } from '../../stores/configStore'
import { getSabnzbdQueue, getSabnzbdHistory } from '../../services/sabnzbd'
import { getQbitTorrents, getQbitTransferInfo } from '../../services/qbittorrent'
import { formatBytes, formatSpeed, formatEta } from '../../lib/utils'
import {
  Download,
  Loader2,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  HardDrive
} from 'lucide-react'
import type { SabnzbdSlot, QbitTorrent } from '../../types'

export default function DownloadsView() {
  const { config } = useConfigStore()
  const sabnzbd = Object.values(config.services).find((s) => s.type === 'sabnzbd' && s.enabled)
  const qbit = Object.values(config.services).find(
    (s) => s.type === 'qbittorrent' && s.enabled
  )

  const { data: sabQueueData, isLoading: sabLoading } = useQuery({
    queryKey: ['sabnzbd', 'queue'],
    queryFn: () => getSabnzbdQueue(sabnzbd!.url, sabnzbd!.apiKey),
    enabled: !!sabnzbd,
    refetchInterval: 5000
  })

  const { data: sabHistoryData } = useQuery({
    queryKey: ['sabnzbd', 'history'],
    queryFn: () => getSabnzbdHistory(sabnzbd!.url, sabnzbd!.apiKey),
    enabled: !!sabnzbd,
    refetchInterval: 30000
  })

  const { data: qbitTorrentsData, isLoading: qbitLoading } = useQuery({
    queryKey: ['qbittorrent', 'torrents'],
    queryFn: () => getQbitTorrents(qbit!.url, qbit!.username, qbit!.password),
    enabled: !!qbit,
    refetchInterval: 5000
  })

  const { data: qbitTransferData } = useQuery({
    queryKey: ['qbittorrent', 'transfer'],
    queryFn: () => getQbitTransferInfo(qbit!.url, qbit!.username, qbit!.password),
    enabled: !!qbit,
    refetchInterval: 5000
  })

  const hasSab = !!sabnzbd
  const hasQbit = !!qbit
  const hasAny = hasSab || hasQbit

  if (!hasAny) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <Download className="w-16 h-16 mb-4 text-slate-600" />
        <p className="text-lg font-medium text-slate-300">No download clients configured</p>
        <p className="text-sm mt-2">Go to Settings to add SABnzbd, qBittorrent, or others</p>
      </div>
    )
  }

  const sabQueue =
    sabQueueData?.success && sabQueueData.data
      ? (sabQueueData.data as { queue: { slots: SabnzbdSlot[]; speed: string; sizeleft: string; timeleft: string; paused: boolean } }).queue
      : null
  const sabHistory =
    sabHistoryData?.success && sabHistoryData.data
      ? (sabHistoryData.data as { history: { slots: Array<{ nzo_id: string; name: string; status: string; size: string }> } }).history.slots.slice(0, 10)
      : []

  const qbitTorrents: QbitTorrent[] =
    qbitTorrentsData?.success && Array.isArray(qbitTorrentsData.data)
      ? qbitTorrentsData.data
      : []
  const qbitTransfer =
    qbitTransferData?.success && qbitTransferData.data
      ? (qbitTransferData.data as { dl_info_speed: number; up_info_speed: number })
      : null

  const activeTorrents = qbitTorrents.filter(
    (t) => t.state === 'downloading' || t.state === 'uploading' || t.state === 'stalledDL' || t.state === 'stalledUP'
  )
  const completedTorrents = qbitTorrents.filter(
    (t) => t.state === 'pausedUP' || t.state === 'uploading' || t.state === 'stalledUP'
  )

  function torrentStateLabel(state: string): { label: string; color: string } {
    switch (state) {
      case 'downloading':
        return { label: 'Downloading', color: 'text-blue-400' }
      case 'uploading':
      case 'stalledUP':
        return { label: 'Seeding', color: 'text-green-400' }
      case 'pausedDL':
        return { label: 'Paused', color: 'text-yellow-400' }
      case 'pausedUP':
        return { label: 'Completed', color: 'text-slate-400' }
      case 'stalledDL':
        return { label: 'Stalled', color: 'text-orange-400' }
      case 'error':
        return { label: 'Error', color: 'text-red-400' }
      case 'queuedDL':
        return { label: 'Queued', color: 'text-slate-400' }
      default:
        return { label: state, color: 'text-slate-400' }
    }
  }

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Downloads</h1>
        <p className="text-sm text-slate-400 mt-1">Unified view of all download clients</p>
      </div>

      {/* Speed overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {hasSab && sabQueue && (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <ArrowDown className="w-3 h-3" /> SABnzbd Speed
              </div>
              <p className="text-lg font-semibold">{sabQueue.speed || '0 B/s'}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <HardDrive className="w-3 h-3" /> SABnzbd Remaining
              </div>
              <p className="text-lg font-semibold">{sabQueue.sizeleft || '0 B'}</p>
            </div>
          </>
        )}
        {hasQbit && qbitTransfer && (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <ArrowDown className="w-3 h-3" /> qBit Download
              </div>
              <p className="text-lg font-semibold">{formatSpeed(qbitTransfer.dl_info_speed)}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <ArrowUp className="w-3 h-3" /> qBit Upload
              </div>
              <p className="text-lg font-semibold">{formatSpeed(qbitTransfer.up_info_speed)}</p>
            </div>
          </>
        )}
      </div>

      {/* SABnzbd section */}
      {hasSab && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Download className="w-5 h-5 text-yellow-400" />
            SABnzbd
            {sabQueue?.paused && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                Paused
              </span>
            )}
          </h2>
          {sabLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {sabQueue && sabQueue.slots.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {sabQueue.slots.map((slot: SabnzbdSlot) => (
                    <div
                      key={slot.nzo_id}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium truncate mr-4">{slot.filename}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                          <span className="bg-slate-800 px-2 py-0.5 rounded">{slot.cat}</span>
                          <span>{slot.timeleft}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-800 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full transition-all"
                            style={{ width: `${slot.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-10 text-right">
                          {slot.percentage}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {slot.mbleft} MB remaining of {slot.mb} MB
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 mb-4">No active downloads</p>
              )}

              {sabHistory.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Recent History</h3>
                  <div className="space-y-1">
                    {sabHistory.map((item) => (
                      <div
                        key={item.nzo_id}
                        className="flex items-center justify-between bg-slate-900/50 rounded-lg px-4 py-2.5"
                      >
                        <p className="text-sm truncate mr-4">{item.name}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-500">{item.size}</span>
                          {item.status === 'Completed' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* qBittorrent section */}
      {hasQbit && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" />
            qBittorrent
            <span className="text-xs text-slate-500">({qbitTorrents.length} torrents)</span>
          </h2>
          {qbitLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : qbitTorrents.length === 0 ? (
            <p className="text-sm text-slate-500">No torrents</p>
          ) : (
            <div className="space-y-2">
              {qbitTorrents
                .sort((a, b) => b.added_on - a.added_on)
                .slice(0, 50)
                .map((torrent) => {
                  const state = torrentStateLabel(torrent.state)
                  const percent = Math.round(torrent.progress * 100)
                  return (
                    <div
                      key={torrent.hash}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium truncate mr-4">{torrent.name}</p>
                        <div className="flex items-center gap-2 text-xs shrink-0">
                          {torrent.category && (
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                              {torrent.category}
                            </span>
                          )}
                          <span className={state.color}>{state.label}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="flex-1 bg-slate-800 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              percent === 100 ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-10 text-right">{percent}%</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{formatBytes(torrent.size)}</span>
                        {torrent.dlspeed > 0 && (
                          <span className="flex items-center gap-1">
                            <ArrowDown className="w-3 h-3" />
                            {formatSpeed(torrent.dlspeed)}
                          </span>
                        )}
                        {torrent.upspeed > 0 && (
                          <span className="flex items-center gap-1">
                            <ArrowUp className="w-3 h-3" />
                            {formatSpeed(torrent.upspeed)}
                          </span>
                        )}
                        {torrent.eta > 0 && torrent.eta < 8640000 && (
                          <span>ETA: {formatEta(torrent.eta)}</span>
                        )}
                        <span>Ratio: {torrent.ratio.toFixed(2)}</span>
                      </div>
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
