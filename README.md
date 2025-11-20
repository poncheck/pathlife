# PathLife 📸🏃📍

Personal diary application that automatically creates daily entries from:
- **Immich** photos
- **Strava** activities  
- **Traccar** GPS location data

Built with React, Node.js, TypeScript, PostgreSQL, and Docker.

## Features

✨ **Automatic Data Sync**
- Photos from Immich with metadata
- Activities from Strava with GPX files
- GPS tracks from Traccar with GPX generation

📅 **Monthly Calendar View**
- Visual indicators for photos and activities
- Photo count badges
- Click any day to see full details

🗺️ **Interactive Maps**
- Leaflet maps with GPS traces
- Route visualization from Traccar

📁 **Local GPX Storage**
- Download and store Strava activity GPX files
- Generate GPX files from Traccar GPS data
- Persist locally for offline access

## Quick Start with Docker Compose

### Prerequisites

- Docker and Docker Compose installed
- Immich instance with API key
- (Optional) Strava API credentials
- (Optional) Traccar instance

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd pathlife
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   nano .env  # Fill in your API credentials
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:3000
   - Health check: http://localhost:3000/health

### First Sync

Trigger initial data synchronization:

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-01-01",
    "endDate": "2025-11-20"
  }'
```

Or use the "Synchronizuj dane" button in the web interface.

## Environment Variables

See `.env.example` for all available configuration options.

### Required Variables

- `IMMICH_URL` - Your Immich instance URL
- `IMMICH_API_KEY` - Immich API key

### Optional Variables

- `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_REFRESH_TOKEN` - For Strava integration
- `TRACCAR_URL`, `TRACCAR_EMAIL`, `TRACCAR_PASSWORD` - For Traccar integration
- `SYNC_SCHEDULE` - Cron schedule for automatic sync (default: every 6 hours)

## API Limits

**Strava API**
- 100 requests per 15 minutes
- 1000 requests per day

**Recommendation:** Set `SYNC_SCHEDULE` to sync every 6-12 hours to avoid rate limits.

## Troubleshooting

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Database Issues

Reset database:
```bash
docker-compose down -v
docker-compose up -d
```

## License

MIT
