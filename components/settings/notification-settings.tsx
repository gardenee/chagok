import { View, Text, Switch } from 'react-native';
import { Bell } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { SettingsCard, Divider } from '@/components/settings/settings-card';
import { useNotificationSettingsStore } from '@/store/notification-settings';

export function NotificationSettings() {
  const {
    partnerTransaction,
    comment,
    fixedExpenseReminder,
    setPartnerTransaction,
    setComment,
    setFixedExpenseReminder,
  } = useNotificationSettingsStore();

  return (
    <SettingsCard>
      {[
        {
          label: '짝꿍 지출 알림',
          value: partnerTransaction,
          onToggle: (v: boolean) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPartnerTransaction(v);
          },
        },
        {
          label: '댓글 알림',
          value: comment,
          onToggle: (v: boolean) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setComment(v);
          },
        },
        {
          label: '고정지출 리마인더',
          value: fixedExpenseReminder,
          onToggle: (v: boolean) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setFixedExpenseReminder(v);
          },
        },
      ].map((item, i) => (
        <View key={item.label}>
          {i > 0 && <Divider />}
          <View className='flex-row items-center px-4 py-4 bg-cream'>
            <View className='w-8 h-8 rounded-xl bg-cream-dark/70 items-center justify-center mr-3'>
              <Bell
                size={16}
                color={
                  item.value ? Colors.neutralDarker : Colors.neutralLighter
                }
                strokeWidth={2}
              />
            </View>
            <Text className='flex-1 font-ibm-semibold text-base text-neutral-800'>
              {item.label}
            </Text>
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: '#E5E5E5', true: Colors.butter }}
              thumbColor='#fff'
            />
          </View>
        </View>
      ))}
    </SettingsCard>
  );
}
