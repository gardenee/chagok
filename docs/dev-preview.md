# Dev Preview — 화면 미리보기 도구

인증 플로우 없이 개별 화면을 빠르게 확인하기 위한 개발 전용 라우트.

---

## 접근 방법

### 웹 브라우저에서 (가장 빠름)

```bash
npx expo start --web
```

브라우저가 열리면 주소창에 직접 입력:

```
http://localhost:8081/(dev)
```

Dev Preview 메뉴에서 원하는 화면 탭 → 바로 이동.

특정 화면으로 바로 가려면:

```
http://localhost:8081/(onboarding)/nickname
http://localhost:8081/(onboarding)/couple
http://localhost:8081/(onboarding)/create-couple
http://localhost:8081/(onboarding)/join-couple
http://localhost:8081/(auth)/login
```

### iOS 시뮬레이터에서

```bash
npx expo start --ios
```

시뮬레이터가 열린 후, Expo Go 개발자 메뉴(⌘D)에서 직접 URL 입력은 불가.
대신 `app/(dev)/index.tsx`에서 버튼으로 이동.

앱이 처음 열릴 때 `/(auth)` 로 이동하는데, _layout.tsx에서 `(dev)` 그룹은 auth 검사를 건너뛰므로
웹에서는 URL 직접 접근이 자유롭다.

---

## 파일 구조

```
app/
  (dev)/
    _layout.tsx   # __DEV__ 아닌 경우 null 반환
    index.tsx     # 화면 목록 UI
```

---

## 새 화면 추가하기

`app/(dev)/index.tsx`의 `SCREENS` 배열에 항목 추가:

```ts
{ group: '그룹명', label: '화면 이름', route: '/(그룹)/파일명' },
```

---

## 프로덕션 빌드에서의 동작

- `(dev)/_layout.tsx`: `__DEV__`가 false면 `null` 반환 → 라우트 렌더 안됨
- `(dev)/index.tsx`: `__DEV__`가 false면 `null` 반환
- `app/_layout.tsx`: `__DEV__ && segments[0] === '(dev)'` 조건으로만 허용 → 프로덕션에서 접근 불가

EAS 프로덕션 빌드(`eas build --profile production`)에서는 `__DEV__ === false`이므로 완전히 비활성화됨.

---

## 주의사항

- 온보딩 화면들은 Supabase 연동 로직이 포함되어 있어, 실제 저장 버튼 누르면 오류가 날 수 있음 (세션 없음)
- UI/디자인 확인 용도로만 사용할 것
- Supabase 로직 테스트는 실제 로그인 후 진행
