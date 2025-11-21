//
//  Activity.swift
//  PathLife
//
//  Activity model (Strava integration)
//

import Foundation

struct Activity: Codable, Identifiable {
    let id: String
    let stravaId: String
    let name: String
    let type: String
    let distance: Double // meters
    let movingTime: Int // seconds
    let elapsedTime: Int // seconds
    let totalElevation: Double // meters
    let startDate: Date
    let endDate: Date?
    let polyline: String?
    let gpxPath: String?
    let metadata: ActivityMetadata?
    let diaryEntryId: String

    var distanceKm: Double {
        distance / 1000.0
    }

    var durationFormatted: String {
        let hours = movingTime / 3600
        let minutes = (movingTime % 3600) / 60
        let seconds = movingTime % 60

        if hours > 0 {
            return String(format: "%dh %dm", hours, minutes)
        } else {
            return String(format: "%dm %ds", minutes, seconds)
        }
    }
}

struct ActivityMetadata: Codable {
    let averageSpeed: Double?
    let maxSpeed: Double?
    let timezone: String?
}
