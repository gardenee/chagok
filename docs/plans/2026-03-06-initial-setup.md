# 차곡 — 초기 프로젝트 세팅 구현 플랜

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expo + Supabase 기반 차곡 앱의 기본 프로젝트 구조를 세팅하고 iOS 시뮬레이터에서 실행되는 상태까지 만든다.

**Architecture:** Expo Router v4 파일 기반 라우팅, NativeWind로 Tailwind CSS 스타일링, Supabase 클라이언트 초기화. 인증 전/후 화면 분기까지 구성.

**Tech Stack:** Expo SDK 52, Expo Router v4, TypeScript, NativeWind v4, Supabase JS v2, Zustand, Reanimated 3, Moti

---

## 사전 조건 확인

- Node v23 (확인됨)
- Xcode 16.2 (확인됨)
- npm v10 (확인됨)
- iOS Simulator: Xcode > Open Developer Tool > Simulator

---

## Task 1: CLI 도구 설치

**Files:**
- 없음 (글로벌 설치)

**Step 1: Expo CLI + EAS CLI 글로벌 설치**

```bash
npm install -g expo-cli eas-cli
```

**Step 2: 설치 확인**

```bash
expo --version
eas --version
```

Expected: 각각 버전 번호 출력

---

## Task 2: Expo 프로젝트 생성

**Files:**
- Create: `/Users/garden/Documents/chagok/` (프로젝트 루트)

**Step 1: 프로젝트 생성**

`/Users/garden/Documents/chagok` 디렉토리에서 실행:

```bash
cd /Users/garden/Documents/chagok
npx create-expo-app@latest . --template blank-typescript
```

> `blank-typescript` 템플릿을 선택한다. 이미 디렉토리가 있으면 덮어쓸지 확인 프롬프트가 뜨는데 yes.

**Step 2: 생성 확인**

```bash
ls
```

Expected: `app.json`, `package.json`, `App.tsx`, `tsconfig.json` 등이 보임

---

## Task 3: Expo Router v4 설치 및 설정

**Files:**
- Modify: `package.json`
- Modify: `app.json`
- Create: `app/_layout.tsx`
- Create: `app/index.tsx`
- Delete: `App.tsx` (Router 쓰면 불필요)

**Step 1: Expo Router 설치**

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
```

**Step 2: app.json 수정 — main 엔트리포인트 변경**

`app.json`의 `expo` 섹션에 추가:

```json
{
  "expo": {
    "scheme": "chagok",
    "web": {
      "bundler": "metro"
    }
  }
}
```

**Step 3: package.json main 필드 수정**

`package.json`에서 `"main"` 필드를 아래로 변경 (없으면 추가):

```json
"main": "expo-router/entry"
```

**Step 4: app/_layout.tsx 생성**

```typescript
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: '차곡' }} />
    </Stack>
  );
}
```

**Step 5: app/index.tsx 생성**

```typescript
import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>차곡 🌿</Text>
    </View>
  );
}
```

**Step 6: App.tsx 삭제**

```bash
rm App.tsx
```

**Step 7: iOS 시뮬레이터에서 실행 확인**

```bash
npx expo start --ios
```

Expected: iOS 시뮬레이터에서 "차곡 🌿" 텍스트가 가운데에 표시됨

---

## Task 4: NativeWind v4 설치 및 설정

**Files:**
- Create: `tailwind.config.js`
- Create: `global.css`
- Modify: `babel.config.js`
- Modify: `metro.config.js` (없으면 생성)
- Modify: `app/_layout.tsx`

**Step 1: NativeWind + Tailwind 설치**

```bash
npx expo install nativewind tailwindcss react-native-reanimated
```

**Step 2: Tailwind 초기화**

```bash
npx tailwindcss init
```

**Step 3: tailwind.config.js 수정**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        butter: '#F5E642',
        olive: '#6B7C3A',
        cream: '#FAFAF5',
        peach: '#FFB5A0',
        lavender: '#C9B8E8',
      },
    },
  },
  plugins: [],
};
```

**Step 4: global.css 생성 (프로젝트 루트)**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 5: babel.config.js 수정**

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

**Step 6: metro.config.js 생성**

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

**Step 7: app/_layout.tsx에서 global.css import 추가**

```typescript
import '../global.css';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: '차곡' }} />
    </Stack>
  );
}
```

**Step 8: nativewind/types.d.ts 선언 파일 생성**

프로젝트 루트에 `nativewind-env.d.ts` 생성:

```typescript
/// <reference types="nativewind/types" />
```

**Step 9: NativeWind 동작 확인 — app/index.tsx 수정**

```typescript
import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-cream">
      <Text className="text-2xl font-bold text-olive">차곡 🌿</Text>
    </View>
  );
}
```

**Step 10: 실행 확인**

```bash
npx expo start --ios --clear
```

Expected: 크림 배경에 올리브색 "차곡 🌿" 텍스트 표시

---

## Task 5: Moti + Reanimated 설정

**Files:**
- Modify: `babel.config.js`

Reanimated는 Task 4에서 이미 설치됨.

**Step 1: Moti 설치**

```bash
npx expo install moti
```

**Step 2: babel.config.js에 reanimated 플러그인 추가**

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

> reanimated 플러그인은 반드시 plugins 배열의 마지막에 위치해야 한다.

**Step 3: 애니메이션 동작 확인 — app/index.tsx 수정**

```typescript
import { View, Text } from 'react-native';
import { MotiView } from 'moti';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-cream">
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600 }}
      >
        <Text className="text-2xl font-bold text-olive">차곡 🌿</Text>
      </MotiView>
    </View>
  );
}
```

**Step 4: 실행 확인**

```bash
npx expo start --ios --clear
```

Expected: 텍스트가 아래에서 위로 fade-in 되며 등장

---

## Task 6: Zustand 설치

**Files:**
- Create: `store/auth.ts`

**Step 1: Zustand 설치**

```bash
npm install zustand
```

**Step 2: 기본 auth 스토어 생성**

`store/auth.ts`:

```typescript
import { create } from 'zustand';

interface User {
  id: string;
  nickname: string;
  coupleId: string | null;
}

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

---

## Task 7: Supabase 클라이언트 설정

**Files:**
- Create: `.env.local`
- Create: `.env.example`
- Create: `lib/supabase.ts`
- Modify: `.gitignore`

**Step 1: Supabase JS 설치**

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

**Step 2: .env.local 생성**

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> Supabase 프로젝트는 https://supabase.com 에서 생성. Project Settings > API에서 URL과 anon key 확인.

**Step 3: .env.example 생성**

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

**Step 4: .gitignore에 .env.local 추가**

`.gitignore` 파일에 아래 줄 추가 (없으면 생성):

```
.env.local
.env*.local
```

**Step 5: lib/supabase.ts 생성**

```typescript
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

---

## Task 8: 프로젝트 폴더 구조 정리

**Files:**
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(auth)/login.tsx`
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/index.tsx`
- Create: `components/.gitkeep`
- Create: `store/.gitkeep` (이미 store/auth.ts 있음)
- Create: `lib/.gitkeep` (이미 lib/supabase.ts 있음)
- Create: `constants/colors.ts`

**Step 1: 인증 라우트 그룹 생성**

`app/(auth)/_layout.tsx`:

```typescript
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}
```

`app/(auth)/login.tsx`:

```typescript
import { View, Text } from 'react-native';

export default function LoginScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-cream">
      <Text className="text-2xl font-bold text-olive">로그인</Text>
    </View>
  );
}
```

**Step 2: 탭 라우트 그룹 생성**

`app/(tabs)/_layout.tsx`:

```typescript
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: '홈' }} />
    </Tabs>
  );
}
```

`app/(tabs)/index.tsx`:

```typescript
import { View, Text } from 'react-native';

export default function HomeTab() {
  return (
    <View className="flex-1 items-center justify-center bg-cream">
      <Text className="text-olive">홈</Text>
    </View>
  );
}
```

**Step 3: 루트 _layout.tsx를 인증 분기 포함하도록 수정**

`app/_layout.tsx`:

```typescript
import '../global.css';
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/auth';

export default function RootLayout() {
  const user = useAuthStore((state) => state.user);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, segments]);

  return <Slot />;
}
```

**Step 4: constants/colors.ts 생성**

```typescript
export const Colors = {
  butter: '#F5E642',
  olive: '#6B7C3A',
  cream: '#FAFAF5',
  peach: '#FFB5A0',
  lavender: '#C9B8E8',
  white: '#FFFFFF',
  black: '#1A1A1A',
  gray: {
    100: '#F5F5F0',
    200: '#E8E8E0',
    400: '#A0A090',
    600: '#6B6B60',
  },
} as const;
```

**Step 5: 실행 확인**

```bash
npx expo start --ios --clear
```

Expected: 로그인 화면이 표시됨 (user가 null이므로 (auth)/login으로 리다이렉트)

---

## Task 9: 테스트 환경 설정

**Files:**
- Modify: `package.json`
- Create: `jest.config.js`
- Create: `__tests__/store/auth.test.ts`

**Step 1: Jest + React Native Testing Library 설치**

```bash
npm install --save-dev jest jest-expo @testing-library/react-native @testing-library/jest-native
```

**Step 2: jest.config.js 생성**

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterFramework: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
```

**Step 3: auth 스토어 테스트 작성**

`__tests__/store/auth.test.ts`:

```typescript
import { useAuthStore } from '../../store/auth';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null });
  });

  it('초기 상태에서 user는 null이다', () => {
    const { user } = useAuthStore.getState();
    expect(user).toBeNull();
  });

  it('setUser로 사용자를 설정할 수 있다', () => {
    const mockUser = { id: '1', nickname: '가든', coupleId: null };
    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('setUser(null)로 로그아웃할 수 있다', () => {
    useAuthStore.getState().setUser({ id: '1', nickname: '가든', coupleId: null });
    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
```

**Step 4: 테스트 실행 확인**

```bash
npx jest
```

Expected: 3 tests passed

---

## Task 10: Git 초기화 및 첫 커밋

**Step 1: git init**

```bash
cd /Users/garden/Documents/chagok
git init
```

**Step 2: .gitignore 확인 — 아래 항목이 포함되어 있어야 함**

```
node_modules/
.expo/
dist/
.env.local
.env*.local
ios/
android/
```

**Step 3: 초기 커밋**

```bash
git add .
git commit -m "$(cat <<'EOF'
chore: 차곡 프로젝트 초기 세팅

- Expo SDK 52 + Expo Router v4
- NativeWind v4 (Tailwind CSS)
- Reanimated 3 + Moti
- Zustand auth store
- Supabase 클라이언트 설정
- Jest + RNTL 테스트 환경
- 인증/탭 라우트 그룹 분기 구조

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## 완료 후 상태

```
chagok/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   └── _layout.tsx
├── components/
├── constants/
│   └── colors.ts
├── lib/
│   └── supabase.ts
├── store/
│   └── auth.ts
├── __tests__/
│   └── store/
│       └── auth.test.ts
├── docs/
│   └── plans/
│       ├── 2026-03-06-chagok-design.md
│       └── 2026-03-06-initial-setup.md
├── global.css
├── tailwind.config.js
├── metro.config.js
├── babel.config.js
├── jest.config.js
├── nativewind-env.d.ts
├── .env.example
└── .env.local  (gitignore됨)
```

iOS 시뮬레이터에서 앱이 실행되고, 로그인 화면으로 자동 리다이렉트되며, 테스트 3개가 모두 통과하는 상태.
