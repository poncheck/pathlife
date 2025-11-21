//
//  PhotoManager.swift
//  PathLife
//
//  PhotoKit integration for accessing iPhone photos
//

import Foundation
import Photos
import UIKit
import Combine

class PhotoManager: ObservableObject {
    @Published var authorizationStatus: PHAuthorizationStatus = .notDetermined
    @Published var recentPhotos: [PHAsset] = []

    init() {
        authorizationStatus = PHPhotoLibrary.authorizationStatus(for: .readWrite)
    }

    // MARK: - Permission Management

    func requestPermission() async -> Bool {
        let status = await PHPhotoLibrary.requestAuthorization(for: .readWrite)
        await MainActor.run {
            self.authorizationStatus = status
        }
        return status == .authorized || status == .limited
    }

    // MARK: - Fetch Photos

    func fetchPhotos(for date: Date) -> [PHAsset] {
        guard authorizationStatus == .authorized || authorizationStatus == .limited else {
            print("❌ Photo library access not granted")
            return []
        }

        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!

        let options = PHFetchOptions()
        options.predicate = NSPredicate(
            format: "creationDate >= %@ AND creationDate < %@",
            startOfDay as NSDate,
            endOfDay as NSDate
        )
        options.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: true)]

        let results = PHAsset.fetchAssets(with: .image, options: options)
        var assets: [PHAsset] = []

        results.enumerateObjects { asset, _, _ in
            assets.append(asset)
        }

        print("📷 Found \(assets.count) photos for \(date)")
        return assets
    }

    func fetchRecentPhotos(limit: Int = 20) {
        guard authorizationStatus == .authorized || authorizationStatus == .limited else {
            return
        }

        let options = PHFetchOptions()
        options.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
        options.fetchLimit = limit

        let results = PHAsset.fetchAssets(with: .image, options: options)
        var assets: [PHAsset] = []

        results.enumerateObjects { asset, _, _ in
            assets.append(asset)
        }

        recentPhotos = assets
    }

    // MARK: - Load Images

    func loadImage(from asset: PHAsset, targetSize: CGSize = CGSize(width: 300, height: 300)) async -> UIImage? {
        return await withCheckedContinuation { continuation in
            let options = PHImageRequestOptions()
            options.deliveryMode = .highQualityFormat
            options.isNetworkAccessAllowed = true
            options.isSynchronous = false

            PHImageManager.default().requestImage(
                for: asset,
                targetSize: targetSize,
                contentMode: .aspectFill,
                options: options
            ) { image, _ in
                continuation.resume(returning: image)
            }
        }
    }

    func loadFullResolutionImage(from asset: PHAsset) async -> UIImage? {
        return await withCheckedContinuation { continuation in
            let options = PHImageRequestOptions()
            options.deliveryMode = .highQualityFormat
            options.isNetworkAccessAllowed = true
            options.isSynchronous = false

            PHImageManager.default().requestImage(
                for: asset,
                targetSize: PHImageManagerMaximumSize,
                contentMode: .default,
                options: options
            ) { image, _ in
                continuation.resume(returning: image)
            }
        }
    }

    // MARK: - Export Photo Data

    func exportPhotoData(from asset: PHAsset) async -> PhotoUpload? {
        guard let image = await loadFullResolutionImage(from: asset) else {
            return nil
        }

        // Compress to JPEG
        guard let imageData = image.jpegData(compressionQuality: 0.8) else {
            return nil
        }

        let base64String = imageData.base64EncodedString()

        // Get location from EXIF
        var latitude: Double?
        var longitude: Double?

        if let location = asset.location {
            latitude = location.coordinate.latitude
            longitude = location.coordinate.longitude
        }

        return PhotoUpload(
            takenAt: asset.creationDate ?? Date(),
            imageData: base64String,
            latitude: latitude,
            longitude: longitude
        )
    }

    // MARK: - Thumbnail Cache

    func loadThumbnail(from asset: PHAsset) async -> UIImage? {
        let targetSize = CGSize(width: 200, height: 200)
        return await loadImage(from: asset, targetSize: targetSize)
    }
}
