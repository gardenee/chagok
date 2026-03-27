import AppIntents
import SwiftUI
import WidgetKit

// MARK: - Timeline Entry

struct AnniversaryEntry: TimelineEntry {
  let date: Date
  let name: String
  let mmDd: String
  let dDayValue: Int  // 양수=D-N, 0=D-Day, 음수=D+N
  let isConfigured: Bool
}

// MARK: - Provider

struct AnniversaryProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> AnniversaryEntry {
    AnniversaryEntry(date: .now, name: "처음 만난 날", mmDd: "06-15", dDayValue: -30, isConfigured: true)
  }

  func snapshot(for configuration: SelectAnniversaryIntent, in context: Context) async -> AnniversaryEntry {
    makeEntry(for: configuration)
  }

  func timeline(for configuration: SelectAnniversaryIntent, in context: Context) async -> Timeline<AnniversaryEntry> {
    let entry = makeEntry(for: configuration)
    // 자정마다 갱신
    let nextMidnight = Calendar.current.nextDate(
      after: .now,
      matching: DateComponents(hour: 0, minute: 0),
      matchingPolicy: .nextTime
    ) ?? Date(timeIntervalSinceNow: 86400)
    return Timeline(entries: [entry], policy: .after(nextMidnight))
  }

  private func makeEntry(for configuration: SelectAnniversaryIntent) -> AnniversaryEntry {
    guard let selected = configuration.anniversary else {
      return AnniversaryEntry(date: .now, name: "", mmDd: "", dDayValue: 0, isConfigured: false)
    }
    // 저장된 데이터에서 최신 정보 읽기
    let stored = WidgetDataStore.shared.load().anniversaries.first { $0.id == selected.id }
    let mmDd = stored?.date ?? selected.date
    let name = stored?.name ?? selected.name
    return AnniversaryEntry(date: .now, name: name, mmDd: mmDd, dDayValue: dDay(from: mmDd), isConfigured: true)
  }

  // MM-DD → 오늘 기준 D-day 값 (양수=미래, 음수=과거)
  private func dDay(from mmDd: String) -> Int {
    let calendar = Calendar.current
    let today = calendar.startOfDay(for: .now)
    let parts = mmDd.split(separator: "-").compactMap { Int($0) }
    guard parts.count == 2 else { return 0 }

    var comps = calendar.dateComponents([.year], from: today)
    comps.month = parts[0]
    comps.day = parts[1]

    guard let thisYear = calendar.date(from: comps) else { return 0 }
    return calendar.dateComponents([.day], from: today, to: thisYear).day ?? 0
  }
}

// MARK: - Views

struct AnniversaryWidgetView: View {
  let entry: AnniversaryEntry
  @Environment(\.widgetFamily) var family

  var dDayLabel: String {
    if entry.dDayValue == 0 { return "D-Day" }
    if entry.dDayValue > 0 { return "D-\(entry.dDayValue)" }
    return "D+\(abs(entry.dDayValue))"
  }

  var formattedDate: String {
    let parts = entry.mmDd.split(separator: "-").compactMap { Int($0) }
    guard parts.count == 2 else { return entry.mmDd }
    return "\(parts[0])월 \(parts[1])일"
  }

  var body: some View {
    Group {
      if !entry.isConfigured {
        unconfiguredView
      } else if family == .systemMedium {
        mediumView
      } else {
        smallView
      }
    }
    .widgetURL(URL(string: "chagok://settings/anniversary-settings"))
    .containerBackground(Color.chagokButter, for: .widget)
  }

  var unconfiguredView: some View {
    VStack(spacing: 4) {
      Image(systemName: "heart.fill")
        .foregroundColor(.chagokBrown.opacity(0.5))
        .font(.system(size: 20))
      Text("기념일을 선택해주세요")
        .font(.system(size: 13, weight: .medium))
        .foregroundColor(.chagokBrown.opacity(0.7))
        .multilineTextAlignment(.center)
    }
  }

  var smallView: some View {
    VStack(spacing: 5) {
      Image(systemName: "heart.fill")
        .foregroundColor(.chagokBrown.opacity(0.6))
        .font(.system(size: 18))
      Text(dDayLabel)
        .font(.system(size: 30, weight: .bold))
        .foregroundColor(.chagokBrown)
      Text(entry.name)
        .font(.system(size: 11, weight: .medium))
        .foregroundColor(.chagokBrown.opacity(0.65))
        .lineLimit(1)
    }
  }

  var mediumView: some View {
    HStack(alignment: .center, spacing: 0) {
      VStack(alignment: .leading, spacing: 6) {
        Image(systemName: "heart.fill")
          .foregroundColor(.chagokBrown.opacity(0.6))
          .font(.system(size: 20))
        Text(entry.name)
          .font(.system(size: 16, weight: .semibold))
          .foregroundColor(.chagokBrown)
          .lineLimit(2)
        Text(formattedDate)
          .font(.system(size: 12))
          .foregroundColor(.chagokBrown.opacity(0.55))
      }
      Spacer()
      Text(dDayLabel)
        .font(.system(size: 42, weight: .bold))
        .foregroundColor(.chagokBrown)
    }
    .padding(.horizontal, 20)
    .padding(.vertical, 16)
  }
}

// MARK: - Widget

struct AnniversaryWidget: Widget {
  let kind = "AnniversaryWidget"

  var body: some WidgetConfiguration {
    AppIntentConfiguration(
      kind: kind,
      intent: SelectAnniversaryIntent.self,
      provider: AnniversaryProvider()
    ) { entry in
      AnniversaryWidgetView(entry: entry)
    }
    .configurationDisplayName("기념일 D-Day")
    .description("특별한 기념일의 D-Day를 확인하세요")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}


#Preview(as: .systemSmall) {
  AnniversaryWidget()
} timeline: {
  AnniversaryEntry(date: .now, name: "처음 만난 날", mmDd: "06-15", dDayValue: 80, isConfigured: true)
}

#Preview("D+", as: .systemMedium) {
  AnniversaryWidget()
} timeline: {
  AnniversaryEntry(date: .now, name: "처음 만난 날", mmDd: "03-01", dDayValue: -26, isConfigured: true)
}
