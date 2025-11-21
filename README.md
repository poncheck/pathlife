# PathLife 📸🏃📍

**Your Personal Digital Diary** - Automatically creates daily entries from your photos, sports activities, and GPS data.

[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/typescript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/react-18-blue.svg)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

### 🔒 Security
- **Authentication System** - JWT authentication with bcrypt password hashing
- **Encrypted Storage** - API credentials encrypted with AES-256
- **Web Admin Panel** - Manage all settings through the web interface
- **Protected API** - All endpoints require authentication

### 📅 Monthly Calendar
- **Grid View** - Clean calendar showing the entire month
- **Visual Indicators** - Dots for photos and activities
- **Photo Count Badge** - Days with many photos get a badge
- **Today Highlight** - Current day marked with blue ring

### 📸 Photos from Immich
- Automatic synchronization of photos from Immich
- Thumbnails and full versions via proxy
- Select photos to display
- Gallery with lightbox modal
- EXIF metadata (location, time)

### 🏃 Activities from Strava
- Import sports activities
- **Download GPX files** - Locally save activity routes
- Statistics: distance, time, elevation gain
- Polyline map visualization
- Respects API limits (100/15min, 1000/day)

### 📍 GPS from Traccar
- Location tracking from Traccar
- **Generate GPX files** - Daily GPS tracks
- Interactive maps with Leaflet
- Route visualization
- Addresses and speed data

### 🎯 Additional Features
- **"On This Day"** - What happened X years ago
- **Notes** - Daily descriptions
- Automatic synchronization (configurable cron)
- Export GPX for other apps
- Responsive design (desktop + mobile)
- Historical sync from any year (e.g., 1986)

### 📱 iOS Native App
- **Native iOS application** with SwiftUI
- **Background GPS tracking** - Replaces Traccar with Core Location
- **Camera Roll integration** - Direct access to iPhone photos
- **Offline support** - Works without internet connection
- **TestFlight ready** - Easy distribution to testers
- **Secure** - JWT stored in iOS Keychain
- See `apps/ios/README.md` for setup instructions

## 🚀 Quick Start with Docker

### Requirements

- Docker and Docker Compose
- Immich instance with API key (required)
- Strava API credentials (optional)
- Traccar instance (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/poncheck/pathlife.git
   cd pathlife
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   nano .env
   ```

   **⚠️ IMPORTANT:** Change default passwords and keys!
   ```env
   # Security (generate: openssl rand -base64 32)
   JWT_SECRET=your-super-secret-key-min-32-chars
   ENCRYPTION_KEY=another-secret-key-32-chars
   ADMIN_PASSWORD=strong-password

   # Immich (required)
   IMMICH_URL=https://immich.example.com
   IMMICH_API_KEY=your-api-key

   # Strava (optional)
   STRAVA_CLIENT_ID=123456
   STRAVA_CLIENT_SECRET=secret
   STRAVA_REFRESH_TOKEN=token

   # Traccar (optional)
   TRACCAR_URL=https://traccar.example.com
   TRACCAR_EMAIL=user@example.com
   TRACCAR_PASSWORD=password
   ```

3. **Start the application**
   ```bash
   docker compose up -d
   ```

4. **Access the application**
   - 🌐 Frontend: **http://localhost:3031**
   - 🔧 Backend API: **http://localhost:3030**
   - 💚 Health check: **http://localhost:3030/health**

5. **First login**

   Default credentials (CHANGE AFTER FIRST LOGIN!):
   - Username: `admin`
   - Password: Generated on first run (check logs)

6. **Configure APIs**

   After logging in:
   - Click **"Settings"** in the menu
   - Fill in API credentials (Immich/Strava/Traccar)
   - Click **"Save Settings"**

7. **First synchronization**

   In Settings, click sync buttons:
   - **Last 30 days** - Quick sync
   - **Last 90 days** - Recent data
   - **Last year** - Full year
   - **From 1986 🚀** - Complete historical sync

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│            React + TypeScript + Vite            │
│          (nginx + Tailwind CSS)                 │
└────────────────┬────────────────────────────────┘
                 │ HTTP/REST
                 ▼
┌─────────────────────────────────────────────────┐
│                   Backend                        │
│         Node.js + Express + TypeScript          │
│     (JWT Auth + AES Encryption)                 │
└────────┬────────────────────────────────────────┘
         │
    ┌────┴─────┬──────────┬──────────────┐
    ▼          ▼          ▼              ▼
┌────────┐ ┌────────┐ ┌────────┐   ┌──────────┐
│Postgres│ │ Immich │ │ Strava │   │ Traccar  │
│  DB    │ │  API   │ │  API   │   │   API    │
└────────┘ └────────┘ └────────┘   └──────────┘
    │
    ▼
┌──────────────┐
│  GPX Files   │
│   Storage    │
└──────────────┘
```

### Technology Stack

**Backend:**
- Node.js 20 + Express
- TypeScript
- Prisma ORM
- PostgreSQL 16
- JWT (jsonwebtoken)
- Bcrypt (password hashing)
- Crypto-JS (AES encryption)
- node-cron (scheduling)

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Leaflet (maps)
- date-fns

**Infrastructure:**
- Docker + Docker Compose
- nginx (reverse proxy)
- PostgreSQL (database)

## 📊 Database Schema

```sql
-- Users (authentication)
User (id, username, password_hash, email, role)

-- Encrypted API settings
Settings (id, key, encrypted_value, type)

-- Diary entries
DiaryEntry (id, date, description, gpxPath)
  ├── Photo (immichId, url, thumbnailUrl, selected)
  ├── Activity (stravaId, name, distance, gpxPath)
  └── Location (latitude, longitude, address, speed)

-- Synchronization history
SyncLog (source, status, itemCount, timestamp)
```

## 🔐 Security

### Default Settings
- Username: `admin`
- Password: Generated on first run (check container logs)

**⚠️ CHANGE THESE AFTER FIRST LOGIN!**

### Production Setup

1. **Generate secure keys:**
   ```bash
   openssl rand -base64 32  # for JWT_SECRET
   openssl rand -base64 32  # for ENCRYPTION_KEY
   ```

2. **Set in `.env`:**
   ```env
   JWT_SECRET=generated-key-1
   ENCRYPTION_KEY=generated-key-2
   ADMIN_PASSWORD=very-strong-password
   ```

3. **Use HTTPS:**
   - Put application behind reverse proxy (nginx, Traefik, Caddy)
   - Enable SSL/TLS
   - Set proper CORS headers

### What's Encrypted?
- ✅ User passwords (bcrypt, 10 rounds)
- ✅ API keys (AES-256)
- ✅ External service passwords (AES-256)
- ✅ JWT tokens (signed, 7 days validity)

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|---------|----------|-------------|
| `JWT_SECRET` | Yes | Key for signing JWT (min 32 chars) |
| `ENCRYPTION_KEY` | Yes | AES key for encryption (32 chars) |
| `ADMIN_PASSWORD` | Yes | Default admin password |
| `IMMICH_URL` | Yes* | Immich instance URL |
| `IMMICH_API_KEY` | Yes* | Immich API key |
| `STRAVA_CLIENT_ID` | No | Strava Client ID |
| `STRAVA_CLIENT_SECRET` | No | Strava Client Secret |
| `STRAVA_REFRESH_TOKEN` | No | Strava Refresh Token |
| `TRACCAR_URL` | No | Traccar instance URL |
| `TRACCAR_EMAIL` | No | Traccar email |
| `TRACCAR_PASSWORD` | No | Traccar password |
| `SYNC_SCHEDULE` | No | Cron schedule (default: `0 */6 * * *`) |

*Can be configured via web interface after first login

### Synchronization Schedule

Format: cron expression

```bash
# Every 6 hours (recommended)
SYNC_SCHEDULE="0 */6 * * *"

# Every 12 hours (safe for Strava limits)
SYNC_SCHEDULE="0 */12 * * *"

# Twice daily
SYNC_SCHEDULE="0 6,18 * * *"

# Once daily at 6:00 AM
SYNC_SCHEDULE="0 6 * * *"
```

**⚠️ Strava API Limits:**
- 100 requests / 15 minutes
- 1000 requests / day

Avoid too frequent synchronization!

## 📂 Project Structure

```
pathlife/
├── docker-compose.yml       # Orchestration
├── .env                     # Configuration (don't commit!)
├── .env.example             # Configuration template
│
├── apps/
│   ├── backend/
│   │   ├── Dockerfile
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # Database model
│   │   │   └── migrations/       # SQL migrations
│   │   └── src/
│   │       ├── index.ts           # Entry point
│   │       ├── middleware/        # Auth middleware
│   │       ├── routes/            # API endpoints
│   │       ├── services/          # Business logic
│   │       └── utils/             # GPX generator, logger
│   │
│   └── frontend/
│       ├── Dockerfile
│       ├── nginx.conf
│       └── src/
│           ├── App.tsx            # Main app
│           ├── contexts/          # Auth context
│           ├── components/        # React components
│           └── pages/             # Login, Settings, Timeline
│
└── README.md
```

## 🎯 API Endpoints

### Public (no authentication)
- `GET /health` - Health check
- `POST /api/auth/login` - Login

### Protected (requires JWT token)
- `GET /api/auth/me` - User information
- `POST /api/auth/change-password` - Change password
- `GET /api/diary/entries/:date` - Entry for specific date
- `GET /api/diary/entries` - List of entries
- `PATCH /api/diary/entries/:date` - Update description
- `POST /api/sync` - Sync data for date range
- `POST /api/sync/today` - Sync today
- `POST /api/sync/last-days/:days` - Sync last N days
- `POST /api/sync/all` - Sync last 30 days
- `GET /api/settings/:type` - Get settings
- `PUT /api/settings/:key` - Update setting
- `POST /api/settings/bulk` - Bulk update

## 🛠️ Useful Commands

```bash
# Start application
docker compose up -d

# Stop application
docker compose down

# Restart application
docker compose restart

# Logs for all services
docker compose logs -f

# Logs for specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres

# Rebuild after code changes
docker compose up -d --build

# Access database
docker compose exec postgres psql -U pathlife -d pathlife

# Database backup
docker compose exec postgres pg_dump -U pathlife pathlife > backup.sql

# Database restore
docker compose exec -T postgres psql -U pathlife pathlife < backup.sql

# Clean EVERYTHING (WARNING: deletes data!)
docker compose down -v
```

## 📥 GPX Files

The application automatically saves GPX files:

### Strava
```
data/gpx/strava/
├── 123456789-morning_run.gpx
├── 987654321-evening_ride.gpx
└── ...
```

### Traccar
```
data/gpx/traccar/
├── traccar-2025-11-18.gpx  # All points from the day
├── traccar-2025-11-19.gpx
└── ...
```

**Format:** GPX 1.1 with:
- GPS coordinates (lat/lon)
- Timestamps
- Elevation data
- Speed data
- Proper metadata

## 🐛 Troubleshooting

### Problem: Backend won't start

**Check logs:**
```bash
docker compose logs -f backend
```

**Common issues:**
- Missing environment variables in `.env`
- PostgreSQL hasn't started yet
- Port 3030 already in use

**Solution:**
```bash
docker compose down
docker compose up -d --build
```

### Problem: Can't login

**Check if backend is running:**
```bash
curl http://localhost:3030/health
```

**Check container logs for default password:**
```bash
docker compose logs backend | grep "Password:"
```

### Problem: No photos from Immich

**Check:**
1. Is Immich API key correct?
2. Is Immich URL accessible from Docker?
3. Logs: `docker compose logs -f backend | grep -i immich`

### Problem: Strava rate limit exceeded

**Check schedule:**
```bash
echo $SYNC_SCHEDULE
```

**Change to less frequent sync:**
```env
SYNC_SCHEDULE="0 */12 * * *"  # Every 12 hours
```

### Problem: Empty database

**Reset and resync:**
```bash
# WARNING: This will delete all data!
docker compose down -v
docker compose up -d
# Wait 30s for initialization
# Login and click "Sync" in Settings
```

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

### Development Setup

```bash
# Clone repo
git clone https://github.com/poncheck/pathlife.git
cd pathlife

# Backend
cd apps/backend
npm install
npm run dev

# Frontend (in new terminal)
cd apps/frontend
npm install
npm run dev
```

## 📝 License

MIT © poncheck

---

**Note:** This project requires working Immich, Strava and/or Traccar instances. It does not include these services - you must configure them separately.

## 🙏 Acknowledgments

- [Immich](https://immich.app/) - Photo management
- [Strava](https://www.strava.com/) - Sports activities
- [Traccar](https://www.traccar.org/) - GPS tracking
- [Leaflet](https://leafletjs.com/) - Interactive maps
