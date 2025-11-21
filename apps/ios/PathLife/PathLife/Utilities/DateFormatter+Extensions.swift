//
//  DateFormatter+Extensions.swift
//  PathLife
//
//  Date formatting utilities
//

import Foundation

extension DateFormatter {
    static let displayDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter
    }()

    static let displayTime: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .none
        formatter.timeStyle = .short
        return formatter
    }()

    static let displayDateTime: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter
    }()

    static let monthYear: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        return formatter
    }()

    static let dayMonth: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "d MMM"
        return formatter
    }()
}

extension Date {
    var startOfDay: Date {
        Calendar.current.startOfDay(for: self)
    }

    var endOfDay: Date {
        var components = DateComponents()
        components.day = 1
        components.second = -1
        return Calendar.current.date(byAdding: components, to: startOfDay)!
    }

    func isSameDay(as other: Date) -> Bool {
        Calendar.current.isDate(self, inSameDayAs: other)
    }

    func adding(days: Int) -> Date {
        Calendar.current.date(byAdding: .day, value: days, to: self)!
    }

    func adding(months: Int) -> Date {
        Calendar.current.date(byAdding: .month, value: months, to: self)!
    }
}
