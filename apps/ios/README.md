# PathLife iOS App

Native iOS application for PathLife - your life tracking diary with photos, locations, and activities.

## 🎯 Features

- **Background Location Tracking** - Replaces Traccar with native iOS Core Location
- **Photo Integration** - Direct access to iPhone Camera Roll
- **Timeline View** - Calendar-based diary entries
- **Activity Tracking** - View Strava activities
- **Offline Support** - Local caching with Core Data
- **Secure** - JWT stored in iOS Keychain

## 📋 Requirements

- macOS with Xcode 15+
- iOS 16.0+ (target device)
- Apple ID (free for local testing)
- Apple Developer Account ($99/year for TestFlight/App Store)

## 🚀 Setup Instructions

### 1. Create Xcode Project

Since Xcode project files are complex binary formats, you need to create the project in Xcode:

1. Open Xcode
2. Click "Create a new Xcode project"
3. Select **iOS** → **App**
4. Configure:
   - Product Name: `PathLife`
   - Team: Select your Apple ID
   - Organization Identifier: `com.pathlife` (or your own)
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Storage: **None** (we're using our own)
   - Include Tests: ☑️ (optional)

5. Save to: `pathlife/apps/ios/PathLife/`

### 2. Add Source Files to Xcode

1. In Xcode, right-click on the `PathLife` group (blue folder)
2. Select **Add Files to "PathLife"...**
3. Navigate to the source directories and add:
   - `Models/` folder
   - `Services/` folder
   - `Views/` folder
   - `Utilities/` folder

4. Make sure to:
   - ☑️ Copy items if needed
   - ☑️ Create groups
   - ☑️ Add to targets: PathLife

### 3. Replace Generated Files

Xcode created some files - replace them with ours:

1. Delete these files from Xcode:
   - `ContentView.swift` (if exists)
   - `PathLifeApp.swift` (if exists)

2. Add our versions:
   - `PathLifeApp.swift`
   - `ContentView.swift`

### 4. Configure Info.plist

1. In Xcode, select the **PathLife** project in Navigator
2. Select **PathLife** target
3. Go to **Info** tab
4. Right-click and select **Open As** → **Source Code**
5. Replace contents with our `Info.plist` file

OR manually add these keys:

- **Privacy - Location Always and When In Use Usage Description**
  ```
  PathLife needs access to your location to track your daily journey and create your life timeline.
  ```

- **Privacy - Location When In Use Usage Description**
  ```
  PathLife needs access to your location to track your daily journey.
  ```

- **Privacy - Photo Library Usage Description**
  ```
  PathLife needs access to your photo library to add photos to your diary entries.
  ```

### 5. Configure Capabilities

1. Select **PathLife** target
2. Go to **Signing & Capabilities** tab
3. Add capability: **Background Modes**
   - ☑️ Location updates
   - ☑️ Background fetch

### 6. Configure Backend URL

Edit `Services/APIClient.swift` line 35:

```swift
private let baseURL = "http://YOUR_BACKEND_URL:3030/api"
```

Replace with your actual backend URL:
- Local testing: `http://192.168.1.XXX:3030/api` (your Mac's IP)
- Production: `https://your-domain.com/api`

⚠️ **Important:** Use your Mac's local network IP, not `localhost` (iPhone can't access localhost)

### 7. Build and Run

#### Option A: iOS Simulator (Quick Test)

1. Select any iPhone simulator from the device menu
2. Click ▶️ Run (Cmd+R)
3. ⚠️ **Note:** Simulators can't test:
   - Real GPS tracking
   - Background location updates
   - Camera/Photo library (limited)

#### Option B: Physical iPhone (Recommended)

1. Connect iPhone via USB
2. On iPhone: **Settings** → **General** → **VPN & Device Management**
3. Trust your computer
4. In Xcode, select your iPhone from device menu
5. Click ▶️ Run

**First time:**
- Xcode will ask to register device
- May need to fix signing issues (select your Apple ID team)
- On iPhone, go to **Settings** → **General** → **VPN & Device Management** → Trust developer

### 8. Grant Permissions

When app launches on iPhone:

1. **Location Permission:**
   - App will request "While Using" first
   - Later request "Always" for background tracking
   - **IMPORTANT:** Select **"Always Allow"** for automatic tracking

2. **Photo Library Permission:**
   - Select **"Allow Access to All Photos"** or **"Selected Photos"**

## 🔧 Troubleshooting

### App Crashes on Launch

Check Xcode console for errors. Common issues:
- Missing imports in files
- Wrong Bundle Identifier
- Signing issues

### "Could not connect to backend"

1. Check backend is running: `docker-compose up`
2. Check iPhone is on same WiFi as Mac
3. Verify backend URL in `APIClient.swift`
4. Test URL in Safari on iPhone: `http://YOUR_IP:3030/health`

### Location Not Working

1. Check permissions: **Settings** → **PathLife** → **Location**
2. Ensure "Always" is selected
3. Check **Settings** → **Privacy** → **Location Services** is ON
4. Background Modes capability is enabled in Xcode

### Photos Not Showing

1. Check permission: **Settings** → **PathLife** → **Photos**
2. Try "Allow Access to All Photos"
3. Check date picker - photos are filtered by date

### App Expires After 7 Days

This is normal with free Apple ID. Options:
1. Reinstall from Xcode every week (free)
2. Purchase Apple Developer Account ($99/year) for unlimited

## 📱 TestFlight Distribution (Requires $99/year Account)

### 1. Archive Build

1. Select **Any iOS Device (arm64)** from device menu
2. **Product** → **Archive**
3. Wait for build to complete
4. Organizer window opens automatically

### 2. Distribute to TestFlight

1. In Organizer, select your archive
2. Click **Distribute App**
3. Choose **TestFlight & App Store**
4. Follow prompts (sign with Apple Developer credentials)
5. Upload completes in 5-10 minutes

### 3. Add Testers

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select **PathLife** app
3. Go to **TestFlight** tab
4. Add **Internal Testers** (up to 100 - must be in your organization)
5. Add **External Testers** (up to 10,000 - anyone with email/link)

### 4. Share TestFlight Link

External testers receive:
- Email invite with TestFlight link
- OR share public link: `https://testflight.apple.com/join/YOUR_CODE`

Testers install **TestFlight** app from App Store, then install PathLife.

## 🔐 Security Notes

### Production Deployment

Before releasing to public, update:

1. **Info.plist** - Remove `NSAllowsArbitraryLoads`, add specific domain
2. **APIClient.swift** - Use HTTPS backend URL
3. **Environment** - Store sensitive config in Xcode build settings

### JWT Token

- Stored securely in iOS Keychain
- Never logged or exposed
- Automatically included in API requests

## 📖 Architecture

```
PathLife iOS
├── Models/              # Data structures matching backend
│   ├── DiaryEntry.swift
│   ├── Location.swift
│   ├── Photo.swift
│   ├── Activity.swift
│   └── User.swift
├── Services/            # Business logic
│   ├── APIClient.swift      # Backend communication
│   ├── LocationManager.swift # Core Location tracking
│   └── PhotoManager.swift   # PhotoKit integration
├── Views/               # SwiftUI screens
│   ├── LoginView.swift
│   ├── TimelineView.swift
│   ├── DayDetailView.swift
│   ├── PhotoPickerView.swift
│   └── SettingsView.swift
├── Utilities/           # Helpers
│   ├── KeychainHelper.swift
│   └── DateFormatter+Extensions.swift
└── PathLifeApp.swift    # App entry point
```

## 🚀 Key Features Implementation

### Background Location Tracking

Replaces Traccar server with native iOS:

```swift
// Automatic tracking in background
locationManager.allowsBackgroundLocationUpdates = true
locationManager.startUpdatingLocation()

// Batch upload every 100 points or hourly
onLocationsReady: { locations in
    await apiClient.uploadLocations(locations)
}
```

### Photo Integration

Direct access to iPhone photos:

```swift
// Fetch photos for specific date
let photos = photoManager.fetchPhotos(for: date)

// Upload to backend
let photoData = await photoManager.exportPhotoData(from: asset)
try await apiClient.uploadPhoto(photoData)
```

### Offline Support

API client handles:
- JWT authentication with auto-logout on 401
- Retry logic for network failures
- Local caching (future: Core Data)

## 🐛 Known Issues

- [ ] Large photo uploads may timeout - implement chunking
- [ ] No offline mode yet - requires Core Data implementation
- [ ] Map view needs polyline support for routes
- [ ] Missing photo upload progress indicator

## 🎉 Next Steps

1. **Test on real iPhone** with GPS tracking
2. **Add photos** from Camera Roll to diary entries
3. **Walk around** and watch locations accumulate
4. **Review timeline** with photos and location tracks
5. **Share with friends** via TestFlight (if Developer Account)

## 📞 Support

Backend API: Check `apps/backend/README.md`
Issues: https://github.com/poncheck/pathlife/issues

---

Built with ❤️ using SwiftUI and Core Location
