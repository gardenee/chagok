import Foundation
import WidgetKit

@objc(WidgetDataModule)
class WidgetDataModule: NSObject {

  private let appGroupId = "group.app.chagok.ios"
  private let dataKey = "chagok_widget_data"

  @objc
  func writeWidgetData(_ data: NSDictionary) {
    guard let defaults = UserDefaults(suiteName: appGroupId) else { return }
    guard
      let jsonData = try? JSONSerialization.data(withJSONObject: data),
      let jsonString = String(data: jsonData, encoding: .utf8)
    else { return }
    defaults.set(jsonString, forKey: dataKey)
    WidgetCenter.shared.reloadAllTimelines()
  }

  @objc
  static func requiresMainQueueSetup() -> Bool { false }
}
