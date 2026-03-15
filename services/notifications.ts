import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import type { FixedExpense, Notification } from '@/types/database';
import { resolveFixedExpenseDate } from '@/utils/fixed-expense-date';

function isExpoPushToken(token: string): boolean {
  return (
    token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')
  );
}

async function getExpoPushToken(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

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
    .update({ expo_push_token: token })
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
  await Notifications.cancelAllScheduledNotificationsAsync();

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
