# 카테고리 관리 화면 개선 설계

Date: 2026-03-10

## 목표

- 카테고리 관리 화면 UX 개선
- 지출/수입 추가 폼 통합
- 배경색·그림자 전역 통일

---

## 변경 범위

### 1. 공통 — 그림자 통일

**문제**: `index.tsx`가 인라인 `cardShadow` (opacity 0.18)를 독자 정의, `categories.tsx`는 `Shadows.soft` (opacity 0.07) 사용 → cream 배경에서 대비 부족.

**해결**: `index.tsx`의 인라인 `cardShadow` → `Shadows.primary`로 교체. `categories.tsx`의 CategoryRow `Shadows.soft` → `Shadows.primary`로 교체.

### 2. 예산 메인 화면 (`index.tsx`)

- `bg-white` → `bg-cream`
- 인라인 `cardShadow` 제거, `Shadows.primary` import 후 사용

### 3. 카테고리 관리 화면 (`categories.tsx`)

**헤더**
- 기존: [←] + "카테고리 관리" (text-2xl) + 없음
- 변경: [←] + "카테고리 관리" (text-xl) + [+] (우상단, Pencil → Plus 아이콘)

**섹션별 "+ 추가" 버튼 제거**
- 헤더 [+] 버튼이 통합 추가를 담당하므로 섹션 우측 추가 버튼 삭제

**모달 열기**
- 헤더 [+] 클릭 → `categoryType: 'expense'` 기본값으로 통합 모달 오픈 (모달 내 토글로 전환 가능)
- 행 클릭 (수정) → `categoryType` 고정, 토글 숨김

### 4. CategoryFormScreen 컴포넌트

**추가 모드 (editingId === null)**
- 타이틀: "카테고리 추가"
- 상단 세그멘트 토글 표시: `[지출] [수입]` (pill 스타일, butter 배경, 선택된 쪽 white pill)
- 토글 전환 시 `categoryType` 변경, `budget_amount` 초기화

**수정 모드 (editingId !== null)**
- 타이틀: `"지출 카테고리 수정"` 또는 `"수입 카테고리 수정"`
- 토글 숨김

**예산 입력 필드**
- 지출 + budget mode: "월 예산" 라벨, 필수
- 수입 + budget mode: "목표 수입" 라벨, 선택 (validation 없음)
- category mode (budget 아님): 숨김 (기존 동일)

**Props 변경**
- `categoryType` prop: 추가 시 초기값, 수정 시 고정값
- 내부에서 `localType` state로 관리 (추가 시 토글로 변경 가능)
- `onChange`에 타입 변경 콜백 필요 → `onTypeChange?: (type: 'expense' | 'income') => void` 추가

### 5. categories.tsx handleSave 수정

```ts
// 수입일 때 budget_amount 0 강제 제거
const amount = parseInt(modal.form.budget_amount.replace(/[^0-9]/g, ''), 10) || 0;
// 지출만 예산 필수 validation
if (!isIncome && (!amount || amount <= 0)) {
  Alert.alert('입력 오류', '예산을 올바르게 입력해주세요');
  return;
}
```

---

## 파일별 작업 목록

| 파일 | 변경 내용 |
|------|-----------|
| `app/(tabs)/budget/index.tsx` | bg-cream, cardShadow → Shadows.primary |
| `app/(tabs)/budget/categories.tsx` | 헤더 개선, 섹션 추가버튼 제거, handleSave 수정, 모달 타입 변경 연동 |
| `components/ui/category-form-screen.tsx` | 세그멘트 토글 추가, 수정 모드 타이틀 변경, 수입 budget 필드 표시 |
