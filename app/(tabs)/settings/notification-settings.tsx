import {
  View,
  Text,
  ScrollView,
  Switch,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bell } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { SettingsCard, Divider } from '@/components/settings/settings-card';
import { SettingsRow } from '@/components/settings/settings-row';
import { useNotificationSettingsStore } from '@/store/notification-settings';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const {
    partnerTransaction,
    comment,
    fixedExpenseReminder,
    budgetExceeded,
    mySchedule,
    togetherSchedule,
    setPartnerTransaction,
    setComment,
    setFixedExpenseReminder,
    setBudgetExceeded,
    setMySchedule,
    setTogetherSchedule,
  } = useNotificationSettingsStore();

  function makeToggle(value: boolean, setter: (v: boolean) => void) {
    return (
      <Switch
        value={value}
        onValueChange={v => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setter(v);
        }}
        trackColor={{ false: '#E5E5E5', true: Colors.butter }}
        thumbColor='#fff'
      />
    );
  }

  const bellIcon = (active: boolean) => (
    <Bell
      size={16}
      color={active ? Colors.neutralDarker : Colors.neutralLighter}
      strokeWidth={2}
    />
  );

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <View className='px-6 pt-6 pb-4 flex-row items-center'>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className='-ml-1 mr-1'
        >
          <ChevronLeft size={28} color={Colors.brownDarker} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text className='font-ibm-bold text-2xl text-brown-darker'>
          알림 설정
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <Text className='font-ibm-semibold text-base text-neutral-600 px-6 mt-1 mb-1'>
          파트너
        </Text>
        <SettingsCard>
          <SettingsRow
            icon={bellIcon(partnerTransaction)}
            label='짝꿍 지출 알림'
            showChevron={false}
            rightElement={makeToggle(partnerTransaction, setPartnerTransaction)}
          />
          <Divider />
          <SettingsRow
            icon={bellIcon(comment)}
            label='댓글 알림'
            showChevron={false}
            rightElement={makeToggle(comment, setComment)}
          />
        </SettingsCard>

        <Text className='font-ibm-semibold text-base text-neutral-600 px-6 mt-3 mb-1'>
          예산
        </Text>
        <SettingsCard>
          <SettingsRow
            icon={bellIcon(budgetExceeded)}
            label='예산 초과 알림'
            showChevron={false}
            rightElement={makeToggle(budgetExceeded, setBudgetExceeded)}
          />
          <Divider />
          <SettingsRow
            icon={bellIcon(fixedExpenseReminder)}
            label='고정지출 리마인더'
            showChevron={false}
            rightElement={makeToggle(
              fixedExpenseReminder,
              setFixedExpenseReminder,
            )}
          />
        </SettingsCard>

        <Text className='font-ibm-semibold text-base text-neutral-600 px-6 mt-3 mb-1'>
          일정
        </Text>
        <SettingsCard>
          <SettingsRow
            icon={bellIcon(mySchedule)}
            label='내 일정 알림'
            showChevron={false}
            rightElement={makeToggle(mySchedule, setMySchedule)}
          />
          <Divider />
          <SettingsRow
            icon={bellIcon(togetherSchedule)}
            label='함께 일정 알림'
            showChevron={false}
            rightElement={makeToggle(togetherSchedule, setTogetherSchedule)}
          />
        </SettingsCard>
      </ScrollView>
    </SafeAreaView>
  );
}
