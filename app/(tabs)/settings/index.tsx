import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Share,
} from 'react-native';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import {
  BookOpen,
  Hash,
  User,
  Bell,
  Users,
  Link,
  Heart,
  MessageSquarePlus,
  Info,
  CalendarDays,
  UserCog,
} from 'lucide-react-native';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth';
import { useCalendarStore } from '@/store/calendar';
import { useCouple, useUpdateBookName } from '@/hooks/use-couple';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useUpdateNickname } from '@/hooks/use-user';
import {
  useUnreadCount,
  useNotificationsSubscription,
} from '@/hooks/use-notifications';
import { useAnniversaries } from '@/hooks/use-anniversaries';
import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsCard, Divider } from '@/components/settings/settings-card';
import { EditModal } from '@/components/settings/edit-modal';
import { NotificationInbox } from '@/components/settings/notification-inbox';
import { FeedbackModal } from '@/components/settings/feedback-modal';
import { OptionsSheet } from '@/components/ui/options-sheet';

export default function SettingsScreen() {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const router = useRouter();

  const { userProfile } = useAuthStore();
  const { weekStartsOnMonday, setWeekStartsOnMonday } = useCalendarStore();
  const { data: couple, isLoading: coupleLoading } = useCouple();
  const { data: members = [] } = useCoupleMembers();
  const updateBookName = useUpdateBookName();
  const updateNickname = useUpdateNickname();
  const [editModal, setEditModal] = useState<{
    type: 'bookName' | 'nickname' | null;
  }>({ type: null });
  const [notifInboxVisible, setNotifInboxVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [weekdaySheetVisible, setWeekdaySheetVisible] = useState(false);
  const { unreadCount } = useUnreadCount();
  useNotificationsSubscription();
  useAnniversaries(); // prefetch for anniversary-settings
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const partner = members.find(m => m.id !== userProfile?.id);
  const isLinked = !!partner;

  function openEdit(type: 'bookName' | 'nickname') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditModal({ type });
  }

  function closeEdit() {
    setEditModal({ type: null });
  }

  async function handleSaveBookName(value: string) {
    if (!value) return;
    try {
      await updateBookName.mutateAsync(value);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeEdit();
    } catch {
      Alert.alert('오류', '가계부 이름 변경 중 문제가 발생했어요');
    }
  }

  async function handleSaveNickname(value: string) {
    if (!value) return;
    try {
      await updateNickname.mutateAsync(value);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeEdit();
    } catch {
      Alert.alert('오류', '닉네임 변경 중 문제가 발생했어요');
    }
  }

  async function handleShareInviteCode() {
    if (!couple?.invite_code) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `차곡 초대코드: ${couple.invite_code}\n앱에서 입력해서 함께 시작해요!`,
      });
    } catch {
      Alert.alert('오류', '공유하기 중 문제가 발생했어요');
    }
  }

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <View className='px-6 pt-6 pb-4 flex-row items-center justify-between'>
          <Text className='font-ibm-bold text-3xl text-brown-darker'>설정</Text>
          <TouchableOpacity
            onPress={() => setNotifInboxVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View className='relative'>
              <Bell size={22} color={Colors.brownDarker} strokeWidth={2} />
              {unreadCount > 0 && (
                <View className='absolute -top-1 -right-1 w-4 h-4 rounded-full bg-peach items-center justify-center'>
                  <Text className='font-ibm-bold text-[9px] text-brown'>
                    {unreadCount <= 9 ? String(unreadCount) : '9+'}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <Text className='font-ibm-semibold text-base text-neutral-600 px-6 mt-1 mb-1'>
          내 정보
        </Text>
        <SettingsCard>
          <SettingsRow
            icon={
              <User size={16} color={Colors.neutralDarker} strokeWidth={2} />
            }
            label='닉네임'
            value={userProfile?.nickname ?? '-'}
            onPress={() => openEdit('nickname')}
          />
        </SettingsCard>

        <View className='mt-5'>
          <Text className='font-ibm-semibold text-base text-neutral-600 px-6 mb-1'>
            가계부 정보
          </Text>
          <SettingsCard>
            <SettingsRow
              icon={
                <BookOpen
                  size={16}
                  color={Colors.brownDarker}
                  strokeWidth={2}
                />
              }
              label='가계부 이름'
              value={coupleLoading ? '...' : (couple?.book_name ?? '-')}
              onPress={() => openEdit('bookName')}
            />
            <Divider />
            {isLinked ? (
              <>
                <SettingsRow
                  icon={
                    <Users
                      size={16}
                      color={Colors.neutralDarker}
                      strokeWidth={2}
                    />
                  }
                  label='짝꿍'
                  value={partner?.nickname ?? '-'}
                  showChevron={false}
                />
                <Divider />
                <SettingsRow
                  icon={
                    <Hash
                      size={16}
                      color={Colors.neutralDarker}
                      strokeWidth={2}
                    />
                  }
                  label='초대코드'
                  value=''
                  showChevron={false}
                  rightElement={
                    <View className='flex-row items-center gap-1 bg-butter rounded-full px-2.5 py-1'>
                      <Link size={11} color={Colors.brown} strokeWidth={2.5} />
                      <Text className='font-ibm-semibold text-sm text-brown-dark'>
                        연동 완료
                      </Text>
                    </View>
                  }
                />
              </>
            ) : (
              <>
                <SettingsRow
                  icon={
                    <Hash
                      size={16}
                      color={Colors.neutralDarker}
                      strokeWidth={2}
                    />
                  }
                  label='초대코드'
                  value={coupleLoading ? '...' : (couple?.invite_code ?? '-')}
                  onPress={handleShareInviteCode}
                />
                <Divider />
                <SettingsRow
                  icon={
                    <Users
                      size={16}
                      color={Colors.neutralDarker}
                      strokeWidth={2}
                    />
                  }
                  label='짝꿍'
                  value='아직 연동 전'
                  showChevron={false}
                />
              </>
            )}
          </SettingsCard>
        </View>

        <View className='mt-5'>
          <Text className='font-ibm-semibold text-base text-neutral-600 px-6 mb-1'>
            앱 설정
          </Text>
          <SettingsCard>
            <SettingsRow
              icon={
                <CalendarDays
                  size={16}
                  color={Colors.neutralDarker}
                  strokeWidth={2}
                />
              }
              label='캘린더 시작 요일'
              value={weekStartsOnMonday ? '월요일' : '일요일'}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setWeekdaySheetVisible(true);
              }}
            />
            <Divider />
            <SettingsRow
              icon={
                <Heart size={16} color={Colors.neutralDarker} strokeWidth={2} />
              }
              label='기념일 설정'
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/settings/anniversary-settings');
              }}
            />
            <Divider />
            <SettingsRow
              icon={
                <Bell size={16} color={Colors.neutralDarker} strokeWidth={2} />
              }
              label='알림 설정'
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/settings/notification-settings');
              }}
            />
            <Divider />
            <SettingsRow
              icon={
                <UserCog
                  size={16}
                  color={Colors.neutralDarker}
                  strokeWidth={2}
                />
              }
              label='계정 관리'
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/settings/account');
              }}
            />
          </SettingsCard>
        </View>

        <View className='mt-5'>
          <Text className='font-ibm-semibold text-base text-neutral-600 px-6 mb-1'>
            앱 정보
          </Text>
          <SettingsCard>
            <SettingsRow
              icon={
                <MessageSquarePlus
                  size={16}
                  color={Colors.neutralDarker}
                  strokeWidth={2}
                />
              }
              label='개발자에게 전하기'
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFeedbackVisible(true);
              }}
            />
            <Divider />
            <SettingsRow
              icon={
                <Info size={16} color={Colors.neutralDarker} strokeWidth={2} />
              }
              label='버전'
              value={appVersion}
              showChevron={false}
            />
          </SettingsCard>
        </View>
      </ScrollView>

      <NotificationInbox
        visible={notifInboxVisible}
        onClose={() => setNotifInboxVisible(false)}
      />

      <FeedbackModal
        visible={feedbackVisible}
        onClose={() => setFeedbackVisible(false)}
      />

      <OptionsSheet
        visible={weekdaySheetVisible}
        onClose={() => setWeekdaySheetVisible(false)}
        title='캘린더 시작 요일'
        options={[
          { label: '일요일', value: 'sunday' },
          { label: '월요일', value: 'monday' },
        ]}
        selectedValue={weekStartsOnMonday ? 'monday' : 'sunday'}
        onSelect={value => setWeekStartsOnMonday(value === 'monday')}
      />

      <EditModal
        visible={editModal.type === 'nickname'}
        title='닉네임 변경'
        value={userProfile?.nickname ?? ''}
        placeholder='닉네임 입력'
        onClose={closeEdit}
        onSave={handleSaveNickname}
        isSaving={updateNickname.isPending}
      />

      <EditModal
        visible={editModal.type === 'bookName'}
        title='가계부 이름 변경'
        value={couple?.book_name ?? ''}
        placeholder='가계부 이름 입력'
        onClose={closeEdit}
        onSave={handleSaveBookName}
        isSaving={updateBookName.isPending}
      />
    </SafeAreaView>
  );
}
