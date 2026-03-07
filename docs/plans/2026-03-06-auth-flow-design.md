# 차곡 인증 플로우 설계

## 범위

소셜 로그인 화면 + 인트로 화면 구현. 전체 온보딩(닉네임, 커플 연동, 가계부 이름)은 다음 단계에서 추가.

---

## 화면 구조

```
app/(auth)/
  ├── _layout.tsx     # Stack 레이아웃 (index + login 등록)
  ├── index.tsx       # 인트로 화면 (로고 + "시작하기" 버튼)
  └── login.tsx       # 로그인 화면 (카카오/구글/애플 버튼)
```

---

## 라우팅 로직

`app/_layout.tsx`에서 Supabase `onAuthStateChange` 구독으로 세션 변화 감지.

| 상태 | 이동 |
|------|------|
| 세션 없음 | `/(auth)` (인트로) |
| 세션 있음, 닉네임 없음 | `/(auth)/onboarding/nickname` (추후 구현) |
| 세션 있음, 닉네임 있음 | `/(tabs)` |

현재 구현 범위: "세션 있음 → (tabs)"

---

## 상태 관리 (Zustand auth store)

```ts
interface AuthState {
  session: Session | null
  userProfile: UserProfile | null
  setSession: (session: Session | null) => void
  setUserProfile: (profile: UserProfile | null) => void
}
```

---

## 인트로 화면

- 클레이모피즘 스타일, cream 배경
- 차곡 로고/타이틀 (butter + olive)
- 슬로건 "따로의 소비, 같이의 차곡"
- "시작하기" 버튼 → login 화면으로 push

---

## 로그인 화면

버튼 3개, 클레이모피즘 통일 스타일:

| 버튼 | 구현 방식 |
|------|----------|
| 카카오 로그인 | `supabase.auth.signInWithOAuth({ provider: 'kakao' })` |
| 구글 로그인 | `supabase.auth.signInWithOAuth({ provider: 'google' })` |
| Apple로 로그인 | `expo-apple-authentication` → credential → `supabase.auth.signInWithIdToken` |

로그인 성공 시 `onAuthStateChange`가 감지 → `_layout.tsx`에서 자동 라우팅.

---

## 추가 패키지

```bash
expo install expo-apple-authentication expo-web-browser expo-linking
```

---

## 다음 단계

온보딩 플로우: 닉네임 설정 → 커플 연동 → 가계부 이름 설정

---

## TODO: 출시 전 필수 작업

### 카카오 비즈 앱 전환 및 심사
- **배경**: 카카오 개발 앱 상태에서는 이메일 동의항목을 테스터 계정에만 받을 수 있음. 일반 사용자에게 이메일을 받으려면 비즈 앱 전환 + 카카오 심사 필요.
- **작업**:
  - [ ] 카카오 개발자 콘솔 → 앱 → **비즈니스** 탭 → 비즈 앱 전환 신청
  - [ ] 동의항목(이메일, 닉네임, 프로필 사진) 심사 제출
  - [ ] 심사 완료 후 일반 사용자도 정상 로그인 가능한지 확인
- **참고**: 심사에 수 일~수 주 소요될 수 있으므로 출시 일정보다 미리 진행할 것
