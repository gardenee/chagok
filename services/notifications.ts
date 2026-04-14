import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import type {
  FixedExpense,
  Notification,
  Schedule,
  Anniversary,
} from '@/types/database';
import { resolveFixedExpenseDate } from '@/utils/fixed-expense-date';

async function cancelNotificationsByTypes(types: string[]): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter(n => types.includes(n.content.data?.type as string))
      .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

function isExpoPushToken(token: string): boolean {
  return (
    token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')
  );
}

export async function checkPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export async function requestPermission(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status;
}

async function getExpoPushToken(): Promise<string | null> {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) return null;

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

async function getPartnerToken(
  coupleId: string,
  myId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('expo_push_token')
    .eq('couple_id', coupleId)
    .neq('id', myId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  const token = data?.expo_push_token;
  if (!token || !isExpoPushToken(token)) return null;
  return token;
}

async function sendExpoPush(
  token: string,
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<void> {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to: token, title, body, sound: 'default', data }),
  });
}

export async function registerMyPushToken(userId: string): Promise<void> {
  const token = await getExpoPushToken();
  if (!token || !isExpoPushToken(token)) return;

  const { error } = await supabase
    .from('users')
    .update({ expo_push_token: token, notification_enabled: true })
    .eq('id', userId);
  if (error) throw error;
}

export async function clearMyPushToken(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ expo_push_token: null, notification_enabled: false })
    .eq('id', userId);
  if (error) throw error;
}

export async function sendPartnerJoinedPush({
  coupleId,
  joinerId,
  joinerNickname,
}: {
  coupleId: string;
  joinerId: string;
  joinerNickname: string;
}): Promise<void> {
  const token = await getPartnerToken(coupleId, joinerId);
  if (!token) return;

  await sendExpoPush(
    token,
    '짝꿍 연동 완료',
    `${joinerNickname}님이 가계부에 합류했어요.`,
    { type: 'COUPLE_JOINED' },
  );
}

export async function sendPartnerTransactionPush({
  coupleId,
  senderId,
  senderNickname,
  amount,
  type,
  categoryName,
}: {
  coupleId: string;
  senderId: string;
  senderNickname: string;
  amount: number;
  type: 'expense' | 'income';
  categoryName?: string | null;
}): Promise<void> {
  const token = await getPartnerToken(coupleId, senderId);
  if (!token) return;

  const typeLabel = type === 'expense' ? '지출' : '수입';
  const categoryLabel = categoryName ? ` · ${categoryName}` : '';

  await sendExpoPush(
    token,
    `${senderNickname}의 ${typeLabel}${categoryLabel}`,
    `${amount.toLocaleString()}원`,
    { type: 'PARTNER_TRANSACTION' },
  );
}

export async function sendPartnerCommentPush({
  coupleId,
  commenterId,
  commenterNickname,
  content,
  transactionId,
}: {
  coupleId: string;
  commenterId: string;
  commenterNickname: string;
  content: string;
  transactionId: string;
}): Promise<void> {
  const token = await getPartnerToken(coupleId, commenterId);
  if (!token) return;

  await sendExpoPush(token, `${commenterNickname}의 댓글`, content, {
    type: 'PARTNER_COMMENT',
    transactionId,
  });
}

export async function scheduleFixedExpenseReminders(
  fixedExpenses: FixedExpense[],
): Promise<void> {
  await cancelNotificationsByTypes(['FIXED_EXPENSE']);

  const now = new Date();

  for (const expense of fixedExpenses) {
    for (let offset = 0; offset < 3; offset++) {
      const totalMonths = now.getMonth() + offset;
      const year = now.getFullYear() + Math.floor(totalMonths / 12);
      const month = totalMonths % 12;
      const dueDate = resolveFixedExpenseDate(expense, year, month);

      if (dueDate > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '고정지출 납부일',
            body: `${expense.name} ${expense.amount.toLocaleString()}원 납부일이에요`,
            sound: true,
            data: { type: 'FIXED_EXPENSE', id: expense.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: dueDate,
          },
        });
      }
    }
  }
}

export async function fetchNotifications(
  userId: string,
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function markAllNotificationsAsRead(
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}

const BUDGET_THRESHOLDS: { rate: number; title: string }[] = [
  { rate: 0.5, title: '예산 50% 도달' },
  { rate: 0.7, title: '예산 70% 도달' },
  { rate: 0.9, title: '예산 90% 도달' },
  { rate: 1.0, title: '예산 초과' },
];

export async function checkAndNotifyBudgetThresholds({
  coupleId,
  categoryId,
  categoryName,
  newAmount,
}: {
  coupleId: string;
  categoryId: string;
  categoryName: string;
  newAmount: number;
}): Promise<void> {
  const { data: category } = await supabase
    .from('categories')
    .select('budget_amount')
    .eq('id', categoryId)
    .single();

  if (!category || category.budget_amount <= 0) return;

  const budget = category.budget_amount;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data: txs } = await supabase
    .from('transactions')
    .select('amount')
    .eq('couple_id', coupleId)
    .eq('category_id', categoryId)
    .eq('type', 'expense')
    .gte('date', startDate)
    .lte('date', endDate);

  const total = (txs ?? []).reduce((sum, t) => sum + t.amount, 0);
  const prevTotal = total - newAmount;

  const crossed = BUDGET_THRESHOLDS.filter(
    ({ rate }) => prevTotal / budget < rate && total / budget >= rate,
  );

  for (const threshold of crossed) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: threshold.title,
        body: `${categoryName} ${total.toLocaleString()}원 / 예산 ${budget.toLocaleString()}원`,
        sound: true,
        data: { type: 'BUDGET_EXCEEDED', categoryId },
      },
      trigger: null,
    });
  }
}

export async function scheduleAnniversaryReminders(
  anniversaries: Anniversary[],
  enabled: boolean,
): Promise<void> {
  await cancelNotificationsByTypes(['ANNIVERSARY']);

  if (!enabled || anniversaries.length === 0) return;

  const now = new Date();

  for (const anniversary of anniversaries) {
    const parts = anniversary.date.split('-').map(Number);
    const mm = parts.length === 3 ? parts[1] : parts[0];
    const dd = parts.length === 3 ? parts[2] : parts[1];

    for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
      const year = now.getFullYear() + yearOffset;
      // Notify at 9 PM the day before
      const triggerDate = new Date(year, mm - 1, dd - 1, 21, 0, 0);

      if (triggerDate <= now) continue;

      let title = '기념일 알림';
      if (anniversary.type === 'birthday_me') title = '생일 알림';
      else if (anniversary.type === 'birthday_partner')
        title = '짝꿍 생일 알림';

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: `내일은 ${anniversary.name}이에요`,
          sound: true,
          data: { type: 'ANNIVERSARY', id: anniversary.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
    }
  }
}

export async function scheduleEventReminders(
  schedules: Schedule[],
  userId: string,
  myScheduleEnabled: boolean,
  togetherScheduleEnabled: boolean,
): Promise<void> {
  await cancelNotificationsByTypes(['MY_SCHEDULE', 'TOGETHER_SCHEDULE']);

  const now = new Date();

  for (const schedule of schedules) {
    const isMySchedule = schedule.tag === 'me' && schedule.user_id === userId;
    const isTogetherSchedule = schedule.tag === 'together';

    if (isMySchedule && !myScheduleEnabled) continue;
    if (isTogetherSchedule && !togetherScheduleEnabled) continue;
    if (!isMySchedule && !isTogetherSchedule) continue;

    const [year, month, day] = schedule.date.split('-').map(Number);
    let triggerDate: Date;

    if (schedule.start_time) {
      const [hours, minutes] = schedule.start_time.split(':').map(Number);
      triggerDate = new Date(year, month - 1, day, hours, minutes, 0);
      triggerDate = new Date(triggerDate.getTime() - 60 * 60 * 1000);
    } else {
      triggerDate = new Date(year, month - 1, day - 1, 21, 0, 0);
    }

    if (triggerDate <= now) continue;

    const type = isTogetherSchedule ? 'TOGETHER_SCHEDULE' : 'MY_SCHEDULE';
    const title = isTogetherSchedule ? '함께 일정' : '내 일정';

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: schedule.title,
        sound: true,
        data: { type, id: schedule.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  }
}
