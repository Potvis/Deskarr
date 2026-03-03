import { useState } from 'react'
import { useConfigStore } from '../stores/configStore'
import { ServiceConfig, ServiceType } from '../types'
import {
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Tv,
  Film,
  Music,
  BookOpen,
  Search,
  Download,
  Activity,
  MessageSquare,
  MonitorPlay,
  Save,
  X,
  type LucideIcon
} from 'lucide-react'

const SERVICE_TYPES: { type: ServiceType; label: string; category: string; icon: LucideIcon; color: string }[] = [
  { type: 'sonarr', label: 'Sonarr', category: 'Media Management', icon: Tv, color: 'text-sky-400' },
  { type: 'radarr', label: 'Radarr', category: 'Media Management', icon: Film, color: 'text-amber-400' },
  { type: 'lidarr', label: 'Lidarr', category: 'Media Management', icon: Music, color: 'text-green-400' },
  { type: 'readarr', label: 'Readarr', category: 'Media Management', icon: BookOpen, color: 'text-purple-400' },
  { type: 'prowlarr', label: 'Prowlarr', category: 'Indexers', icon: Search, color: 'text-orange-400' },
  { type: 'sabnzbd', label: 'SABnzbd', category: 'Downloads', icon: Download, color: 'text-yellow-400' },
  { type: 'nzbget', label: 'NZBGet', category: 'Downloads', icon: Download, color: 'text-emerald-400' },
  { type: 'qbittorrent', label: 'qBittorrent', category: 'Downloads', icon: Download, color: 'text-blue-400' },
  { type: 'deluge', label: 'Deluge', category: 'Downloads', icon: Download, color: 'text-indigo-400' },
  { type: 'transmission', label: 'Transmission', category: 'Downloads', icon: Download, color: 'text-red-400' },
  { type: 'overseerr', label: 'Overseerr', category: 'Requests', icon: MessageSquare, color: 'text-indigo-400' },
  { type: 'tautulli', label: 'Tautulli', category: 'Monitoring', icon: Activity, color: 'text-orange-400' },
  { type: 'plex', label: 'Plex', category: 'Media Servers', icon: MonitorPlay, color: 'text-amber-400' },
  { type: 'jellyfin', label: 'Jellyfin', category: 'Media Servers', icon: MonitorPlay, color: 'text-purple-400' }
]

export default function Settings() {
  const { config, updateService, removeService } = useConfigStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ServiceConfig | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [testing, setTesting] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)

  const handleAdd = (type: ServiceType) => {
    const id = `${type}-${Date.now()}`
    const label = SERVICE_TYPES.find((s) => s.type === type)?.label || type
    const newService: ServiceConfig = {
      name: label,
      url: '',
      apiKey: '',
      enabled: true,
      type
    }
    updateService(id, newService)
    setEditingId(id)
    setEditForm(newService)
    setShowAddMenu(false)
    setTestResult(null)
  }

  const handleEdit = (id: string) => {
    setEditingId(id)
    setEditForm({ ...config.services[id] })
    setTestResult(null)
  }

  const handleTest = async () => {
    if (!editForm) return
    setTesting(true)
    setTestResult(null)
    try {
      const result = await window.api.testConnection({
        baseUrl: editForm.url,
        apiKey: editForm.apiKey,
        type: editForm.type,
        username: editForm.username,
        password: editForm.password
      })
      setTestResult({
        success: result.success,
        message: result.success ? 'Connection successful!' : `Failed: ${result.error}`
      })
    } catch (e: unknown) {
      const err = e as Error
      setTestResult({ success: false, message: err.message })
    }
    setTesting(false)
  }

  const handleSave = async () => {
    if (!editingId || !editForm) return
    await updateService(editingId, editForm)
    setEditingId(null)
    setEditForm(null)
    setTestResult(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm(null)
    setTestResult(null)
  }

  const handleRemove = async (id: string) => {
    await removeService(id)
    if (editingId === id) {
      setEditingId(null)
      setEditForm(null)
    }
  }

  const services = Object.entries(config.services)
  const categories = [...new Set(SERVICE_TYPES.map((s) => s.category))]

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Configure your media server services</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </button>
          {showAddMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 py-2 max-h-96 overflow-auto">
                {categories.map((cat) => (
                  <div key={cat}>
                    <p className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {cat}
                    </p>
                    {SERVICE_TYPES.filter((s) => s.category === cat).map((s) => (
                      <button
                        key={s.type}
                        onClick={() => handleAdd(s.type)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                      >
                        <s.icon className={`w-4 h-4 ${s.color}`} />
                        {s.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {services.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg mb-2">No services configured</p>
          <p className="text-sm">Click &quot;Add Service&quot; to get started</p>
        </div>
      )}

      <div className="space-y-3">
        {services.map(([id, service]) => {
          const meta = SERVICE_TYPES.find((s) => s.type === service.type)
          const isEditing = editingId === id
          const Icon = meta?.icon || Activity

          return (
            <div
              key={id}
              className={`bg-slate-900 border rounded-xl transition-all ${
                isEditing ? 'border-blue-500' : 'border-slate-800'
              }`}
            >
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => (!isEditing ? handleEdit(id) : undefined)}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${meta?.color || 'text-slate-400'}`} />
                  <div>
                    <h3 className="font-medium text-sm">{service.name}</h3>
                    <p className="text-xs text-slate-500">
                      {service.url || 'Not configured'} &middot; {meta?.label || service.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      service.enabled
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {service.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(id)
                    }}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isEditing && editForm && (
                <div className="px-4 pb-4 border-t border-slate-800 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        placeholder="My Sonarr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">
                        Enabled
                      </label>
                      <button
                        onClick={() => setEditForm({ ...editForm, enabled: !editForm.enabled })}
                        className={`relative inline-flex h-9 w-16 items-center rounded-lg transition-colors ${
                          editForm.enabled ? 'bg-blue-600' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-md bg-white transition-transform ${
                            editForm.enabled ? 'translate-x-8' : 'translate-x-1.5'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">
                        URL
                      </label>
                      <input
                        type="text"
                        value={editForm.url}
                        onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        placeholder="http://localhost:8989"
                      />
                    </div>
                    {editForm.type === 'qbittorrent' ? (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Username
                          </label>
                          <input
                            type="text"
                            value={editForm.username || ''}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            placeholder="admin"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Password
                          </label>
                          <input
                            type="password"
                            value={editForm.password || ''}
                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            placeholder="Password"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                          API Key
                        </label>
                        <input
                          type="password"
                          value={editForm.apiKey}
                          onChange={(e) => setEditForm({ ...editForm, apiKey: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                          placeholder="Your API key"
                        />
                      </div>
                    )}
                  </div>

                  {testResult && (
                    <div
                      className={`mt-4 flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                        testResult.success
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {testResult.success ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      {testResult.message}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={handleTest}
                      disabled={testing || !editForm.url}
                      className="inline-flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors text-sm disabled:opacity-50"
                    >
                      {testing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Activity className="w-4 h-4" />
                      )}
                      Test Connection
                    </button>
                    <button
                      onClick={handleSave}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="inline-flex items-center gap-2 text-slate-400 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
