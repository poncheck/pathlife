//
//  PhotoPickerView.swift
//  PathLife
//
//  Photo picker from Camera Roll
//

import SwiftUI
import Photos

struct PhotoPickerView: View {
    let date: Date
    let photoManager: PhotoManager
    let onPhotosSelected: ([PHAsset]) -> Void

    @Environment(\.dismiss) var dismiss
    @State private var photos: [PHAsset] = []
    @State private var selectedPhotos: Set<String> = []

    var body: some View {
        NavigationView {
            ScrollView {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))], spacing: 4) {
                    ForEach(photos, id: \.localIdentifier) { asset in
                        PhotoThumbnail(
                            asset: asset,
                            photoManager: photoManager,
                            isSelected: selectedPhotos.contains(asset.localIdentifier),
                            onTap: {
                                if selectedPhotos.contains(asset.localIdentifier) {
                                    selectedPhotos.remove(asset.localIdentifier)
                                } else {
                                    selectedPhotos.insert(asset.localIdentifier)
                                }
                            }
                        )
                    }
                }
            }
            .navigationTitle("Select Photos")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Add (\(selectedPhotos.count))") {
                        let selected = photos.filter { selectedPhotos.contains($0.localIdentifier) }
                        onPhotosSelected(selected)
                        dismiss()
                    }
                    .disabled(selectedPhotos.isEmpty)
                }
            }
            .onAppear {
                photos = photoManager.fetchPhotos(for: date)
            }
        }
    }
}

struct PhotoThumbnail: View {
    let asset: PHAsset
    let photoManager: PhotoManager
    let isSelected: Bool
    let onTap: () -> Void

    @State private var image: UIImage?

    var body: some View {
        Button(action: onTap) {
            ZStack(alignment: .topTrailing) {
                if let image = image {
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: 100, height: 100)
                        .clipped()
                } else {
                    ProgressView()
                        .frame(width: 100, height: 100)
                }

                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.blue)
                        .background(Circle().fill(Color.white))
                        .padding(4)
                }
            }
        }
        .buttonStyle(.plain)
        .onAppear {
            Task {
                image = await photoManager.loadThumbnail(from: asset)
            }
        }
    }
}
