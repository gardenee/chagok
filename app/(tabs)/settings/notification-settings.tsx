import {
  View,
  Switch,
  SafeAreaView,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { Bell } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { SettingsCard, Divider } from '@/components/settings/settings-card';
import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsSubHeader } from '@/components/settings/settings-sub-header';
import { SettingsSectionLabel } from '@/components/settings/settings-section-label';
import { useNotificationSettingsStore } from '@/store/notification-settings';
import { useAuthStore } from '@/store/auth';
import {
  registerMyPushToken,
  clearMyPushToken,
  checkPermissionStatus,
  requestPermission,
} from '@/services/notifications';

type ToggleItem = {
  label: string;
  value: boolean;
  setter: (v: boolean) => void;
};

export default function NotificationSettingsScreen() {
  const { userProfile } = useAuthStore();
  const {
    notificationEnabled,
    setNotificationEnabled,
    setHasShownPermissionModal,
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

  async function handleMasterToggle(value: boolean) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!value) {
      // 알림 끄기
      setNotificationEnabled(false);
      if (userProfile?.id) {
        clearMyPushToken(userProfile.id).catch(e =>
          console.warn('푸시 토큰 삭제 실패:', e),
        );
      }
      return;
    }

    // 알림 켜기 → iOS 권한 확인
    const status = await checkPermissionStatus();

    if (status === 'granted') {
      setNotificationEnabled(true);
      setHasShownPermissionModal(true);
      if (userProfile?.id) {
        registerMyPushToken(userProfile.id).catch(e =>
          console.warn('푸시 토큰 등록 실패:', e),
        );
      }
    } else if (status === 'undetermined') {
      const result = await requestPermission();
      if (result === 'granted') {
        setNotificationEnabled(true);
        setHasShownPermissionModal(true);
        if (userProfile?.id) {
          registerMyPushToken(userProfile.id).catch(e =>
            console.warn('푸시 토큰 등록 실패:', e),
          );
        }
      }
      // denied인 경우 토글 변경 없이 종료
    } else {
      // iOS 설정에서 이미 거부된 상태 → 설정으로 안내
      Alert.alert(
        '알림 권한이 필요해요',
        'iOS 설정에서 차곡의 알림을 허용해 주세요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '설정 열기', onPress: () => Linking.openSettings() },
        ],
      );
    }
  }

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
        <SettingsSectionLabel label='전체' className='mt-1' />
        <SettingsCard>
          <SettingsRow
            icon={
              <Bell
                size={16}
                color={
                  notificationEnabled
                    ? Colors.neutralDarker
                    : Colors.neutralLighter
                }
                strokeWidth={2}
              />
            }
            label='알림 받기'
            showChevron={false}
            rightElement={
              <Switch
                value={notificationEnabled}
                onValueChange={handleMasterToggle}
                trackColor={{ false: '#E5E5E5', true: Colors.butter }}
                thumbColor='#fff'
              />
            }
          />
        </SettingsCard>

        {sections.map((section, sIdx) => (
          <View
            key={section.title}
            style={{ opacity: notificationEnabled ? 1 : 0.4 }}
          >
            <SettingsSectionLabel label={section.title} className='mt-3' />
            <SettingsCard>
              {section.items.map((item, i) => (
                <View key={item.label}>
                  {i > 0 && <Divider />}
                  <SettingsRow
                    icon={
                      <Bell
                        size={16}
                        color={
                          item.value && notificationEnabled
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
                        disabled={!notificationEnabled}
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
