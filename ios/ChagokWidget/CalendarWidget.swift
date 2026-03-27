import AppIntents
import SwiftUI
import WidgetKit

// MARK: - Entry

struct CalendarEntry: TimelineEntry {
  let date: Date
  let year: Int
  let month: Int
  let today: Int
  let firstWeekday: Int   // 0=일, 6=토
  let daysInMonth: Int
  let scheduledDays: Set<Int>
}

// MARK: - Provider

struct CalendarProvider: TimelineProvider {
  func placeholder(in context: Context) -> CalendarEntry {
    makeEntry()
  }

  func getSnapshot(in context: Context, completion: @escaping (CalendarEntry) -> Void) {
    completion(makeEntry())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<CalendarEntry>) -> Void) {
    let entry = makeEntry()
    let nextMidnight = Calendar.current.nextDate(
      after: .now,
      matching: DateComponents(hour: 0, minute: 0),
      matchingPolicy: .nextTime
    ) ?? Date(timeIntervalSinceNow: 86400)
    completion(Timeline(entries: [entry], policy: .after(nextMidnight)))
  }

  private func makeEntry() -> CalendarEntry {
    let calendar = Calendar.current
    let now = Date()
    let year = calendar.component(.year, from: now)
    let month = calendar.component(.month, from: now)
    let today = calendar.component(.day, from: now)

    var firstComps = DateComponents()
    firstComps.year = year
    firstComps.month = month
    firstComps.day = 1
    let firstDate = calendar.date(from: firstComps)!

    // 0=일요일 기준 weekday offset
    let firstWeekday = (calendar.component(.weekday, from: firstDate) - 1 + 7) % 7

    let daysInMonth = calendar.range(of: .day, in: .month, for: firstDate)!.count

    let scheduled = WidgetDataStore.shared.scheduledDays(year: year, month: month)

    return CalendarEntry(
      date: now,
      year: year,
      month: month,
      today: today,
      firstWeekday: firstWeekday,
      daysInMonth: daysInMonth,
      scheduledDays: scheduled
    )
  }
}

// MARK: - Views

private let weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"]

struct CalendarWidgetView: View {
  let entry: CalendarEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      // 헤더
      HStack {
        Text("\(entry.year)년 \(entry.month)월")
          .font(.system(size: 15, weight: .bold))
          .foregroundColor(.chagokBrown)
        Spacer()
        HStack(spacing: 14) {
          Button(intent: RefreshCalendarIntent()) {
            Image(systemName: "arrow.clockwise")
              .font(.system(size: 12, weight: .medium))
              .foregroundColor(.chagokBrown.opacity(0.45))
          }
          .buttonStyle(.plain)
          Link(destination: URL(string: "chagok://calendar/schedule-form")!) {
            Image(systemName: "plus")
              .font(.system(size: 12, weight: .medium))
              .foregroundColor(.chagokBrown.opacity(0.45))
          }
        }
      }

      // 요일 라벨
      HStack(spacing: 0) {
        ForEach(weekdayLabels, id: \.self) { label in
          Text(label)
            .font(.system(size: 10, weight: .medium))
            .foregroundColor(label == "일" ? .chagokPeach : .chagokBrown.opacity(0.45))
            .frame(maxWidth: .infinity)
        }
      }

      // 날짜 그리드
      let totalCells = entry.firstWeekday + entry.daysInMonth
      let rows = Int(ceil(Double(totalCells) / 7.0))

      VStack(spacing: 4) {
        ForEach(0..<rows, id: \.self) { row in
          HStack(spacing: 0) {
            ForEach(0..<7) { col in
              let cellIndex = row * 7 + col
              let day = cellIndex - entry.firstWeekday + 1

              if day < 1 || day > entry.daysInMonth {
                Spacer().frame(maxWidth: .infinity)
              } else {
                DayCell(
                  day: day,
                  isToday: day == entry.today,
                  hasSchedule: entry.scheduledDays.contains(day),
                  isSunday: col == 0
                )
              }
            }
          }
        }
      }
    }
    .padding(.horizontal, 16)
    .padding(.vertical, 14)
    .containerBackground(Color.chagokCream, for: .widget)
  }
}

struct DayCell: View {
  let day: Int
  let isToday: Bool
  let hasSchedule: Bool
  let isSunday: Bool

  var textColor: Color {
    if isToday { return .chagokBrown }
    if isSunday { return .chagokPeach }
    return .chagokBrown.opacity(0.75)
  }

  var body: some View {
    VStack(spacing: 2) {
      ZStack {
        if isToday {
          Circle()
            .fill(Color.chagokButter)
            .frame(width: 24, height: 24)
        }
        Text("\(day)")
          .font(.system(size: 12, weight: isToday ? .bold : .regular))
          .foregroundColor(textColor)
      }
      .frame(width: 24, height: 24)

      // 일정 점
      Circle()
        .fill(hasSchedule ? Color.chagokPeach : Color.clear)
        .frame(width: 4, height: 4)
    }
    .frame(maxWidth: .infinity)
  }
}

// MARK: - Widget

struct CalendarWidget: Widget {
  let kind = "CalendarWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: CalendarProvider()) { entry in
      CalendarWidgetView(entry: entry)
    }
    .configurationDisplayName("이번달 달력")
    .description("이번 달 일정을 한눈에 확인하세요")
    .supportedFamilies([.systemLarge])
  }
}




#Preview(as: .systemLarge) {
  CalendarWidget()
} timeline: {
  CalendarEntry(
    date: .now,
    year: 2026,
    month: 3,
    today: 27,
    firstWeekday: 0,  // 3월 1일 = 일요일
    daysInMonth: 31,
    scheduledDays: [5, 12, 15, 27, 28]
  )
}
