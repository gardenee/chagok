# 소셜 로그인 플로우 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 인트로 화면 + 카카오/구글/애플 소셜 로그인 화면 구현 및 Supabase 세션 기반 라우팅 연동

**Architecture:** Supabase `onAuthStateChange`로 세션을 구독하고 Zustand store에 저장. OAuth는 `expo-web-browser`로 인앱 브라우저를 열고 딥링크로 콜백을 받음. Apple은 `expo-apple-authentication` 네이티브 SDK 사용.

**Tech Stack:** Expo SDK 55, Supabase JS v2, expo-apple-authentication, expo-web-browser, expo-linking, NativeWind v4, Zustand, TypeScript

---

### Task 1: 패키지 설치

**Files:**
- Modify: `package.json` (자동)

**Step 1: 패키지 설치**

```bash
cd /Users/garden/Documents/chagok
expo install expo-apple-authentication expo-web-browser expo-linking
```

**Step 2: 설치 확인**

```bash
npx expo install --check
```

Expected: 에러 없음

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add expo-apple-authentication, expo-web-browser, expo-linking"
```

---

### Task 2: app.json에 딥링크 scheme 추가

**Files:**
- Modify: `app.json`

OAuth 콜백을 앱이 받으려면 URL scheme이 필요하다.

**Step 1: app.json 읽기**

파일을 열어 현재 내용 확인.

**Step 2: scheme 추가**

`expo` 객체 안에 아래 추가:

```json
{
  "expo": {
    "scheme": "chagok",
    "ios": {
      "bundleIdentifier": "com.chagok.app",
      "usesAppleSignIn": true
    }
  }
}
```

`scheme`은 OAuth redirect URL에 사용된다: `chagok://auth/callback`
`usesAppleSignIn: true`는 Apple Sign In entitlement 활성화에 필요.

**Step 3: Commit**

```bash
git add app.json
git commit -m "chore: add deep link scheme and Apple Sign In entitlement"
```

---

### Task 3: auth store 업데이트

**Files:**
- Modify: `store/auth.ts`
- Modify: `__tests__/store/auth.test.ts`

기존 `user` 필드를 Supabase `Session` + DB `UserProfile`로 교체한다.

**Step 1: 기존 테스트 실행해서 현재 상태 확인**

```bash
npx jest __tests__/store/auth.test.ts --no-coverage
```

Expected: PASS (기존 테스트 통과)

**Step 2: 새 shape에 맞게 테스트 먼저 수정**

`__tests__/store/auth.test.ts`를 아래로 교체:

```ts
import { useAuthStore } from '../../store/auth';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '../../types/database';

const mockSession = { user: { id: 'user-1' } } as Session;
const mockProfile: UserProfile = {
  id: 'user-1',
  couple_id: null,
  nickname: '가든',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null, userProfile: null });
  });

  it('초기 상태에서 session은 null이다', () => {
    expect(useAuthStore.getState().session).toBeNull();
  });

  it('초기 상태에서 userProfile은 null이다', () => {
    expect(useAuthStore.getState().userProfile).toBeNull();
  });

  it('setSession으로 세션을 설정할 수 있다', () => {
    useAuthStore.getState().setSession(mockSession);
    expect(useAuthStore.getState().session).toEqual(mockSession);
  });

  it('setUserProfile로 프로필을 설정할 수 있다', () => {
    useAuthStore.getState().setUserProfile(mockProfile);
    expect(useAuthStore.getState().userProfile).toEqual(mockProfile);
  });

  it('setSession(null)로 로그아웃할 수 있다', () => {
    useAuthStore.getState().setSession(mockSession);
    useAuthStore.getState().setSession(null);
    expect(useAuthStore.getState().session).toBeNull();
  });
});
```

**Step 3: 테스트 실행 - FAIL 확인**

```bash
npx jest __tests__/store/auth.test.ts --no-coverage
```

Expected: FAIL (`session is not a function` 혹은 유사한 에러)

**Step 4: store/auth.ts 구현**

```ts
import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types/database';

interface AuthState {
  session: Session | null;
  userProfile: UserProfile | null;
  setSession: (session: Session | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  userProfile: null,
  setSession: (session) => set({ session }),
  setUserProfile: (userProfile) => set({ userProfile }),
}));
```

**Step 5: 테스트 실행 - PASS 확인**

```bash
npx jest __tests__/store/auth.test.ts --no-coverage
```

Expected: PASS (5개 테스트)

**Step 6: Commit**

```bash
git add store/auth.ts __tests__/store/auth.test.ts
git commit -m "feat: update auth store to session/userProfile shape"
```

---

### Task 4: app/_layout.tsx — Supabase 세션 구독 + 라우팅 업데이트

**Files:**
- Modify: `app/_layout.tsx`

**Step 1: 현재 _layout.tsx 읽기**

내용 확인 후 아래로 교체:

```tsx
import '../global.css';
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function RootLayoutNav() {
  const { session, userProfile, setSession, setUserProfile } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Supabase 세션 구독
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);

        if (newSession) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', newSession.user.id)
            .single();
          setUserProfile(data);
        } else {
          setUserProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // 라우팅 분기
  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, segments]);

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

**Step 2: TypeScript 에러 없는지 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

**Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: add Supabase session subscription and auth routing"
```

---

### Task 5: app/(auth)/_layout.tsx — index 화면 등록

**Files:**
- Modify: `app/(auth)/_layout.tsx`

**Step 1: 현재 파일 확인 후 수정**

```tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
    </Stack>
  );
}
```

**Step 2: Commit**

```bash
git add app/(auth)/_layout.tsx
git commit -m "feat: add index screen to auth stack"
```

---

### Task 6: 인트로 화면 생성

**Files:**
- Create: `app/(auth)/index.tsx`

클레이모피즘 스타일 인트로 화면. 로고 + 슬로건 + "시작하기" 버튼.

**Step 1: 파일 생성**

```tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Leaf } from 'lucide-react-native';

export default function IntroScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-cream items-center justify-center px-8">
      {/* 로고 영역 */}
      <View
        className="w-24 h-24 bg-butter rounded-3xl items-center justify-center mb-6"
        style={{
          shadowColor: '#F5E642',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <Leaf size={48} color="#6B7C3A" strokeWidth={2.5} />
      </View>

      {/* 타이틀 */}
      <Text className="text-5xl font-bold text-olive mb-3">차곡</Text>

      {/* 슬로건 */}
      <Text className="text-base text-olive/70 text-center mb-16 leading-6">
        따로의 소비, 같이의 차곡{'\n'}
        우리 둘의 내일이 차곡차곡 쌓여요
      </Text>

      {/* 시작하기 버튼 */}
      <TouchableOpacity
        onPress={() => router.push('/(auth)/login')}
        className="w-full bg-butter rounded-3xl py-4 items-center"
        style={{
          shadowColor: '#F5E642',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 8,
        }}
        activeOpacity={0.85}
      >
        <Text className="text-olive text-lg font-bold">시작하기</Text>
      </TouchableOpacity>
    </View>
  );
}
```

**Step 2: TypeScript 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

**Step 3: Commit**

```bash
git add app/(auth)/index.tsx
git commit -m "feat: add intro screen with claymorphism style"
```

---

### Task 7: 로그인 화면 구현

**Files:**
- Modify: `app/(auth)/login.tsx`
- Create: `lib/auth-helpers.ts`

소셜 로그인 로직은 `lib/auth-helpers.ts`로 분리하고, UI만 `login.tsx`에 둔다.

**Step 1: lib/auth-helpers.ts 생성**

OAuth 공통 로직과 Apple 로직을 분리:

```ts
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from './supabase';

type OAuthProvider = 'kakao' | 'google';

export async function signInWithOAuth(provider: OAuthProvider): Promise<void> {
  const redirectUrl = Linking.createURL('auth/callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) throw error ?? new Error('OAuth URL 생성 실패');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

  if (result.type !== 'success') return;

  // URL 해시에서 토큰 파싱
  const hashPart = result.url.split('#')[1] ?? '';
  const params = new URLSearchParams(hashPart);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) throw new Error('토큰을 받지 못했습니다');

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) throw sessionError;
}

export async function signInWithApple(): Promise<void> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) throw new Error('Apple 인증 토큰이 없습니다');

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });

  if (error) throw error;
}
```

**Step 2: app/(auth)/login.tsx 구현**

```tsx
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useState } from 'react';
import { Chrome, MessageCircle } from 'lucide-react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { signInWithOAuth, signInWithApple } from '../../lib/auth-helpers';

type LoadingState = 'kakao' | 'google' | 'apple' | null;

export default function LoginScreen() {
  const [loading, setLoading] = useState<LoadingState>(null);

  async function handleKakao() {
    try {
      setLoading('kakao');
      await signInWithOAuth('kakao');
    } catch {
      Alert.alert('오류', '카카오 로그인에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(null);
    }
  }

  async function handleGoogle() {
    try {
      setLoading('google');
      await signInWithOAuth('google');
    } catch {
      Alert.alert('오류', '구글 로그인에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(null);
    }
  }

  async function handleApple() {
    try {
      setLoading('apple');
      await signInWithApple();
    } catch {
      Alert.alert('오류', 'Apple 로그인에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <View className="flex-1 bg-cream items-center justify-center px-8">
      <Text className="text-3xl font-bold text-olive mb-2">로그인</Text>
      <Text className="text-sm text-olive/60 mb-12">소셜 계정으로 시작하세요</Text>

      <View className="w-full gap-4">
        {/* 카카오 로그인 */}
        <TouchableOpacity
          onPress={handleKakao}
          disabled={loading !== null}
          className="w-full bg-butter rounded-3xl py-4 flex-row items-center justify-center gap-3"
          style={{
            shadowColor: '#F5E642',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 6,
          }}
          activeOpacity={0.85}
        >
          {loading === 'kakao' ? (
            <ActivityIndicator color="#6B7C3A" />
          ) : (
            <>
              <MessageCircle size={22} color="#6B7C3A" strokeWidth={2.5} />
              <Text className="text-olive font-bold text-base">카카오로 계속하기</Text>
            </>
          )}
        </TouchableOpacity>

        {/* 구글 로그인 */}
        <TouchableOpacity
          onPress={handleGoogle}
          disabled={loading !== null}
          className="w-full bg-white rounded-3xl py-4 flex-row items-center justify-center gap-3 border border-olive/10"
          style={{
            shadowColor: '#6B7C3A',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 6,
          }}
          activeOpacity={0.85}
        >
          {loading === 'google' ? (
            <ActivityIndicator color="#6B7C3A" />
          ) : (
            <>
              <Chrome size={22} color="#6B7C3A" strokeWidth={2.5} />
              <Text className="text-olive font-bold text-base">구글로 계속하기</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Apple 로그인 — iOS만 */}
        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={24}
            style={{ width: '100%', height: 52 }}
            onPress={handleApple}
          />
        )}
      </View>
    </View>
  );
}
```

**Step 3: TypeScript 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

**Step 4: Commit**

```bash
git add app/(auth)/login.tsx lib/auth-helpers.ts
git commit -m "feat: implement social login screen (kakao/google/apple)"
```

---

### Task 8: 전체 테스트 실행

**Step 1: 전체 테스트**

```bash
npx jest --no-coverage
```

Expected: 모든 테스트 PASS

**Step 2: TypeScript 전체 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

---

### Task 9: 수동 테스트 체크리스트

Expo Go 또는 시뮬레이터에서 아래 흐름 확인:

```bash
npx expo start --ios
```

확인 항목:
- [ ] 앱 실행 시 인트로 화면 표시 (크림 배경, 차곡 로고)
- [ ] "시작하기" 버튼 탭 → 로그인 화면으로 전환
- [ ] 로그인 화면에 카카오/구글/Apple 버튼 표시
- [ ] 카카오 버튼 탭 → 인앱 브라우저 열림 (Supabase 대시보드에서 카카오 OAuth 활성화 필요)
- [ ] 구글 버튼 탭 → 인앱 브라우저 열림
- [ ] Apple 버튼 탭 → 시스템 Apple 로그인 팝업
- [ ] 로그인 성공 → 자동으로 (tabs) 화면으로 이동

> **주의**: Supabase 대시보드 > Authentication > Providers에서 카카오/구글/Apple OAuth 앱 키 설정이 사전에 필요합니다. 키 없이는 브라우저가 열려도 에러가 납니다.

---

### 완료 기준

- [ ] `npx jest --no-coverage` 모두 PASS
- [ ] `npx tsc --noEmit` 에러 없음
- [ ] 인트로 → 로그인 화면 전환 동작
- [ ] 소셜 로그인 버튼 3개 렌더링 (iOS 기준)
- [ ] 로그인 성공 시 (tabs)로 라우팅
