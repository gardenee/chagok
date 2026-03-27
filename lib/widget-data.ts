import { NativeModules, Platform } from 'react-native';
import { supabase } from './supabase';

const { WidgetDataModule } = NativeModules as {
  WidgetDataModule?: {
    writeWidgetData: (data: Record<string, unknown>) => void;
  };
};

interface WidgetAnniversary {
  id: string;
  name: string;
  date: string;
  type: string;
}

interface WidgetSchedule {
  id: string;
  title: string;
  date: string;
  endDate: string | null;
}

export async function syncWidgetData(coupleId: string): Promise<void> {
  if (Platform.OS !== 'ios' || !WidgetDataModule) return;

  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    // 이번 달 + 다음 달 일정 fetch
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const nextMonthYear = month === 11 ? year + 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;
    const lastDay = new Date(nextMonthYear, nextMonth + 1, 0).getDate();
    const endDate = `${nextMonthYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const [anniversaryRes, scheduleRes] = await Promise.all([
      supabase
        .from('anniversaries')
        .select('id, name, date, type')
        .eq('couple_id', coupleId),
      supabase
        .from('schedules')
        .select('id, title, date, end_date')
        .eq('couple_id', coupleId)
        .lte('date', endDate)
        .or(
          `and(end_date.is.null,date.gte.${startDate}),end_date.gte.${startDate}`,
        ),
    ]);

    const anniversaries: WidgetAnniversary[] = (anniversaryRes.data ?? []).map(
      a => ({
        id: a.id,
        name: a.name,
        date: a.date,
        type: a.type,
      }),
    );

    const schedules: WidgetSchedule[] = (scheduleRes.data ?? []).map(s => ({
      id: s.id,
      title: s.title,
      date: s.date,
      endDate: s.end_date ?? null,
    }));

    WidgetDataModule.writeWidgetData({
      anniversaries,
      schedules,
      updatedAt: now.toISOString(),
    });
  } catch {
    // 위젯 동기화 실패는 조용히 무시
  }
}
