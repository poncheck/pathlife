# PathLife 📸🏃📍

**Osobisty pamiętnik cyfrowy** - automatycznie tworzy wpisy dzienne z Twoich zdjęć, aktywności sportowych i danych GPS.

[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/typescript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/react-18-blue.svg)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Funkcje

### 🔒 Bezpieczeństwo
- **System logowania** - JWT authentication z bcrypt hashing
- **Szyfrowane dane** - API credentials zaszyfrowane AES-256
- **Panel administracyjny** - zarządzanie ustawieniami przez WWW
- **Zabezpieczone API** - wszystkie endpointy wymagają autentykacji

### 📅 Kalendarz miesięczny
- **Widok kratkowy** - przejrzysty kalendarz z całym miesiącem
- **Wizualne wskaźniki** - kropki dla zdjęć i aktywności
- **Badge z liczbą** - dni z wieloma zdjęciami
- **Dzień dzisiejszy** - wyróżniony niebieskim pierścieniem

### 📸 Zdjęcia z Immich
- Automatyczna synchronizacja zdjęć z Immich
- Miniaturki i pełne wersje przez proxy
- Wybór zdjęć do wyświetlenia
- Galeria z lightbox modal
- Metadata EXIF (lokalizacja, czas)

### 🏃 Aktywności ze Strava
- Import aktywności sportowych
- **Pobieranie plików GPX** - lokalne zapisywanie tras
- Statystyki: dystans, czas, przewyższenie
- Polyline map visualization
- Respektowanie limitów API (100/15min, 1000/dzień)

### 📍 GPS z Traccar
- Śledzenie lokalizacji z Traccar
- **Generowanie plików GPX** - dzienne trasy GPS
- Interaktywne mapy z Leaflet
- Wizualizacja tras
- Adresy i prędkość

### 🎯 Dodatkowe funkcje
- **"W tym dniu"** - co się wydarzyło X lat temu
- **Notatki** - opis każdego dnia
- Automatyczna synchronizacja (configurable cron)
- Export GPX do innych aplikacji
- Responsive design (desktop + mobile)

## 🚀 Szybki start z Docker

### Wymagania

- Docker i Docker Compose
- Immich instance z API key (wymagane)
- Strava API credentials (opcjonalne)
- Traccar instance (opcjonalne)

### Instalacja

1. **Sklonuj repozytorium**
   ```bash
   git clone https://github.com/poncheck/pathlife.git
   cd pathlife
   ```

2. **Skonfiguruj zmienne środowiskowe**
   ```bash
   cp .env.example .env
   nano .env
   ```

   **⚠️ WAŻNE:** Zmień domyślne hasła i klucze!
   ```env
   # Bezpieczeństwo (wygeneruj: openssl rand -base64 32)
   JWT_SECRET=twoj-super-tajny-klucz-min-32-znaki
   ENCRYPTION_KEY=inny-tajny-klucz-32-znaki
   ADMIN_PASSWORD=silne-haslo

   # Immich (wymagane)
   IMMICH_URL=https://immich.example.com
   IMMICH_API_KEY=twoj-klucz-api

   # Strava (opcjonalne)
   STRAVA_CLIENT_ID=123456
   STRAVA_CLIENT_SECRET=secret
   STRAVA_REFRESH_TOKEN=token

   # Traccar (opcjonalne)
   TRACCAR_URL=https://traccar.example.com
   TRACCAR_EMAIL=user@example.com
   TRACCAR_PASSWORD=haslo
   ```

3. **Uruchom aplikację**
   ```bash
   docker-compose up -d
   ```

4. **Dostęp do aplikacji**
   - 🌐 Frontend: **http://localhost**
   - 🔧 Backend API: **http://localhost:3000**
   - 💚 Health check: **http://localhost:3000/health**

5. **Pierwsze logowanie**

   Domyślne dane logowania (ZMIEŃ PO PIERWSZYM LOGOWANIU!):
   - Username: `admin`
   - Password: `admin123`

6. **Konfiguracja API**

   Po zalogowaniu:
   - Kliknij **"Ustawienia"** w menu
   - Wypełnij dane API (Immich/Strava/Traccar)
   - Kliknij **"Zapisz ustawienia"**

7. **Pierwsza synchronizacja**

   Kliknij **"Synchronizuj dane"** na stronie głównej lub użyj API:
   ```bash
   curl -X POST http://localhost:3000/api/sync \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "startDate": "2025-01-01",
       "endDate": "2025-11-20"
     }'
   ```

## 🏗️ Architektura

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

### Stack technologiczny

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

## 📊 Struktura bazy danych

```sql
-- Użytkownicy (authentication)
User (id, username, password_hash, email, role)

-- Zaszyfrowane ustawienia API
Settings (id, key, encrypted_value, type)

-- Wpisy dziennika
DiaryEntry (id, date, description, gpxPath)
  ├── Photo (immichId, url, thumbnailUrl, selected)
  ├── Activity (stravaId, name, distance, gpxPath)
  └── Location (latitude, longitude, address, speed)

-- Historia synchronizacji
SyncLog (source, status, itemCount, timestamp)
```

## 🔐 Bezpieczeństwo

### Domyślne ustawienia
- Username: `admin`
- Password: `admin123`

**⚠️ ZMIEŃ TE DANE PO PIERWSZYM LOGOWANIU!**

### Produkcja

1. **Wygeneruj bezpieczne klucze:**
   ```bash
   openssl rand -base64 32  # dla JWT_SECRET
   openssl rand -base64 32  # dla ENCRYPTION_KEY
   ```

2. **Ustaw w `.env`:**
   ```env
   JWT_SECRET=wygenerowany-klucz-1
   ENCRYPTION_KEY=wygenerowany-klucz-2
   ADMIN_PASSWORD=bardzo-silne-haslo
   ```

3. **Użyj HTTPS:**
   - Postaw aplikację za reverse proxy (nginx, Traefik, Caddy)
   - Włącz SSL/TLS
   - Ustaw proper CORS headers

### Co jest szyfrowane?
- ✅ Hasła użytkowników (bcrypt, 10 rounds)
- ✅ API keys (AES-256)
- ✅ Hasła do zewnętrznych serwisów (AES-256)
- ✅ JWT tokeny (podpisane, 7 dni ważności)

## 🔧 Konfiguracja

### Zmienne środowiskowe

| Zmienna | Wymagana | Opis |
|---------|----------|------|
| `JWT_SECRET` | Tak | Klucz do podpisywania JWT (min 32 znaki) |
| `ENCRYPTION_KEY` | Tak | Klucz AES do szyfrowania (32 znaki) |
| `ADMIN_PASSWORD` | Tak | Hasło domyślnego admina |
| `IMMICH_URL` | Tak | URL instancji Immich |
| `IMMICH_API_KEY` | Tak | Klucz API Immich |
| `STRAVA_CLIENT_ID` | Nie | Strava Client ID |
| `STRAVA_CLIENT_SECRET` | Nie | Strava Client Secret |
| `STRAVA_REFRESH_TOKEN` | Nie | Strava Refresh Token |
| `TRACCAR_URL` | Nie | URL instancji Traccar |
| `TRACCAR_EMAIL` | Nie | Email do Traccar |
| `TRACCAR_PASSWORD` | Nie | Hasło do Traccar |
| `SYNC_SCHEDULE` | Nie | Cron schedule (default: `0 */6 * * *`) |

### Harmonogram synchronizacji

Format: cron expression

```bash
# Co 6 godzin (zalecane)
SYNC_SCHEDULE="0 */6 * * *"

# Co 12 godzin (bezpieczne dla Strava limits)
SYNC_SCHEDULE="0 */12 * * *"

# Dwa razy dziennie
SYNC_SCHEDULE="0 6,18 * * *"

# Raz dziennie o 6:00
SYNC_SCHEDULE="0 6 * * *"
```

**⚠️ Strava API Limits:**
- 100 requests / 15 minutes
- 1000 requests / day

Unikaj zbyt częstej synchronizacji!

## 📂 Struktura projektu

```
pathlife/
├── docker-compose.yml       # Orchestration
├── .env                     # Konfiguracja (nie commituj!)
├── .env.example             # Szablon konfiguracji
│
├── apps/
│   ├── backend/
│   │   ├── Dockerfile
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # Model bazy danych
│   │   │   └── migrations/       # Migracje SQL
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

### Public (bez autentykacji)
- `GET /health` - Health check
- `POST /api/auth/login` - Logowanie

### Protected (wymaga JWT token)
- `GET /api/auth/me` - Informacje o użytkowniku
- `POST /api/auth/change-password` - Zmiana hasła
- `GET /api/diary/entries/:date` - Wpis dla daty
- `GET /api/diary/entries` - Lista wpisów
- `PATCH /api/diary/entries/:date` - Aktualizacja opisu
- `POST /api/sync` - Synchronizacja danych
- `GET /api/settings/:type` - Pobierz ustawienia
- `PUT /api/settings/:key` - Zaktualizuj ustawienie
- `POST /api/settings/bulk` - Masowa aktualizacja

## 🛠️ Przydatne komendy

```bash
# Uruchom aplikację
docker-compose up -d

# Zatrzymaj aplikację
docker-compose down

# Restart aplikacji
docker-compose restart

# Logi wszystkich serwisów
docker-compose logs -f

# Logi konkretnego serwisu
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Rebuild po zmianach w kodzie
docker-compose up -d --build

# Dostęp do bazy danych
docker-compose exec postgres psql -U pathlife -d pathlife

# Backup bazy danych
docker-compose exec postgres pg_dump -U pathlife pathlife > backup.sql

# Restore bazy danych
docker-compose exec -T postgres psql -U pathlife pathlife < backup.sql

# Wyczyść WSZYSTKO (UWAGA: kasuje dane!)
docker-compose down -v
```

## 📥 Pliki GPX

Aplikacja automatycznie zapisuje pliki GPX:

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
├── traccar-2025-11-18.gpx  # Wszystkie punkty z dnia
├── traccar-2025-11-19.gpx
└── ...
```

**Format:** GPX 1.1 z:
- GPS coordinates (lat/lon)
- Timestamps
- Elevation data
- Speed data
- Proper metadata

## 🐛 Troubleshooting

### Problem: Backend nie startuje

**Sprawdź logi:**
```bash
docker-compose logs -f backend
```

**Typowe problemy:**
- Brakujące zmienne środowiskowe w `.env`
- PostgreSQL nie zdążył wystartować
- Port 3000 zajęty

**Rozwiązanie:**
```bash
docker-compose down
docker-compose up -d --build
```

### Problem: Nie mogę się zalogować

**Sprawdź czy backend działa:**
```bash
curl http://localhost:3000/health
```

**Reset hasła admina:**
```bash
docker-compose exec postgres psql -U pathlife -d pathlife -c \
  "UPDATE \"User\" SET password = '\$2a\$10\$...' WHERE username = 'admin';"
```

### Problem: Brak zdjęć z Immich

**Sprawdź:**
1. Czy Immich API key jest poprawny?
2. Czy URL Immich jest dostępny z Dockera?
3. Logi: `docker-compose logs -f backend | grep -i immich`

### Problem: Strava rate limit exceeded

**Sprawdź harmonogram:**
```bash
echo $SYNC_SCHEDULE
```

**Zmień na rzadszą synchronizację:**
```env
SYNC_SCHEDULE="0 */12 * * *"  # Co 12 godzin
```

### Problem: Baza danych pusta

**Reset i resync:**
```bash
# UWAGA: To skasuje wszystkie dane!
docker-compose down -v
docker-compose up -d
# Poczekaj 30s na inicjalizację
# Zaloguj się i kliknij "Synchronizuj dane"
```

## 🤝 Contributing

Pull requesty są mile widziane! Dla większych zmian, najpierw otwórz issue.

### Development setup

```bash
# Sklonuj repo
git clone https://github.com/poncheck/pathlife.git
cd pathlife

# Backend
cd apps/backend
npm install
npm run dev

# Frontend (w nowym terminalu)
cd apps/frontend
npm install
npm run dev
```

## 📝 Licencja

MIT © poncheck

---

**Uwaga:** Ten projekt wymaga działających instancji Immich, Strava i/lub Traccar. Nie zawiera tych serwisów - musisz je skonfigurować osobno.

## 🙏 Podziękowania

- [Immich](https://immich.app/) - zarządzanie zdjęciami
- [Strava](https://www.strava.com/) - aktywności sportowe
- [Traccar](https://www.traccar.org/) - śledzenie GPS
- [Leaflet](https://leafletjs.com/) - mapy interaktywne
