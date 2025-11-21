//
//  PathLifeApp.swift
//  PathLife
//
//  Main app entry point
//

import SwiftUI

@main
struct PathLifeApp: App {
    @StateObject private var apiClient = APIClient.shared
    @StateObject private var locationManager = LocationManager()
    @StateObject private var photoManager = PhotoManager()

    init() {
        // Configure app on launch
        configureApp()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(apiClient)
                .environmentObject(locationManager)
                .environmentObject(photoManager)
        }
    }

    private func configureApp() {
        // Start location tracking if permission granted
        if locationManager.authorizationStatus == .authorizedAlways {
            locationManager.startTracking()
        }

        // Setup location upload callback
        locationManager.onLocationsReady = { locations in
            Task {
                do {
                    try await APIClient.shared.uploadLocations(locations)
                } catch {
                    print("❌ Failed to upload locations: \(error)")
                }
            }
        }
    }
}
