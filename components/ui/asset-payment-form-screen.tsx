import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import {
  X,
  Landmark,
  Banknote,
  TrendingUp,
  PiggyBank,
  Building2,
  Wallet,
  CircleMinus,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { SaveButton } from './save-button';
import { ModalTextInput, AmountInput } from './modal-inputs';
import { PM_TYPE_OPTIONS } from './payment-method-form-screen';
import type { Asset, PaymentMethod } from '../../types/database';

export type AssetTypeOption = {
  key: string;
  label: string;
  Icon: LucideIcon;
  color: string;
};

export const ASSET_TYPE_OPTIONS: AssetTypeOption[] = [
  { key: 'bank', label: '은행 계좌', Icon: Landmark, color: '#B5D5F0' },
  { key: 'cash', label: '현금', Icon: Banknote, color: '#A8D8B0' },
  { key: 'investment', label: '주식/펀드', Icon: TrendingUp, color: '#D4C5F0' },
  { key: 'saving', label: '적금/예금', Icon: PiggyBank, color: '#FAD97A' },
  { key: 'real_estate', label: '부동산', Icon: Building2, color: '#F5D0A0' },
  { key: 'other', label: '기타', Icon: Wallet, color: '#F0C5D5' },
  { key: 'loan', label: '대출', Icon: CircleMinus, color: '#F4A0A0' },
  { key: 'insurance', label: '보험', Icon: ShieldCheck, color: '#B5D5F0' },
];

export function getAssetTypeOption(key: string): AssetTypeOption {
  return (
    ASSET_TYPE_OPTIONS.find(t => t.key === key) ??
    ASSET_TYPE_OPTIONS.find(t => t.key === 'other')!
  );
}

const ASSET_GROUPS = [
  {
    label: '자산',
    types: ASSET_TYPE_OPTIONS.filter(
      t => t.key !== 'loan' && t.key !== 'insurance',
    ),
  },
  { label: '부채', types: ASSET_TYPE_OPTIONS.filter(t => t.key === 'loan') },
  {
    label: '보험',
    types: ASSET_TYPE_OPTIONS.filter(t => t.key === 'insurance'),
  },
];

export type UnifiedFormData = {
  category: 'asset' | 'pm';
  type: string;
  name: string;
  amount: string; // 자산용 (선택)
  limit: string; // 결제수단용 (선택)
};

const INITIAL_FORM: UnifiedFormData = {
  category: 'asset',
  type: 'bank',
  name: '',
  amount: '',
  limit: '',
};

type Props = {
  visible: boolean;
  editingAsset?: Asset | null;
  editingPm?: PaymentMethod | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (form: UnifiedFormData) => void;
  onDeleteAsset?: () => void;
  onDeletePm?: () => void;
};

export function AssetPaymentFormScreen({
  visible,
  editingAsset,
  editingPm,
  isSaving,
  onClose,
  onSave,
  onDeleteAsset,
  onDeletePm,
}: Props) {
  const [form, setForm] = useState<UnifiedFormData>(INITIAL_FORM);

  useEffect(() => {
    if (!visible) return;
    if (editingAsset) {
      setForm({
        category: 'asset',
        type: editingAsset.type,
        name: editingAsset.name,
        amount: editingAsset.amount != null ? String(editingAsset.amount) : '',
        limit: '',
      });
    } else if (editingPm) {
      setForm({
        category: 'pm',
        type: editingPm.type,
        name: editingPm.name,
        amount: '',
        limit: editingPm.limit != null ? String(editingPm.limit) : '',
      });
    } else {
      setForm(INITIAL_FORM);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const isEditMode = !!(editingAsset || editingPm);

  let title: string;
  if (editingAsset) title = '자산 수정';
  else if (editingPm) title = '결제수단 수정';
  else title = '자산 · 결제수단 추가';

  // 편집 모드에서는 해당 카테고리 칩만 표시
  const showAssetGroups = !isEditMode || !!editingAsset;
  const showPmGroup = !isEditMode || !!editingPm;

  return (
    <Modal visible={visible} animationType='slide' onRequestClose={onClose}>
      <SafeAreaView className='flex-1 bg-white'>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className='flex-1'
        >
          {/* 헤더 */}
          <View className='flex-row items-center justify-between px-6 pt-5 mb-5'>
            <View style={{ width: 22 }} />
            <Text className='font-ibm-bold text-lg text-neutral-800'>
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={22} color='#A3A3A3' strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          >
            {/* 유형 */}
            <Text className='font-ibm-semibold text-xs text-neutral-500 mb-3 ml-1'>
              유형
            </Text>

            {showAssetGroups &&
              ASSET_GROUPS.map(group => (
                <View key={group.label} className='mb-3'>
                  <Text className='font-ibm-semibold text-xs text-neutral-400 mb-1.5 ml-1'>
                    {group.label}
                  </Text>
                  <View className='flex-row flex-wrap gap-2'>
                    {group.types.map(({ key, label }) => {
                      const isSelected =
                        form.category === 'asset' && form.type === key;
                      return (
                        <TouchableOpacity
                          key={`asset-${key}`}
                          onPress={() =>
                            setForm(s => ({
                              ...s,
                              category: 'asset',
                              type: key,
                            }))
                          }
                          className={`px-3 py-2 rounded-2xl ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                          activeOpacity={0.7}
                        >
                          <Text
                            className={`font-ibm-semibold text-xs ${isSelected ? 'text-brown-dark' : 'text-brown-dark/60'}`}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

            {showPmGroup && (
              <View className='mb-6'>
                <Text className='font-ibm-semibold text-xs text-neutral-400 mb-1.5 ml-1'>
                  결제수단
                </Text>
                <View className='flex-row flex-wrap gap-2'>
                  {PM_TYPE_OPTIONS.map(({ key, label }) => {
                    const isSelected =
                      form.category === 'pm' && form.type === key;
                    return (
                      <TouchableOpacity
                        key={`pm-${key}`}
                        onPress={() =>
                          setForm(s => ({ ...s, category: 'pm', type: key }))
                        }
                        className={`px-3 py-2 rounded-2xl ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                        activeOpacity={0.7}
                      >
                        <Text
                          className={`font-ibm-semibold text-xs ${isSelected ? 'text-brown-dark' : 'text-brown-dark/60'}`}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 이름 */}
            <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
              이름
            </Text>
            <ModalTextInput
              value={form.name}
              onChangeText={v => setForm(s => ({ ...s, name: v }))}
              placeholder={
                form.category === 'asset'
                  ? '자산 이름 (예: 국민은행, 비상금)'
                  : '결제수단 이름 (예: 신한카드, T-money)'
              }
              maxLength={20}
              className='mb-5'
            />

            {/* 금액 — 자산 선택 시 */}
            {form.category === 'asset' && (
              <>
                <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
                  금액{' '}
                  <Text className='font-ibm-regular text-neutral-400'>
                    (선택)
                  </Text>
                </Text>
                <AmountInput
                  value={form.amount}
                  onChangeText={v => setForm(s => ({ ...s, amount: v }))}
                  placeholder='현재 잔액'
                  className='mb-2'
                />
              </>
            )}

            {/* 한도 — 결제수단 선택 시 */}
            {form.category === 'pm' && (
              <>
                <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
                  한도{' '}
                  <Text className='font-ibm-regular text-neutral-400'>
                    (선택)
                  </Text>
                </Text>
                <AmountInput
                  value={form.limit}
                  onChangeText={v => setForm(s => ({ ...s, limit: v }))}
                  placeholder='한도 금액'
                  className='mb-2'
                />
              </>
            )}
          </ScrollView>

          {/* 하단 고정 버튼 */}
          <View className='px-6 pb-6 pt-3 gap-3'>
            {onDeleteAsset && (
              <TouchableOpacity
                onPress={onDeleteAsset}
                activeOpacity={0.8}
                className='rounded-2xl items-center'
                style={{
                  backgroundColor: Colors.cream,
                  borderWidth: 1.5,
                  borderColor: Colors.peachDark,
                  paddingVertical: 14,
                }}
              >
                <Text
                  className='font-ibm-semibold text-base'
                  style={{ color: Colors.peachDark }}
                >
                  자산 삭제
                </Text>
              </TouchableOpacity>
            )}
            {onDeletePm && (
              <TouchableOpacity
                onPress={onDeletePm}
                activeOpacity={0.8}
                className='rounded-2xl items-center'
                style={{
                  backgroundColor: Colors.cream,
                  borderWidth: 1.5,
                  borderColor: Colors.peachDark,
                  paddingVertical: 14,
                }}
              >
                <Text
                  className='font-ibm-semibold text-base'
                  style={{ color: Colors.peachDark }}
                >
                  결제수단 삭제
                </Text>
              </TouchableOpacity>
            )}
            <SaveButton
              onPress={() => onSave(form)}
              isSaving={isSaving}
              label={isEditMode ? '수정 완료' : '저장'}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
