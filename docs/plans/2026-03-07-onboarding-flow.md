# 온보딩 플로우 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 첫 로그인 후 닉네임 설정 → 커플 연동(가계부 만들기/합류) 온보딩 플로우 구현

**Architecture:** `app/_layout.tsx`를 3-way 분기로 수정(세션/프로필/커플 상태 기반), `app/(onboarding)` 그룹 신규 추가. 딥링크(`chagok://join?code=XXXX`) 캡처는 `_layout.tsx`에서 처리해 Zustand `pendingInviteCode`에 저장. 초대 공유는 RN 내장 `Share.share()` + `expo-clipboard` 사용.

**Tech Stack:** Expo Router v4, Zustand, Supabase JS v2, `expo-clipboard`, React Native `Share`

---

## 완성 후 플로우

```
로그인 성공
  ↓
userProfile 없음 → (onboarding)/nickname  [닉네임 입력 → users INSERT]
  ↓
couple_id 없음  → (onboarding)/couple    [새로 만들기 / 합류 선택]
  ├── 새로 만들기 → (onboarding)/create-couple  [가계부 이름 → 초대코드 공유]
  └── 합류하기   → (onboarding)/join-couple    [6자리 코드 입력]
  ↓
(tabs) 메인
```

딥링크 `chagok://join?code=ABCD12` 클릭 시:
- 앱이 켜지면서 코드를 Zustand `pendingInviteCode`에 저장
- 인증/프로필 플로우 완료 후 `join-couple` 화면에서 자동 입력

---

## Task 1: expo-clipboard 설치

**Files:**
- Modify: `package.json` (자동)

**Step 1: 설치**

```bash
npx expo install expo-clipboard
```

Expected: `package.json`에 `"expo-clipboard"` 추가됨

**Step 2: 커밋**

```bash
git add package.json package-lock.json
git commit -m "chore: install expo-clipboard"
```

---

## Task 2: auth store에 pendingInviteCode 추가

**Files:**
- Modify: `store/auth.ts`

**Step 1: 전체 파일 교체**

```ts
import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types/database';

interface AuthState {
  session: Session | null;
  userProfile: UserProfile | null;
  pendingInviteCode: string | null;
  setSession: (session: Session | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setPendingInviteCode: (code: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  userProfile: null,
  pendingInviteCode: null,
  setSession: (session) => set({ session }),
  setUserProfile: (userProfile) => set({ userProfile }),
  setPendingInviteCode: (pendingInviteCode) => set({ pendingInviteCode }),
}));
```

**Step 2: 커밋**

```bash
git add store/auth.ts
git commit -m "feat: add pendingInviteCode to auth store"
```

---

## Task 3: _layout.tsx — 3-way 라우팅 + 딥링크 캡처

**Files:**
- Modify: `app/_layout.tsx`

**Step 1: 전체 파일 교체**

```tsx
import '../global.css';
import { useEffect } from 'react';
import { Slot, useRouter, useSegments, SplashScreen } from 'expo-router';
import * as Linking from 'expo-linking';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  IBMPlexSansKR_400Regular,
  IBMPlexSansKR_600SemiBold,
  IBMPlexSansKR_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-kr';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

function RootLayoutNav() {
  const [fontsLoaded] = useFonts({
    'IBMPlexSansKR-Regular': IBMPlexSansKR_400Regular,
    'IBMPlexSansKR-SemiBold': IBMPlexSansKR_600SemiBold,
    'IBMPlexSansKR-Bold': IBMPlexSansKR_700Bold,
  });
  const { session, userProfile, setSession, setUserProfile, setPendingInviteCode } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // 딥링크 캡처 (chagok://join?code=XXXX)
  useEffect(() => {
    function handleDeepLink(url: string) {
      const parsed = Linking.parse(url);
      if (parsed.path === 'join' && typeof parsed.queryParams?.code === 'string') {
        setPendingInviteCode(parsed.queryParams.code);
      }
    }

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Supabase 세션 구독
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);

        if (newSession) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', newSession.user.id)
            .single();
          if (error && error.code !== 'PGRST116') {
            console.warn('userProfile 조회 실패:', error.message);
          }
          setUserProfile(data ?? null);
        } else {
          setUserProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3-way 라우팅 분기
  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';

    if (!session) {
      // 미로그인 → 인증 화면
      if (!inAuthGroup) router.replace('/(auth)');
    } else if (!userProfile) {
      // 로그인 완료, 프로필 없음 → 닉네임 설정
      if (!inOnboarding) router.replace('/(onboarding)/nickname');
    } else if (!userProfile.couple_id) {
      // 프로필 있음, 커플 미연동 → 커플 연동
      if (!inOnboarding) router.replace('/(onboarding)/couple');
    } else {
      // 모두 완료 → 메인
      if (inAuthGroup || inOnboarding) router.replace('/(tabs)');
    }
  }, [session, userProfile, segments]);

  if (!fontsLoaded) return null;

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
```

**Step 2: 커밋**

```bash
git add app/_layout.tsx
git commit -m "feat: 3-way routing + deep link capture in root layout"
```

---

## Task 4: (onboarding)/_layout.tsx 생성

**Files:**
- Create: `app/(onboarding)/_layout.tsx`

**Step 1: 파일 생성**

```tsx
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="nickname" />
      <Stack.Screen name="couple" />
      <Stack.Screen name="create-couple" />
      <Stack.Screen name="join-couple" />
    </Stack>
  );
}
```

**Step 2: 커밋**

```bash
git add app/(onboarding)/_layout.tsx
git commit -m "feat: add onboarding layout"
```

---

## Task 5: nickname.tsx — 닉네임 설정 화면

**Files:**
- Create: `app/(onboarding)/nickname.tsx`

**Step 1: 파일 생성**

```tsx
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { Colors } from '../../constants/colors';

export default function NicknameScreen() {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const { session, setUserProfile } = useAuthStore();

  async function handleComplete() {
    const trimmed = nickname.trim();
    if (!trimmed) {
      Alert.alert('알림', '별명을 입력해 주세요.');
      return;
    }
    if (!session) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .insert({ id: session.user.id, nickname: trimmed })
        .select()
        .single();

      if (error) throw error;
      setUserProfile(data);
      // _layout.tsx가 couple_id 없음 감지 → /(onboarding)/couple 자동 이동
    } catch {
      Alert.alert('오류', '별명 저장에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-butter px-8">
      <View className="flex-1" />

      <View className="mb-10">
        <Text className="font-ibm-bold text-[40px] text-brown tracking-tight">
          별명을 알려주세요
        </Text>
        <Text className="font-ibm-regular text-base text-brown mt-2">
          파트너에게 표시되는 이름이에요
        </Text>
      </View>

      <View className="mb-8">
        <TextInput
          className="w-full bg-cream rounded-[20px] px-5 py-4 font-ibm-semibold text-lg text-brown"
          placeholder="예: 가든"
          placeholderTextColor={Colors.brown + '60'}
          value={nickname}
          onChangeText={setNickname}
          maxLength={10}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleComplete}
        />
        <Text className="font-ibm-regular text-sm text-brown/50 mt-2 text-right">
          {nickname.length}/10
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleComplete}
        disabled={loading || !nickname.trim()}
        className="w-full bg-brown rounded-[20px] py-4 items-center"
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={Colors.cream} />
        ) : (
          <Text className="font-ibm-bold text-base text-cream">완료</Text>
        )}
      </TouchableOpacity>

      <View className="flex-1" />
    </View>
  );
}
```

**Step 2: 커밋**

```bash
git add app/(onboarding)/nickname.tsx
git commit -m "feat: nickname setup screen"
```

---

## Task 6: couple.tsx — 연동 방법 선택 화면

**Files:**
- Create: `app/(onboarding)/couple.tsx`

**Step 1: 파일 생성**

```tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Key } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth';

export default function CoupleScreen() {
  const router = useRouter();
  const nickname = useAuthStore((s) => s.userProfile?.nickname ?? '');

  return (
    <View className="flex-1 bg-butter px-8">
      <View className="flex-1" />

      <View className="mb-10">
        <Text className="font-ibm-bold text-[40px] text-brown tracking-tight">
          {nickname}님,{'\n'}파트너를 연동해요
        </Text>
        <Text className="font-ibm-regular text-base text-brown mt-2">
          두 사람이 함께 차곡차곡 쌓아요
        </Text>
      </View>

      <View className="gap-3 mb-6">
        <TouchableOpacity
          onPress={() => router.push('/(onboarding)/create-couple')}
          className="w-full bg-brown rounded-[24px] py-5 flex-row items-center justify-center gap-3"
          activeOpacity={0.8}
        >
          <Plus size={22} color={Colors.cream} strokeWidth={2.5} />
          <Text className="font-ibm-bold text-base text-cream">새 가계부 만들기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(onboarding)/join-couple')}
          className="w-full bg-cream rounded-[24px] py-5 flex-row items-center justify-center gap-3"
          activeOpacity={0.8}
        >
          <Key size={22} color={Colors.brown} strokeWidth={2.5} />
          <Text className="font-ibm-bold text-base text-brown">초대코드로 합류하기</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1" />
    </View>
  );
}
```

**Step 2: 커밋**

```bash
git add app/(onboarding)/couple.tsx
git commit -m "feat: couple connection selection screen"
```

---

## Task 7: create-couple.tsx — 가계부 생성 + 초대코드 공유

**Files:**
- Create: `app/(onboarding)/create-couple.tsx`

**동작 흐름:**
1. 가계부 이름 입력 (`name` step)
2. "만들기" → `create_couple(book_name, invite_code)` 호출 (invite_code는 앱에서 6자리 랜덤 생성)
3. 성공 시 → `invite` step으로 전환 (초대코드 카드 + 공유/복사 버튼)
4. `setUserProfile`로 갱신된 프로필 저장 → `_layout.tsx`가 couple_id 감지 → `(tabs)` 이동

**Step 1: 파일 생성**

```tsx
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { Check, Copy, Share2 } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { Colors } from '../../constants/colors';

function generateInviteCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

type Step = 'name' | 'invite';

export default function CreateCoupleScreen() {
  const [step, setStep] = useState<Step>('name');
  const [bookName, setBookName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { session, setUserProfile } = useAuthStore();

  async function handleCreate() {
    const trimmed = bookName.trim();
    if (!trimmed) {
      Alert.alert('알림', '가계부 이름을 입력해 주세요.');
      return;
    }

    try {
      setLoading(true);
      const code = generateInviteCode();

      const { error } = await supabase.rpc('create_couple', {
        book_name: trimmed,
        invite_code: code,
      });
      if (error) throw error;

      // 업데이트된 userProfile 재조회
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session!.user.id)
        .single();
      if (profileError) throw profileError;

      setInviteCode(code);
      setUserProfile(profile);
      setStep('invite');
    } catch {
      Alert.alert('오류', '가계부 생성에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    const deepLink = `chagok://join?code=${inviteCode}`;
    await Share.share({
      message: `차곡 앱에서 같이 가계부를 써요!\n\n초대 코드: ${inviteCode}\n\n앱 설치 후 링크를 탭하거나 코드를 입력하세요:\n${deepLink}`,
    });
  }

  if (step === 'invite') {
    return (
      <View className="flex-1 bg-butter px-8">
        <View className="flex-1" />

        <View className="mb-10">
          <Text className="font-ibm-bold text-[40px] text-brown tracking-tight">
            초대코드를{'\n'}파트너에게 보내요
          </Text>
          <Text className="font-ibm-regular text-base text-brown mt-2">
            파트너가 코드를 입력하면 연동 완료!
          </Text>
        </View>

        {/* 초대코드 카드 */}
        <View className="bg-cream rounded-[24px] py-8 items-center mb-6">
          <Text className="font-ibm-regular text-sm text-brown/60 mb-2">초대 코드</Text>
          <Text className="font-ibm-bold text-[44px] text-brown tracking-widest">
            {inviteCode}
          </Text>
        </View>

        <View className="gap-3 mb-6">
          <TouchableOpacity
            onPress={handleShare}
            className="w-full bg-brown rounded-[20px] py-4 flex-row items-center justify-center gap-2.5"
            activeOpacity={0.8}
          >
            <Share2 size={20} color={Colors.cream} strokeWidth={2.5} />
            <Text className="font-ibm-bold text-base text-cream">공유하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCopy}
            className="w-full bg-cream rounded-[20px] py-4 flex-row items-center justify-center gap-2.5"
            activeOpacity={0.8}
          >
            {copied ? (
              <Check size={20} color={Colors.brown} strokeWidth={2.5} />
            ) : (
              <Copy size={20} color={Colors.brown} strokeWidth={2.5} />
            )}
            <Text className="font-ibm-bold text-base text-brown">
              {copied ? '복사됨!' : '코드 복사'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="font-ibm-regular text-sm text-brown/50 text-center mb-4">
          파트너가 합류하면 자동으로 시작돼요
        </Text>

        <View className="flex-1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-butter px-8">
      <View className="flex-1" />

      <View className="mb-10">
        <Text className="font-ibm-bold text-[40px] text-brown tracking-tight">
          가계부 이름을{'\n'}정해요
        </Text>
        <Text className="font-ibm-regular text-base text-brown mt-2">
          나중에 바꿀 수 있어요
        </Text>
      </View>

      <View className="mb-8">
        <TextInput
          className="w-full bg-cream rounded-[20px] px-5 py-4 font-ibm-semibold text-lg text-brown"
          placeholder="예: 우리 둘의 살림"
          placeholderTextColor={Colors.brown + '60'}
          value={bookName}
          onChangeText={setBookName}
          maxLength={20}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleCreate}
        />
      </View>

      <TouchableOpacity
        onPress={handleCreate}
        disabled={loading || !bookName.trim()}
        className="w-full bg-brown rounded-[20px] py-4 items-center"
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={Colors.cream} />
        ) : (
          <Text className="font-ibm-bold text-base text-cream">만들기</Text>
        )}
      </TouchableOpacity>

      <View className="flex-1" />
    </View>
  );
}
```

**Step 2: 커밋**

```bash
git add app/(onboarding)/create-couple.tsx
git commit -m "feat: create couple screen with invite code sharing"
```

---

## Task 8: join-couple.tsx — 초대코드 입력 화면

**Files:**
- Create: `app/(onboarding)/join-couple.tsx`

**동작 흐름:**
- `pendingInviteCode`(딥링크로 전달된 코드) 있으면 자동 입력
- `join_couple(invite_code)` 호출 → userProfile 재조회 → `setUserProfile` → `_layout.tsx`가 `(tabs)` 이동

**Step 1: 파일 생성**

```tsx
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { Colors } from '../../constants/colors';

export default function JoinCoupleScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { session, pendingInviteCode, setPendingInviteCode, setUserProfile } = useAuthStore();

  // 딥링크로 전달된 코드 자동 입력
  useEffect(() => {
    if (pendingInviteCode) {
      setCode(pendingInviteCode);
    }
  }, [pendingInviteCode]);

  async function handleJoin() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      Alert.alert('알림', '6자리 초대 코드를 입력해 주세요.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.rpc('join_couple', { invite_code: trimmed });
      if (error) {
        if (error.code === 'P0001') {
          Alert.alert('오류', '유효하지 않은 초대 코드예요. 다시 확인해 주세요.');
        } else {
          throw error;
        }
        return;
      }

      // 업데이트된 userProfile 재조회
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session!.user.id)
        .single();
      if (profileError) throw profileError;

      setPendingInviteCode(null);
      setUserProfile(profile);
      // _layout.tsx가 couple_id 감지 → /(tabs) 자동 이동
    } catch {
      Alert.alert('오류', '합류에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-butter px-8">
      <View className="flex-1" />

      <View className="mb-10">
        <Text className="font-ibm-bold text-[40px] text-brown tracking-tight">
          초대 코드를{'\n'}입력해요
        </Text>
        <Text className="font-ibm-regular text-base text-brown mt-2">
          파트너에게 받은 6자리 코드를 입력하세요
        </Text>
      </View>

      <View className="mb-8">
        <TextInput
          className="w-full bg-cream rounded-[20px] px-5 py-4 font-ibm-bold text-[28px] text-brown text-center tracking-widest"
          placeholder="ABC123"
          placeholderTextColor={Colors.brown + '40'}
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          maxLength={6}
          autoFocus
          autoCapitalize="characters"
          returnKeyType="done"
          onSubmitEditing={handleJoin}
        />
      </View>

      <TouchableOpacity
        onPress={handleJoin}
        disabled={loading || code.trim().length !== 6}
        className="w-full bg-brown rounded-[20px] py-4 items-center"
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={Colors.cream} />
        ) : (
          <Text className="font-ibm-bold text-base text-cream">합류하기</Text>
        )}
      </TouchableOpacity>

      <View className="flex-1" />
    </View>
  );
}
```

**Step 2: 커밋**

```bash
git add app/(onboarding)/join-couple.tsx
git commit -m "feat: join couple screen with deep link auto-fill"
```

---

## 완료 확인 체크리스트

- [ ] `expo-clipboard` 설치됨
- [ ] `store/auth.ts`에 `pendingInviteCode` 필드 추가됨
- [ ] `app/_layout.tsx` 3-way 분기 동작 (세션/프로필/커플)
- [ ] 딥링크 `chagok://join?code=XXXX` 캡처됨
- [ ] `(onboarding)/nickname` — 닉네임 입력 후 users INSERT, couple.tsx로 이동
- [ ] `(onboarding)/couple` — 두 버튼 정상 동작
- [ ] `(onboarding)/create-couple` — 가계부 생성 후 초대코드 표시, 공유/복사 동작
- [ ] `(onboarding)/join-couple` — 코드 입력/자동 입력, join_couple 호출 후 (tabs)로 이동
