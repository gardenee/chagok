import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState } from 'react';
import {
  Plus,
  X,
  Check,
  Trash2,
  Landmark,
  Banknote,
  TrendingUp,
  PiggyBank,
  Building2,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset } from '../../hooks/use-assets';
import type { Asset } from '../../types/database';

type AssetType = { key: string; label: string; Icon: LucideIcon; color: string };

const ASSET_TYPES: AssetType[] = [
  { key: 'bank',        label: '은행 계좌', Icon: Landmark,   color: '#B5D5F0' },
  { key: 'cash',        label: '현금',      Icon: Banknote,   color: '#A8D8B0' },
  { key: 'investment',  label: '주식/펀드', Icon: TrendingUp, color: '#D4C5F0' },
  { key: 'saving',      label: '적금/예금', Icon: PiggyBank,  color: '#FAD97A' },
  { key: 'real_estate', label: '부동산',    Icon: Building2,  color: '#F5D0A0' },
  { key: 'other',       label: '기타',      Icon: Wallet,     color: '#F0C5D5' },
];

function getAssetType(key: string): AssetType {
  return ASSET_TYPES.find(t => t.key === key) ?? ASSET_TYPES[ASSET_TYPES.length - 1];
}

function formatAmount(n: number): string {
  return n.toLocaleString('ko-KR');
}

type FormData = {
  name: string;
  amount: string;
  type: string;
};

const INITIAL_FORM: FormData = { name: '', amount: '', type: 'bank' };

export default function AssetsTab() {
  const { data: assets = [], isLoading } = useAssets();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();

  const [modal, setModal] = useState<{ visible: boolean; editingId: string | null; form: FormData }>({
    visible: false, editingId: null, form: INITIAL_FORM,
  });

  const totalAssets = assets.reduce((s, a) => s + a.amount, 0);
  const isSaving = createAsset.isPending || updateAsset.isPending;

  function openCreate() {
    setModal({ visible: true, editingId: null, form: INITIAL_FORM });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  function openEdit(a: Asset) {
    setModal({ visible: true, editingId: a.id, form: { name: a.name, amount: String(a.amount), type: a.type } });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleSave() {
    const name = modal.form.name.trim();
    const amount = parseInt(modal.form.amount.replace(/[^0-9]/g, ''), 10);
    if (!name) { Alert.alert('입력 오류', '자산 이름을 입력해주세요'); return; }
    if (isNaN(amount) || amount < 0) { Alert.alert('입력 오류', '금액을 올바르게 입력해주세요'); return; }
    const type = modal.form.type;
    const { Icon, color } = getAssetType(type);
    try {
      if (modal.editingId) {
        await updateAsset.mutateAsync({ id: modal.editingId, name, amount, type, icon: type, color });
      } else {
        await createAsset.mutateAsync({ name, amount, type, icon: type, color, sort_order: assets.length });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModal(s => ({ ...s, visible: false }));
    } catch { Alert.alert('오류', '저장 중 문제가 발생했어요'); }
  }

  function handleDelete(id: string) {
    Alert.alert('자산 삭제', '이 자산을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => {
        try {
          await deleteAsset.mutateAsync(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setModal(s => ({ ...s, visible: false }));
        } catch { Alert.alert('오류', '삭제 중 문제가 발생했어요'); }
      }},
    ]);
  }

  // 유형별 그룹핑
  const grouped = ASSET_TYPES.map(t => ({
    ...t,
    items: assets.filter(a => a.type === t.key),
  })).filter(g => g.items.length > 0);

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* 헤더 */}
        <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
          <Text className="font-ibm-bold text-2xl text-brown">자산</Text>
          <TouchableOpacity
            onPress={openCreate}
            className="w-10 h-10 rounded-full bg-butter items-center justify-center"
            activeOpacity={0.7}
            style={{ shadowColor: Colors.butter, shadowOpacity: 0.7, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}
          >
            <Plus size={20} color={Colors.brown} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* 총 자산 카드 */}
        <View
          className="mx-4 bg-butter rounded-3xl px-6 py-6"
          style={{ shadowColor: Colors.butter, shadowOpacity: 0.8, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } }}
        >
          <Text className="font-ibm-regular text-sm text-brown/60 mb-1">총 자산</Text>
          <Text className="font-ibm-bold text-3xl text-brown">
            {totalAssets > 0 ? `${formatAmount(totalAssets)}원` : '0원'}
          </Text>
          <Text className="font-ibm-regular text-xs text-brown/50 mt-2">
            항목 {assets.length}개
          </Text>
        </View>

        {/* 유형별 분류 */}
        {isLoading ? (
          <View className="py-16 items-center"><ActivityIndicator color={Colors.butter} /></View>
        ) : assets.length === 0 ? (
          <View className="mx-4 mt-5 bg-cream-dark/40 rounded-3xl py-14 items-center gap-3">
            <Landmark size={32} color={Colors.brown + '30'} strokeWidth={1.5} />
            <Text className="font-ibm-semibold text-sm text-brown/40">등록된 자산이 없어요</Text>
            <Text className="font-ibm-regular text-xs text-brown/30">+ 버튼으로 추가해보세요</Text>
          </View>
        ) : (
          <View className="mx-4 mt-5 gap-5">
            {grouped.map(group => {
              const groupTotal = group.items.reduce((s, a) => s + a.amount, 0);
              return (
                <View key={group.key}>
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2">
                      <group.Icon size={14} color={Colors.brown + '80'} strokeWidth={2} />
                      <Text className="font-ibm-semibold text-xs text-brown/60">{group.label}</Text>
                    </View>
                    <Text className="font-ibm-semibold text-xs text-brown/50">{formatAmount(groupTotal)}원</Text>
                  </View>
                  <View className="gap-2">
                    {group.items.map(a => (
                      <TouchableOpacity key={a.id} onPress={() => openEdit(a)} activeOpacity={0.8}>
                        <View
                          className="bg-white rounded-3xl px-4 py-4 flex-row items-center gap-3"
                          style={{ shadowColor: Colors.brown, shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } }}
                        >
                          <View
                            className="w-11 h-11 rounded-2xl items-center justify-center"
                            style={{ backgroundColor: group.color + '80' }}
                          >
                            <group.Icon size={20} color={Colors.brown} strokeWidth={2.5} />
                          </View>
                          <Text className="flex-1 font-ibm-semibold text-sm text-brown">{a.name}</Text>
                          <Text className="font-ibm-bold text-base text-brown">{formatAmount(a.amount)}원</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── 자산 추가/수정 모달 ── */}
      <Modal visible={modal.visible} animationType="slide" transparent onRequestClose={() => setModal(s => ({ ...s, visible: false }))}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setModal(s => ({ ...s, visible: false }))} />
          <View className="bg-cream rounded-t-3xl px-6 pt-5 pb-10" style={{ shadowColor: Colors.brown, shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: -4 } }}>

            {/* 모달 헤더 */}
            <View className="flex-row items-center justify-between mb-5">
              <Text className="font-ibm-bold text-lg text-brown">{modal.editingId ? '자산 수정' : '자산 추가'}</Text>
              <View className="flex-row items-center gap-3">
                {modal.editingId && (
                  <TouchableOpacity onPress={() => handleDelete(modal.editingId!)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Trash2 size={18} color={Colors.brown + '60'} strokeWidth={2} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setModal(s => ({ ...s, visible: false }))}>
                  <X size={22} color={Colors.brown} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 자산 유형 */}
            <Text className="font-ibm-semibold text-xs text-brown/50 mb-2 ml-1">유형</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {ASSET_TYPES.map(({ key, label, Icon, color }) => {
                const isSelected = modal.form.type === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setModal(s => ({ ...s, form: { ...s.form, type: key } }))}
                    className={`flex-row items-center gap-1.5 px-3 py-2 rounded-2xl ${isSelected ? '' : 'bg-white'}`}
                    style={isSelected ? { backgroundColor: color } : { shadowColor: Colors.brown, shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 1 } }}
                    activeOpacity={0.7}
                  >
                    <Icon size={14} color={Colors.brown} strokeWidth={2.5} />
                    <Text className={`font-ibm-semibold text-xs text-brown ${isSelected ? '' : 'opacity-50'}`}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 자산 이름 */}
            <View className="bg-white rounded-2xl px-4 py-3.5 mb-4" style={{ shadowColor: Colors.brown, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
              <TextInput
                className="font-ibm-regular text-sm text-brown"
                placeholder="자산 이름 (예: 국민은행, 비상금)"
                placeholderTextColor={Colors.brown + '40'}
                value={modal.form.name}
                onChangeText={v => setModal(s => ({ ...s, form: { ...s.form, name: v } }))}
                maxLength={20}
              />
            </View>

            {/* 금액 */}
            <View className="bg-white rounded-2xl px-4 py-3.5 mb-5 flex-row items-center" style={{ shadowColor: Colors.brown, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
              <Text className="font-ibm-semibold text-brown text-base mr-2">₩</Text>
              <TextInput
                className="flex-1 font-ibm-semibold text-base text-brown"
                placeholder="현재 잔액"
                placeholderTextColor={Colors.brown + '40'}
                keyboardType="numeric"
                value={modal.form.amount}
                onChangeText={v => setModal(s => ({ ...s, form: { ...s.form, amount: v.replace(/[^0-9]/g, '') } }))}
              />
              <Text className="font-ibm-regular text-sm text-brown/40">원</Text>
            </View>

            {/* 저장 버튼 */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className="bg-butter rounded-2xl py-4 items-center flex-row justify-center gap-2"
              activeOpacity={0.8}
              style={{ shadowColor: Colors.butter, shadowOpacity: 0.8, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
            >
              {isSaving
                ? <ActivityIndicator color={Colors.brown} />
                : <><Check size={18} color={Colors.brown} strokeWidth={2.5} /><Text className="font-ibm-bold text-base text-brown">{modal.editingId ? '수정 완료' : '저장'}</Text></>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
