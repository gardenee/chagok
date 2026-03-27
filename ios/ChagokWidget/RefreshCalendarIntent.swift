import AppIntents
import WidgetKit

struct RefreshCalendarIntent: AppIntent {
  static var title: LocalizedStringResource = "캘린더 새로고침"

  func perform() async throws -> some IntentResult {
    WidgetCenter.shared.reloadTimelines(ofKind: "CalendarWidget")
    return .result()
  }
}
