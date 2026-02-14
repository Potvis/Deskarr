import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useConfigStore } from './stores/configStore'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import Settings from './components/Settings'
import SonarrView from './components/services/SonarrView'
import RadarrView from './components/services/RadarrView'
import DownloadsView from './components/services/DownloadsView'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10000,
      refetchOnWindowFocus: false
    }
  }
})

function AppLoader({ children }: { children: React.ReactNode }) {
  const { loaded, loadConfig } = useConfigStore()

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-400">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading Deskarr...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppLoader>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="sonarr" element={<SonarrView />} />
              <Route path="radarr" element={<RadarrView />} />
              <Route path="downloads" element={<DownloadsView />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </AppLoader>
    </QueryClientProvider>
  )
}
