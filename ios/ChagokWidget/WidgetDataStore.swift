import Foundation

final class WidgetDataStore {
  static let shared = WidgetDataStore()

  private let appGroupId = "group.app.chagok.ios"
  private let dataKey = "chagok_widget_data"

  func load() -> WidgetData {
    guard
      let defaults = UserDefaults(suiteName: appGroupId),
      let json = defaults.string(forKey: dataKey),
      let data = json.data(using: .utf8),
      let decoded = try? JSONDecoder().decode(WidgetData.self, from: data)
    else {
      return WidgetData(anniversaries: [], schedules: [], updatedAt: nil)
    }
    return decoded
  }

  // 특정 달의 일정이 있는 날짜(day number) Set 반환
  func scheduledDays(year: Int, month: Int) -> Set<Int> {
    let schedules = load().schedules
    var days = Set<Int>()
    let calendar = Calendar.current

    for s in schedules {
      guard let startDate = parseDate(s.date) else { continue }
      let endDate = s.endDate.flatMap { parseDate($0) } ?? startDate

      var current = startDate
      while current <= endDate {
        let comps = calendar.dateComponents([.year, .month, .day], from: current)
        if comps.year == year, comps.month == month, let d = comps.day {
          days.insert(d)
        }
        guard let next = calendar.date(byAdding: .day, value: 1, to: current) else { break }
        current = next
      }
    }
    return days
  }

  private func parseDate(_ str: String) -> Date? {
    let f = DateFormatter()
    f.dateFormat = "yyyy-MM-dd"
    f.locale = Locale(identifier: "en_US_POSIX")
    return f.date(from: str)
  }
}
