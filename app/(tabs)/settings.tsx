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
import { useState, useEffect } from 'react';
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
  Link,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabase';
import { useCouple, useUpdateBookName } from '../../hooks/use-couple';
import { useCoupleMembers } from '../../hooks/use-couple-members';
import { useUpdateNickname } from '../../hooks/use-user';

// ── 설정 행 ─────────────────────────────────────────────────────
type SettingsRowProps = {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
  disabled?: boolean;
};

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
  rightElement,
  disabled = false,
}: SettingsRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress || disabled}
      activeOpacity={onPress && !disabled ? 0.6 : 1}
      className="flex-row items-center px-4 py-4 bg-cream"
    >
      <View className="w-8 h-8 rounded-xl bg-cream-dark/70 items-center justify-center mr-3">
        {icon}
      </View>
      <Text className={`flex-1 font-ibm-semibold text-sm ${disabled ? 'text-neutral-400' : 'text-neutral-800'}`}>
        {label}
      </Text>
      {value ? (
        <Text className="font-ibm-regular text-sm text-neutral-400 mr-1.5">{value}</Text>
      ) : null}
      {rightElement ?? null}
      {showChevron && onPress && !disabled ? (
        <ChevronRight size={16} color="#A3A3A3" strokeWidth={2} />
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

  useEffect(() => {
    if (visible) setText(value);
  }, [visible, value]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end"
      >
        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={onClose} />
        <View
          className="bg-white rounded-t-3xl px-6 pt-5 pb-10"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: -4 },
          }}
        >
          {/* 모달 헤더 */}
          <View className="flex-row items-center justify-between mb-5">
            <Text className="font-ibm-bold text-lg text-neutral-800">{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={22} color="#737373" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* 입력 필드 */}
          <View className="bg-neutral-100 rounded-2xl px-4 py-3.5 mb-5">
            <TextInput
              className="font-ibm-regular text-base text-neutral-800"
              placeholder={placeholder}
              placeholderTextColor="#A3A3A3"
              value={text}
              onChangeText={setText}
              maxLength={maxLength}
              autoFocus
            />
          </View>

          {/* 저장 버튼 */}
          <TouchableOpacity
            onPress={() => onSave(text.trim())}
            disabled={isSaving || !text.trim()}
            activeOpacity={0.8}
            className="bg-butter rounded-2xl py-4 items-center flex-row justify-center gap-2"
            style={{
              shadowColor: Colors.butter,
              shadowOpacity: 0.6,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              borderTopWidth: 2,
              borderTopColor: 'rgba(255, 255, 255, 0.65)',
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

// ── 카드 컨테이너 ────────────────────────────────────────────────
function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="mx-4 bg-cream rounded-3xl overflow-hidden"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 1 },
      }}
    >
      {children}
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-cream-dark mx-4" />;
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
  const isLinked = !!partner;

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
    try {
      await Share.share({
        message: `차곡 초대코드: ${couple.invite_code}\n앱에서 입력해서 함께 시작해요!`,
      });
    } catch {
      Alert.alert('오류', '공유하기 중 문제가 발생했어요');
    }
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
    Alert.alert(
      '계정 탈퇴',
      '탈퇴하면 모든 데이터가 삭제되고 복구할 수 없어요.\n정말 탈퇴할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: () => Alert.alert('준비 중', '계정 탈퇴 기능은 준비 중이에요'),
        },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* 헤더 */}
        <View className="px-6 pt-6 pb-4">
          <Text className="font-ibm-bold text-2xl text-brown-darker">설정</Text>
        </View>

        {/* ── 내 정보 ── */}
        <SettingsCard>
          <SettingsRow
            icon={<User size={16} color="#737373" strokeWidth={2} />}
            label="닉네임"
            value={userProfile?.nickname ?? '-'}
            onPress={() => openEdit('nickname')}
          />
        </SettingsCard>

        {/* ── 우리 커플 ── */}
        <View className="mt-3">
          <SettingsCard>
            <SettingsRow
              icon={<BookOpen size={16} color="#737373" strokeWidth={2} />}
              label="가계부 이름"
              value={coupleLoading ? '...' : (couple?.book_name ?? '-')}
              onPress={() => openEdit('bookName')}
            />
            <Divider />
            <SettingsRow
              icon={<Hash size={16} color="#737373" strokeWidth={2} />}
              label="초대코드"
              value={coupleLoading ? '...' : (isLinked ? undefined : (couple?.invite_code ?? '-'))}
              onPress={isLinked ? undefined : handleShareInviteCode}
              disabled={isLinked}
              rightElement={
                isLinked ? (
                  <View className="flex-row items-center gap-1 bg-lavender/40 rounded-full px-2.5 py-1">
                    <Link size={11} color={Colors.lavender} strokeWidth={2.5} />
                    <Text className="font-ibm-semibold text-xs text-lavender-dark">연동 완료</Text>
                  </View>
                ) : null
              }
              showChevron={!isLinked}
            />
            <Divider />
            <SettingsRow
              icon={<Users size={16} color="#737373" strokeWidth={2} />}
              label="짝꿍"
              value={partner?.nickname ?? '아직 연동 전'}
              showChevron={false}
            />
          </SettingsCard>
        </View>

        {/* ── 알림 (UI only) ── */}
        <View className="mt-3">
          <SettingsCard>
            {[
              { label: '파트너 지출 알림' },
              { label: '댓글 알림' },
              { label: '고정지출 리마인더' },
            ].map((item, i) => (
              <View key={item.label}>
                {i > 0 && <Divider />}
                <View className="flex-row items-center px-4 py-4 bg-cream">
                  <View className="w-8 h-8 rounded-xl bg-cream-dark/70 items-center justify-center mr-3">
                    <Bell size={16} color="#A3A3A3" strokeWidth={2} />
                  </View>
                  <Text className="flex-1 font-ibm-semibold text-sm text-neutral-400">{item.label}</Text>
                  <Switch value={false} disabled />
                </View>
              </View>
            ))}
            <View className="px-4 pb-3">
              <Text className="font-ibm-regular text-xs text-neutral-300 text-center">
                알림 설정은 준비 중이에요
              </Text>
            </View>
          </SettingsCard>
        </View>

        {/* ── 계정 ── */}
        <View className="mt-3">
          <SettingsCard>
            <SettingsRow
              icon={<LogOut size={16} color="#737373" strokeWidth={2} />}
              label="로그아웃"
              onPress={handleLogout}
            />
            <Divider />
            <SettingsRow
              icon={<Trash2 size={16} color="#737373" strokeWidth={2} />}
              label="계정 탈퇴"
              onPress={handleDeleteAccount}
            />
          </SettingsCard>
        </View>
      </ScrollView>

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
    </SafeAreaView>
  );
}
