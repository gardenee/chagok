import AppIntents
import SwiftUI
import WidgetKit

// MARK: - Timeline Entry

struct AnniversaryEntry: TimelineEntry {
  let date: Date
  let name: String
  let fullDate: String  // YYYY-MM-DD (또는 레거시 MM-DD)
  let dDayValue: Int    // 양수=D-N, 0=D-Day, 음수=D+N
  let isConfigured: Bool
}

// MARK: - Provider

struct AnniversaryProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> AnniversaryEntry {
    AnniversaryEntry(date: .now, name: "처음 만난 날", fullDate: "2022-06-15", dDayValue: -30, isConfigured: true)
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
      return AnniversaryEntry(date: .now, name: "", fullDate: "", dDayValue: 0, isConfigured: false)
    }
    let stored = WidgetDataStore.shared.load().anniversaries.first { $0.id == selected.id }
    let fullDate = stored?.date ?? selected.date
    let name = stored?.name ?? selected.name
    return AnniversaryEntry(date: .now, name: name, fullDate: fullDate, dDayValue: dDay(from: fullDate), isConfigured: true)
  }

  // YYYY-MM-DD 또는 MM-DD → 이번 연도 기준 D-day (양수=미래, 음수=과거)
  private func dDay(from dateStr: String) -> Int {
    let calendar = Calendar.current
    let today = calendar.startOfDay(for: .now)
    let parts = dateStr.split(separator: "-").compactMap { Int($0) }

    let mm: Int
    let dd: Int
    if parts.count == 3 {
      mm = parts[1]; dd = parts[2]
    } else if parts.count == 2 {
      mm = parts[0]; dd = parts[1]
    } else { return 0 }

    var comps = calendar.dateComponents([.year], from: today)
    comps.month = mm
    comps.day = dd

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
    let parts = entry.fullDate.split(separator: "-").compactMap { Int($0) }
    if parts.count == 3 {
      return "\(parts[0])년 \(parts[1])월 \(parts[2])일"
    } else if parts.count == 2 {
      return "\(parts[0])월 \(parts[1])일"
    }
    return entry.fullDate
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
        .font(.system(size: 34, weight: .bold))
        .foregroundColor(.chagokBrown)
        .minimumScaleFactor(0.5)
        .lineLimit(1)
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
        VStack(alignment: .leading, spacing: 2) {
          Text(entry.name)
            .font(.system(size: 16, weight: .semibold))
            .foregroundColor(.chagokBrown)
            .lineLimit(2)
          Text(formattedDate)
            .font(.system(size: 12))
            .foregroundColor(.chagokBrown.opacity(0.7))
        }
      }
      Spacer()
      Text(dDayLabel)
        .font(.system(size: 46, weight: .bold))
        .foregroundColor(.chagokBrown)
        .minimumScaleFactor(0.5)
        .lineLimit(1)
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
  AnniversaryEntry(date: .now, name: "처음 만난 날", fullDate: "2022-06-15", dDayValue: 80, isConfigured: true)
}

#Preview("D+", as: .systemMedium) {
  AnniversaryWidget()
} timeline: {
  AnniversaryEntry(date: .now, name: "처음 만난 날", mmDd: "03-01", dDayValue: -26, isConfigured: true)
}
