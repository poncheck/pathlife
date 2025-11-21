//
//  TimelineView.swift
//  PathLife
//
//  Calendar timeline view
//

import SwiftUI

struct TimelineView: View {
    @EnvironmentObject var apiClient: APIClient
    @State private var selectedMonth = Date()
    @State private var entries: [DiaryEntrySummary] = []
    @State private var isLoading = false
    @State private var selectedDate: Date?

    private let calendar = Calendar.current
    private let columns = Array(repeating: GridItem(.flexible()), count: 7)

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Month navigation
                HStack {
                    Button(action: previousMonth) {
                        Image(systemName: "chevron.left")
                            .font(.title2)
                    }

                    Spacer()

                    Text(DateFormatter.monthYear.string(from: selectedMonth))
                        .font(.title2)
                        .fontWeight(.semibold)

                    Spacer()

                    Button(action: nextMonth) {
                        Image(systemName: "chevron.right")
                            .font(.title2)
                    }
                }
                .padding()

                // Weekday headers
                LazyVGrid(columns: columns, spacing: 0) {
                    ForEach(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], id: \.self) { day in
                        Text(day)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                    }
                }

                Divider()

                // Calendar grid
                ScrollView {
                    LazyVGrid(columns: columns, spacing: 0) {
                        ForEach(daysInMonth(), id: \.self) { date in
                            if let date = date {
                                DayCell(
                                    date: date,
                                    entry: entries.first { $0.date.isSameDay(as: date) },
                                    isToday: date.isSameDay(as: Date()),
                                    onTap: { selectedDate = date }
                                )
                            } else {
                                Color.clear
                                    .frame(height: 80)
                            }
                        }
                    }
                }

                if isLoading {
                    ProgressView()
                        .padding()
                }
            }
            .navigationTitle("Timeline")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                loadEntries()
            }
            .onChange(of: selectedMonth) { _ in
                loadEntries()
            }
            .sheet(item: $selectedDate) { date in
                DayDetailView(date: date)
            }
        }
    }

    private func previousMonth() {
        selectedMonth = selectedMonth.adding(months: -1)
    }

    private func nextMonth() {
        selectedMonth = selectedMonth.adding(months: 1)
    }

    private func daysInMonth() -> [Date?] {
        let firstDay = calendar.date(from: calendar.dateComponents([.year, .month], from: selectedMonth))!
        let range = calendar.range(of: .day, in: .month, for: firstDay)!
        let firstWeekday = calendar.component(.weekday, from: firstDay)

        var days: [Date?] = Array(repeating: nil, count: firstWeekday - 1)

        for day in range {
            if let date = calendar.date(byAdding: .day, value: day - 1, to: firstDay) {
                days.append(date)
            }
        }

        return days
    }

    private func loadEntries() {
        isLoading = true

        let firstDay = calendar.date(from: calendar.dateComponents([.year, .month], from: selectedMonth))!
        let lastDay = calendar.date(byAdding: DateComponents(month: 1, day: -1), to: firstDay)!

        Task {
            do {
                entries = try await apiClient.getDiaryEntries(startDate: firstDay, endDate: lastDay)
            } catch {
                print("❌ Error loading entries: \(error)")
            }
            isLoading = false
        }
    }
}

struct DayCell: View {
    let date: Date
    let entry: DiaryEntrySummary?
    let isToday: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 4) {
                Text("\(Calendar.current.component(.day, from: date))")
                    .font(.system(size: 16, weight: isToday ? .bold : .regular))
                    .foregroundColor(isToday ? .white : .primary)

                HStack(spacing: 2) {
                    if let entry = entry {
                        if entry.photoCount > 0 {
                            Image(systemName: "photo.fill")
                                .font(.system(size: 8))
                                .foregroundColor(.blue)
                        }
                        if entry.activityCount > 0 {
                            Image(systemName: "figure.run")
                                .font(.system(size: 8))
                                .foregroundColor(.green)
                        }
                        if entry.locationCount > 0 {
                            Image(systemName: "location.fill")
                                .font(.system(size: 8))
                                .foregroundColor(.red)
                        }
                    }
                }
                .frame(height: 10)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 70)
            .background(
                isToday ?
                    AnyView(Circle()
                        .fill(Color.blue)
                        .frame(width: 35, height: 35)) :
                    AnyView(Color.clear)
            )
        }
        .buttonStyle(.plain)
    }
}

// Make Date identifiable for sheet presentation
extension Date: Identifiable {
    public var id: TimeInterval {
        self.timeIntervalSince1970
    }
}
