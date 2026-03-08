# 설정 탭 추가 & 탭 구조 개편 구현 플랜

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 홈 탭을 제거하고 설정 탭을 추가하며, 탭 순서를 고정지출→예산→캘린더→자산→설정으로 개편한다.

**Architecture:** 탭 레이아웃 수정 → 서비스/훅 확장 → 설정 화면 UI 구현 순서로 진행. 설정 화면은 4개 섹션(우리 커플, 내 정보, 알림, 계정)으로 구성되며 Supabase에서 데이터를 읽어 편집한다. 알림 섹션은 UI만 구현하고 실제 동작은 비활성 상태로 둔다.

**Tech Stack:** Expo Router v4, NativeWind v4, TanStack React Query, Zustand, Supabase JS v2, React Native Share API

---

## Task 1: 탭 레이아웃 개편 & 홈 탭 제거

**Files:**
- Modify: `app/(tabs)/_layout.tsx`
- Delete: `app/(tabs)/index.tsx`
- Create: `app/(tabs)/settings.tsx` (placeholder)

**Step 1: settings.tsx placeholder 생성**

```tsx
// app/(tabs)/settings.tsx
import { View, Text } from 'react-native';

export default function SettingsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-cream">
      <Text className="font-ibm-semibold text-brown">설정</Text>
    </View>
  );
}
```

**Step 2: `_layout.tsx` 수정**

아래 내용으로 전체 교체한다. 변경 사항:
- 탭 순서: 고정지출(1) → 예산(2) → 캘린더(3) → 자산(4) → 설정(5)
- `예산·결산` → `예산` 이름 변경
- 홈 탭 (`name="index"`) 제거
- 설정 탭 (`name="settings"`) 추가, 아이콘: `Settings`

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { CalendarDays, Repeat, Landmark, BookCheck, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.brown,
        tabBarInactiveTintColor: Colors.brown + '55',
        tabBarStyle: {
          backgroundColor: Colors.cream,
          borderTopColor: '#F0E8D0',
          borderTopWidth: 1,
          paddingBottom: insets.bottom + 4,
          paddingTop: 4,
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontFamily: 'IBMPlexSansKR-SemiBold',
          fontSize: 11,
          marginTop: 1,
        },
      }}
    >
      <Tabs.Screen
        name="fixed"
        options={{
          title: '고정지출',
          tabBarIcon: ({ color, size }) => (
            <Repeat size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: '예산',
          tabBarIcon: ({ color, size }) => (
            <BookCheck size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: '캘린더',
          tabBarIcon: ({ color, size }) => (
            <CalendarDays size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="assets"
        options={{
          title: '자산',
          tabBarIcon: ({ color, size }) => (
            <Landmark size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
```

**Step 3: `index.tsx` 삭제**

```bash
rm app/(tabs)/index.tsx
```

> 주의: `index.tsx`가 삭제되면 Expo Router는 탭 그룹 첫 번째 화면으로 자동 이동한다. `fixed.tsx`가 첫 번째가 된다.

**Step 4: 시뮬레이터에서 확인**

```bash
npx expo start --ios
```

탭 바에 고정지출·예산·캘린더·자산·설정 5개 탭이 나타나는지 확인한다.

**Step 5: 커밋**

```bash
git add app/(tabs)/_layout.tsx app/(tabs)/settings.tsx
git rm app/(tabs)/index.tsx
git commit -m "feat: 탭 구조 개편 — 홈 제거, 설정 탭 추가, 순서 조정"
```

---

## Task 2: couple 서비스 확장 (getCoupleInfo, updateBookName)

설정 화면에서 가계부 이름과 초대코드를 표시하고 수정하려면 `couples` 테이블에서 데이터를 읽고 써야 한다.

**Files:**
- Modify: `services/couple.ts`
- Modify: `hooks/use-couple.ts`

**Step 1: `services/couple.ts`에 함수 추가**

파일 하단에 다음 두 함수를 추가한다.

```typescript
import type { Couple } from '../types/database';

export async function getCoupleInfo(coupleId: string): Promise<Couple> {
  const { data, error } = await supabase
    .from('couples')
    .select('*')
    .eq('id', coupleId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateBookName(coupleId: string, bookName: string): Promise<void> {
  const { error } = await supabase
    .from('couples')
    .update({ book_name: bookName })
    .eq('id', coupleId);
  if (error) throw error;
}
```

**Step 2: `hooks/use-couple.ts`에 훅 추가**

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCouple, joinCouple, getCoupleInfo, updateBookName } from '../services/couple';
import { useAuthStore } from '../store/auth';

// 기존 useCreateCouple, useJoinCouple은 유지하고 아래를 추가

export function useCouple() {
  const { userProfile } = useAuthStore();
  const coupleId = userProfile?.couple_id;

  return useQuery({
    queryKey: ['couple', coupleId],
    queryFn: () => getCoupleInfo(coupleId!),
    enabled: !!coupleId,
  });
}

export function useUpdateBookName() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuthStore();
  const coupleId = userProfile?.couple_id;

  return useMutation({
    mutationFn: (bookName: string) => updateBookName(coupleId!, bookName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couple', coupleId] });
    },
  });
}
```

**Step 3: 커밋**

```bash
git add services/couple.ts hooks/use-couple.ts
git commit -m "feat: couple 서비스에 getCoupleInfo, updateBookName 추가"
```

---

## Task 3: user 서비스 확장 (updateNickname)

**Files:**
- Modify: `services/user.ts`
- Modify: `hooks/use-user.ts`

**Step 1: `services/user.ts`에 함수 추가**

파일 하단에 추가한다.

```typescript
export async function updateNickname(userId: string, nickname: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('users')
    .update({ nickname })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
```

**Step 2: `hooks/use-user.ts`에 훅 추가**

```typescript
import { useAuthStore } from '../store/auth';
import { createUserProfile, getUserProfile, updateNickname } from '../services/user';

// 기존 훅 유지하고 아래 추가

export function useUpdateNickname() {
  const { userProfile, setUserProfile } = useAuthStore();

  return useMutation({
    mutationFn: (nickname: string) => updateNickname(userProfile!.id, nickname),
    onSuccess: (updated) => {
      setUserProfile(updated);
    },
  });
}
```

**Step 3: 커밋**

```bash
git add services/user.ts hooks/use-user.ts
git commit -m "feat: user 서비스에 updateNickname 추가"
```

---

## Task 4: 설정 화면 UI 구현

**Files:**
- Modify: `app/(tabs)/settings.tsx`

**전체 화면 구조:**

```
SafeAreaView (bg-cream)
└── ScrollView
    ├── 헤더: "설정" (font-ibm-bold text-2xl text-brown)
    ├── 섹션: 우리 커플
    │   ├── 가계부 이름 (탭 → 편집 모달)
    │   ├── 초대코드 (탭 → 코드 표시 + 공유)
    │   └── 파트너 (닉네임 표시, 읽기 전용)
    ├── 섹션: 내 정보
    │   └── 닉네임 (탭 → 편집 모달)
    ├── 섹션: 알림 (모두 비활성)
    │   ├── 파트너 지출 알림 (Switch, disabled)
    │   ├── 댓글 알림 (Switch, disabled)
    │   └── 고정지출 리마인더 (Switch, disabled)
    └── 섹션: 계정
        ├── 로그아웃 (탭 → Alert 확인 → signOut)
        └── 계정 탈퇴 (빨간색, 탭 → Alert → TODO)
```

**Step 1: settings.tsx 전체 구현**

```tsx
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

  // 모달 열릴 때마다 초기값 동기화
  // visible이 true로 바뀔 때 value로 초기화
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
            icon={<Trash2 size={16} color="#EF4444" strokeWidth={2} />}
            label="계정 탈퇴"
            labelClassName="text-red-500"
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
```

**Step 2: 시뮬레이터에서 확인**

아래 항목을 수동으로 확인한다.

- [ ] 설정 탭 탭했을 때 화면이 보이는가
- [ ] 가계부 이름이 표시되고 탭 시 모달이 열리는가
- [ ] 닉네임이 표시되고 탭 시 모달이 열리는가
- [ ] 초대코드 탭 시 공유 시트가 열리는가
- [ ] 파트너 닉네임이 표시되는가 (미연동 시 "아직 연동 전")
- [ ] 알림 Switch가 비활성 상태로 보이는가
- [ ] 로그아웃 탭 → Alert → 로그아웃 실행되는가
- [ ] 계정 탈퇴 탭 → Alert → "준비 중" 메시지가 나오는가

**Step 3: 커밋**

```bash
git add app/(tabs)/settings.tsx
git commit -m "feat: 설정 화면 구현 (가계부 이름, 닉네임 편집, 초대코드 공유, 로그아웃)"
```

---

## 완료 기준

- [ ] 탭 바에 고정지출·예산·캘린더·자산·설정 5개 탭이 표시된다
- [ ] 홈 탭이 사라졌다
- [ ] 첫 번째 탭(고정지출)이 기본 화면이다
- [ ] 설정 화면 4개 섹션이 모두 표시된다
- [ ] 가계부 이름 편집이 Supabase에 저장된다
- [ ] 닉네임 편집이 Zustand store에도 반영된다
- [ ] 초대코드 공유 시트가 열린다
- [ ] 로그아웃이 동작한다
