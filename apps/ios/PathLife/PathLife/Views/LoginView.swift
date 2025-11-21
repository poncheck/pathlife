//
//  LoginView.swift
//  PathLife
//
//  Login screen
//

import SwiftUI

struct LoginView: View {
    @EnvironmentObject var apiClient: APIClient

    @State private var username = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Spacer()

                // Logo/Title
                VStack(spacing: 8) {
                    Image(systemName: "map.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.blue)

                    Text("PathLife")
                        .font(.largeTitle)
                        .fontWeight(.bold)

                    Text("Your life, mapped")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.bottom, 40)

                // Login form
                VStack(spacing: 16) {
                    TextField("Username", text: $username)
                        .textFieldStyle(.roundedBorder)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()

                    SecureField("Password", text: $password)
                        .textFieldStyle(.roundedBorder)

                    if let error = errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                            .multilineTextAlignment(.center)
                    }

                    Button(action: login) {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(.circular)
                                .tint(.white)
                        } else {
                            Text("Login")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                    .disabled(isLoading || username.isEmpty || password.isEmpty)
                }
                .padding(.horizontal, 32)

                Spacer()
            }
            .navigationTitle("")
            .navigationBarHidden(true)
        }
    }

    private func login() {
        isLoading = true
        errorMessage = nil

        Task {
            do {
                _ = try await apiClient.login(username: username, password: password)
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}
