//
//  LocationManager.swift
//  PathLife
//
//  Core Location service for background GPS tracking
//

import Foundation
import CoreLocation
import Combine

class LocationManager: NSObject, ObservableObject {
    private let locationManager = CLLocationManager()
    private let geocoder = CLGeocoder()

    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var currentLocation: CLLocation?
    @Published var isTracking = false

    // Store locations in memory before batch upload
    private var pendingLocations: [LocationUpload] = []
    private let maxPendingLocations = 100

    // For uploading to backend
    var onLocationsReady: (([LocationUpload]) -> Void)?

    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 50 // Update every 50 meters
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
        locationManager.showsBackgroundLocationIndicator = true

        authorizationStatus = locationManager.authorizationStatus
    }

    // MARK: - Permission Management

    func requestPermission() {
        locationManager.requestAlwaysAuthorization()
    }

    func requestWhenInUsePermission() {
        locationManager.requestWhenInUseAuthorization()
    }

    // MARK: - Tracking Control

    func startTracking() {
        guard authorizationStatus == .authorizedAlways || authorizationStatus == .authorizedWhenInUse else {
            print("❌ Location permission not granted")
            return
        }

        locationManager.startUpdatingLocation()
        isTracking = true
        print("✅ Location tracking started")
    }

    func stopTracking() {
        locationManager.stopUpdatingLocation()
        isTracking = false
        print("⏸️ Location tracking stopped")
    }

    // MARK: - Batch Upload

    func uploadPendingLocations() async {
        guard !pendingLocations.isEmpty else { return }

        let locationsToUpload = pendingLocations
        pendingLocations.removeAll()

        print("📤 Uploading \(locationsToUpload.count) locations to backend")
        onLocationsReady?(locationsToUpload)
    }

    // MARK: - Geocoding

    private func reverseGeocode(location: CLLocation) async -> String? {
        do {
            let placemarks = try await geocoder.reverseGeocodeLocation(location)
            guard let placemark = placemarks.first else { return nil }

            var addressComponents: [String] = []
            if let locality = placemark.locality {
                addressComponents.append(locality)
            }
            if let country = placemark.country {
                addressComponents.append(country)
            }

            return addressComponents.joined(separator: ", ")
        } catch {
            print("⚠️ Geocoding error: \(error)")
            return nil
        }
    }
}

// MARK: - CLLocationManagerDelegate

extension LocationManager: CLLocationManagerDelegate {
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus

        switch authorizationStatus {
        case .authorizedAlways, .authorizedWhenInUse:
            print("✅ Location permission granted: \(authorizationStatus.rawValue)")
        case .denied, .restricted:
            print("❌ Location permission denied")
        case .notDetermined:
            print("⏳ Location permission not determined")
        @unknown default:
            break
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }

        currentLocation = location

        // Add to pending batch
        let locationUpload = LocationUpload(from: location)
        pendingLocations.append(locationUpload)

        print("📍 Location: \(location.coordinate.latitude), \(location.coordinate.longitude)")

        // Upload batch if we have enough locations
        if pendingLocations.count >= maxPendingLocations {
            Task {
                await uploadPendingLocations()
            }
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("❌ Location error: \(error.localizedDescription)")
    }
}
