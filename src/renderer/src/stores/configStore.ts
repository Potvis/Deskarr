import { create } from 'zustand'
import { AppConfig, ServiceConfig } from '../types'

interface ConfigStore {
  config: AppConfig
  loaded: boolean
  loadConfig: () => Promise<void>
  saveConfig: (config: AppConfig) => Promise<void>
  updateService: (id: string, service: ServiceConfig) => Promise<void>
  removeService: (id: string) => Promise<void>
  getServicesByType: (type: string) => ServiceConfig[]
  getEnabledService: (type: string) => ServiceConfig | undefined
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: { services: {} },
  loaded: false,

  loadConfig: async () => {
    const raw = await window.api.getConfig()
    const config: AppConfig = {
      services: {},
      ...(raw as object)
    }
    set({ config, loaded: true })
  },

  saveConfig: async (config: AppConfig) => {
    await window.api.setConfig(config as unknown as Record<string, unknown>)
    set({ config })
  },

  updateService: async (id: string, service: ServiceConfig) => {
    const config = { ...get().config }
    config.services = { ...config.services, [id]: service }
    await window.api.setConfig(config as unknown as Record<string, unknown>)
    set({ config })
  },

  removeService: async (id: string) => {
    const config = { ...get().config }
    const services = { ...config.services }
    delete services[id]
    config.services = services
    await window.api.setConfig(config as unknown as Record<string, unknown>)
    set({ config })
  },

  getServicesByType: (type: string) => {
    return Object.values(get().config.services).filter((s) => s.type === type)
  },

  getEnabledService: (type: string) => {
    return Object.values(get().config.services).find((s) => s.type === type && s.enabled)
  }
}))
