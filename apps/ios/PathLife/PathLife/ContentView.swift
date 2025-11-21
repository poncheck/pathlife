//
//  ContentView.swift
//  PathLife
//
//  Root view with authentication check
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var apiClient: APIClient

    var body: some View {
        if apiClient.isAuthenticated {
            MainTabView()
        } else {
            LoginView()
        }
    }
}

struct MainTabView: View {
    var body: some View {
        TabView {
            TimelineView()
                .tabItem {
                    Label("Timeline", systemImage: "calendar")
                }

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
        }
    }
}
