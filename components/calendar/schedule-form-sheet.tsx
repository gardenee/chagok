import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Clock, X, CalendarDays } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { SaveButton } from '@/components/ui/save-button';
import { DeleteButton } from '@/components/ui/delete-button';
import { ModalTextInput } from '@/components/ui/modal-inputs';
import type { ScheduleModalState, TagOption } from './types';

function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function parseTimeStr(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date;
}

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
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [tempTime, setTempTime] = useState<Date>(new Date());

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

  const dateValue = form.date ? parseDateStr(form.date) : new Date();

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
          <View className='mb-2 flex-row items-center ml-1'>
            <Text className='font-ibm-semibold text-base text-neutral-600'>
              제목
            </Text>
            <Text
              className='font-ibm-semibold text-base ml-0.5'
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
            className='mb-6'
            error={titleError}
          />

          {/* 날짜 */}
          <Text className='font-ibm-semibold text-base text-neutral-600 mb-2 ml-1'>
            날짜
          </Text>
          <TouchableOpacity
            onPress={() => {
              setTempDate(dateValue);
              setDatePickerVisible(true);
            }}
            activeOpacity={0.7}
            className='bg-neutral-100 rounded-2xl px-4 mb-6 flex-row items-center gap-2.5 h-16'
          >
            <CalendarDays
              size={16}
              color={Colors.neutralDark}
              strokeWidth={2}
            />
            <Text className='font-ibm-semibold text-base text-neutral-700'>
              {(() => {
                const d = form.date;
                const [y, m, day] = d.split('-').map(Number);
                return `${y}년 ${m}월 ${day}일`;
              })()}
            </Text>
          </TouchableOpacity>

          {/* 참여자 */}
          <View className='mb-5'>
            <View className='flex-row items-center mb-2 ml-1'>
              <Text className='font-ibm-semibold text-base text-neutral-600'>
                참여자
              </Text>
              <Text
                className='font-ibm-semibold text-base ml-0.5'
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
                      borderColor: showError
                        ? Colors.peachDarker
                        : 'transparent',
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`font-ibm-semibold text-base ${isSelected ? 'text-neutral-800' : 'text-neutral-500'}`}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {tagError && !form.tag && (
              <Text
                className='font-ibm-regular text-sm mt-1 ml-1'
                style={{ color: Colors.peachDarker }}
              >
                참여자를 선택해주세요
              </Text>
            )}
          </View>

          {/* 시간 */}
          <View className='mb-8'>
            {form.time === null ? (
              <TouchableOpacity
                onPress={() => {
                  setTempTime(parseTimeStr('09:00'));
                  setTimePickerVisible(true);
                }}
                className='bg-neutral-100 rounded-2xl px-5 flex-row items-center h-16'
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
                onPress={() => {
                  setTempTime(parseTimeStr(form.time!));
                  setTimePickerVisible(true);
                }}
                className='bg-neutral-100 rounded-2xl px-5 flex-row items-center h-16'
                activeOpacity={0.7}
              >
                <Clock size={16} color={Colors.neutralDark} strokeWidth={2} />
                <View className='flex-1 items-center'>
                  <Text className='font-ibm-bold text-xl text-neutral-800'>
                    {form.time}
                  </Text>
                </View>
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

      {/* 시간 선택 모달 */}
      <Modal
        visible={timePickerVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setTimePickerVisible(false)}
      >
        <View
          className='flex-1 justify-end'
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <TouchableOpacity
            className='flex-1'
            activeOpacity={1}
            onPress={() => setTimePickerVisible(false)}
          />
          <View className='bg-white rounded-t-3xl px-6 pt-5 pb-8'>
            <Text className='font-ibm-bold text-xl text-brown-darker text-center mb-4'>
              시간 선택
            </Text>
            <View className='items-center mb-6'>
              <DateTimePicker
                value={tempTime}
                mode='time'
                display='spinner'
                onChange={(_event, date) => {
                  if (!date) return;
                  setTempTime(date);
                }}
                locale='ko-KR'
                accentColor={Colors.brownDark}
              />
            </View>
            <TouchableOpacity
              onPress={() => {
                const h = String(tempTime.getHours()).padStart(2, '0');
                const m = String(tempTime.getMinutes()).padStart(2, '0');
                onFormChange({ ...form, time: `${h}:${m}` });
                setTimePickerVisible(false);
              }}
              className='bg-butter rounded-2xl py-4 items-center'
              activeOpacity={0.8}
            >
              <Text className='font-ibm-bold text-base text-brown-darker'>
                확인
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 날짜 선택 모달 */}
      <Modal
        visible={datePickerVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View
          className='flex-1 justify-end'
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <TouchableOpacity
            className='flex-1'
            activeOpacity={1}
            onPress={() => setDatePickerVisible(false)}
          />
          <View className='bg-white rounded-t-3xl px-6 pt-5 pb-8'>
            <Text className='font-ibm-bold text-xl text-brown-darker text-center mb-4'>
              날짜 선택
            </Text>
            <View className='items-center mb-6'>
              <DateTimePicker
                value={tempDate}
                mode='date'
                display='spinner'
                onChange={(_event, date) => {
                  if (!date) return;
                  setTempDate(date);
                }}
                locale='ko-KR'
                accentColor={Colors.brownDark}
              />
            </View>
            <TouchableOpacity
              onPress={() => {
                const y = tempDate.getFullYear();
                const m = String(tempDate.getMonth() + 1).padStart(2, '0');
                const d = String(tempDate.getDate()).padStart(2, '0');
                onFormChange({ ...form, date: `${y}-${m}-${d}` });
                setDatePickerVisible(false);
              }}
              className='bg-butter rounded-2xl py-4 items-center'
              activeOpacity={0.8}
            >
              <Text className='font-ibm-bold text-base text-brown-darker'>
                확인
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
