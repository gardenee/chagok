import { Alert } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCalendarStore } from '@/store/calendar';
import { useAuthStore } from '@/store/auth';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import {
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
} from '@/hooks/use-schedules';
import { ScheduleFormSheet } from '@/components/calendar/schedule-form-sheet';
import type { ScheduleFormData } from '@/components/calendar/types';

export default function ScheduleFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    date: string;
    editingId?: string;
    title?: string;
    tag?: string;
    time?: string;
    end_date?: string;
  }>();

  const { session, userProfile } = useAuthStore();
  const myId = session?.user.id ?? '';
  const { data: members = [] } = useCoupleMembers();
  const partner = members.find(m => m.id !== myId);
  const myNickname = userProfile?.nickname ?? '나';
  const partnerNickname = partner?.nickname ?? '파트너';

  const tagOptions = [
    { value: 'me' as const, label: myNickname },
    { value: 'partner' as const, label: partnerNickname },
    { value: 'together' as const, label: '함께' },
  ];

  const initialForm: ScheduleFormData = {
    title: params.title ?? '',
    tag: (params.tag as ScheduleFormData['tag']) ?? null,
    date: params.date ?? '',
    end_date:
      params.end_date && params.end_date !== 'none' ? params.end_date : null,
    time: params.time && params.time !== 'none' ? params.time : null,
  };

  const [form, setForm] = useState<ScheduleFormData>(initialForm);

  const setPendingReturnDate = useCalendarStore(s => s.setPendingReturnDate);

  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();
  const isSaving = createSchedule.isPending || updateSchedule.isPending;

  async function handleSave() {
    if (params.editingId) {
      const noChange =
        form.title.trim() === initialForm.title.trim() &&
        form.tag === initialForm.tag &&
        form.date === initialForm.date &&
        form.end_date === initialForm.end_date &&
        form.time === initialForm.time;
      if (noChange) {
        router.back();
        return;
      }
    }

    const payload = {
      title: form.title.trim(),
      tag: form.tag ?? ('me' as const),
      date: form.date,
      end_date: form.end_date ?? null,
      start_time: form.time ?? null,
    };
    try {
      if (params.editingId)
        await updateSchedule.mutateAsync({ id: params.editingId, ...payload });
      else await createSchedule.mutateAsync(payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPendingReturnDate(form.date);
      router.back();
    } catch {
      Alert.alert('오류', '저장 중 문제가 발생했어요');
    }
  }

  function handleDelete(id: string) {
    Alert.alert('일정 삭제', '이 일정을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSchedule.mutateAsync(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          } catch {
            Alert.alert('오류', '삭제 중 문제가 발생했어요');
          }
        },
      },
    ]);
  }

  return (
    <ScheduleFormSheet
      scheduleModal={{
        visible: true,
        editingId: params.editingId ?? null,
        form,
      }}
      onClose={() => router.back()}
      onFormChange={setForm}
      onSave={handleSave}
      onDelete={params.editingId ? handleDelete : undefined}
      tagOptions={tagOptions}
      isSaving={isSaving}
    />
  );
}
