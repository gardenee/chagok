import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Wallet,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { resolveColor } from '@/constants/color-map';
import { SaveButton } from '@/components/ui/save-button';
import { ModalTextInput, AmountInput } from '@/components/ui/modal-inputs';
import { SegmentControl } from '@/components/ui/segment-control';
import { CategoryFormScreen } from '@/components/budget/category-form-screen';
import { CategoryManagementScreen } from '@/components/budget/category-management-screen';
import { ICON_MAP } from '@/constants/icon-map';
import { PaymentMethodFormScreen } from '@/components/assets/payment-method-form-screen';
import {
  PM_TYPE_OPTIONS,
  INITIAL_PM_FORM,
  type PaymentMethodFormData,
  type PmTypeOption,
} from '@/constants/payment-method';
import { getAssetTypeOption } from '@/constants/asset-type';
import {
  getSelectedDateLabel,
  type TxModalState,
  type TagOption,
} from './types';
import type { Category, PaymentMethod, Asset } from '@/types/database';

interface TransactionFormSheetProps {
  txModal: TxModalState;
  setTxModal: React.Dispatch<React.SetStateAction<TxModalState>>;
  selectedDate: string;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  bankCashAssets: Asset[];
  tagOptions: TagOption[];
  isTxSaving: boolean;
  isCatSaving: boolean;
  isPmSaving: boolean;
  onTxSave: () => void;
  onTxDelete: (id: string) => void;
  onCatCreate: () => void;
  onCatEdit: (c: Category) => void;
  onCatSave: () => void;
  onCatDelete: (id: string) => void;
  onPmSave: () => void;
  onPmDelete: (id: string) => void;
}

export function TransactionFormSheet({
  txModal,
  setTxModal,
  selectedDate,
  categories,
  paymentMethods,
  bankCashAssets,
  tagOptions,
  isTxSaving,
  isCatSaving,
  isPmSaving,
  onTxSave,
  onTxDelete,
  onCatCreate,
  onCatEdit,
  onCatSave,
  onCatDelete,
  onPmSave,
  onPmDelete,
}: TransactionFormSheetProps) {
  const [amountErrorMsg, setAmountErrorMsg] = useState('');

  useEffect(() => {
    if (!txModal.visible) setAmountErrorMsg('');
  }, [txModal.visible]);

  function handleTxSavePress() {
    const amount = parseInt(txModal.form.amount.replace(/[^0-9]/g, ''), 10);
    if (!amount || amount <= 0 || amountErrorMsg) {
      setAmountErrorMsg(prev => prev || '금액을 입력해주세요');
      return;
    }
    onTxSave();
  }

  const closeTx = () => setTxModal(s => ({ ...s, visible: false, view: 'tx' }));

  return (
    <>
      {/* 거래 추가/수정 풀사이즈 모달 */}
      <Modal
        visible={txModal.visible && txModal.view === 'tx'}
        animationType='slide'
        onRequestClose={closeTx}
      >
        <SafeAreaView className='flex-1 bg-white'>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className='flex-1'
          >
            {/* 헤더 */}
            <View className='flex-row items-center justify-between px-6 pt-5 mb-6'>
              <View style={{ width: 22 }} />
              <Text className='font-ibm-bold text-lg text-neutral-800'>
                {txModal.editingId
                  ? '내역 수정'
                  : `${getSelectedDateLabel(selectedDate)} 내역 추가`}
              </Text>
              <TouchableOpacity
                onPress={closeTx}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={22} color={Colors.neutralLight} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 24,
                paddingBottom: 24,
              }}
              keyboardShouldPersistTaps='handled'
            >
              {!txModal.editingId && (
                <SegmentControl
                  options={[
                    { value: 'expense' as const, label: '지출' },
                    { value: 'income' as const, label: '수입' },
                  ]}
                  value={txModal.form.type}
                  onChange={type =>
                    setTxModal(s => ({
                      ...s,
                      form: {
                        ...s.form,
                        type,
                        category_id: null,
                        ...(type === 'income'
                          ? { payment_method_id: null, asset_id: null }
                          : {}),
                      },
                    }))
                  }
                  bgClassName='bg-neutral-100 rounded-2xl'
                  className='mb-5'
                  activeTextClassName='text-neutral-800'
                  inactiveTextClassName='text-neutral-500'
                />
              )}

              <View className='mb-2 flex-row items-center ml-1'>
                <Text className='font-ibm-semibold text-xs text-neutral-600'>
                  금액
                </Text>
                <Text
                  className='font-ibm-semibold text-xs ml-0.5'
                  style={{ color: '#C8562E' }}
                >
                  *
                </Text>
              </View>
              <AmountInput
                value={txModal.form.amount}
                onChangeText={v => {
                  setTxModal(s => ({ ...s, form: { ...s.form, amount: v } }));
                  const n = parseInt(v, 10);
                  setAmountErrorMsg(
                    n > 2_147_483_647 ? '최대 입력값을 초과했어요' : '',
                  );
                }}
                className={amountErrorMsg ? 'mb-1' : 'mb-3'}
                error={!!amountErrorMsg}
                maxLength={10}
              />
              {!!amountErrorMsg && (
                <Text
                  className='font-ibm-regular text-xs mb-3 ml-1'
                  style={{ color: '#C8562E' }}
                >
                  {amountErrorMsg}
                </Text>
              )}

              <ModalTextInput
                value={txModal.form.memo}
                onChangeText={v =>
                  setTxModal(s => ({ ...s, form: { ...s.form, memo: v } }))
                }
                placeholder='메모'
                maxLength={50}
                className='mb-4'
              />

              {/* 카테고리 선택 */}
              <View className='mb-4'>
                <View className='flex-row items-center justify-between mb-2 ml-1 mr-1'>
                  <Text className='font-ibm-semibold text-xs text-neutral-600'>
                    카테고리
                  </Text>
                  {categories.length > 0 && (
                    <TouchableOpacity
                      onPress={() =>
                        setTxModal(s => ({ ...s, view: 'catMgmt' }))
                      }
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text className='font-ibm-semibold text-xs text-neutral-600 bg-neutral-200 rounded-2xl px-2 py-0.5'>
                        수정
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps='handled'
                >
                  <View className='flex-row gap-2 pr-2'>
                    {categories
                      .filter(c => c.type === txModal.form.type)
                      .map(c => {
                        const Icon = ICON_MAP[c.icon] ?? Wallet;
                        const isSelected = txModal.form.category_id === c.id;
                        const cColor = resolveColor(c.color);
                        return (
                          <TouchableOpacity
                            key={c.id}
                            onPress={() => {
                              setTxModal(s => ({
                                ...s,
                                form: {
                                  ...s.form,
                                  category_id: isSelected ? null : c.id,
                                },
                              }));
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light,
                              );
                            }}
                            className='items-center gap-1'
                            activeOpacity={0.7}
                          >
                            <View
                              className='w-12 h-12 rounded-2xl items-center justify-center'
                              style={{
                                backgroundColor: cColor + '30',
                                borderWidth: isSelected ? 2 : 0,
                                borderColor: isSelected
                                  ? cColor
                                  : 'transparent',
                              }}
                            >
                              <Icon
                                size={20}
                                color={cColor}
                                strokeWidth={2.5}
                              />
                            </View>
                            <Text
                              className={`font-ibm-semibold text-[10px] ${isSelected ? 'text-neutral-800' : 'text-neutral-500'}`}
                            >
                              {c.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    <TouchableOpacity
                      onPress={onCatCreate}
                      className='items-center gap-1'
                      activeOpacity={0.7}
                    >
                      <View className='w-12 h-12 rounded-2xl items-center justify-center bg-neutral-100 border border-dashed border-neutral-300'>
                        <Plus size={18} color='#A3A3A3' strokeWidth={2} />
                      </View>
                      <Text className='font-ibm-semibold text-[10px] text-neutral-600'>
                        추가
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>

              {/* 결제수단 선택 (지출일 때) */}
              {txModal.form.type === 'expense' && (
                <View className='mb-4'>
                  <View className='flex-row items-center justify-between mb-2 ml-1 mr-1'>
                    <Text className='font-ibm-semibold text-xs text-neutral-600'>
                      결제수단
                    </Text>
                    {paymentMethods.length > 0 && (
                      <TouchableOpacity
                        onPress={() =>
                          setTxModal(s => ({ ...s, view: 'pmMgmt' }))
                        }
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text className='font-ibm-semibold text-xs text-neutral-600 bg-neutral-200 rounded-2xl px-2 py-0.5'>
                          수정
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps='handled'
                  >
                    <View className='flex-row gap-2 pr-2'>
                      {paymentMethods.map(pm => {
                        const isSelected =
                          txModal.form.payment_method_id === pm.id;
                        return (
                          <TouchableOpacity
                            key={pm.id}
                            onPress={() => {
                              setTxModal(s => ({
                                ...s,
                                form: {
                                  ...s.form,
                                  payment_method_id: isSelected ? null : pm.id,
                                  asset_id: null,
                                },
                              }));
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light,
                              );
                            }}
                            className='items-center gap-1'
                            activeOpacity={0.7}
                          >
                            <View
                              className='w-12 h-12 rounded-2xl items-center justify-center'
                              style={{
                                backgroundColor: pm.color + '30',
                                borderWidth: isSelected ? 2 : 0,
                                borderColor: isSelected
                                  ? pm.color
                                  : 'transparent',
                              }}
                            >
                              <Wallet
                                size={20}
                                color={pm.color}
                                strokeWidth={2.5}
                              />
                            </View>
                            <Text
                              className={`font-ibm-semibold text-[10px] ${isSelected ? 'text-neutral-800' : 'text-neutral-500'}`}
                              numberOfLines={1}
                            >
                              {pm.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                      {bankCashAssets.map((asset: Asset) => {
                        const isSelected = txModal.form.asset_id === asset.id;
                        const { Icon: AssetIcon, color: assetColor } =
                          getAssetTypeOption(asset.type);
                        return (
                          <TouchableOpacity
                            key={`asset-${asset.id}`}
                            onPress={() => {
                              setTxModal(s => ({
                                ...s,
                                form: {
                                  ...s.form,
                                  asset_id: isSelected ? null : asset.id,
                                  payment_method_id: null,
                                },
                              }));
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light,
                              );
                            }}
                            className='items-center gap-1'
                            activeOpacity={0.7}
                          >
                            <View
                              className='w-12 h-12 rounded-2xl items-center justify-center'
                              style={{
                                backgroundColor: assetColor + '30',
                                borderWidth: isSelected ? 2 : 0,
                                borderColor: isSelected
                                  ? assetColor
                                  : 'transparent',
                              }}
                            >
                              <AssetIcon
                                size={20}
                                color={assetColor}
                                strokeWidth={2.5}
                              />
                            </View>
                            <Text
                              className={`font-ibm-semibold text-[10px] ${isSelected ? 'text-neutral-800' : 'text-neutral-500'}`}
                              numberOfLines={1}
                            >
                              {asset.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                      <TouchableOpacity
                        onPress={() =>
                          setTxModal(s => ({
                            ...s,
                            view: 'pmForm',
                            pmEditingId: null,
                            pmForm: INITIAL_PM_FORM,
                          }))
                        }
                        className='items-center gap-1'
                        activeOpacity={0.7}
                      >
                        <View className='w-12 h-12 rounded-2xl items-center justify-center bg-neutral-100 border border-dashed border-neutral-300'>
                          <Plus size={18} color='#A3A3A3' strokeWidth={2} />
                        </View>
                        <Text className='font-ibm-semibold text-[10px] text-neutral-600'>
                          추가
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              )}

              <View className='mb-2'>
                <Text className='font-ibm-semibold text-xs text-neutral-600 mb-2 ml-1'>
                  {'누가'}
                </Text>
                <View className='flex-row gap-2'>
                  {tagOptions.map(({ value, label }) => (
                    <TouchableOpacity
                      key={value}
                      onPress={() =>
                        setTxModal(s => ({
                          ...s,
                          form: { ...s.form, tag: value },
                        }))
                      }
                      className={`flex-1 py-2.5 rounded-2xl items-center ${txModal.form.tag === value ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`font-ibm-semibold text-sm ${txModal.form.tag === value ? 'text-neutral-800' : 'text-neutral-500'}`}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* 하단 버튼 */}
            <View
              className='px-6 pb-6 pt-3 gap-3'
              style={{ borderTopWidth: 1, borderTopColor: Colors.cream }}
            >
              {txModal.editingId && (
                <TouchableOpacity
                  onPress={() => onTxDelete(txModal.editingId!)}
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
                    내역 삭제
                  </Text>
                </TouchableOpacity>
              )}
              <SaveButton
                onPress={handleTxSavePress}
                isSaving={isTxSaving}
                label={txModal.editingId ? '수정 완료' : '저장'}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* 카테고리 관리 모달 */}
      <Modal
        visible={txModal.visible && txModal.view === 'catMgmt'}
        animationType='none'
        onRequestClose={() => setTxModal(s => ({ ...s, view: 'tx' }))}
      >
        <CategoryManagementScreen
          categories={categories}
          filterType={txModal.form.type}
          onBack={() => setTxModal(s => ({ ...s, view: 'tx' }))}
          onCreate={onCatCreate}
          onEdit={onCatEdit}
          onDelete={onCatDelete}
        />
      </Modal>

      {/* 카테고리 추가/수정 모달 */}
      <Modal
        visible={txModal.visible && txModal.view === 'catForm'}
        animationType='none'
        onRequestClose={() =>
          setTxModal(s => ({ ...s, view: s.catFormSource }))
        }
      >
        <CategoryFormScreen
          editingId={txModal.catEditingId}
          form={txModal.catForm}
          isSaving={isCatSaving}
          categoryType={txModal.catCategoryType}
          onBack={() => setTxModal(s => ({ ...s, view: s.catFormSource }))}
          onChange={catForm => setTxModal(s => ({ ...s, catForm }))}
          onSave={onCatSave}
          onDelete={
            txModal.catEditingId
              ? () => onCatDelete(txModal.catEditingId!)
              : undefined
          }
          onTypeChange={type =>
            setTxModal(s => ({ ...s, catCategoryType: type }))
          }
        />
      </Modal>

      {/* 결제수단 관리 모달 */}
      <Modal
        visible={txModal.visible && txModal.view === 'pmMgmt'}
        animationType='none'
        onRequestClose={() => setTxModal(s => ({ ...s, view: 'tx' }))}
      >
        <SafeAreaView className='flex-1 bg-white'>
          <View className='flex-row items-center justify-between px-6 pt-5 mb-5'>
            <TouchableOpacity
              onPress={() => setTxModal(s => ({ ...s, view: 'tx' }))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronLeft size={22} color={Colors.brown} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text className='font-ibm-bold text-lg text-neutral-800'>
              결제수단 관리
            </Text>
            <TouchableOpacity
              onPress={() =>
                setTxModal(s => ({
                  ...s,
                  view: 'pmForm',
                  pmEditingId: null,
                  pmForm: INITIAL_PM_FORM,
                }))
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Plus size={22} color={Colors.brown} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          >
            {paymentMethods.length === 0 ? (
              <View className='py-16 items-center gap-2'>
                <Text className='font-ibm-semibold text-sm text-neutral-400'>
                  결제수단이 없어요
                </Text>
              </View>
            ) : (
              <View className='gap-2'>
                {paymentMethods.map(pm => {
                  const pmType = PM_TYPE_OPTIONS.find(t => t.key === pm.type);
                  const Icon = pmType?.Icon ?? Wallet;
                  return (
                    <TouchableOpacity
                      key={pm.id}
                      onPress={() =>
                        setTxModal(s => ({
                          ...s,
                          view: 'pmForm',
                          pmEditingId: pm.id,
                          pmForm: { name: pm.name, type: pm.type },
                        }))
                      }
                      activeOpacity={0.8}
                    >
                      <View className='flex-row items-center gap-3 bg-neutral-50 rounded-2xl px-4 py-3'>
                        <View
                          className='w-10 h-10 rounded-xl items-center justify-center'
                          style={{ backgroundColor: pm.color + '55' }}
                        >
                          <Icon size={18} color={pm.color} strokeWidth={2.5} />
                        </View>
                        <Text className='flex-1 font-ibm-semibold text-sm text-neutral-800'>
                          {pm.name}
                        </Text>
                        <Text className='font-ibm-regular text-xs text-neutral-400'>
                          {pmType?.label ?? ''}
                        </Text>
                        <ChevronRight
                          size={16}
                          color='#D4D4D4'
                          strokeWidth={2}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 결제수단 추가/수정 모달 */}
      <Modal
        visible={txModal.visible && txModal.view === 'pmForm'}
        animationType='none'
        onRequestClose={() =>
          setTxModal(s => ({
            ...s,
            view: s.pmEditingId ? 'pmMgmt' : 'tx',
          }))
        }
      >
        <PaymentMethodFormScreen
          editingId={txModal.pmEditingId}
          form={txModal.pmForm}
          isSaving={isPmSaving}
          onBack={() =>
            setTxModal(s => ({
              ...s,
              view: s.pmEditingId ? 'pmMgmt' : 'tx',
            }))
          }
          onChange={(pmForm: PaymentMethodFormData) =>
            setTxModal(s => ({ ...s, pmForm }))
          }
          onSave={onPmSave}
          onDelete={
            txModal.pmEditingId
              ? () => onPmDelete(txModal.pmEditingId!)
              : undefined
          }
        />
      </Modal>
    </>
  );
}
