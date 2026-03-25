import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
} from 'react-native';
import { Clock, X, CalendarDays } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { SaveButton } from '@/components/ui/save-button';
import { DeleteButton } from '@/components/ui/delete-button';
import { ModalTextInput } from '@/components/ui/modal-inputs';
import { FormLabel } from '@/components/ui/form-label';
import { TagSelector } from '@/components/ui/tag-selector';
import { DatePickerButton } from '@/components/ui/date-picker-button';
import { DatePickerModal } from '@/components/ui/date-picker-modal';
import type { ScheduleModalState, TagOption } from './types';

interface ScheduleFormSheetProps {
  scheduleModal: ScheduleModalState;
  onClose: () => void;
  onFormChange: (form: ScheduleModalState['form']) => void;
  onSave: () => void;
  onDelete: ((id: string) => void) | undefined;
  tagOptions: TagOption[];
  isSaving: boolean;
}

type DatePickerTarget = 'start' | 'end';

export function ScheduleFormSheet({
  scheduleModal,
  onClose,
  onFormChange,
  onSave,
  onDelete,
  tagOptions,
  isSaving,
}: ScheduleFormSheetProps) {
  const { form } = scheduleModal;
  const [titleError, setTitleError] = useState(false);
  const [tagError, setTagError] = useState(false);
  const [datePickerTarget, setDatePickerTarget] =
    useState<DatePickerTarget | null>(null);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  useEffect(() => {
    if (!scheduleModal.visible) {
      setTitleError(false);
      setTagError(false);
    }
  }, [scheduleModal.visible]);

  function handleSavePress() {
    const titleEmpty = !form.title.trim();
    const tagEmpty = !form.tag;
    if (titleEmpty) setTitleError(true);
    if (tagEmpty) setTagError(true);
    if (titleEmpty || tagEmpty) return;
    onSave();
  }

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className='flex-1'
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          keyboardShouldPersistTaps='handled'
        >
          {/* 헤더 */}
          <View className='flex-row items-center justify-between pt-5 mb-6'>
            <View style={{ width: 22 }} />
            <Text className='font-ibm-bold text-xl text-neutral-800'>
              {scheduleModal.editingId ? '일정 수정' : '일정 추가'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={22} color={Colors.neutralLight} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* 제목 */}
          <FormLabel required>제목</FormLabel>
          <ModalTextInput
            value={form.title}
            onChangeText={v => {
              onFormChange({ ...form, title: v });
              if (titleError) setTitleError(false);
            }}
            placeholder='일정 제목'
            maxLength={30}
            autoFocus
            className='mb-6'
            error={titleError}
          />

          {/* 날짜 */}
          <FormLabel>날짜</FormLabel>
          <DatePickerButton
            dateStr={form.date}
            onPress={() => setDatePickerTarget('start')}
            className='mb-2'
          />

          {/* 종료일 */}
          {form.end_date === null ? (
            <TouchableOpacity
              onPress={() => {
                onFormChange({ ...form, end_date: form.date });
                setDatePickerTarget('end');
              }}
              className='bg-neutral-100 rounded-2xl px-5 flex-row items-center h-[48px] mb-6'
              activeOpacity={0.7}
            >
              <CalendarDays
                size={16}
                color={Colors.neutralDark}
                strokeWidth={2}
              />
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  alignItems: 'center',
                }}
                pointerEvents='none'
              >
                <Text className='font-ibm-regular text-base text-neutral-600'>
                  종료일 없음
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View className='flex-row items-center bg-neutral-100 rounded-2xl px-5 h-[48px] mb-6'>
              <CalendarDays
                size={16}
                color={Colors.neutralDark}
                strokeWidth={2}
              />
              <TouchableOpacity
                onPress={() => setDatePickerTarget('end')}
                className='flex-1 items-center'
                activeOpacity={0.7}
              >
                {(() => {
                  const [y, m, d] = form.end_date!.split('-').map(Number);
                  return (
                    <Text className='font-ibm-regular text-base text-neutral-800'>
                      {y}년 {m}월 {d}일
                    </Text>
                  );
                })()}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onFormChange({ ...form, end_date: null })}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <X size={18} color={Colors.neutralLight} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          )}

          {/* 참여자 */}
          <View className='mb-5'>
            <FormLabel required>참여자</FormLabel>
            <TagSelector
              options={tagOptions}
              value={form.tag}
              onChange={tag => onFormChange({ ...form, tag })}
              error={tagError && !form.tag}
              errorMessage='참여자를 선택해주세요'
            />
          </View>

          {/* 시간 (하루 일정에서만) */}
          {!form.end_date && (
            <View className='mb-8'>
              <FormLabel>시작 시간</FormLabel>
              {form.time === null ? (
                <TouchableOpacity
                  onPress={() => setTimePickerVisible(true)}
                  className='bg-neutral-100 rounded-2xl px-4 flex-row items-center h-[48px]'
                  activeOpacity={0.7}
                >
                  <Clock size={16} color={Colors.neutralDark} strokeWidth={2} />
                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      alignItems: 'center',
                    }}
                    pointerEvents='none'
                  >
                    <Text className='font-ibm-regular text-base text-neutral-600'>
                      시작 시간 없음
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => setTimePickerVisible(true)}
                  className='bg-neutral-100 rounded-2xl px-4 flex-row items-center h-[48px]'
                  activeOpacity={0.7}
                >
                  <Clock size={16} color={Colors.neutralDark} strokeWidth={2} />
                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      alignItems: 'center',
                    }}
                    pointerEvents='none'
                  >
                    <Text className='font-ibm-regular text-base text-neutral-800'>
                      {form.time}
                    </Text>
                  </View>
                  <View className='flex-1' />
                  <TouchableOpacity
                    onPress={() => onFormChange({ ...form, time: null })}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                  >
                    <X size={18} color={Colors.neutralLight} strokeWidth={2} />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>

        {/* 하단 버튼 */}
        <View className='px-6 pb-6 pt-3 gap-3'>
          {scheduleModal.editingId && onDelete && (
            <DeleteButton
              onPress={() => onDelete(scheduleModal.editingId!)}
              label='일정 삭제'
            />
          )}
          <SaveButton
            onPress={handleSavePress}
            isSaving={isSaving}
            label={scheduleModal.editingId ? '수정 완료' : '저장'}
          />
        </View>
      </KeyboardAvoidingView>

      <DatePickerModal
        visible={timePickerVisible}
        mode='time'
        timeStr={form.time ?? undefined}
        onConfirm={timeStr => {
          onFormChange({ ...form, time: timeStr });
          setTimePickerVisible(false);
        }}
        onDismiss={() => setTimePickerVisible(false)}
      />

      <DatePickerModal
        visible={datePickerTarget !== null}
        mode='date'
        dateStr={
          datePickerTarget === 'end' ? (form.end_date ?? form.date) : form.date
        }
        onConfirm={dateStr => {
          if (datePickerTarget === 'end') {
            const resolvedEnd = dateStr < form.date ? form.date : dateStr;
            onFormChange({ ...form, end_date: resolvedEnd });
          } else {
            const endDate = form.end_date;
            const resolvedEnd =
              endDate !== null && endDate < dateStr ? dateStr : endDate;
            onFormChange({ ...form, date: dateStr, end_date: resolvedEnd });
          }
          setDatePickerTarget(null);
        }}
        onDismiss={() => setDatePickerTarget(null)}
      />
    </SafeAreaView>
  );
}
