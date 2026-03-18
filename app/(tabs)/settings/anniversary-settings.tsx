import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronLeft, Plus, Heart, Cake } from 'lucide-react-native';
import { DeleteButton } from '@/components/ui/delete-button';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { SettingsCard, Divider } from '@/components/settings/settings-card';
import { SettingsRow } from '@/components/settings/settings-row';
import { useAuthStore } from '@/store/auth';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import {
  useAnniversaries,
  useUpsertBirthday,
  useCreateAnniversary,
  useUpdateAnniversary,
  useDeleteAnniversary,
} from '@/hooks/use-anniversaries';
import type { Anniversary } from '@/types/database';

type BirthdayPickerState = {
  visible: boolean;
  type: 'birthday_me' | 'birthday_partner';
  date: Date;
};

type AnniversaryModalState = {
  visible: boolean;
  editingId: string | null;
  name: string;
  date: Date;
};

function mmDdToDate(mmDd: string): Date {
  const [mm, dd] = mmDd.split('-').map(Number);
  // year irrelevant for display, use current year
  return new Date(new Date().getFullYear(), mm - 1, dd);
}

function dateToMmDd(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}-${d}`;
}

function formatMmDd(mmDd: string): string {
  const [mm, dd] = mmDd.split('-').map(Number);
  return `${mm}월 ${dd}일`;
}

export default function AnniversarySettingsScreen() {
  const router = useRouter();
  const { userProfile, session } = useAuthStore();
  const myId = session?.user.id ?? '';
  const { data: members = [] } = useCoupleMembers();
  const partner = members.find(m => m.id !== myId);
  const myNickname = userProfile?.nickname ?? '나';
  const partnerNickname = partner?.nickname ?? '짝꿍';

  const { data: anniversaries = [] } = useAnniversaries();
  const upsertBirthday = useUpsertBirthday();
  const createAnniversary = useCreateAnniversary();
  const updateAnniversary = useUpdateAnniversary();
  const deleteAnniversary = useDeleteAnniversary();

  const myBirthday = anniversaries.find(a => a.type === 'birthday_me');
  const partnerBirthday = anniversaries.find(
    a => a.type === 'birthday_partner',
  );
  const customAnniversaries = anniversaries.filter(
    a => a.type === 'anniversary',
  );

  const [birthdayPicker, setBirthdayPicker] = useState<BirthdayPickerState>({
    visible: false,
    type: 'birthday_me',
    date: new Date(),
  });

  const [anniversaryModal, setAnniversaryModal] =
    useState<AnniversaryModalState>({
      visible: false,
      editingId: null,
      name: '',
      date: new Date(),
    });

  function openBirthdayPicker(
    type: 'birthday_me' | 'birthday_partner',
    existing?: Anniversary,
  ) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBirthdayPicker({
      visible: true,
      type,
      date: existing ? mmDdToDate(existing.date) : new Date(),
    });
  }

  async function handleBirthdaySave() {
    const { type, date } = birthdayPicker;
    const mmDd = dateToMmDd(date);
    const name =
      type === 'birthday_me' ? `${myNickname} 생일` : `${partnerNickname} 생일`;
    try {
      await upsertBirthday.mutateAsync({ type, name, date: mmDd });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setBirthdayPicker(s => ({ ...s, visible: false }));
    } catch {
      Alert.alert('오류', '저장 중 문제가 발생했어요');
    }
  }

  function openAddModal() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnniversaryModal({
      visible: true,
      editingId: null,
      name: '',
      date: new Date(),
    });
  }

  function openEditModal(item: Anniversary) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnniversaryModal({
      visible: true,
      editingId: item.id,
      name: item.name,
      date: mmDdToDate(item.date),
    });
  }

  async function handleAnniversarySave() {
    const { editingId, name, date } = anniversaryModal;
    if (!name.trim()) {
      Alert.alert('알림', '기념일 이름을 입력해주세요');
      return;
    }
    const mmDd = dateToMmDd(date);
    try {
      if (editingId) {
        await updateAnniversary.mutateAsync({
          id: editingId,
          name: name.trim(),
          date: mmDd,
        });
      } else {
        await createAnniversary.mutateAsync({
          name: name.trim(),
          date: mmDd,
          type: 'anniversary',
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAnniversaryModal(s => ({ ...s, visible: false }));
    } catch {
      Alert.alert('오류', '저장 중 문제가 발생했어요');
    }
  }

  function handleDeleteAnniversary() {
    const { editingId, name } = anniversaryModal;
    if (!editingId) return;
    Alert.alert('기념일 삭제', `"${name}"을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            setAnniversaryModal(s => ({ ...s, visible: false }));
            await deleteAnniversary.mutateAsync(editingId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            Alert.alert('오류', '삭제 중 문제가 발생했어요');
          }
        },
      },
    ]);
  }

  const isSaving =
    createAnniversary.isPending ||
    updateAnniversary.isPending ||
    upsertBirthday.isPending;

  return (
    <SafeAreaView className='flex-1 bg-white'>
      {/* 헤더 */}
      <View className='px-6 pt-6 pb-4 flex-row items-center justify-between'>
        <View className='flex-row items-center'>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className='-ml-1 mr-1'
          >
            <ChevronLeft
              size={28}
              color={Colors.brownDarker}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
          <Text className='font-ibm-bold text-2xl text-brown-darker'>
            기념일 설정
          </Text>
        </View>
        <TouchableOpacity
          onPress={openAddModal}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={22} color={Colors.brownDarker} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* 생일 섹션 */}
        <Text className='font-ibm-semibold text-base text-neutral-600 px-6 mt-1 mb-1'>
          생일
        </Text>
        <SettingsCard>
          <SettingsRow
            icon={
              <Cake size={16} color={Colors.neutralDarker} strokeWidth={2} />
            }
            label={`${myNickname} 생일`}
            value={myBirthday ? formatMmDd(myBirthday.date) : '미설정'}
            onPress={() => openBirthdayPicker('birthday_me', myBirthday)}
          />
          <Divider />
          <SettingsRow
            icon={
              <Cake size={16} color={Colors.neutralDarker} strokeWidth={2} />
            }
            label={`${partnerNickname} 생일`}
            value={
              partnerBirthday ? formatMmDd(partnerBirthday.date) : '미설정'
            }
            onPress={() =>
              openBirthdayPicker('birthday_partner', partnerBirthday)
            }
          />
        </SettingsCard>

        {/* 기념일 섹션 */}
        {customAnniversaries.length > 0 && (
          <>
            <Text className='font-ibm-semibold text-base text-neutral-600 px-6 mt-3 mb-1'>
              기념일
            </Text>
            <SettingsCard>
              {customAnniversaries.map((item, idx) => (
                <View key={item.id}>
                  {idx > 0 && <Divider />}
                  <SettingsRow
                    icon={
                      <Heart
                        size={16}
                        color={Colors.neutralDarker}
                        strokeWidth={2}
                      />
                    }
                    label={item.name}
                    value={formatMmDd(item.date)}
                    onPress={() => openEditModal(item)}
                  />
                </View>
              ))}
            </SettingsCard>
          </>
        )}
      </ScrollView>

      {/* 생일 날짜 선택 */}
      <Modal
        visible={birthdayPicker.visible}
        transparent
        animationType='fade'
        onRequestClose={() =>
          setBirthdayPicker(s => ({ ...s, visible: false }))
        }
      >
        <View
          className='flex-1 justify-end'
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <TouchableOpacity
            className='flex-1'
            activeOpacity={1}
            onPress={() => setBirthdayPicker(s => ({ ...s, visible: false }))}
          />
          <View className='bg-white rounded-t-3xl px-6 pt-5 pb-8'>
            <Text className='font-ibm-bold text-xl text-brown-darker text-center mb-4'>
              {birthdayPicker.type === 'birthday_me'
                ? `${myNickname} 생일`
                : `${partnerNickname} 생일`}{' '}
              설정
            </Text>
            <View className='items-center mb-6'>
              <DateTimePicker
                value={birthdayPicker.date}
                mode='date'
                display='spinner'
                onChange={(_event, date) => {
                  if (!date) return;
                  setBirthdayPicker(s => ({ ...s, date }));
                }}
                locale='ko-KR'
                accentColor={Colors.brownDark}
              />
            </View>
            <TouchableOpacity
              onPress={handleBirthdaySave}
              disabled={isSaving}
              className='bg-butter rounded-2xl py-4 items-center'
              activeOpacity={0.8}
            >
              <Text className='font-ibm-bold text-base text-brown-darker'>
                저장
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 기념일 추가 / 수정 */}
      <Modal
        visible={anniversaryModal.visible}
        transparent
        animationType='fade'
        onRequestClose={() =>
          setAnniversaryModal(s => ({ ...s, visible: false }))
        }
      >
        <View
          className='flex-1 justify-end'
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <TouchableOpacity
            className='flex-1'
            activeOpacity={1}
            onPress={() => setAnniversaryModal(s => ({ ...s, visible: false }))}
          />
          <View className='bg-white rounded-t-3xl px-6 pt-5 pb-8'>
            <Text className='font-ibm-bold text-xl text-brown-darker text-center mb-5'>
              {anniversaryModal.editingId ? '기념일 수정' : '기념일 추가'}
            </Text>

            <Text className='font-ibm-semibold text-base text-neutral-600 mb-2 ml-1'>
              이름
            </Text>
            <View className='bg-neutral-100 rounded-2xl px-4 mb-4 h-14 flex-row items-center'>
              <TextInput
                value={anniversaryModal.name}
                onChangeText={v =>
                  setAnniversaryModal(s => ({ ...s, name: v }))
                }
                placeholder='기념일 이름 (예: 첫 만남)'
                placeholderTextColor={Colors.neutralLighter}
                className='flex-1 font-ibm-regular text-base text-neutral-800'
                maxLength={20}
                autoFocus={!anniversaryModal.editingId}
                returnKeyType='done'
              />
            </View>

            <Text className='font-ibm-semibold text-base text-neutral-600 mb-1 ml-1'>
              날짜
            </Text>
            <View className='items-center mb-5'>
              <DateTimePicker
                value={anniversaryModal.date}
                mode='date'
                display='spinner'
                onChange={(_event, date) => {
                  if (!date) return;
                  setAnniversaryModal(s => ({ ...s, date }));
                }}
                locale='ko-KR'
                accentColor={Colors.brownDark}
              />
            </View>

            {anniversaryModal.editingId && (
              <DeleteButton
                onPress={handleDeleteAnniversary}
                label='기념일 삭제'
              />
            )}

            <TouchableOpacity
              onPress={handleAnniversarySave}
              disabled={isSaving}
              className='bg-butter rounded-2xl py-4 items-center mt-3'
              activeOpacity={0.8}
            >
              <Text className='font-ibm-bold text-base text-brown-darker'>
                {anniversaryModal.editingId ? '수정 완료' : '저장'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
