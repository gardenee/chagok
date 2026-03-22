import { View, Switch, SafeAreaView, ScrollView } from 'react-native';
import { Bell } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { SettingsCard, Divider } from '@/components/settings/settings-card';
import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsSubHeader } from '@/components/settings/settings-sub-header';
import { SettingsSectionLabel } from '@/components/settings/settings-section-label';
import { useNotificationSettingsStore } from '@/store/notification-settings';

type ToggleItem = {
  label: string;
  value: boolean;
  setter: (v: boolean) => void;
};

export default function NotificationSettingsScreen() {
  const {
    partnerTransaction,
    comment,
    fixedExpenseReminder,
    budgetExceeded,
    mySchedule,
    togetherSchedule,
    anniversaryReminder,
    setPartnerTransaction,
    setComment,
    setFixedExpenseReminder,
    setBudgetExceeded,
    setMySchedule,
    setTogetherSchedule,
    setAnniversaryReminder,
  } = useNotificationSettingsStore();

  const sections: { title: string; items: ToggleItem[] }[] = [
    {
      title: '파트너',
      items: [
        {
          label: '짝꿍 지출 알림',
          value: partnerTransaction,
          setter: setPartnerTransaction,
        },
        { label: '댓글 알림', value: comment, setter: setComment },
      ],
    },
    {
      title: '예산',
      items: [
        {
          label: '예산 초과 알림',
          value: budgetExceeded,
          setter: setBudgetExceeded,
        },
        {
          label: '고정지출 리마인더',
          value: fixedExpenseReminder,
          setter: setFixedExpenseReminder,
        },
      ],
    },
    {
      title: '일정',
      items: [
        { label: '내 일정 알림', value: mySchedule, setter: setMySchedule },
        {
          label: '함께 일정 알림',
          value: togetherSchedule,
          setter: setTogetherSchedule,
        },
      ],
    },
    {
      title: '기념일',
      items: [
        {
          label: '기념일 알림',
          value: anniversaryReminder,
          setter: setAnniversaryReminder,
        },
      ],
    },
  ];

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <SettingsSubHeader title='알림 설정' />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {sections.map((section, sIdx) => (
          <View key={section.title}>
            <SettingsSectionLabel
              label={section.title}
              className={sIdx === 0 ? 'mt-1' : 'mt-3'}
            />
            <SettingsCard>
              {section.items.map((item, i) => (
                <View key={item.label}>
                  {i > 0 && <Divider />}
                  <SettingsRow
                    icon={
                      <Bell
                        size={16}
                        color={
                          item.value
                            ? Colors.neutralDarker
                            : Colors.neutralLighter
                        }
                        strokeWidth={2}
                      />
                    }
                    label={item.label}
                    showChevron={false}
                    rightElement={
                      <Switch
                        value={item.value}
                        onValueChange={v => {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light,
                          );
                          item.setter(v);
                        }}
                        trackColor={{ false: '#E5E5E5', true: Colors.butter }}
                        thumbColor='#fff'
                      />
                    }
                  />
                </View>
              ))}
            </SettingsCard>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
