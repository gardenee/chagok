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
import DateTimePicker from '@react-native-community/datetimepicker';
import { Plus, Heart, Cake } from 'lucide-react-native';
import { DeleteButton } from '@/components/ui/delete-button';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { SettingsCard, Divider } from '@/components/settings/settings-card';
import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsSubHeader } from '@/components/settings/settings-sub-header';
import { SettingsSectionLabel } from '@/components/settings/settings-section-label';
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

// YYYY-MM-DD 또는 레거시 MM-DD 모두 파싱
function parseDateStr(dateStr: string): Date {
  if (dateStr.length === 5) {
    const [mm, dd] = dateStr.split('-').map(Number);
    return new Date(new Date().getFullYear(), mm - 1, dd);
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateStr(dateStr: string): string {
  const date = parseDateStr(dateStr);
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if (dateStr.length === 5) return `${m}월 ${d}일`;
  return `${y}년 ${m}월 ${d}일`;
}

export default function AnniversarySettingsScreen() {
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
      date: existing ? parseDateStr(existing.date) : new Date(),
    });
  }

  async function handleBirthdaySave() {
    const { type, date } = birthdayPicker;
    const mmDd = toIsoDate(date);
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
      date: parseDateStr(item.date),
    });
  }

  async function handleAnniversarySave() {
    const { editingId, name, date } = anniversaryModal;
    if (!name.trim()) {
      Alert.alert('알림', '기념일 이름을 입력해주세요');
      return;
    }
    const mmDd = toIsoDate(date);
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
      <SettingsSubHeader
        title='기념일 설정'
        rightElement={
          <TouchableOpacity
            onPress={openAddModal}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Plus size={22} color={Colors.brownDarker} strokeWidth={2.5} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <SettingsSectionLabel label='생일' className='mt-1' />
        <SettingsCard>
          <SettingsRow
            icon={
              <Cake size={16} color={Colors.neutralDarker} strokeWidth={2} />
            }
            label={`${myNickname} 생일`}
            value={myBirthday ? formatDateStr(myBirthday.date) : '미설정'}
            onPress={() => openBirthdayPicker('birthday_me', myBirthday)}
          />
          <Divider />
          <SettingsRow
            icon={
              <Cake size={16} color={Colors.neutralDarker} strokeWidth={2} />
            }
            label={`${partnerNickname} 생일`}
            value={
              partnerBirthday ? formatDateStr(partnerBirthday.date) : '미설정'
            }
            onPress={() => {
              if (!partner) {
                Alert.alert('연동 전', '짝꿍이 아직 연동 전이에요');
                return;
              }
              openBirthdayPicker('birthday_partner', partnerBirthday);
            }}
          />
        </SettingsCard>

        {/* 기념일 섹션 */}
        {customAnniversaries.length > 0 && (
          <>
            <SettingsSectionLabel label='기념일' className='mt-3' />
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
                    value={formatDateStr(item.date)}
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
