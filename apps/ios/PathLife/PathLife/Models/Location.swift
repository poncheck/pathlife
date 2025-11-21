//
//  Location.swift
//  PathLife
//
//  Location model for GPS tracking
//

import Foundation
import CoreLocation

struct Location: Codable, Identifiable {
    let id: String
    let traccarId: String?
    let latitude: Double
    let longitude: Double
    let address: String?
    let timestamp: Date
    let speed: Double?
    let altitude: Double?
    let metadata: LocationMetadata?
    let diaryEntryId: String

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    var clLocation: CLLocation {
        CLLocation(
            coordinate: coordinate,
            altitude: altitude ?? 0,
            horizontalAccuracy: metadata?.accuracy ?? 0,
            verticalAccuracy: -1,
            timestamp: timestamp
        )
    }
}

struct LocationMetadata: Codable {
    let source: String?
    let deviceId: String?
    let accuracy: Double?
}

// For uploading to backend
struct LocationUpload: Codable {
    let latitude: Double
    let longitude: Double
    let timestamp: Date
    let speed: Double?
    let altitude: Double?
    let address: String?

    init(from location: CLLocation, address: String? = nil) {
        self.latitude = location.coordinate.latitude
        self.longitude = location.coordinate.longitude
        self.timestamp = location.timestamp
        self.speed = location.speed >= 0 ? location.speed : nil
        self.altitude = location.altitude
        self.address = address
    }
}
