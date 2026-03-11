# 코드베이스 리팩토링 설계

**날짜**: 2026-03-10
**범위**: 전체 (캘린더 제외 — 이미 분리 완료)

---

## 목표

1. 화면 tsx 파일에서 논리적 단위로 컴포넌트 분리 → `components/도메인명/`
2. `components/ui/`에서 도메인이 묻은 컴포넌트를 해당 도메인 폴더로 이동
3. 상대경로 import를 `@/` alias로 일괄 교체
4. CLAUDE.md 컴포넌트 분리 기준 업데이트

---

## 디렉토리 구조

```
components/
  budget/
    category-form-screen.tsx   ← components/ui/에서 이동
    (budget/index.tsx에서 분리한 컴포넌트들)
    (budget/[id].tsx에서 분리한 컴포넌트들)
    (budget/categories.tsx에서 분리한 컴포넌트들)
  assets/
    asset-payment-form-screen.tsx  ← 기존 components/asset/에서 이동
    payment-method-form-screen.tsx ← 기존 components/asset/에서 이동
    (assets.tsx에서 분리한 컴포넌트들)
  fixed/
    (fixed.tsx에서 분리한 컴포넌트들)
  settings/
    (settings.tsx에서 분리한 컴포넌트들)
  ui/
    ← 순수 범용 컴포넌트만 유지 (clay-button, clay-input, bottom-sheet 등)
```

---

## 컴포넌트 분리 기준

논리적 단위(헤더, 카드, 리스트 아이템, 폼, 섹션 등)로 의미 있게 묶이면 분리한다.
**재사용 여부는 고려하지 않는다.**

---

## Alias 적용

`@/` alias는 이미 `tsconfig.json`과 `babel.config.js`에 설정되어 있음.
작업 대상 파일의 모든 상대경로 import를 `@/`로 교체한다.

```ts
// before
import { useTransactions } from '../../../hooks/use-transactions'
// after
import { useTransactions } from '@/hooks/use-transactions'
```

---

## 작업 순서

1. **budget** — `app/(tabs)/budget/index.tsx`, `[id].tsx`, `categories.tsx` + `components/ui/category-form-screen.tsx` 이동
2. **assets** — `app/(tabs)/assets.tsx` + `components/asset/` → `components/assets/` 이름 정리
3. **fixed** — `app/(tabs)/fixed.tsx`
4. **settings** — `app/(tabs)/settings.tsx`
5. **전체 alias sweep** — 나머지 파일(`app/`, `hooks/`, `services/`, `store/` 등) import 일괄 정리

---

## CLAUDE.md 업데이트

**변경 항목**: 컴포넌트 분리 기준

```
기존: 컴포넌트 분리 기준: 같은 UI가 2곳 이상 쓰일 때만 분리
변경: 컴포넌트 분리 기준: 논리적 단위(헤더, 카드, 리스트 아이템, 폼, 섹션 등)로
      의미 있게 묶이면 분리. 재사용 여부 무관
```

---

## 비고

- 캘린더 도메인(`app/(tabs)/calendar.tsx`, `components/calendar/`)은 이미 분리 완료 — 제외
- `components/asset/` 폴더명을 `components/assets/`로 통일 (다른 도메인과 일관성)
- 각 도메인 작업 완료 시 `npm run format:check` 실행
