# Deskarr

A cross-platform desktop application for managing your media server stack from a single, unified dashboard. No more juggling browser tabs — monitor and control all your services in one place.

![Electron](https://img.shields.io/badge/Electron-28-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

### Unified Dashboard
- At-a-glance status for all connected services
- Upcoming episodes calendar widget with poster thumbnails
- Quick metrics (disk space, activity counts, queue sizes)

### TV Shows (Sonarr)
- Poster card grid with lazy-loaded images
- Filter by status: Monitored, Unmonitored, Continuing, Ended, Missing Episodes
- Sort by title, year, recently added, episode count, or size
- Rich series detail view with season/episode browser
- Toggle monitoring, trigger searches, and refresh metadata per series or episode
- Upcoming calendar grouped by day

### Movies (Radarr)
- Poster card grid with ratings and quality badges
- Filter: Monitored, Unmonitored, Downloaded, Missing, Wanted
- Sort by title, year, recently added, size, or rating
- Detailed movie view with file info (codec, resolution, audio channels, languages)
- Monitor toggle, search, and refresh actions

### Downloads
- Combined view for SABnzbd and qBittorrent
- Live speed stats and progress bars
- Queue management across download clients

### Settings
- Easy service configuration with connection testing
- API key authentication for *arr services
- Username/password authentication for qBittorrent

### Supported Services
| Service | Type | Auth |
|---------|------|------|
| Sonarr | TV Show Management | API Key |
| Radarr | Movie Management | API Key |
| Lidarr | Music Management | API Key |
| Readarr | Book Management | API Key |
| Prowlarr | Indexer Management | API Key |
| SABnzbd | Usenet Downloader | API Key |
| NZBGet | Usenet Downloader | API Key |
| qBittorrent | Torrent Client | Username/Password |
| Deluge | Torrent Client | API Key |
| Transmission | Torrent Client | API Key |
| Tautulli | Plex Monitoring | API Key |
| Overseerr | Request Management | API Key |
| Plex | Media Server | API Key |
| Jellyfin | Media Server | API Key |

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Potvis/Deskarr.git
cd Deskarr

# Install dependencies
npm install

# Launch in development mode
npm run dev
```

### Building

```bash
# Windows (NSIS installer)
npm run build:win

# macOS (DMG)
npm run build:mac

# Linux (AppImage + deb)
npm run build:linux
```

## Tech Stack

- **Electron** — Cross-platform desktop shell
- **React 18** — UI framework
- **TypeScript** — Type safety
- **Tailwind CSS** — Dark-themed styling
- **TanStack Query** — Data fetching with auto-refresh and caching
- **Zustand** — Lightweight state management
- **Axios** — HTTP client (main process)
- **Lucide React** — Icons

## Architecture

```
src/
├── main/           # Electron main process (IPC, API proxy, auth)
├── preload/        # Context bridge (secure renderer ↔ main communication)
└── renderer/
    └── src/
        ├── components/     # React components (Dashboard, Settings, service views)
        ├── services/       # API client functions per service
        ├── stores/         # Zustand config store
        ├── types/          # TypeScript type definitions
        └── lib/            # Utility functions
```

All API requests are proxied through the Electron main process via IPC to avoid CORS issues. Configuration is stored as a JSON file in the user's app data directory.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT
