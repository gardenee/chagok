// app/(tabs)/settings.tsx
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useState } from 'react';
import {
  BookOpen,
  Hash,
  User,
  Bell,
  LogOut,
  Trash2,
  ChevronRight,
  X,
  Check,
  Users,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabase';
import { useCouple, useUpdateBookName } from '../../hooks/use-couple';
import { useCoupleMembers } from '../../hooks/use-couple-members';
import { useUpdateNickname } from '../../hooks/use-user';

// ── 섹션 헤더 ──────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="font-ibm-semibold text-xs text-brown/50 mb-2 ml-1 mt-6">
      {title}
    </Text>
  );
}

// ── 설정 행 ─────────────────────────────────────────────────────
type SettingsRowProps = {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
  labelClassName?: string;
};

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
  rightElement,
  labelClassName,
}: SettingsRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className="flex-row items-center px-4 py-3.5 bg-white"
    >
      <View className="w-8 h-8 rounded-xl bg-cream items-center justify-center mr-3">
        {icon}
      </View>
      <Text className={`flex-1 font-ibm-semibold text-sm text-brown ${labelClassName ?? ''}`}>
        {label}
      </Text>
      {value ? (
        <Text className="font-ibm-regular text-sm text-brown/40 mr-2">{value}</Text>
      ) : null}
      {rightElement ?? null}
      {showChevron && onPress ? (
        <ChevronRight size={16} color={Colors.brown + '40'} strokeWidth={2} />
      ) : null}
    </TouchableOpacity>
  );
}

// ── 편집 모달 ────────────────────────────────────────────────────
type EditModalProps = {
  visible: boolean;
  title: string;
  value: string;
  placeholder?: string;
  onClose: () => void;
  onSave: (value: string) => void;
  isSaving: boolean;
  maxLength?: number;
};

function EditModal({
  visible, title, value, placeholder, onClose, onSave, isSaving, maxLength = 20,
}: EditModalProps) {
  const [text, setText] = useState(value);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end"
      >
        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={onClose} />
        <View
          className="bg-cream rounded-t-3xl px-6 pt-5 pb-10"
          style={{
            shadowColor: Colors.brown,
            shadowOpacity: 0.15,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: -4 },
          }}
        >
          <View className="flex-row items-center justify-between mb-5">
            <Text className="font-ibm-bold text-lg text-brown">{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color={Colors.brown} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View
            className="bg-white rounded-2xl px-4 py-3.5 mb-5"
            style={{
              shadowColor: Colors.brown,
              shadowOpacity: 0.06,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <TextInput
              className="font-ibm-regular text-sm text-brown"
              placeholder={placeholder}
              placeholderTextColor={Colors.brown + '40'}
              value={text}
              onChangeText={setText}
              maxLength={maxLength}
              autoFocus
            />
          </View>

          <TouchableOpacity
            onPress={() => onSave(text.trim())}
            disabled={isSaving || !text.trim()}
            className="bg-butter rounded-2xl py-4 items-center flex-row justify-center gap-2"
            activeOpacity={0.8}
            style={{
              shadowColor: Colors.butter,
              shadowOpacity: 0.8,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.brown} />
            ) : (
              <>
                <Check size={18} color={Colors.brown} strokeWidth={2.5} />
                <Text className="font-ibm-bold text-base text-brown">저장</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── 메인 화면 ────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { userProfile } = useAuthStore();
  const { data: couple, isLoading: coupleLoading } = useCouple();
  const { data: members = [] } = useCoupleMembers();
  const updateBookName = useUpdateBookName();
  const updateNickname = useUpdateNickname();

  const [editModal, setEditModal] = useState<{
    type: 'bookName' | 'nickname' | null;
  }>({ type: null });

  const partner = members.find((m) => m.id !== userProfile?.id);

  function openEdit(type: 'bookName' | 'nickname') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditModal({ type });
  }

  function closeEdit() {
    setEditModal({ type: null });
  }

  async function handleSaveBookName(value: string) {
    if (!value) return;
    try {
      await updateBookName.mutateAsync(value);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeEdit();
    } catch {
      Alert.alert('오류', '가계부 이름 변경 중 문제가 발생했어요');
    }
  }

  async function handleSaveNickname(value: string) {
    if (!value) return;
    try {
      await updateNickname.mutateAsync(value);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeEdit();
    } catch {
      Alert.alert('오류', '닉네임 변경 중 문제가 발생했어요');
    }
  }

  async function handleShareInviteCode() {
    if (!couple?.invite_code) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      message: `차곡 초대코드: ${couple.invite_code}\n앱에서 입력해서 함께 시작해요!`,
    });
  }

  function handleLogout() {
    Alert.alert('로그아웃', '정말 로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert('계정 탈퇴', '탈퇴하면 모든 데이터가 삭제되고 복구할 수 없어요.\n정말 탈퇴할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '탈퇴', style: 'destructive', onPress: () => {
        Alert.alert('준비 중', '계정 탈퇴 기능은 준비 중이에요');
      }},
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* 헤더 */}
        <View className="px-6 pt-6 pb-2">
          <Text className="font-ibm-bold text-2xl text-brown">설정</Text>
        </View>

        {/* ── 우리 커플 ── */}
        <SectionHeader title="우리 커플" />
        <View
          className="mx-4 bg-white rounded-3xl overflow-hidden"
          style={{
            shadowColor: Colors.brown,
            shadowOpacity: 0.07,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <SettingsRow
            icon={<BookOpen size={16} color={Colors.brown} strokeWidth={2} />}
            label="가계부 이름"
            value={coupleLoading ? '...' : (couple?.book_name ?? '-')}
            onPress={() => openEdit('bookName')}
          />
          <View className="h-px bg-brown/5 mx-4" />
          <SettingsRow
            icon={<Hash size={16} color={Colors.brown} strokeWidth={2} />}
            label="초대코드"
            value={coupleLoading ? '...' : (couple?.invite_code ?? '-')}
            onPress={handleShareInviteCode}
          />
          <View className="h-px bg-brown/5 mx-4" />
          <SettingsRow
            icon={<Users size={16} color={Colors.brown} strokeWidth={2} />}
            label="파트너"
            value={partner?.nickname ?? '아직 연동 전'}
            showChevron={false}
          />
        </View>

        {/* ── 내 정보 ── */}
        <SectionHeader title="내 정보" />
        <View
          className="mx-4 bg-white rounded-3xl overflow-hidden"
          style={{
            shadowColor: Colors.brown,
            shadowOpacity: 0.07,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <SettingsRow
            icon={<User size={16} color={Colors.brown} strokeWidth={2} />}
            label="닉네임"
            value={userProfile?.nickname ?? '-'}
            onPress={() => openEdit('nickname')}
          />
        </View>

        {/* ── 알림 (UI only) ── */}
        <SectionHeader title="알림" />
        <View
          className="mx-4 bg-white rounded-3xl overflow-hidden"
          style={{
            shadowColor: Colors.brown,
            shadowOpacity: 0.07,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          {[
            { label: '파트너 지출 알림' },
            { label: '댓글 알림' },
            { label: '고정지출 리마인더' },
          ].map((item, i) => (
            <View key={item.label}>
              {i > 0 && <View className="h-px bg-brown/5 mx-4" />}
              <View className="flex-row items-center px-4 py-3.5">
                <View className="w-8 h-8 rounded-xl bg-cream items-center justify-center mr-3">
                  <Bell size={16} color={Colors.brown + '60'} strokeWidth={2} />
                </View>
                <Text className="flex-1 font-ibm-semibold text-sm text-brown/50">{item.label}</Text>
                <Switch value={false} disabled thumbColor={Colors.brown + '30'} />
              </View>
            </View>
          ))}
          <View className="px-4 pb-3">
            <Text className="font-ibm-regular text-xs text-brown/30 text-center">
              알림 설정은 준비 중이에요
            </Text>
          </View>
        </View>

        {/* ── 계정 ── */}
        <SectionHeader title="계정" />
        <View
          className="mx-4 bg-white rounded-3xl overflow-hidden"
          style={{
            shadowColor: Colors.brown,
            shadowOpacity: 0.07,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <SettingsRow
            icon={<LogOut size={16} color={Colors.brown} strokeWidth={2} />}
            label="로그아웃"
            onPress={handleLogout}
          />
          <View className="h-px bg-brown/5 mx-4" />
          <SettingsRow
            icon={<Trash2 size={16} color={Colors.peach} strokeWidth={2} />}
            label="계정 탈퇴"
            labelClassName="text-peach"
            onPress={handleDeleteAccount}
          />
        </View>
      </ScrollView>

      {/* 가계부 이름 편집 모달 */}
      <EditModal
        visible={editModal.type === 'bookName'}
        title="가계부 이름 변경"
        value={couple?.book_name ?? ''}
        placeholder="가계부 이름 입력"
        onClose={closeEdit}
        onSave={handleSaveBookName}
        isSaving={updateBookName.isPending}
      />

      {/* 닉네임 편집 모달 */}
      <EditModal
        visible={editModal.type === 'nickname'}
        title="닉네임 변경"
        value={userProfile?.nickname ?? ''}
        placeholder="닉네임 입력"
        onClose={closeEdit}
        onSave={handleSaveNickname}
        isSaving={updateNickname.isPending}
      />
    </SafeAreaView>
  );
}
