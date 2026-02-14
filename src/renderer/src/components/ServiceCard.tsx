import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ServiceConfig } from '../types'
import { CheckCircle, XCircle, Loader2, type LucideIcon } from 'lucide-react'

interface ServiceCardProps {
  service: ServiceConfig
  icon: LucideIcon
  iconColor: string
  link?: string
  metrics?: { label: string; value: string | number }[]
}

export default function ServiceCard({ service, icon: Icon, iconColor, link, metrics }: ServiceCardProps) {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    if (!service.enabled) {
      setStatus('offline')
      return
    }
    setStatus('checking')
    window.api
      .testConnection({ baseUrl: service.url, apiKey: service.apiKey, type: service.type })
      .then((result) => setStatus(result.success ? 'online' : 'offline'))
      .catch(() => setStatus('offline'))
  }, [service])

  return (
    <button
      onClick={() => link && navigate(link)}
      className={`bg-slate-900 border border-slate-800 rounded-xl p-5 text-left transition-all hover:border-slate-700 hover:bg-slate-800/50 ${
        link ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{service.name}</h3>
            <p className="text-xs text-slate-500 truncate max-w-[180px]">{service.url}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {status === 'checking' && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
          {status === 'online' && <CheckCircle className="w-4 h-4 text-green-500" />}
          {status === 'offline' && <XCircle className="w-4 h-4 text-red-500" />}
          <span
            className={`text-xs ${
              status === 'online'
                ? 'text-green-500'
                : status === 'offline'
                  ? 'text-red-500'
                  : 'text-slate-400'
            }`}
          >
            {status === 'checking' ? 'Checking...' : status === 'online' ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
      {metrics && metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800">
          {metrics.map((m) => (
            <div key={m.label}>
              <p className="text-xs text-slate-500">{m.label}</p>
              <p className="text-sm font-medium">{m.value}</p>
            </div>
          ))}
        </div>
      )}
    </button>
  )
}
