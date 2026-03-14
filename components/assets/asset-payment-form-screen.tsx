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
import { ASSET_GROUPS } from '@/constants/asset-type';
import {
  CREDIT_CARD_COMPANIES,
  DEBIT_CARD_BANKS,
  TRANSIT_PROVIDERS,
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

  useEffect(() => {
    if (!visible) return;
    if (editingAsset) {
      setForm({
        category: 'asset',
        type: editingAsset.type,
        name: editingAsset.name,
        amount: editingAsset.amount != null ? String(editingAsset.amount) : '',
        limit: '',
        card_company: '',
        billing_day: null,
        annual_fee: '',
        linked_asset_id: null,
      });
    } else if (editingPm) {
      setForm({
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

  const showAssetGroups = !isEditMode || !!editingAsset;
  const showPmGroup = !isEditMode || !!editingPm;

  const isCreditCard = form.category === 'pm' && form.type === 'credit_card';
  const isDebitCard = form.category === 'pm' && form.type === 'debit_card';
  const isTransit = form.category === 'pm' && form.type === 'transit';

  const selectedCreditCompany = CREDIT_CARD_COMPANIES.find(
    c => c.id === form.card_company,
  );
  const selectedBank = DEBIT_CARD_BANKS.find(b => b.id === form.card_company);
  const selectedTransit = TRANSIT_PROVIDERS.find(
    t => t.id === form.card_company,
  );

  const availableDays =
    selectedCreditCompany?.availablePaymentDays ?? DEFAULT_PAYMENT_DAYS;

  const billingPeriodLabel =
    isCreditCard && selectedCreditCompany && form.billing_day
      ? getBillingPeriodLabel(selectedCreditCompany, form.billing_day)
      : null;

  function handleCompanySelect(id: string, name: string) {
    const isSame = form.card_company === id;
    const prevCompanyName =
      [
        ...CREDIT_CARD_COMPANIES,
        ...DEBIT_CARD_BANKS,
        ...TRANSIT_PROVIDERS,
      ].find(c => c.id === form.card_company)?.name ?? '';
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
              <X size={22} color={Colors.neutralLight} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          >
            {/* ── 유형 선택 ── */}
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
                          setForm(s => ({
                            ...s,
                            category: 'pm',
                            type: key,
                            card_company: '',
                            billing_day: null,
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
            )}

            {/* ── 신용카드 전용 ── */}
            {isCreditCard && (
              <>
                {/* 카드사 선택 */}
                <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
                  카드사
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className='mb-4'
                  keyboardShouldPersistTaps='handled'
                >
                  <View className='flex-row gap-2 pr-2'>
                    {CREDIT_CARD_COMPANIES.map(company => {
                      const isSelected = form.card_company === company.id;
                      return (
                        <TouchableOpacity
                          key={company.id}
                          onPress={() =>
                            handleCompanySelect(company.id, company.name)
                          }
                          className='rounded-2xl px-3 py-2'
                          style={{
                            backgroundColor: isSelected
                              ? company.color
                              : company.color + '55',
                            borderWidth: isSelected ? 1.5 : 0,
                            borderColor: isSelected
                              ? company.color
                              : 'transparent',
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            className={`font-ibm-semibold text-xs ${isSelected ? 'text-neutral-800' : 'text-neutral-600'}`}
                          >
                            {company.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* 결제일 선택 */}
                <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
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
                        className={`rounded-xl items-center justify-center ${isSelected ? 'bg-lavender' : 'bg-neutral-100'}`}
                        style={{ width: 44, height: 38 }}
                        activeOpacity={0.7}
                      >
                        <Text
                          className={`font-ibm-semibold text-xs ${isSelected ? 'text-brown' : 'text-neutral-500'}`}
                        >
                          {day}일
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 청구 기간 안내 */}
                {billingPeriodLabel ? (
                  <View
                    className='flex-row items-center gap-2 rounded-2xl px-3 py-2.5 mb-4'
                    style={{ backgroundColor: Colors.lavender + '50' }}
                  >
                    <Info size={14} color={Colors.brown} strokeWidth={2} />
                    <Text className='font-ibm-semibold text-xs text-brown'>
                      {billingPeriodLabel}
                    </Text>
                  </View>
                ) : (
                  <View className='mb-4' />
                )}
              </>
            )}

            {/* ── 체크카드 전용 ── */}
            {isDebitCard && (
              <>
                {/* 은행 선택 */}
                <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
                  은행
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className='mb-4'
                  keyboardShouldPersistTaps='handled'
                >
                  <View className='flex-row gap-2 pr-2'>
                    {DEBIT_CARD_BANKS.map(bank => {
                      const isSelected = form.card_company === bank.id;
                      return (
                        <TouchableOpacity
                          key={bank.id}
                          onPress={() =>
                            handleCompanySelect(bank.id, bank.name)
                          }
                          className='rounded-2xl px-3 py-2'
                          style={{
                            backgroundColor: isSelected
                              ? bank.color
                              : bank.color + '55',
                            borderWidth: isSelected ? 1.5 : 0,
                            borderColor: isSelected
                              ? bank.color
                              : 'transparent',
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            className={`font-ibm-semibold text-xs ${isSelected ? 'text-neutral-800' : 'text-neutral-600'}`}
                          >
                            {bank.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* 연결 계좌 */}
                <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
                  연결 계좌
                </Text>
                {bankAssets.length === 0 ? (
                  <View
                    className='rounded-2xl px-4 py-3 mb-4'
                    style={{ backgroundColor: Colors.cream }}
                  >
                    <Text className='font-ibm-regular text-xs text-neutral-400'>
                      등록된 은행 계좌가 없어요. 자산에서 계좌를 먼저
                      추가해보세요.
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className='mb-4'
                    keyboardShouldPersistTaps='handled'
                  >
                    <View className='flex-row gap-2 pr-2'>
                      {bankAssets.map(asset => {
                        const isSelected = form.linked_asset_id === asset.id;
                        return (
                          <TouchableOpacity
                            key={asset.id}
                            onPress={() => {
                              setForm(s => ({
                                ...s,
                                linked_asset_id: isSelected ? null : asset.id,
                              }));
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light,
                              );
                            }}
                            className={`rounded-2xl px-3 py-2 ${isSelected ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                            style={{
                              borderWidth: isSelected ? 1.5 : 0,
                              borderColor: isSelected
                                ? Colors.brown
                                : 'transparent',
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              className={`font-ibm-semibold text-xs ${isSelected ? 'text-brown' : 'text-neutral-600'}`}
                            >
                              {asset.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}
              </>
            )}

            {/* ── 교통카드 전용 ── */}
            {isTransit && (
              <>
                <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
                  종류
                </Text>
                <View className='flex-row flex-wrap gap-2 mb-4'>
                  {TRANSIT_PROVIDERS.map(provider => {
                    const isSelected = form.card_company === provider.id;
                    return (
                      <TouchableOpacity
                        key={provider.id}
                        onPress={() =>
                          handleCompanySelect(provider.id, provider.name)
                        }
                        className='rounded-2xl px-3 py-2'
                        style={{
                          backgroundColor: isSelected
                            ? provider.color
                            : provider.color + '55',
                          borderWidth: isSelected ? 1.5 : 0,
                          borderColor: isSelected
                            ? provider.color
                            : 'transparent',
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          className={`font-ibm-semibold text-xs ${isSelected ? 'text-neutral-800' : 'text-neutral-600'}`}
                        >
                          {provider.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* ── 이름 ── */}
            <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
              이름
            </Text>
            <ModalTextInput
              value={form.name}
              onChangeText={v => setForm(s => ({ ...s, name: v }))}
              placeholder={
                form.category === 'asset'
                  ? '자산 이름 (예: 국민은행, 비상금)'
                  : isCreditCard
                    ? selectedCreditCompany
                      ? `${selectedCreditCompany.name} 카드 이름`
                      : '카드 이름 (예: 삼성카드 taptap)'
                    : isDebitCard
                      ? selectedBank
                        ? `${selectedBank.name} 체크카드 이름`
                        : '체크카드 이름'
                      : isTransit
                        ? selectedTransit
                          ? `${selectedTransit.name} 카드 이름`
                          : '교통카드 이름'
                        : '결제수단 이름'
              }
              maxLength={20}
              className='mb-5'
            />

            {/* ── 자산: 금액 ── */}
            {form.category === 'asset' && (
              <>
                <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
                  금액
                </Text>
                <AmountInput
                  value={form.amount}
                  onChangeText={v => setForm(s => ({ ...s, amount: v }))}
                  placeholder='현재 잔액'
                  className='mb-2'
                />
              </>
            )}

            {/* ── 신용카드: 연회비 ── */}
            {isCreditCard && (
              <>
                <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
                  연회비
                </Text>
                <AmountInput
                  value={form.annual_fee}
                  onChangeText={v => setForm(s => ({ ...s, annual_fee: v }))}
                  placeholder='연회비 금액'
                  className='mb-5'
                />
              </>
            )}

            {/* ── 결제수단: 한도 (신용카드 포함) ── */}
            {form.category === 'pm' && (
              <>
                <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
                  한도
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
