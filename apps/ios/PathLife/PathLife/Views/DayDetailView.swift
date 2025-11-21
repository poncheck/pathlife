//
//  DayDetailView.swift
//  PathLife
//
//  Detailed view for a single day
//

import SwiftUI
import MapKit

struct DayDetailView: View {
    let date: Date

    @EnvironmentObject var apiClient: APIClient
    @EnvironmentObject var photoManager: PhotoManager
    @Environment(\.dismiss) var dismiss

    @State private var entry: DiaryEntry?
    @State private var isLoading = false
    @State private var localPhotos: [PHAsset] = []
    @State private var showingPhotoPicker = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if isLoading {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                            .padding()
                    } else if let entry = entry {
                        // Description
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Description")
                                .font(.headline)

                            if let description = entry.description {
                                Text(description)
                                    .font(.body)
                            } else {
                                Text("No description")
                                    .foregroundColor(.secondary)
                                    .italic()
                            }
                        }
                        .padding(.horizontal)

                        Divider()

                        // Photos
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text("Photos")
                                    .font(.headline)

                                Spacer()

                                Button("Add from Camera Roll") {
                                    showingPhotoPicker = true
                                }
                                .font(.caption)
                                .buttonStyle(.bordered)
                            }

                            if !entry.photos.isEmpty {
                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: 12) {
                                        ForEach(entry.photos) { photo in
                                            RemotePhotoView(photo: photo)
                                        }
                                    }
                                    .padding(.horizontal)
                                }
                            }

                            if !localPhotos.isEmpty {
                                Text("From your Camera Roll:")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                    .padding(.horizontal)

                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: 12) {
                                        ForEach(localPhotos, id: \.localIdentifier) { asset in
                                            LocalPhotoView(asset: asset, photoManager: photoManager)
                                        }
                                    }
                                    .padding(.horizontal)
                                }
                            }

                            if entry.photos.isEmpty && localPhotos.isEmpty {
                                Text("No photos for this day")
                                    .foregroundColor(.secondary)
                                    .italic()
                                    .padding(.horizontal)
                            }
                        }

                        Divider()

                        // Activities
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Activities")
                                .font(.headline)
                                .padding(.horizontal)

                            if !entry.activities.isEmpty {
                                ForEach(entry.activities) { activity in
                                    ActivityRow(activity: activity)
                                        .padding(.horizontal)
                                }
                            } else {
                                Text("No activities")
                                    .foregroundColor(.secondary)
                                    .italic()
                                    .padding(.horizontal)
                            }
                        }

                        Divider()

                        // Location map
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Location Track")
                                .font(.headline)
                                .padding(.horizontal)

                            if !entry.locations.isEmpty {
                                LocationMapView(locations: entry.locations)
                                    .frame(height: 300)
                                    .cornerRadius(12)
                                    .padding(.horizontal)

                                Text("\(entry.locations.count) location points")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                    .padding(.horizontal)
                            } else {
                                Text("No location data")
                                    .foregroundColor(.secondary)
                                    .italic()
                                    .padding(.horizontal)
                            }
                        }
                    } else {
                        Text("No data for this day")
                            .foregroundColor(.secondary)
                            .padding()
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle(DateFormatter.displayDate.string(from: date))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .onAppear {
                loadData()
            }
            .sheet(isPresented: $showingPhotoPicker) {
                PhotoPickerView(
                    date: date,
                    photoManager: photoManager,
                    onPhotosSelected: { assets in
                        localPhotos = assets
                    }
                )
            }
        }
    }

    private func loadData() {
        isLoading = true

        Task {
            do {
                entry = try await apiClient.getDiaryEntry(for: date)
                localPhotos = photoManager.fetchPhotos(for: date)
            } catch {
                print("❌ Error loading day details: \(error)")
            }
            isLoading = false
        }
    }
}

// MARK: - Activity Row

struct ActivityRow: View {
    let activity: Activity

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: iconForActivity(activity.type))
                    .foregroundColor(.green)

                Text(activity.name)
                    .font(.headline)

                Spacer()

                Text(activity.type)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.green.opacity(0.2))
                    .cornerRadius(8)
            }

            HStack(spacing: 16) {
                Label("\(String(format: "%.2f", activity.distanceKm)) km", systemImage: "arrow.right")
                    .font(.caption)

                Label(activity.durationFormatted, systemImage: "clock")
                    .font(.caption)

                if activity.totalElevation > 0 {
                    Label("\(Int(activity.totalElevation)) m", systemImage: "arrow.up")
                        .font(.caption)
                }
            }
            .foregroundColor(.secondary)
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }

    private func iconForActivity(_ type: String) -> String {
        switch type.lowercased() {
        case "run": return "figure.run"
        case "ride": return "bicycle"
        case "walk": return "figure.walk"
        case "hike": return "figure.hiking"
        default: return "figure.mixed.cardio"
        }
    }
}

// MARK: - Remote Photo View

struct RemotePhotoView: View {
    let photo: Photo

    var body: some View {
        AsyncImage(url: URL(string: photo.thumbnailUrl ?? "")) { phase in
            switch phase {
            case .empty:
                ProgressView()
                    .frame(width: 150, height: 150)
            case .success(let image):
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 150, height: 150)
                    .clipped()
                    .cornerRadius(12)
            case .failure:
                Image(systemName: "photo")
                    .frame(width: 150, height: 150)
                    .background(Color.gray.opacity(0.2))
                    .cornerRadius(12)
            @unknown default:
                EmptyView()
            }
        }
    }
}

// MARK: - Local Photo View

struct LocalPhotoView: View {
    let asset: PHAsset
    let photoManager: PhotoManager

    @State private var image: UIImage?

    var body: some View {
        Group {
            if let image = image {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } else {
                ProgressView()
            }
        }
        .frame(width: 150, height: 150)
        .clipped()
        .cornerRadius(12)
        .onAppear {
            Task {
                image = await photoManager.loadThumbnail(from: asset)
            }
        }
    }
}

// MARK: - Location Map View

struct LocationMapView: View {
    let locations: [Location]

    @State private var region: MKCoordinateRegion

    init(locations: [Location]) {
        self.locations = locations

        // Calculate initial region
        let coords = locations.map { $0.coordinate }
        let center = CLLocationCoordinate2D(
            latitude: coords.map { $0.latitude }.reduce(0, +) / Double(coords.count),
            longitude: coords.map { $0.longitude }.reduce(0, +) / Double(coords.count)
        )

        _region = State(initialValue: MKCoordinateRegion(
            center: center,
            span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
        ))
    }

    var body: some View {
        Map(coordinateRegion: $region, annotationItems: locations) { location in
            MapMarker(coordinate: location.coordinate, tint: .red)
        }
    }
}
