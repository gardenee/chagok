import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { ChevronUp, ChevronDown, Clock, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { BottomSheet, BottomSheetHeader } from '@/components/ui/bottom-sheet';
import { SaveButton } from '@/components/ui/save-button';
import { ModalTextInput } from '@/components/ui/modal-inputs';
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

  function adjustHour(delta: number) {
    const [hStr, mStr] = (form.time ?? '09:00').split(':');
    const h = (parseInt(hStr) + delta + 24) % 24;
    onFormChange({ ...form, time: `${String(h).padStart(2, '0')}:${mStr}` });
  }

  function adjustMinute(delta: number) {
    const [hStr, mStr] = (form.time ?? '09:00').split(':');
    const m = (parseInt(mStr) + delta + 60) % 60;
    onFormChange({ ...form, time: `${hStr}:${String(m).padStart(2, '0')}` });
  }

  return (
    <BottomSheet visible={scheduleModal.visible} onClose={onClose}>
      <BottomSheetHeader
        title={scheduleModal.editingId ? '일정 수정' : '일정 추가'}
        onClose={onClose}
        onDelete={
          scheduleModal.editingId
            ? () => onDelete?.(scheduleModal.editingId!)
            : undefined
        }
        className='mb-5'
      />

      <View className='mb-2 flex-row items-center ml-1'>
        <Text className='font-ibm-semibold text-xs text-neutral-600'>제목</Text>
        <Text
          className='font-ibm-semibold text-xs ml-0.5'
          style={{ color: Colors.peachDarker }}
        >
          *
        </Text>
      </View>
      <ModalTextInput
        value={form.title}
        onChangeText={v => {
          onFormChange({ ...form, title: v });
          if (titleError) setTitleError(false);
        }}
        placeholder='일정 제목'
        maxLength={30}
        autoFocus
        className='mb-5'
        error={titleError}
      />

      <View className='mb-5'>
        <View className='flex-row items-center mb-2 ml-1'>
          <Text className='font-ibm-semibold text-xs text-neutral-600'>
            참여자
          </Text>
          <Text
            className='font-ibm-semibold text-xs ml-0.5'
            style={{ color: Colors.peachDarker }}
          >
            *
          </Text>
        </View>
        <View className='flex-row gap-2'>
          {tagOptions.map(({ value, label }) => {
            const isSelected = form.tag === value;
            const showError = tagError && !form.tag;
            return (
              <TouchableOpacity
                key={value}
                onPress={() =>
                  onFormChange({ ...form, tag: isSelected ? null : value })
                }
                className={`flex-1 py-2.5 items-center ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                style={{
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: showError ? Colors.peachDarker : 'transparent',
                }}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-ibm-semibold text-sm ${isSelected ? 'text-neutral-800' : 'text-neutral-500'}`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {tagError && !form.tag && (
          <Text
            className='font-ibm-regular text-xs mt-1 ml-1'
            style={{ color: Colors.peachDarker }}
          >
            참여자를 선택해주세요
          </Text>
        )}
      </View>

      <View className='mb-6'>
        {form.time === null ? (
          <TouchableOpacity
            onPress={() => onFormChange({ ...form, time: '09:00' })}
            className='bg-neutral-100 rounded-2xl py-3 flex-row items-center justify-center gap-2'
            activeOpacity={0.7}
          >
            <Clock size={14} color='#a3a3a3' strokeWidth={2} />
            <Text className='font-ibm-regular text-sm text-neutral-400'>
              시작 시간 없음
            </Text>
          </TouchableOpacity>
        ) : (
          <View className='bg-neutral-100 rounded-2xl py-3 px-5 flex-row items-center'>
            <Clock size={16} color={Colors.brown} strokeWidth={2} />
            <View className='flex-1 flex-row items-center justify-center gap-3'>
              <View className='items-center gap-1'>
                <TouchableOpacity
                  onPress={() => adjustHour(1)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 4, left: 16, right: 16 }}
                >
                  <ChevronUp size={16} color={Colors.brown} strokeWidth={2.5} />
                </TouchableOpacity>
                <TextInput
                  value={form.time.slice(0, 2)}
                  onChangeText={v => {
                    const digits = v.replace(/[^0-9]/g, '');
                    const n = Math.min(
                      parseInt(digits.slice(-2) || '0', 10),
                      23,
                    );
                    onFormChange({
                      ...form,
                      time: `${String(n).padStart(2, '0')}:${form.time?.slice(3, 5) ?? '00'}`,
                    });
                  }}
                  keyboardType='number-pad'
                  selectTextOnFocus
                  className='font-ibm-bold text-xl text-neutral-800 w-10 text-center'
                />
                <TouchableOpacity
                  onPress={() => adjustHour(-1)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 4, bottom: 8, left: 16, right: 16 }}
                >
                  <ChevronDown
                    size={16}
                    color={Colors.brown}
                    strokeWidth={2.5}
                  />
                </TouchableOpacity>
              </View>
              <Text className='font-ibm-bold text-xl text-neutral-600'>:</Text>
              <View className='items-center gap-1'>
                <TouchableOpacity
                  onPress={() => adjustMinute(5)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 4, left: 16, right: 16 }}
                >
                  <ChevronUp size={16} color={Colors.brown} strokeWidth={2.5} />
                </TouchableOpacity>
                <TextInput
                  value={form.time.slice(3, 5)}
                  onChangeText={v => {
                    const digits = v.replace(/[^0-9]/g, '');
                    const n = Math.min(
                      parseInt(digits.slice(-2) || '0', 10),
                      59,
                    );
                    onFormChange({
                      ...form,
                      time: `${form.time?.slice(0, 2) ?? '09'}:${String(n).padStart(2, '0')}`,
                    });
                  }}
                  keyboardType='number-pad'
                  selectTextOnFocus
                  className='font-ibm-bold text-xl text-neutral-800 w-10 text-center'
                />
                <TouchableOpacity
                  onPress={() => adjustMinute(-5)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 4, bottom: 8, left: 16, right: 16 }}
                >
                  <ChevronDown
                    size={16}
                    color={Colors.brown}
                    strokeWidth={2.5}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => onFormChange({ ...form, time: null })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <X size={18} color={Colors.neutralLight} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <SaveButton
        onPress={handleSavePress}
        isSaving={isSaving}
        label={scheduleModal.editingId ? '수정 완료' : '저장'}
      />
    </BottomSheet>
  );
}
