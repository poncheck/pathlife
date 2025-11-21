//
//  DiaryEntry.swift
//  PathLife
//
//  Models for diary entries, matching backend schema
//

import Foundation

struct DiaryEntry: Codable, Identifiable {
    let id: String
    let date: Date
    var description: String?
    let gpxPath: String?
    let photos: [Photo]
    let activities: [Activity]
    let locations: [Location]
    let createdAt: Date
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id, date, description, gpxPath, photos, activities, locations, createdAt, updatedAt
    }
}

struct DiaryEntrySummary: Codable, Identifiable {
    let id: String
    let date: Date
    let description: String?
    let photos: [Photo]
    let activities: [Activity]
    let photoCount: Int
    let activityCount: Int
    let locationCount: Int

    enum CodingKeys: String, CodingKey {
        case id, date, description, photos, activities
        case photoCount = "_count"
        case activityCount = "_count"
        case locationCount = "_count"
    }
}
