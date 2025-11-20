# PathLife - Twój Osobisty Pamiętnik

PathLife to aplikacja webowa, która automatycznie tworzy pamiętnik na podstawie Twoich zdjęć z Immich, aktywności ze Stravy i danych lokalizacji z Traccara.

## 🌟 Funkcje

- **Automatyczne pobieranie danych** z Immich, Strava i Traccar
- **Dzienne podsumowania** z wybranymi zdjęciami, aktywnościami i mapą lokalizacji
- **Edytor wpisów** - wybieraj zdjęcia i dodawaj opisy do każdego dnia
- **"W tym dniu"** - zobacz co robiłeś równo X lat temu
- **Kalendarz/Timeline** - przeglądaj swoje wpisy chronologicznie
- **Mapa** - wizualizacja tras i lokalizacji z każdego dnia

## 📋 Wymagania

- Node.js 18+
- Konto w Immich (self-hosted lub cloud)
- Konto Strava z API access
- Serwer Traccar (opcjonalnie)

## 🚀 Instalacja

### 1. Klonowanie repozytorium

```bash
git clone <repository-url>
cd pathlife
```

### 2. Instalacja zależności

```bash
npm install
```

### 3. Konfiguracja backendu

Skopiuj plik `.env.example` i dostosuj konfigurację:

```bash
cd apps/backend
cp .env.example .env
```

Edytuj plik `.env` i uzupełnij dane:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="file:./pathlife.db"

# Immich
IMMICH_URL=http://localhost:2283
IMMICH_API_KEY=twoj_immich_api_key

# Strava
STRAVA_CLIENT_ID=twoj_strava_client_id
STRAVA_CLIENT_SECRET=twoj_strava_client_secret
STRAVA_REFRESH_TOKEN=twoj_strava_refresh_token

# Traccar
TRACCAR_URL=http://localhost:8082
TRACCAR_EMAIL=twoj_traccar_email
TRACCAR_PASSWORD=twoje_traccar_haslo

# Harmonogram synchronizacji (format cron)
SYNC_SCHEDULE="0 */6 * * *"  # Co 6 godzin
```

### 4. Konfiguracja frontendu

```bash
cd apps/frontend
cp .env.example .env
```

### 5. Inicjalizacja bazy danych

```bash
cd apps/backend
npm run db:generate
npm run db:push
```

## 🔑 Konfiguracja integracji

### Immich

1. Zaloguj się do swojej instancji Immich
2. Przejdź do **Ustawienia użytkownika** → **API Keys**
3. Stwórz nowy klucz API
4. Skopiuj klucz do zmiennej `IMMICH_API_KEY` w pliku `.env`

### Strava

1. Przejdź do [Strava API Settings](https://www.strava.com/settings/api)
2. Stwórz nową aplikację
3. Zanotuj **Client ID** i **Client Secret**
4. Wygeneruj **Refresh Token**:
   ```bash
   # Authorization URL (otwórz w przeglądarce)
   https://www.strava.com/oauth/authorize?client_id=TWOJ_CLIENT_ID&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=activity:read_all

   # Po autoryzacji dostaniesz kod w URL, użyj go do wygenerowania tokena:
   curl -X POST https://www.strava.com/oauth/token \
     -d client_id=TWOJ_CLIENT_ID \
     -d client_secret=TWOJ_CLIENT_SECRET \
     -d code=KOD_Z_URL \
     -d grant_type=authorization_code
   ```
5. Skopiuj `refresh_token` do zmiennej `STRAVA_REFRESH_TOKEN`

### Traccar

1. Upewnij się, że Twój serwer Traccar jest dostępny
2. Użyj swoich danych logowania (email i hasło)

## 🏃 Uruchomienie

### Rozwojowy (Development)

Uruchom backend i frontend jednocześnie:

```bash
npm run dev
```

Lub osobno:

```bash
# Backend (http://localhost:3000)
cd apps/backend
npm run dev

# Frontend (http://localhost:5173)
cd apps/frontend
npm run dev
```

### Produkcyjny (Production)

```bash
# Build
npm run build

# Start
npm start
```

## 📱 Użytkowanie

### Pierwsze uruchomienie

1. Po uruchomieniu aplikacji, wykonaj początkową synchronizację:
   ```bash
   curl -X POST http://localhost:3000/api/sync/last-days/30
   ```
   To pobierze dane z ostatnich 30 dni.

2. Otwórz aplikację w przeglądarce: http://localhost:5173

3. Aplikacja będzie automatycznie synchronizować dane zgodnie z harmonogramem (domyślnie co 6 godzin)

### Nawigacja

- **Kalendarz** - widok wszystkich wpisów w formie listy
- **W tym dniu** - zobacz co działo się w tym dniu w poprzednich latach
- **Dzień** - szczegółowy widok z możliwością edycji

### Edycja wpisów

1. Przejdź do konkretnego dnia
2. Wybierz zdjęcia, które chcesz zachować (kliknij na checkbox)
3. Dodaj opis dnia
4. Kliknij "Zapisz"

## 🔧 API Endpoints

### Diary

- `GET /api/diary/entries/:date` - Pobierz wpis dla konkretnej daty
- `GET /api/diary/entries?startDate=...&endDate=...` - Pobierz wpisy z zakresu dat
- `GET /api/diary/on-this-day/:date` - Pobierz wpisy "w tym dniu" z poprzednich lat
- `PATCH /api/diary/entries/:date` - Zaktualizuj opis wpisu
- `PATCH /api/diary/photos/:photoId/toggle` - Przełącz wybór zdjęcia

### Sync

- `POST /api/sync` - Ręczna synchronizacja dla zakresu dat
- `POST /api/sync/today` - Synchronizuj tylko dzisiaj
- `POST /api/sync/last-days/:days` - Synchronizuj ostatnie N dni
- `GET /api/test-connections` - Testuj połączenia z zewnętrznymi API

## 🗄️ Struktura bazy danych

Aplikacja używa SQLite z następującymi tabelami:

- **DiaryEntry** - wpisy pamiętnika (jeden na dzień)
- **Photo** - zdjęcia z Immich
- **Activity** - aktywności ze Stravy
- **Location** - punkty lokalizacji z Traccara
- **SyncLog** - historia synchronizacji

## 🔄 Automatyczna synchronizacja

Aplikacja automatycznie pobiera dane zgodnie z harmonogramem określonym w `SYNC_SCHEDULE`. Format harmonogramu to cron:

```
# Przykłady:
"0 */6 * * *"    # Co 6 godzin
"0 0 * * *"      # Codziennie o północy
"0 0,12 * * *"   # Dwa razy dziennie (00:00 i 12:00)
"*/30 * * * *"   # Co 30 minut
```

## 🐛 Rozwiązywanie problemów

### Błędy połączenia z Immich

- Sprawdź czy URL jest poprawny
- Upewnij się, że API key jest aktualny
- Sprawdź czy Immich jest dostępny z serwera backendu

### Błędy połączenia ze Stravą

- Refresh token mógł wygasnąć - wygeneruj nowy
- Sprawdź uprawnienia aplikacji (scope: `activity:read_all`)

### Błędy połączenia z Traccar

- Sprawdź URL serwera
- Upewnij się, że dane logowania są poprawne

### Baza danych

```bash
# Sprawdź status bazy
cd apps/backend
npm run db:studio

# Zresetuj bazę (UWAGA: usunie wszystkie dane!)
rm prisma/pathlife.db
npm run db:push
```

## 📊 Monitoring

Logi synchronizacji można sprawdzić:

```bash
# Logi aplikacji
tail -f apps/backend/combined.log

# Logi błędów
tail -f apps/backend/error.log

# Lub przez API:
curl http://localhost:3000/api/diary/sync-logs
```

## 🚀 Deployment

### Docker (TODO)

```bash
docker-compose up -d
```

### VPS

1. Skopiuj pliki na serwer
2. Zainstaluj zależności: `npm install`
3. Skonfiguruj `.env`
4. Zbuduj aplikację: `npm run build`
5. Uruchom: `npm start`
6. Użyj PM2 lub systemd do zarządzania procesem

## 🤝 Contributing

Zgłaszaj problemy i propozycje ulepszeń przez Issues na GitHubie.

## 📝 Licencja

MIT

## 🙏 Podziękowania

Aplikacja korzysta z:
- [Immich](https://immich.app/) - zarządzanie zdjęciami
- [Strava](https://www.strava.com/) - śledzenie aktywności
- [Traccar](https://www.traccar.org/) - śledzenie lokalizacji
