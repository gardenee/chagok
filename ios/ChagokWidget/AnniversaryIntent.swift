import AppIntents
import WidgetKit

// MARK: - Entity

struct AnniversaryEntity: AppEntity {
  let id: String
  let name: String
  let date: String  // "MM-DD"

  static var typeDisplayRepresentation: TypeDisplayRepresentation = "기념일"
  static var defaultQuery = AnniversaryEntityQuery()

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: LocalizedStringResource(stringLiteral: name))
  }
}

// MARK: - Query

struct AnniversaryEntityQuery: EntityQuery {
  func entities(for identifiers: [String]) async throws -> [AnniversaryEntity] {
    WidgetDataStore.shared.load().anniversaries
      .filter { identifiers.contains($0.id) }
      .map { AnniversaryEntity(id: $0.id, name: $0.name, date: $0.date) }
  }

  func suggestedResults() async throws -> [AnniversaryEntity] {
    WidgetDataStore.shared.load().anniversaries
      .map { AnniversaryEntity(id: $0.id, name: $0.name, date: $0.date) }
  }
}

// MARK: - Intent

struct SelectAnniversaryIntent: WidgetConfigurationIntent {
  static var title: LocalizedStringResource = "기념일 선택"
  static var description = IntentDescription("위젯에 표시할 기념일을 선택하세요")

  @Parameter(title: "기념일")
  var anniversary: AnniversaryEntity?
}
