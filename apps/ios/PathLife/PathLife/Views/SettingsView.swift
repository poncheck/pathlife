//
//  SettingsView.swift
//  PathLife
//
//  Settings and configuration
//

import SwiftUI
import CoreLocation
import Photos

struct SettingsView: View {
    @EnvironmentObject var apiClient: APIClient
    @EnvironmentObject var locationManager: LocationManager
    @EnvironmentObject var photoManager: PhotoManager

    @State private var showingLogoutAlert = false

    var body: some View {
        NavigationView {
            List {
                // User info
                Section("Account") {
                    if let user = apiClient.currentUser {
                        HStack {
                            Text("Username")
                            Spacer()
                            Text(user.username)
                                .foregroundColor(.secondary)
                        }

                        HStack {
                            Text("Role")
                            Spacer()
                            Text(user.role.capitalized)
                                .foregroundColor(.secondary)
                        }
                    }

                    Button("Logout", role: .destructive) {
                        showingLogoutAlert = true
                    }
                }

                // Location tracking
                Section {
                    HStack {
                        Text("Location Tracking")
                        Spacer()
                        Toggle("", isOn: $locationManager.isTracking)
                            .onChange(of: locationManager.isTracking) { newValue in
                                if newValue {
                                    locationManager.startTracking()
                                } else {
                                    locationManager.stopTracking()
                                }
                            }
                    }

                    HStack {
                        Text("Permission")
                        Spacer()
                        Text(permissionText(locationManager.authorizationStatus))
                            .foregroundColor(.secondary)
                            .font(.caption)
                    }

                    if locationManager.authorizationStatus == .notDetermined {
                        Button("Request Location Permission") {
                            locationManager.requestPermission()
                        }
                    }

                    Button("Upload Pending Locations") {
                        Task {
                            await locationManager.uploadPendingLocations()
                        }
                    }
                } header: {
                    Text("Location Services")
                } footer: {
                    Text("Background location tracking requires 'Always' permission. This replaces Traccar.")
                }

                // Photo library
                Section {
                    HStack {
                        Text("Permission")
                        Spacer()
                        Text(photoPermissionText(photoManager.authorizationStatus))
                            .foregroundColor(.secondary)
                            .font(.caption)
                    }

                    if photoManager.authorizationStatus == .notDetermined {
                        Button("Request Photo Library Permission") {
                            Task {
                                _ = await photoManager.requestPermission()
                            }
                        }
                    }
                } header: {
                    Text("Photo Library")
                } footer: {
                    Text("Access to your photos allows you to add them to your diary entries.")
                }

                // Sync
                Section("Synchronization") {
                    Button("Sync Today") {
                        Task {
                            try? await apiClient.syncToday()
                        }
                    }

                    Button("Sync Last 7 Days") {
                        Task {
                            try? await apiClient.syncLastDays(7)
                        }
                    }

                    Button("Sync Last 30 Days") {
                        Task {
                            try? await apiClient.syncLastDays(30)
                        }
                    }
                }

                // App info
                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }

                    HStack {
                        Text("Build")
                        Spacer()
                        Text("1")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .alert("Logout", isPresented: $showingLogoutAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Logout", role: .destructive) {
                    apiClient.logout()
                }
            } message: {
                Text("Are you sure you want to logout?")
            }
        }
    }

    private func permissionText(_ status: CLAuthorizationStatus) -> String {
        switch status {
        case .notDetermined: return "Not Determined"
        case .restricted: return "Restricted"
        case .denied: return "Denied"
        case .authorizedAlways: return "Always"
        case .authorizedWhenInUse: return "When In Use"
        @unknown default: return "Unknown"
        }
    }

    private func photoPermissionText(_ status: PHAuthorizationStatus) -> String {
        switch status {
        case .notDetermined: return "Not Determined"
        case .restricted: return "Restricted"
        case .denied: return "Denied"
        case .authorized: return "Authorized"
        case .limited: return "Limited"
        @unknown default: return "Unknown"
        }
    }
}
