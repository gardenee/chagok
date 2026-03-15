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
import { X, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { SaveButton } from '@/components/ui/save-button';
import { ModalTextInput, AmountInput } from '@/components/ui/modal-inputs';
import { PM_TYPE_OPTIONS } from '@/constants/payment-method';
import { ASSET_TYPE_OPTIONS } from '@/constants/asset-type';
import {
  CREDIT_CARD_COMPANIES,
  DEFAULT_PAYMENT_DAYS,
  getBillingPeriodLabel,
} from '@/constants/card-companies';
import type { Asset, PaymentMethod } from '@/types/database';

export type UnifiedFormData = {
  category: 'asset' | 'pm';
  type: string;
  name: string;
  amount: string; // 자산: 잔액
  limit: string; // 결제수단: 한도
  card_company: string;
  billing_day: number | null;
  annual_fee: string;
  linked_asset_id: string | null;
};

const INITIAL_FORM: UnifiedFormData = {
  category: 'asset',
  type: 'bank',
  name: '',
  amount: '',
  limit: '',
  card_company: '',
  billing_day: null,
  annual_fee: '',
  linked_asset_id: null,
};

type Props = {
  visible: boolean;
  editingAsset?: Asset | null;
  editingPm?: PaymentMethod | null;
  isSaving: boolean;
  bankAssets?: Asset[];
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
  bankAssets = [],
  onClose,
  onSave,
  onDeleteAsset,
  onDeletePm,
}: Props) {
  const [form, setForm] = useState<UnifiedFormData>(INITIAL_FORM);
  const [nameError, setNameError] = useState(false);
  const [originalForm, setOriginalForm] = useState<UnifiedFormData | null>(
    null,
  );

  useEffect(() => {
    if (!visible) {
      setNameError(false);
      return;
    }
    let initialForm: UnifiedFormData;
    if (editingAsset) {
      initialForm = {
        category: 'asset',
        type: editingAsset.type,
        name: editingAsset.name,
        amount: editingAsset.amount != null ? String(editingAsset.amount) : '',
        limit: '',
        card_company: '',
        billing_day: null,
        annual_fee: '',
        linked_asset_id: null,
      };
    } else if (editingPm) {
      initialForm = {
        category: 'pm',
        type: editingPm.type,
        name: editingPm.name,
        amount: '',
        limit: editingPm.limit != null ? String(editingPm.limit) : '',
        card_company: editingPm.card_company ?? '',
        billing_day: editingPm.billing_day ?? null,
        annual_fee:
          editingPm.annual_fee != null ? String(editingPm.annual_fee) : '',
        linked_asset_id: editingPm.linked_asset_id ?? null,
      };
    } else {
      initialForm = INITIAL_FORM;
    }
    setForm(initialForm);
    setNameError(false);
    setOriginalForm(initialForm);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSavePress() {
    const nameErr = !form.name.trim();
    if (nameErr) {
      setNameError(true);
      return;
    }
    setNameError(false);

    // no-op check for edit mode
    if (originalForm && (editingAsset || editingPm)) {
      const noChange =
        form.name.trim() === originalForm.name.trim() &&
        form.amount === originalForm.amount &&
        form.limit === originalForm.limit &&
        form.card_company === originalForm.card_company &&
        form.billing_day === originalForm.billing_day &&
        form.annual_fee === originalForm.annual_fee &&
        form.linked_asset_id === originalForm.linked_asset_id &&
        form.type === originalForm.type;
      if (noChange) {
        onClose();
        return;
      }
    }

    onSave(form);
  }

  const isEditMode = !!(editingAsset || editingPm);

  let title: string;
  if (editingAsset) title = '자산 수정';
  else if (editingPm) title = '결제수단 수정';
  else title = '자산 · 결제수단 추가';

  const showAssetGroups = !isEditMode || !!editingAsset;
  const showPmGroup = !isEditMode || !!editingPm;

  const isCreditCard = form.category === 'pm' && form.type === 'credit_card';
  const isCard =
    form.category === 'pm' &&
    (form.type === 'credit_card' ||
      form.type === 'debit_card' ||
      form.type === 'transit');

  const selectedCreditCompany = CREDIT_CARD_COMPANIES.find(
    c => c.id === form.card_company,
  );

  const availableDays =
    selectedCreditCompany?.availablePaymentDays ?? DEFAULT_PAYMENT_DAYS;

  const billingPeriodLabel =
    isCreditCard && selectedCreditCompany && form.billing_day
      ? getBillingPeriodLabel(selectedCreditCompany, form.billing_day)
      : null;

  const isVariableMonthDay =
    isCreditCard &&
    selectedCreditCompany &&
    form.billing_day != null &&
    (selectedCreditCompany.variableMonthDays ?? []).includes(form.billing_day);

  function handleCompanySelect(id: string, name: string) {
    const isSame = form.card_company === id;
    const prevCompanyName =
      CREDIT_CARD_COMPANIES.find(c => c.id === form.card_company)?.name ?? '';
    const shouldAutoFillName =
      form.name === '' || form.name === prevCompanyName;
    setForm(s => ({
      ...s,
      card_company: isSame ? '' : id,
      billing_day: null,
      name: isSame ? s.name : shouldAutoFillName ? name : s.name,
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleLinkedAssetSelect(asset: Asset) {
    const isSelected = form.linked_asset_id === asset.id;
    const currentLinkedAsset = bankAssets.find(
      a => a.id === form.linked_asset_id,
    );
    // 체크카드만 연결 계좌 선택 시 이름 자동채우기
    const shouldAutoFillName =
      form.type === 'debit_card' &&
      (form.name === '' || form.name === currentLinkedAsset?.name);
    setForm(s => ({
      ...s,
      linked_asset_id: isSelected ? null : asset.id,
      name: shouldAutoFillName ? (isSelected ? '' : asset.name) : s.name,
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

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
            <Text className='font-ibm-bold text-xl text-neutral-800'>
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={22} color={Colors.neutralLight} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          >
            {/* ── 유형 선택 ── */}
            <Text className='font-ibm-bold text-lg text-neutral-700 mb-3 ml-1'>
              유형
            </Text>

            {showAssetGroups && (
              <View className='mb-3'>
                <Text className='font-ibm-semibold text-[17px] text-neutral-600 mb-2.5 ml-1'>
                  자산
                </Text>
                <View className='flex-row flex-wrap gap-2'>
                  {ASSET_TYPE_OPTIONS.map(({ key, label }) => {
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
                        className={`px-4 py-2.5 rounded-2xl ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                        activeOpacity={0.7}
                      >
                        <Text
                          className={`font-ibm-semibold text-base ${isSelected ? 'text-neutral-800' : 'text-neutral-600'}`}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {showPmGroup && (
              <View className='mb-6'>
                <Text className='font-ibm-semibold text-[17px] text-neutral-600 mb-2.5 ml-1'>
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
                          setForm(s => ({
                            ...s,
                            category: 'pm',
                            type: key,
                            card_company: '',
                            billing_day: null,
                            linked_asset_id: null,
                          }))
                        }
                        className={`px-4 py-2.5 rounded-2xl ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                        activeOpacity={0.7}
                      >
                        <Text
                          className={`font-ibm-semibold text-base ${isSelected ? 'text-neutral-800' : 'text-neutral-600'}`}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── 신용카드 전용: 카드사 + 결제일 ── */}
            {isCreditCard && (
              <>
                <Text className='font-ibm-bold text-base text-neutral-700 mb-2.5 ml-1'>
                  카드사
                </Text>
                <View className='flex-row flex-wrap gap-2 mb-4'>
                  {CREDIT_CARD_COMPANIES.map(company => {
                    const isSelected = form.card_company === company.id;
                    return (
                      <TouchableOpacity
                        key={company.id}
                        onPress={() =>
                          handleCompanySelect(company.id, company.name)
                        }
                        className={`px-3.5 py-2.5 rounded-2xl ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                        activeOpacity={0.7}
                      >
                        <Text
                          className={`font-ibm-semibold text-base ${isSelected ? 'text-neutral-800' : 'text-neutral-600'}`}
                        >
                          {company.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {form.card_company && (
                  <>
                    <Text className='font-ibm-bold text-base text-neutral-700 mb-2.5 ml-1'>
                      결제일
                    </Text>
                    <View className='flex-row flex-wrap gap-1.5 mb-2'>
                      {availableDays.map(day => {
                        const isSelected = form.billing_day === day;
                        return (
                          <TouchableOpacity
                            key={day}
                            onPress={() => {
                              setForm(s => ({
                                ...s,
                                billing_day: isSelected ? null : day,
                              }));
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light,
                              );
                            }}
                            className={`rounded-xl items-center justify-center ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                            style={{ width: 52, height: 44 }}
                            activeOpacity={0.7}
                          >
                            <Text
                              className={`font-ibm-semibold text-base ${isSelected ? 'text-neutral-800' : 'text-neutral-600'}`}
                            >
                              {day}일
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {billingPeriodLabel ? (
                      <View
                        className='flex-row items-center gap-2 rounded-2xl px-3 py-2.5 mb-4'
                        style={{ backgroundColor: Colors.butter + '50' }}
                      >
                        <Info
                          size={15}
                          color={Colors.neutralDarker}
                          strokeWidth={2}
                        />
                        <Text className='font-ibm-semibold text-sm text-neutral-700'>
                          {billingPeriodLabel}
                        </Text>
                      </View>
                    ) : isVariableMonthDay ? (
                      <View
                        className='flex-row items-center gap-2 rounded-2xl px-3 py-2.5 mb-4'
                        style={{ backgroundColor: Colors.butter + '50' }}
                      >
                        <Info
                          size={15}
                          color={Colors.neutralDarker}
                          strokeWidth={2}
                        />
                        <Text className='font-ibm-semibold text-sm text-neutral-700'>
                          청구기간이 매월 달라져요
                        </Text>
                      </View>
                    ) : (
                      <View className='mb-4' />
                    )}
                  </>
                )}
              </>
            )}

            {/* ── 카드 공통: 연결 계좌 ── */}
            {isCard && (
              <>
                <Text className='font-ibm-bold text-base text-neutral-700 mb-2.5 ml-1'>
                  연결 계좌
                </Text>
                {bankAssets.length === 0 ? (
                  <View
                    className='rounded-2xl px-4 py-3 mb-5'
                    style={{ backgroundColor: Colors.cream }}
                  >
                    <Text className='font-ibm-regular text-sm text-neutral-600'>
                      등록된 은행 계좌가 없어요. 자산에서 계좌를 먼저
                      추가해보세요.
                    </Text>
                  </View>
                ) : (
                  <View className='flex-row flex-wrap gap-2 mb-5'>
                    {bankAssets.map(asset => {
                      const isSelected = form.linked_asset_id === asset.id;
                      return (
                        <TouchableOpacity
                          key={asset.id}
                          onPress={() => handleLinkedAssetSelect(asset)}
                          className={`px-4 py-3 rounded-2xl ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                          activeOpacity={0.7}
                        >
                          <Text
                            className={`font-ibm-semibold text-base ${isSelected ? 'text-neutral-800' : 'text-neutral-600'}`}
                          >
                            {asset.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            )}

            {/* ── 이름 ── */}
            <View className='mb-2 flex-row items-center ml-1'>
              <Text className='font-ibm-bold text-base text-neutral-700'>
                이름
              </Text>
              <Text
                className='font-ibm-bold text-base ml-0.5'
                style={{ color: Colors.peachDarker }}
              >
                *
              </Text>
            </View>
            <ModalTextInput
              value={form.name}
              onChangeText={v => {
                setForm(s => ({ ...s, name: v }));
                if (nameError) setNameError(false);
              }}
              placeholder={
                form.category === 'asset'
                  ? '자산 이름 (예: 국민은행, 비상금)'
                  : isCreditCard
                    ? selectedCreditCompany
                      ? `${selectedCreditCompany.name} 카드 이름`
                      : '카드 이름 (예: 삼성카드 taptap)'
                    : form.type === 'debit_card'
                      ? '체크카드 이름'
                      : form.type === 'transit'
                        ? '교통카드 이름'
                        : '결제수단 이름'
              }
              maxLength={20}
              className='mb-5'
              error={nameError}
            />

            {/* ── 자산: 금액 ── */}
            {form.category === 'asset' && (
              <>
                <Text className='font-ibm-bold text-base text-neutral-700 mb-2.5 ml-1'>
                  금액
                </Text>
                <AmountInput
                  value={form.amount}
                  onChangeText={v => setForm(s => ({ ...s, amount: v }))}
                  placeholder='현재 잔액'
                  className='mb-2'
                  maxLength={15}
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
                  className='font-ibm-semibold text-lg'
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
                  className='font-ibm-semibold text-lg'
                  style={{ color: Colors.peachDark }}
                >
                  결제수단 삭제
                </Text>
              </TouchableOpacity>
            )}
            <SaveButton
              onPress={handleSavePress}
              isSaving={isSaving}
              label={isEditMode ? '수정 완료' : '저장'}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
