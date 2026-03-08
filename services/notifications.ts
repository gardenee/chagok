import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';

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
  const { data, error } = await supabase
    .from('users')
    .select('expo_push_token')
    .eq('couple_id', coupleId)
    .neq('id', joinerId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  const partnerToken = data?.expo_push_token;
  if (!partnerToken || !isExpoPushToken(partnerToken)) return;

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: partnerToken,
      title: '짝꿍 연동 완료',
      body: `${joinerNickname}님이 가계부에 합류했어요.`,
      sound: 'default',
      data: { type: 'COUPLE_JOINED' },
    }),
  });
}
