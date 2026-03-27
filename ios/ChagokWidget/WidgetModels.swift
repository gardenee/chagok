import Foundation

struct WidgetAnniversary: Codable, Identifiable {
  let id: String
  let name: String
  let date: String  // "MM-DD"
  let type: String
}

struct WidgetSchedule: Codable, Identifiable {
  let id: String
  let title: String
  let date: String  // "YYYY-MM-DD"
  let endDate: String?  // "YYYY-MM-DD", optional
}

struct WidgetData: Codable {
  let anniversaries: [WidgetAnniversary]
  let schedules: [WidgetSchedule]
  let updatedAt: String?
}
