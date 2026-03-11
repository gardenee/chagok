import { useState, useEffect } from 'react';
import { Text } from 'react-native';
import { BottomSheet, BottomSheetHeader } from '@/components/ui/bottom-sheet';
import { ModalTextInput } from '@/components/ui/modal-inputs';
import { SaveButton } from '@/components/ui/save-button';

type Props = {
  visible: boolean;
  title: string;
  value: string;
  placeholder?: string;
  onClose: () => void;
  onSave: (value: string) => void;
  isSaving: boolean;
  maxLength?: number;
};

export function EditModal({
  visible,
  title,
  value,
  placeholder,
  onClose,
  onSave,
  isSaving,
  maxLength = 20,
}: Props) {
  const [text, setText] = useState(value);

  useEffect(() => {
    if (visible) setText(value);
  }, [visible, value]);

  const trimmed = text.trim();
  const isDisabled = isSaving || !trimmed || trimmed === value.trim();

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <BottomSheetHeader title={title} onClose={onClose} className='mb-5' />

      <ModalTextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus
        className='mb-1'
      />
      <Text className='font-ibm-regular text-xs text-neutral-400 text-right mb-4 mr-1'>
        {text.length}/{maxLength}
      </Text>

      <SaveButton
        onPress={() => onSave(trimmed)}
        isSaving={isSaving}
        disabled={isDisabled}
      />
    </BottomSheet>
  );
}
