# 카테고리 관리 화면 개선 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 카테고리 관리 화면 UX 개선 — 배경/그림자 통일, 헤더 개선, 지출·수입 추가 폼 통합 (세그멘트 토글)

**Architecture:** 기존 `CategoryFormScreen` 컴포넌트에 내부 타입 토글 state를 추가해 추가/수정 두 흐름을 하나의 컴포넌트로 처리. 예산 메인 화면과 카테고리 화면의 배경·그림자를 `Shadows.primary`로 통일.

**Tech Stack:** React Native, Expo Router, NativeWind (className), lucide-react-native, expo-haptics

---

### Task 1: 예산 메인 화면 배경·그림자 통일

**Files:**
- Modify: `app/(tabs)/budget/index.tsx`

**Step 1: bg-white → bg-cream, 인라인 cardShadow 제거**

`index.tsx` 상단 인라인 `cardShadow` 상수 제거하고 `Shadows` import 추가:

```tsx
// 제거할 코드 (line 21-27):
const cardShadow = {
  shadowColor: Colors.brown,
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.18,
  shadowRadius: 6,
  elevation: 5,
};

// 추가:
import { Shadows } from '../../../constants/shadows';
```

`ExpenseCard`와 `IncomeCard`의 `style={cardShadow}` → `style={Shadows.primary}`로 교체 (총 3곳: ExpenseCard View, IncomeCard View, 결산 카드 View).

결산 카드 View들도 `style={cardShadow}` → `style={Shadows.primary}`.

`<SafeAreaView className='flex-1 bg-white'>` → `<SafeAreaView className='flex-1 bg-cream'>`.

**Step 2: 앱 실행해서 예산 화면 확인**

cream 배경에 카드들이 그림자와 함께 잘 보이는지 확인.

**Step 3: Commit**

```bash
git add app/(tabs)/budget/index.tsx
git commit -m "style: 예산 메인 화면 배경 cream, 그림자 Shadows.primary 통일"
```

---

### Task 2: 카테고리 관리 화면 헤더 개선 + 섹션 추가버튼 제거

**Files:**
- Modify: `app/(tabs)/budget/categories.tsx`

**Step 1: import Plus 추가**

```tsx
// 기존 import에 Plus 추가
import {
  ArrowLeft,
  Plus,       // 기존에 있음 — 확인 후 없으면 추가
  Wallet,
  TrendingUp,
  ChevronRight,
} from 'lucide-react-native';
```

(이미 `Plus`가 import되어 있으므로 추가 불필요. 확인만.)

**Step 2: 헤더 타이틀 text-2xl → text-xl, + 버튼 추가**

```tsx
{/* 헤더 */}
<View className='flex-row items-center gap-3 px-6 pt-6 pb-2'>
  <TouchableOpacity
    onPress={() => router.back()}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    activeOpacity={0.7}
  >
    <ArrowLeft size={22} color={Colors.brownDarker} strokeWidth={2.5} />
  </TouchableOpacity>
  <Text className='font-ibm-bold text-xl text-brown-darker flex-1'>
    카테고리 관리
  </Text>
  <TouchableOpacity
    onPress={() => openCreate('expense')}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    activeOpacity={0.7}
  >
    <Plus size={22} color={Colors.brownDarker} strokeWidth={2.5} />
  </TouchableOpacity>
</View>
```

**Step 3: 섹션별 "+ 추가" TouchableOpacity 제거**

지출 섹션과 수입 섹션 각각의 `<View className='flex-row items-center justify-between mb-3'>` 안에서
`<TouchableOpacity onPress={() => openCreate('expense'|'income')} ...>` 블록 제거.

섹션 헤더를 단순 텍스트만 남김:

```tsx
{/* 지출 섹션 헤더 */}
<Text className='font-ibm-bold text-base text-neutral-700 mb-3'>
  지출
</Text>

{/* 수입 섹션 헤더 */}
<Text className='font-ibm-bold text-base text-neutral-700 mb-3'>
  수입
</Text>
```

**Step 4: CategoryRow 카드 그림자 Shadows.soft → Shadows.primary**

```tsx
<View
  className='bg-white rounded-3xl px-4 py-3.5 flex-row items-center gap-3'
  style={Shadows.primary}
>
```

**Step 5: 앱에서 카테고리 관리 화면 확인**

- 타이틀 크기 작아졌는지
- 우상단 + 버튼 보이는지
- 섹션별 추가 버튼 사라졌는지
- 카드 그림자 선명해졌는지

**Step 6: Commit**

```bash
git add app/(tabs)/budget/categories.tsx
git commit -m "style: 카테고리 관리 헤더 개선, 섹션 추가버튼 제거, 그림자 강화"
```

---

### Task 3: CategoryFormScreen — 추가 모드 세그멘트 토글 + 수입 예산 필드

**Files:**
- Modify: `components/ui/category-form-screen.tsx`

**Step 1: Props에 onTypeChange 추가**

```tsx
type Props = {
  editingId: string | null;
  form: CategoryFormData;
  isSaving: boolean;
  onBack: () => void;
  onChange: (form: CategoryFormData) => void;
  onSave: () => void;
  onDelete?: () => void;
  mode?: 'budget' | 'category';
  categoryType?: 'expense' | 'income';
  onTypeChange?: (type: 'expense' | 'income') => void;  // 추가
};
```

**Step 2: 타이틀 로직 수정**

추가 모드: "카테고리 추가"
수정 모드: "지출 카테고리 수정" / "수입 카테고리 수정"

```tsx
const title = editingId
  ? isIncome
    ? '수입 카테고리 수정'
    : '지출 카테고리 수정'
  : '카테고리 추가';
```

(budget mode 구분 없이 수정 시엔 타입만으로 결정)

**Step 3: 세그멘트 토글 UI 추가 (추가 모드에만 표시)**

헤더 바로 아래, 이름 필드 위에 삽입:

```tsx
{/* 타입 토글 — 추가 모드에만 표시 */}
{!editingId && (
  <View
    className='flex-row rounded-2xl p-1 mb-6'
    style={{ backgroundColor: Colors.butter }}
  >
    {(['expense', 'income'] as const).map(type => {
      const isActive = categoryType === type;
      return (
        <TouchableOpacity
          key={type}
          onPress={() => onTypeChange?.(type)}
          activeOpacity={0.8}
          className='flex-1 rounded-xl py-2 items-center'
          style={isActive ? { backgroundColor: '#fff' } : undefined}
        >
          <Text
            className='font-ibm-semibold text-sm'
            style={{ color: isActive ? Colors.brownDarker : Colors.brown + '99' }}
          >
            {type === 'expense' ? '지출' : '수입'}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
)}
```

**Step 4: 예산 필드 — 수입도 budget mode에서 표시 (optional)**

기존 조건 `{isBudgetMode && !isIncome && (...)}` 를 아래로 교체:

```tsx
{isBudgetMode && (
  <>
    <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
      {isIncome ? '목표 수입' : '월 예산'}
      {isIncome && (
        <Text className='font-ibm-regular text-xs text-neutral-400'>
          {' '}(선택)
        </Text>
      )}
    </Text>
    <AmountInput
      value={form.budget_amount}
      onChangeText={v => onChange({ ...form, budget_amount: v })}
      placeholder={isIncome ? '목표 수입 금액 (선택)' : '예산 금액을 입력하세요'}
      className='mb-6'
    />
  </>
)}
```

**Step 5: categories.tsx — onTypeChange 연결 + handleSave 수정**

`categories.tsx`의 `ModalState` 및 `setModal` 콜백에 타입 변경 처리 추가:

모달 props에 `onTypeChange` 연결:
```tsx
onTypeChange={type =>
  setModal(s => ({
    ...s,
    categoryType: type,
    form: { ...INITIAL_CATEGORY_FORM },  // 폼 초기화
  }))
}
```

`handleSave`에서 수입 budget_amount 0 강제 제거:
```tsx
// 기존:
const amount = isIncome
  ? 0
  : parseInt(modal.form.budget_amount.replace(/[^0-9]/g, ''), 10);

// 변경:
const amount = parseInt(modal.form.budget_amount.replace(/[^0-9]/g, ''), 10) || 0;

// validation: 지출만 필수
if (!isIncome && (!amount || amount <= 0)) {
  Alert.alert('입력 오류', '예산을 올바르게 입력해주세요');
  return;
}
```

**Step 6: 앱에서 동작 확인**

- 헤더 [+] 클릭 → "카테고리 추가" 타이틀 + 지출/수입 토글 보임
- 토글 전환 시 폼 초기화, 수입 탭에서 "목표 수입 (선택)" 필드 보임
- 카테고리 행 클릭 → 타이틀 "지출/수입 카테고리 수정", 토글 없음
- 수입 카테고리 수정 시 목표 수입 필드 보임 (budget mode)

**Step 7: Commit**

```bash
git add components/ui/category-form-screen.tsx app/(tabs)/budget/categories.tsx
git commit -m "feat: 카테고리 추가 폼 지출/수입 통합 토글, 수입 목표 예산 입력 추가"
```

---

### Task 4: 포맷 검사

**Step 1:**

```bash
npm run format:check
```

실패 시:
```bash
npm run format
npm run format:check
```

**Step 2: Commit (변경사항 있을 경우)**

```bash
git add -A
git commit -m "style: 코드 포맷 정리"
```
