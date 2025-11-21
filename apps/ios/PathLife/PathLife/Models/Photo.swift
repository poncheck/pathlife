//
//  Photo.swift
//  PathLife
//
//  Photo model matching backend schema
//

import Foundation
import UIKit

struct Photo: Codable, Identifiable {
    let id: String
    let immichId: String
    let immichUrl: String?
    let thumbnailUrl: String?
    let takenAt: Date
    let selected: Bool
    let metadata: PhotoMetadata?
    let diaryEntryId: String
}

struct PhotoMetadata: Codable {
    let source: String?
    let type: String?
    let isFavorite: Bool?
    let latitude: Double?
    let longitude: Double?
    let exifInfo: ExifInfo?
}

struct ExifInfo: Codable {
    let latitude: Double?
    let longitude: Double?
    let city: String?
    let country: String?
}

// For uploading to backend
struct PhotoUpload: Codable {
    let takenAt: Date
    let imageData: String? // Base64 encoded
    let latitude: Double?
    let longitude: Double?
}
