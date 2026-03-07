# 디자인 시스템 리디자인 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 컬러 팔레트를 butter+brown 시스템으로 교체하고, 인트로/로그인 화면을 butter 배경 기반으로 리디자인한다.

**Architecture:** tailwind.config.js + constants/colors.ts를 단일 진실 소스로 삼아 컬러 토큰 교체 → typography.ts 업데이트 → 화면 컴포넌트 순서로 진행. olive → brown 네이밍 교체를 먼저 완료한 후 화면을 건드린다.

**Tech Stack:** NativeWind v4, Tailwind CSS v3, Gowun Dodum (expo-google-fonts), TypeScript, React Native

---

### Task 1: 컬러 팔레트 교체 (토큰 + 전체 olive → brown 교체)

**Files:**
- Modify: `tailwind.config.js`
- Modify: `constants/colors.ts`
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/(auth)/login.tsx`
- Modify: `app/(auth)/index.tsx`

**Step 1: tailwind.config.js 수정**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        butter: '#FAD97A',
        brown: '#7B5E3A',
        cream: '#FEFCF5',
        peach: '#F7B8A0',
        lavender: '#D4C5F0',
      },
      fontFamily: {
        dodum: ['GowunDodum'],
      },
    },
  },
  plugins: [],
};
```

**Step 2: constants/colors.ts 수정**

```ts
export const Colors = {
  butter: '#FAD97A',
  brown: '#7B5E3A',
  cream: '#FEFCF5',
  peach: '#F7B8A0',
  lavender: '#D4C5F0',
  white: '#FFFFFF',
  black: '#1A1A1A',
} as const;
```

**Step 3: 전체 olive 참조 찾아서 brown으로 교체**

아래 파일들의 `olive` → `brown` 전수 교체 (className 문자열, Colors 참조 모두):
- `app/(tabs)/index.tsx`: `text-olive` → `text-brown`
- `app/(auth)/index.tsx`: `text-olive` 등 → `text-brown` (다음 Task에서 전체 교체하므로 일단 치환만)
- `app/(auth)/login.tsx`: `text-olive`, `color="#6B7C3A"` 등 → brown 값으로

**Step 4: TypeScript 확인**

```bash
cd /Users/garden/Documents/chagok
npx tsc --noEmit
```

Expected: `__tests__` 관련 에러 외 없음

**Step 5: Commit**

```bash
git add tailwind.config.js constants/colors.ts app/(tabs)/index.tsx app/(auth)/index.tsx app/(auth)/login.tsx
git commit -m "style: replace olive→brown in color palette and all references"
```

---

### Task 2: 타이포그래피 토큰 업데이트

**Files:**
- Modify: `constants/typography.ts`

butter 배경 위에 쓸 white 변형 토큰을 추가한다.

**Step 1: constants/typography.ts 전체 교체**

```ts
/**
 * 차곡 타이포그래피 시스템 (NativeWind className 토큰)
 *
 * butter 배경 위: display, titleWhite, captionWhite 사용
 * 일반(cream) 배경 위: title, heading, body, caption 사용
 */
export const Typography = {
  // butter 배경 위 — 흰색
  display:      'font-dodum text-5xl text-white',
  titleWhite:   'font-dodum text-3xl text-white',
  captionWhite: 'text-sm text-white/70',

  // 일반 배경 위 — brown 계열
  title:   'font-dodum text-3xl text-brown',
  heading: 'text-lg font-bold text-brown',
  body:    'text-base text-brown/80',
  caption: 'text-sm text-brown/50',
} as const;
```

**Step 2: TypeScript 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음 (`__tests__` 제외)

**Step 3: Commit**

```bash
git add constants/typography.ts
git commit -m "style: add white typography variants for butter background"
```

---

### Task 3: 인트로 화면 리디자인

**Files:**
- Modify: `app/(auth)/index.tsx`

butter 배경 + 흰 텍스트 + cream 버튼으로 전면 교체.

**Step 1: app/(auth)/index.tsx 전체 교체**

```tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../constants/typography';

export default function IntroScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-butter items-center justify-center px-8">
      {/* 타이틀 */}
      <Text className={`${Typography.display} mb-4`}>차곡</Text>

      {/* 슬로건 */}
      <Text className={`${Typography.captionWhite} text-center mb-24 leading-6`}>
        따로의 소비, 같이의 차곡{'\n'}우리 둘의 내일이 차곡차곡 쌓여요
      </Text>

      {/* 시작하기 버튼 */}
      <TouchableOpacity
        onPress={() => router.push('/(auth)/login')}
        className="w-full bg-cream rounded-3xl py-4 items-center"
        style={{
          shadowColor: '#7B5E3A',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 20,
          elevation: 8,
        }}
        activeOpacity={0.88}
      >
        <Text className="text-brown font-bold text-lg">시작하기</Text>
      </TouchableOpacity>
    </View>
  );
}
```

**Step 2: TypeScript 확인**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add app/(auth)/index.tsx
git commit -m "style: redesign intro screen with butter background and white text"
```

---

### Task 4: 로그인 화면 리디자인

**Files:**
- Modify: `app/(auth)/login.tsx`

butter 배경 + cream 카드 버튼 3개 완전 통일. 네이티브 Apple 버튼 제거.

**Step 1: app/(auth)/login.tsx 전체 교체**

```tsx
import {
  View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useState } from 'react';
import { Chrome, MessageCircle, Apple } from 'lucide-react-native';
import { signInWithOAuth, signInWithApple } from '../../lib/auth-helpers';
import { Typography } from '../../constants/typography';
import { Colors } from '../../constants/colors';

type LoadingState = 'kakao' | 'google' | 'apple' | null;

const CARD_SHADOW = {
  shadowColor: '#7B5E3A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.14,
  shadowRadius: 14,
  elevation: 4,
} as const;

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
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        'code' in (err as { code?: string }) &&
        (err as { code?: string }).code === 'ERR_CANCELED'
      ) {
        return;
      }
      Alert.alert('오류', 'Apple 로그인에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(null);
    }
  }

  function SocialButton({
    onPress,
    isLoading,
    icon,
    label,
  }: {
    onPress: () => void;
    isLoading: boolean;
    icon: React.ReactNode;
    label: string;
  }) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={loading !== null}
        className="w-full bg-cream rounded-3xl py-4 flex-row items-center justify-center gap-3"
        style={CARD_SHADOW}
        activeOpacity={0.88}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.brown} />
        ) : (
          <>
            {icon}
            <Text className="text-brown font-bold text-base">{label}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View className="flex-1 bg-butter items-center justify-center px-8">
      <Text className={`${Typography.titleWhite} mb-2`}>로그인</Text>
      <Text className={`${Typography.captionWhite} mb-14`}>
        소셜 계정으로 시작하세요
      </Text>

      <View className="w-full gap-4">
        <SocialButton
          onPress={handleKakao}
          isLoading={loading === 'kakao'}
          icon={<MessageCircle size={20} color={Colors.brown} strokeWidth={2.5} />}
          label="카카오로 계속하기"
        />
        <SocialButton
          onPress={handleGoogle}
          isLoading={loading === 'google'}
          icon={<Chrome size={20} color={Colors.brown} strokeWidth={2.5} />}
          label="구글로 계속하기"
        />
        {Platform.OS === 'ios' && (
          <SocialButton
            onPress={handleApple}
            isLoading={loading === 'apple'}
            icon={<Apple size={20} color={Colors.brown} strokeWidth={2.5} />}
            label="Apple로 계속하기"
          />
        )}
      </View>
    </View>
  );
}
```

**Step 2: TypeScript 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음 (`__tests__` 제외)

**Step 3: Commit**

```bash
git add app/(auth)/login.tsx
git commit -m "style: redesign login screen — butter bg, unified cream social buttons"
```

---

### Task 5: 전체 확인

**Step 1: Jest 테스트**

```bash
cd /Users/garden/Documents/chagok
npx jest --no-coverage
```

Expected: 5 passed

**Step 2: TypeScript 전체**

```bash
npx tsc --noEmit
```

Expected: `__tests__` 관련 외 에러 없음

**Step 3: 시뮬레이터 수동 확인 체크리스트**

```bash
npx expo start --ios
```

- [ ] 인트로 화면: butter 배경, 흰 "차곡" 타이틀 (Gowun Dodum), 흰 슬로건, cream "시작하기" 버튼
- [ ] "시작하기" 탭 → 로그인 화면으로 이동
- [ ] 로그인 화면: butter 배경, 흰 "로그인" 타이틀, cream 카드 버튼 3개 동일한 스타일
- [ ] 버튼 텍스트 모두 brown, 아이콘 모두 brown
- [ ] Apple 버튼 iOS에서만 표시

---

## 완료 기준

- [ ] `npx jest --no-coverage` 5 PASS
- [ ] `npx tsc --noEmit` 앱 코드 에러 없음
- [ ] olive 참조 앱 코드에 전혀 없음 (`grep -r "olive" app/ constants/` 결과 0건)
- [ ] butter `#FAD97A`, brown `#7B5E3A` 적용 확인
