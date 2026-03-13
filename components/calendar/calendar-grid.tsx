import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { formatAmountShort } from '@/utils/format';
import { WEEKDAYS, getTagBgColor, type DayCell } from './types';
import type { Schedule } from '@/types/database';
import { Shadows } from '@/constants/shadows';

interface CalendarGridProps {
  calendarDays: DayCell[];
  selectedDate: string;
  onSelectDate: (date: string, isCurrentMonth: boolean) => void;
  activeTab: 'ledger' | 'schedule';
  dailyTotals: Record<string, { expense: number; income: number }>;
  schedulesByDate: Record<string, Schedule[]>;
  holidaysByDate: Record<string, string>;
}

export function CalendarGrid({
  calendarDays,
  selectedDate,
  onSelectDate,
  activeTab,
  dailyTotals,
  schedulesByDate,
  holidaysByDate,
}: CalendarGridProps) {
  return (
    <View
      className='mx-4 mt-3 bg-white rounded-3xl p-4'
      style={Shadows.primary}
    >
      <View className='flex-row mb-1'>
        {WEEKDAYS.map((day, i) => (
          <View key={day} className='flex-1 items-center py-1.5'>
            <Text
              className={`font-ibm-semibold text-xs ${i === 0 ? 'text-peach-dark' : 'text-neutral-600'}`}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      <View className='flex-row flex-wrap'>
        {calendarDays.map((item, index) => {
          const isSelected = item.date === selectedDate;
          const col = index % 7;
          const isHoliday = !!holidaysByDate[item.date];
          const dayTotals = dailyTotals[item.date];
          const dayExpense = dayTotals?.expense ?? 0;
          const dayIncome = dayTotals?.income ?? 0;
          const daySchedules = schedulesByDate[item.date] ?? [];

          // 공휴일 점 + 일정 점 통합 (공휴일이 항상 첫 번째)
          type DotItem = { id: string; color: string };
          const allDots: DotItem[] = [
            ...(item.isCurrentMonth && isHoliday
              ? [{ id: '__holiday__', color: '#C8562E' }]
              : []),
            ...daySchedules.map(s => ({
              id: s.id,
              color: getTagBgColor(s.tag),
            })),
          ];
          const hasExtraDots = allDots.length > 6;
          const visibleDots = hasExtraDots ? allDots.slice(0, 5) : allDots;
          const extraDotCount = hasExtraDots ? allDots.length - 5 : 0;
          const dotRow1 = visibleDots.slice(0, 3);
          const dotRow2 = visibleDots.slice(3);

          return (
            <TouchableOpacity
              key={`${item.date}-${index}`}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectDate(item.date, item.isCurrentMonth);
              }}
              className='w-[14.28%] items-center'
              style={{
                paddingVertical: 3,
                opacity: item.isCurrentMonth ? 1 : 0.35,
              }}
              activeOpacity={0.7}
            >
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${isSelected ? 'bg-butter' : item.isToday ? 'bg-butter/40' : ''}`}
                style={
                  isSelected
                    ? {
                        shadowColor: '#000',
                        shadowOpacity: 0.1,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 2 },
                      }
                    : {}
                }
              >
                <Text
                  className={`font-ibm-semibold text-sm ${
                    isSelected
                      ? 'text-brown-darker'
                      : col === 0 || isHoliday
                        ? 'text-peach-darker'
                        : 'text-neutral-800'
                  }`}
                >
                  {item.day}
                </Text>
              </View>

              {activeTab === 'ledger' ? (
                <View
                  className='w-full items-center'
                  style={{ height: 30, overflow: 'hidden', paddingTop: 2 }}
                >
                  {item.isCurrentMonth && dayExpense > 0 && (
                    <Text
                      className='font-ibm-bold text-peach-dark text-center'
                      style={{ fontSize: 10, lineHeight: 14 }}
                      numberOfLines={1}
                    >
                      -{formatAmountShort(dayExpense)}
                    </Text>
                  )}
                  {item.isCurrentMonth && dayIncome > 0 && (
                    <Text
                      className='font-ibm-bold text-olive-dark text-center'
                      style={{ fontSize: 10, lineHeight: 14 }}
                      numberOfLines={1}
                    >
                      +{formatAmountShort(dayIncome)}
                    </Text>
                  )}
                </View>
              ) : (
                <View
                  className='w-full items-center justify-center'
                  style={{ height: 30, gap: 3 }}
                >
                  {item.isCurrentMonth && dotRow1.length > 0 && (
                    <View
                      className='flex-row justify-center'
                      style={{ gap: 3 }}
                    >
                      {dotRow1.map(dot => (
                        <View
                          key={dot.id}
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 3.5,
                            backgroundColor: dot.color,
                          }}
                        />
                      ))}
                    </View>
                  )}
                  {item.isCurrentMonth &&
                    (dotRow2.length > 0 || extraDotCount > 0) && (
                      <View
                        className='flex-row justify-center items-center'
                        style={{ gap: 3 }}
                      >
                        {dotRow2.map(dot => (
                          <View
                            key={dot.id}
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: 3.5,
                              backgroundColor: dot.color,
                            }}
                          />
                        ))}
                        {extraDotCount > 0 && (
                          <Text
                            className='font-ibm-semibold text-neutral-600'
                            style={{ fontSize: 10, lineHeight: 14 }}
                          >
                            +{extraDotCount}
                          </Text>
                        )}
                      </View>
                    )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
