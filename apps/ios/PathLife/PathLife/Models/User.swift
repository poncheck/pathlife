//
//  User.swift
//  PathLife
//
//  User authentication model
//

import Foundation

struct User: Codable {
    let id: String
    let username: String
    let email: String?
    let role: String
}

struct LoginRequest: Codable {
    let username: String
    let password: String
}

struct LoginResponse: Codable {
    let token: String
    let user: User
}
