//
//  APIClient.swift
//  PathLife
//
//  API client for backend communication
//

import Foundation

enum APIError: Error {
    case invalidURL
    case invalidResponse
    case unauthorized
    case serverError(String)
    case decodingError(Error)
    case networkError(Error)

    var localizedDescription: String {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .unauthorized:
            return "Unauthorized - please login again"
        case .serverError(let message):
            return "Server error: \(message)"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        }
    }
}

class APIClient: ObservableObject {
    static let shared = APIClient()

    // CONFIGURE THIS WITH YOUR BACKEND URL
    private let baseURL = "http://localhost:3030/api"

    @Published var isAuthenticated = false
    @Published var currentUser: User?

    private var jwtToken: String? {
        get { KeychainHelper.shared.getToken() }
        set {
            if let token = newValue {
                KeychainHelper.shared.saveToken(token)
            } else {
                KeychainHelper.shared.deleteToken()
            }
        }
    }

    private let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }()

    private let encoder: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }()

    init() {
        // Check if we have a stored token
        isAuthenticated = jwtToken != nil
    }

    // MARK: - Authentication

    func login(username: String, password: String) async throws -> LoginResponse {
        let request = LoginRequest(username: username, password: password)
        let response: LoginResponse = try await post("/auth/login", body: request, requiresAuth: false)

        jwtToken = response.token
        currentUser = response.user
        await MainActor.run {
            isAuthenticated = true
        }

        print("✅ Logged in as \(response.user.username)")
        return response
    }

    func logout() {
        jwtToken = nil
        currentUser = nil
        isAuthenticated = false
        print("👋 Logged out")
    }

    // MARK: - Diary Entries

    func getDiaryEntry(for date: Date) async throws -> DiaryEntry {
        let dateString = date.toISO8601String()
        return try await get("/diary/entries/\(dateString)")
    }

    func getDiaryEntries(startDate: Date, endDate: Date) async throws -> [DiaryEntrySummary] {
        let params = [
            "startDate": startDate.toISO8601String(),
            "endDate": endDate.toISO8601String()
        ]
        return try await get("/diary/entries", queryParams: params)
    }

    func updateDiaryEntry(date: Date, description: String) async throws -> DiaryEntry {
        let body = ["description": description]
        let dateString = date.toISO8601String()
        return try await patch("/diary/entries/\(dateString)", body: body)
    }

    func getOnThisDay(date: Date) async throws -> [DiaryEntry] {
        let dateString = date.toISO8601String()
        return try await get("/diary/on-this-day/\(dateString)")
    }

    // MARK: - Locations

    func uploadLocations(_ locations: [LocationUpload]) async throws {
        let body = ["locations": locations]
        let _: [String: Any] = try await post("/diary/locations", body: body)
        print("✅ Uploaded \(locations.count) locations")
    }

    // MARK: - Photos

    func uploadPhoto(_ photo: PhotoUpload) async throws {
        let body = ["photo": photo]
        let _: [String: Any] = try await post("/diary/photos", body: body)
        print("✅ Uploaded photo")
    }

    func togglePhotoSelection(_ photoId: String) async throws -> Photo {
        return try await patch("/diary/photos/\(photoId)/toggle", body: [:])
    }

    // MARK: - Sync

    func syncToday() async throws {
        let _: [String: Any] = try await post("/sync/today", body: [:])
        print("✅ Synced today's data")
    }

    func syncLastDays(_ days: Int) async throws {
        let _: [String: Any] = try await post("/sync/last-days/\(days)", body: [:])
        print("✅ Synced last \(days) days")
    }

    // MARK: - Generic HTTP Methods

    private func get<T: Decodable>(
        _ endpoint: String,
        queryParams: [String: String]? = nil,
        requiresAuth: Bool = true
    ) async throws -> T {
        let url = try buildURL(endpoint, queryParams: queryParams)
        var request = URLRequest(url: url)
        request.httpMethod = "GET"

        if requiresAuth {
            try addAuthHeader(&request)
        }

        return try await performRequest(request)
    }

    private func post<T: Decodable, B: Encodable>(
        _ endpoint: String,
        body: B,
        requiresAuth: Bool = true
    ) async throws -> T {
        let url = try buildURL(endpoint)
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        request.httpBody = try encoder.encode(body)

        if requiresAuth {
            try addAuthHeader(&request)
        }

        return try await performRequest(request)
    }

    private func patch<T: Decodable, B: Encodable>(
        _ endpoint: String,
        body: B,
        requiresAuth: Bool = true
    ) async throws -> T {
        let url = try buildURL(endpoint)
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        request.httpBody = try encoder.encode(body)

        if requiresAuth {
            try addAuthHeader(&request)
        }

        return try await performRequest(request)
    }

    // MARK: - Helpers

    private func buildURL(_ endpoint: String, queryParams: [String: String]? = nil) throws -> URL {
        var urlString = baseURL + endpoint

        if let params = queryParams, !params.isEmpty {
            let queryString = params.map { "\($0.key)=\($0.value)" }.joined(separator: "&")
            urlString += "?" + queryString
        }

        guard let url = URL(string: urlString) else {
            throw APIError.invalidURL
        }

        return url
    }

    private func addAuthHeader(_ request: inout URLRequest) throws {
        guard let token = jwtToken else {
            throw APIError.unauthorized
        }
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    }

    private func performRequest<T: Decodable>(_ request: URLRequest) async throws -> T {
        do {
            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }

            switch httpResponse.statusCode {
            case 200...299:
                do {
                    return try decoder.decode(T.self, from: data)
                } catch {
                    print("❌ Decoding error: \(error)")
                    throw APIError.decodingError(error)
                }

            case 401:
                await MainActor.run {
                    self.logout()
                }
                throw APIError.unauthorized

            default:
                if let errorMessage = try? JSONDecoder().decode([String: String].self, from: data),
                   let message = errorMessage["error"] {
                    throw APIError.serverError(message)
                }
                throw APIError.serverError("Status code: \(httpResponse.statusCode)")
            }

        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.networkError(error)
        }
    }
}

// MARK: - Date Extensions

extension Date {
    func toISO8601String() -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        return formatter.string(from: self)
    }
}
