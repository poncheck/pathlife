# PathLife iOS - Quick Start Guide

## 🚀 5-Minute Setup (For Testing)

### Prerequisites
- Mac with Xcode 15+ installed
- iPhone with iOS 16+
- USB cable
- Your backend running (`docker-compose up` in main directory)

### Step 1: Find Your Mac's IP Address

```bash
# Run this on your Mac:
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Look for something like: `inet 192.168.1.123`

### Step 2: Update Backend URL

Edit `apps/ios/PathLife/PathLife/Services/APIClient.swift`:

```swift
// Line 35 - Change this:
private let baseURL = "http://localhost:3030/api"

// To your Mac's IP:
private let baseURL = "http://192.168.1.123:3030/api"
```

### Step 3: Create Xcode Project

1. Open **Xcode**
2. **File** → **New** → **Project**
3. Choose **iOS** → **App**
4. Settings:
   - Product Name: `PathLife`
   - Team: Your Apple ID
   - Organization: `com.pathlife`
   - Interface: **SwiftUI**
   - Language: **Swift**
5. Save to: `pathlife/apps/ios/PathLife/`

### Step 4: Add All Source Files

In Xcode:
1. Right-click `PathLife` folder (blue icon)
2. **Add Files to "PathLife"...**
3. Select these folders:
   - `Models`
   - `Services`
   - `Views`
   - `Utilities`
4. Also add:
   - `PathLifeApp.swift`
   - `ContentView.swift`
5. Check ☑️ **"Copy items if needed"**

### Step 5: Configure Permissions

1. Select **PathLife** project (blue icon at top)
2. Select **PathLife** target
3. **Signing & Capabilities** tab
4. Click **+ Capability** → **Background Modes**
5. Check:
   - ☑️ Location updates
   - ☑️ Background fetch

### Step 6: Update Info.plist

1. Still in **PathLife** target
2. **Info** tab
3. Add these keys (click **+** button):

| Key | Type | Value |
|-----|------|-------|
| Privacy - Location Always and When In Use Usage Description | String | PathLife tracks your location to create your life timeline |
| Privacy - Location When In Use Usage Description | String | PathLife needs your location |
| Privacy - Photo Library Usage Description | String | PathLife needs access to add photos to your diary |

### Step 7: Build and Run

1. Connect iPhone via USB
2. **Trust computer** on iPhone if prompted
3. Select your iPhone from device dropdown (top bar)
4. Click ▶️ **Run** button
5. If signing error:
   - **Signing & Capabilities** → select your Team
   - May need to change Bundle Identifier to something unique

### Step 8: Trust Developer on iPhone

First time only:
1. On iPhone: **Settings** → **General** → **VPN & Device Management**
2. Tap your developer profile
3. **Trust**

### Step 9: Grant Permissions

When app launches:
1. Login with your backend credentials (default: `admin` / your admin password)
2. **Allow Location** → Select **"Always Allow"** (important!)
3. **Allow Photos** → Select **"All Photos"**
4. Go to **Settings** tab → toggle **Location Tracking** ON

### Step 10: Test!

1. Walk around with your iPhone
2. Check **Timeline** tab - locations should appear
3. Tap a day with photos to see them
4. Photos are synced from Immich (if configured)

## ✅ Verify It's Working

### Check Location Tracking

```swift
// In Settings tab, should see:
Location Tracking: ON
Permission: Always
```

### Check Backend Connection

On your Mac, check backend logs:
```bash
docker-compose logs -f backend
```

Should see:
```
Created X location points from iOS
```

### Check Photos

1. **Timeline** tab
2. Tap any day
3. Should see photos from:
   - Immich (if configured)
   - iPhone Camera Roll (for that date)

## 🐛 Troubleshooting

### "Could not connect to server"

1. Check backend is running:
   ```bash
   curl http://192.168.1.123:3030/health
   ```

2. Check iPhone is on **same WiFi** as Mac

3. On iPhone, open Safari and visit:
   ```
   http://192.168.1.123:3030/health
   ```
   Should show: `{"status":"ok"}`

### Location Not Updating

1. **Settings** → **PathLife** → **Location** = **Always**
2. **Settings** → **Privacy & Security** → **Location Services** = **ON**
3. Walk at least 50 meters (app updates every 50m)
4. Check **Settings** tab → **Upload Pending Locations**

### App Crashes

Check Xcode console (bottom panel). Common fixes:
- Clean build: **Product** → **Clean Build Folder**
- Restart Xcode
- Delete app from iPhone and reinstall

### Photos Not Showing

1. **Settings** → **PathLife** → **Photos** = **All Photos**
2. Check date - photos are filtered by creation date
3. Try adding photo manually: tap day → **"Add from Camera Roll"**

## 📱 Free vs Paid Apple Developer

### With Free Apple ID (Testing)

✅ Can do:
- Install on your own iPhone
- Test all features
- Use for personal use

❌ Limitations:
- **App expires after 7 days** (just reinstall from Xcode)
- Max 3 devices
- Can't share with others
- No TestFlight

### With Paid Account ($99/year)

✅ Additional features:
- **No expiration** - app works forever
- **TestFlight** - share with 10,000 testers
- **App Store** - public distribution
- Up to 100 test devices
- Push notifications
- Advanced capabilities

## 🎯 What's Next?

1. **Use it daily** - let it track your movements
2. **Add photos** - enrich your timeline
3. **Review timeline** - see your life mapped out
4. **Decide on TestFlight** - if you want to share with others, consider Developer Account

## 💡 Tips

### Battery Life

Location tracking uses battery. Optimize:
- App uses "significant location changes" mode
- Updates every 50 meters (not every step)
- Similar to Apple Maps navigation

### Data Usage

- Location upload: ~100 bytes per point
- Photos: uploaded to your server (not cellular data if on WiFi)
- Minimal bandwidth usage

### Privacy

- All data goes to **YOUR** backend server
- No third-party tracking
- JWT token stored in secure iOS Keychain
- Location data never leaves your infrastructure

---

**Need help?** Check full `README.md` or open an issue on GitHub!
