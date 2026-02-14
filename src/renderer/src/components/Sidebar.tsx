import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Tv, Film, Download, Settings, Clapperboard } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sonarr', icon: Tv, label: 'TV Shows' },
  { to: '/radarr', icon: Film, label: 'Movies' },
  { to: '/downloads', icon: Download, label: 'Downloads' }
]

export default function Sidebar() {
  return (
    <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-800">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Clapperboard className="w-6 h-6 text-blue-500" />
          Deskarr
        </h1>
        <p className="text-xs text-slate-500 mt-1">Media Server Manager</p>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-2 border-t border-slate-800">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`
          }
        >
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>
      </div>
    </aside>
  )
}
