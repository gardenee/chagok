# 코드베이스 리팩토링 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 화면 tsx 파일에서 논리적 단위로 컴포넌트를 분리하고, ui/의 도메인 컴포넌트를 도메인 폴더로 이동하며, 모든 import를 `@/` alias로 통일한다.

**Architecture:** 도메인별로 `components/budget/`, `components/assets/`, `components/fixed/`, `components/settings/`를 운영한다. `components/ui/`는 순수 범용 컴포넌트만 남긴다. `ICON_MAP`은 constants로 분리해 cross-domain 재사용을 허용한다.

**Tech Stack:** React Native, Expo Router, NativeWind, TypeScript, Lucide React Native

---

## Chunk 1: CLAUDE.md 업데이트 + Budget 도메인

### Task 1: CLAUDE.md 컴포넌트 분리 기준 업데이트

**Files:**
- Modify: `CLAUDE.md:101`

- [ ] **Step 1: CLAUDE.md에서 컴포넌트 분리 기준 수정**

  `CLAUDE.md` 101번째 줄을 다음으로 교체:
  ```
  - **컴포넌트 분리 기준**: 논리적 단위(헤더, 카드, 리스트 아이템, 폼, 섹션 등)로 의미 있게 묶이면 분리. 재사용 여부 무관
  ```

- [ ] **Step 2: 커밋**
  ```bash
  git add CLAUDE.md
  git commit -m "docs: 컴포넌트 분리 기준 업데이트 (재사용 무관, 논리적 단위 기준)"
  ```

---

### Task 2: ICON_MAP을 constants로 분리

**Files:**
- Create: `constants/icon-map.ts`
- Modify: `components/ui/category-form-screen.tsx` (import 교체, re-export 추가)

**배경:** `ICON_MAP`은 `budget/`, `fixed/` 양쪽에서 모두 사용된다. `components/budget/`으로 이동하면 `fixed.tsx`가 cross-domain import를 해야 해서, `constants/`에 분리한다.

- [ ] **Step 1: `constants/icon-map.ts` 파일 생성**

  `components/ui/category-form-screen.tsx` 1~85줄의 icon import 목록과 `ICON_MAP` 정의를 그대로 복사해 새 파일 생성:
  ```ts
  import {
    ShoppingCart,
    Utensils,
    Car,
    Home,
    Heart,
    BookOpen,
    Coffee,
    Plane,
    Shirt,
    Zap,
    Gift,
    Wallet,
    Dumbbell,
    Music,
    Baby,
    Scissors,
    PawPrint,
    Smartphone,
    Bot,
    BottleWine,
    Briefcase,
    BusFront,
    Cake,
    Candy,
    ChartCandlestick,
    Joystick,
    Landmark,
    Banknote,
    Laptop,
    TrendingUp,
    Coins,
    Building2,
    type LucideIcon,
  } from 'lucide-react-native';

  export const ICON_MAP: Record<string, LucideIcon> = {
    shopping: ShoppingCart,
    food: Utensils,
    transport: Car,
    home: Home,
    health: Heart,
    education: BookOpen,
    cafe: Coffee,
    travel: Plane,
    fashion: Shirt,
    telecom: Zap,
    gift: Gift,
    wallet: Wallet,
    fitness: Dumbbell,
    music: Music,
    baby: Baby,
    beauty: Scissors,
    pet: PawPrint,
    digital: Smartphone,
    bot: Bot,
    wine: BottleWine,
    work: Briefcase,
    bus: BusFront,
    cake: Cake,
    candy: Candy,
    invest: ChartCandlestick,
    game: Joystick,
    bank: Landmark,
    salary: Banknote,
    freelance: Laptop,
    dividend: TrendingUp,
    allowance: Coins,
    rental: Building2,
  };
  ```

- [ ] **Step 2: `components/ui/category-form-screen.tsx`에서 ICON_MAP을 re-export로 교체**

  기존 `ICON_MAP` 정의를 삭제하고, `@/constants/icon-map`에서 import 후 re-export 추가:
  ```ts
  export { ICON_MAP } from '@/constants/icon-map';
  ```
  (기존 코드와의 하위 호환을 위해 re-export 유지)

- [ ] **Step 3: format 확인**
  ```bash
  npm run format:check
  # 실패 시: npm run format
  ```

- [ ] **Step 4: 커밋**
  ```bash
  git add constants/icon-map.ts components/ui/category-form-screen.tsx
  git commit -m "refactor: ICON_MAP을 constants/icon-map.ts로 분리"
  ```

---

### Task 3: CategoryIcon 공유 컴포넌트 생성

**Files:**
- Create: `components/budget/category-icon.tsx`

**배경:** `CategoryIcon` 함수가 `budget/index.tsx`, `budget/[id].tsx`, `budget/categories.tsx` 세 곳에 동일하게 정의되어 있다.
**주의:** `budget/[id].tsx`의 로컬 `CategoryIcon`은 `size = 20`이 기본값이다. 공유 컴포넌트는 `size = 18`을 기본값으로 하므로, `[id].tsx`에서 사용 시 `size={20}`을 명시적으로 전달해야 한다 (Task 8에서 처리).

- [ ] **Step 1: `components/budget/category-icon.tsx` 생성**

  ```tsx
  import { Wallet } from 'lucide-react-native';
  import type { LucideIcon } from 'lucide-react-native';
  import { ICON_MAP } from '@/constants/icon-map';

  type Props = {
    iconKey: string;
    color: string;
    size?: number;
  };

  export function CategoryIcon({ iconKey, color, size = 18 }: Props) {
    const Icon: LucideIcon = ICON_MAP[iconKey] ?? Wallet;
    return <Icon size={size} color={color} strokeWidth={2.5} />;
  }
  ```

- [ ] **Step 2: format 확인**
  ```bash
  npm run format:check
  # 실패 시: npm run format
  ```

- [ ] **Step 3: 커밋**
  ```bash
  git add components/budget/category-icon.tsx
  git commit -m "refactor: CategoryIcon 공유 컴포넌트 분리"
  ```

---

### Task 4: MonthNavigator 공유 컴포넌트 생성

**Files:**
- Create: `components/budget/month-navigator.tsx`

**배경:** 월 이동 UI가 `budget/index.tsx`와 `budget/[id].tsx`에 동일하게 구현되어 있다.
**주의:** `index.tsx`(344~361줄)는 `pt-1 pb-4` 패딩, `[id].tsx`(269~285줄)는 `py-3` 패딩으로 다르다. `className` prop을 받아 오버라이드 가능하게 만든다.

- [ ] **Step 1: `components/budget/month-navigator.tsx` 생성**

  ```tsx
  import { View, Text, TouchableOpacity } from 'react-native';
  import { ChevronLeft, ChevronRight } from 'lucide-react-native';

  type Props = {
    year: number;
    month: number; // 0-indexed
    onPrev: () => void;
    onNext: () => void;
    className?: string;
  };

  export function MonthNavigator({ year, month, onPrev, onNext, className = 'pt-1 pb-4' }: Props) {
    return (
      <View className={`flex-row items-center justify-center gap-5 px-6 ${className}`}>
        <TouchableOpacity
          onPress={onPrev}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={20} color='#404040' strokeWidth={2.5} />
        </TouchableOpacity>
        <Text className='font-ibm-semibold text-base text-neutral-700 w-24 text-center'>
          {year}년 {month + 1}월
        </Text>
        <TouchableOpacity
          onPress={onNext}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronRight size={20} color='#404040' strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    );
  }
  ```

- [ ] **Step 2: format 확인 후 커밋**
  ```bash
  npm run format:check
  git add components/budget/month-navigator.tsx
  git commit -m "refactor: MonthNavigator 공유 컴포넌트 분리"
  ```

---

### Task 5: BudgetSummaryCards 컴포넌트 분리

**Files:**
- Create: `components/budget/budget-summary-cards.tsx`
- Modify: `app/(tabs)/budget/index.tsx`

**배경:** `budget/index.tsx`에서 수입·지출·결산 세 카드 블록(~90줄)을 분리한다.

- [ ] **Step 1: `components/budget/budget-summary-cards.tsx` 생성**

  `budget/index.tsx`의 `{/* 요약 카드 */}` 블록(대략 368~455줄)을 컴포넌트로 추출:
  ```tsx
  import { View, Text } from 'react-native';
  import { TrendingUp, Wallet, Scale } from 'lucide-react-native';
  import { Colors } from '@/constants/colors';
  import { Shadows } from '@/constants/shadows';
  import { formatAmount } from '@/utils/format';

  type Props = {
    totalIncome: number;
    totalSpent: number;
    totalBudget: number;
  };

  export function BudgetSummaryCards({ totalIncome, totalSpent, totalBudget }: Props) {
    const isOver = totalSpent > totalBudget && totalBudget > 0;
    const balance = totalIncome - totalSpent;
    const isPositive = balance >= 0;

    return (
      <View className='mx-4 mb-4'>
        <View className='flex-row gap-3 mb-3'>
          {/* 총 수입 카드 */}
          <View className='flex-1 bg-olive-light rounded-3xl p-4' style={Shadows.primary}>
            <View className='flex-row items-center gap-2 mb-1'>
              <TrendingUp size={16} color={Colors.oliveDark} strokeWidth={2.5} />
              <Text className='font-ibm-semibold text-xs text-neutral-500'>총 수입</Text>
            </View>
            <Text className='font-ibm-bold text-base' style={{ color: Colors.oliveDark }}>
              {formatAmount(totalIncome)}원
            </Text>
          </View>

          {/* 총 지출 카드 */}
          <View className='flex-1 bg-peach-light rounded-3xl p-4' style={Shadows.primary}>
            <View className='flex-row items-center gap-2 mb-1'>
              <Wallet size={16} color={isOver ? Colors.peachDark : '#a3a3a3'} strokeWidth={2.5} />
              <Text className='font-ibm-semibold text-xs text-neutral-500'>총 지출</Text>
            </View>
            <Text
              className='font-ibm-bold text-base'
              style={{ color: isOver ? Colors.peachDark : '#404040' }}
            >
              {formatAmount(totalSpent)}원
            </Text>
          </View>
        </View>

        {/* 결산 카드 */}
        <View className='bg-white rounded-3xl px-4 py-3' style={Shadows.primary}>
          <View className='flex-row items-center justify-between'>
            <View className='flex-row items-center gap-2'>
              <Scale
                size={16}
                color={isPositive ? Colors.oliveDark : Colors.peachDark}
                strokeWidth={2.5}
              />
              <Text className='font-ibm-semibold text-sm text-neutral-600'>이번달 결산</Text>
            </View>
            <Text
              className='font-ibm-bold text-base'
              style={{ color: isPositive ? Colors.oliveDark : Colors.peachDark }}
            >
              {isPositive
                ? `+${formatAmount(balance)}원`
                : `-${formatAmount(Math.abs(balance))}원`}
            </Text>
          </View>
        </View>
      </View>
    );
  }
  ```

- [ ] **Step 2: `budget/index.tsx`에서 요약 카드 블록을 컴포넌트로 교체**

  - 상단에 `import { BudgetSummaryCards } from '@/components/budget/budget-summary-cards';` 추가
  - 기존 요약 카드 블록 JSX를 `<BudgetSummaryCards totalIncome={totalIncome} totalSpent={totalSpent} totalBudget={totalBudget} />` 으로 교체
  - 기존 import에서 `TrendingUp`, `Scale` 아이콘이 summary에서만 쓰였다면 제거

- [ ] **Step 3: format 확인 후 커밋**
  ```bash
  npm run format:check
  git add components/budget/budget-summary-cards.tsx app/\(tabs\)/budget/index.tsx
  git commit -m "refactor: BudgetSummaryCards 컴포넌트 분리"
  ```

---

### Task 6: ExpenseCard, IncomeCard 컴포넌트 분리

**Files:**
- Create: `components/budget/expense-card.tsx`
- Create: `components/budget/income-card.tsx`
- Modify: `app/(tabs)/budget/index.tsx`

- [ ] **Step 1: `components/budget/expense-card.tsx` 생성**

  `budget/index.tsx` 44~151줄의 `ExpenseCard` 함수 전체를 새 파일로 추출. imports는 `@/` alias 사용:
  ```tsx
  import { View, Text, TouchableOpacity } from 'react-native';
  import { Colors } from '@/constants/colors';
  import { Shadows } from '@/constants/shadows';
  import { IconBox } from '@/components/ui/icon-box';
  import { CategoryIcon } from '@/components/budget/category-icon';
  import { formatAmount } from '@/utils/format';
  import type { Category } from '@/types/database';

  type Props = {
    c: Category;
    spent: number;
    onPress: () => void;
  };

  export function ExpenseCard({ c, spent, onPress }: Props) {
    // ← budget/index.tsx 44~151줄의 함수 body를 그대로 붙여넣는다.
    //   hasBudget, over, diff, ratio, barColor 계산 로직과 JSX 전체 포함.
    //   CategoryIcon import는 위의 @/components/budget/category-icon으로 대체.
  }
  ```

- [ ] **Step 2: `components/budget/income-card.tsx` 생성**

  `budget/index.tsx` 153~256줄의 `IncomeCard` 함수 전체를 새 파일로 추출. imports는 `@/` alias 사용:
  ```tsx
  import { View, Text, TouchableOpacity } from 'react-native';
  import { Colors } from '@/constants/colors';
  import { Shadows } from '@/constants/shadows';
  import { IconBox } from '@/components/ui/icon-box';
  import { CategoryIcon } from '@/components/budget/category-icon';
  import { formatAmount } from '@/utils/format';
  import type { Category } from '@/types/database';

  type Props = {
    c: Category;
    income: number;
    onPress: () => void;
  };

  export function IncomeCard({ c, income, onPress }: Props) {
    // ← budget/index.tsx 153~256줄의 함수 body를 그대로 붙여넣는다.
    //   hasTarget, over, diff, incomeRatio 계산 로직과 JSX 전체 포함.
    //   CategoryIcon import는 위의 @/components/budget/category-icon으로 대체.
  }
  ```

- [ ] **Step 3: `budget/index.tsx` 업데이트**

  - 기존 `ExpenseCard`, `IncomeCard` 함수 정의 삭제
  - 기존 로컬 `CategoryIcon` 함수 정의 삭제
  - import 추가:
    ```ts
    import { ExpenseCard } from '@/components/budget/expense-card';
    import { IncomeCard } from '@/components/budget/income-card';
    ```
  - 기존 `ICON_MAP` import를 `@/constants/icon-map`으로 교체 (또는 사용처 없으면 제거)
  - 나머지 상대경로 imports를 `@/` alias로 교체

- [ ] **Step 4: format 확인 후 커밋**
  ```bash
  npm run format:check
  git add components/budget/expense-card.tsx components/budget/income-card.tsx app/\(tabs\)/budget/index.tsx
  git commit -m "refactor: ExpenseCard, IncomeCard 컴포넌트 분리"
  ```

---

### Task 7: CategoryFormScreen을 budget 도메인으로 이동

**Files:**
- Create: `components/budget/category-form-screen.tsx` (내용 이동)
- Modify: `components/ui/category-form-screen.tsx` (re-export 파일로 변환, 이후 삭제 가능)
- Modify: `app/(tabs)/budget/categories.tsx`

- [ ] **Step 1: `components/budget/category-form-screen.tsx` 생성**

  `components/ui/category-form-screen.tsx` 전체 내용을 복사해 새 파일 생성.
  다음 변경을 적용한다:
  - 1~46줄의 icon imports 전체를 삭제하고 `export { ICON_MAP } from '@/constants/icon-map';` 로 교체
  - 47~50줄의 내부 imports를 `@/` alias로 교체:
    ```ts
    import { Colors } from '@/constants/colors';
    import { SaveButton } from '@/components/ui/save-button';
    import { SegmentControl } from '@/components/ui/segment-control';
    import { ModalTextInput, AmountInput } from '@/components/ui/modal-inputs';
    ```
  - 87번째 줄 이후 (`COLOR_OPTIONS`, `CategoryFormData`, `INITIAL_CATEGORY_FORM`, `CategoryFormScreen` 등)는 변경 없이 그대로 유지

- [ ] **Step 2: `components/ui/category-form-screen.tsx`를 re-export 파일로 변환**

  하위 호환을 위해 기존 파일을 다음 내용으로 교체:
  ```ts
  // 이 파일은 하위 호환용입니다. @/components/budget/category-form-screen 를 직접 import하세요.
  export {
    CategoryFormScreen,
    CategoryFormData,
    INITIAL_CATEGORY_FORM,
    ICON_MAP,
  } from '@/components/budget/category-form-screen';
  ```

- [ ] **Step 3: `budget/categories.tsx` import 경로 업데이트**

  기존:
  ```ts
  import { CategoryFormScreen, ICON_MAP, CategoryFormData, INITIAL_CATEGORY_FORM }
    from '../../../components/ui/category-form-screen';
  ```
  변경:
  ```ts
  import { CategoryFormScreen, ICON_MAP, CategoryFormData, INITIAL_CATEGORY_FORM }
    from '@/components/budget/category-form-screen';
  ```

  그리고 `categories.tsx`의 나머지 상대경로 imports도 `@/` alias로 교체.
  로컬 `CategoryIcon` 함수 삭제 후 import:
  ```ts
  import { CategoryIcon } from '@/components/budget/category-icon';
  ```

- [ ] **Step 4: format 확인 후 커밋**
  ```bash
  npm run format:check
  git add components/budget/category-form-screen.tsx components/ui/category-form-screen.tsx app/\(tabs\)/budget/categories.tsx
  git commit -m "refactor: CategoryFormScreen을 components/budget으로 이동"
  ```

---

### Task 8: CategorySummaryCard 분리 + budget/[id].tsx 정리

**Files:**
- Create: `components/budget/category-summary-card.tsx`
- Create: `components/budget/transaction-item.tsx`
- Modify: `app/(tabs)/budget/[id].tsx`

- [ ] **Step 1: `components/budget/category-summary-card.tsx` 생성**

  `budget/[id].tsx` 183~266줄의 상단 요약 카드 블록을 컴포넌트로 추출. `saveBudget` 함수와 상태는 부모(`[id].tsx`)에 유지하고 props로 전달:
  ```tsx
  import { View, Text, TextInput } from 'react-native';
  import { Colors } from '@/constants/colors';
  import { Shadows } from '@/constants/shadows';
  import { IconBox } from '@/components/ui/icon-box';
  import { CategoryIcon } from '@/components/budget/category-icon';
  import { formatAmount } from '@/utils/format';
  import type { Category } from '@/types/database';

  type Props = {
    category: Category;
    totalAmount: number;
    budgetInput: string;
    isSavingBudget: boolean;
    onBudgetChange: (v: string) => void;
    onBudgetSave: () => void;
  };

  export function CategorySummaryCard({
    category,
    totalAmount,
    budgetInput,
    isSavingBudget,
    onBudgetChange,
    onBudgetSave,
  }: Props) {
    // ← budget/[id].tsx 183~266줄 JSX를 그대로 붙여넣는다.
    //   CategoryIcon 사용 시 size={20} 명시 (공유 컴포넌트 기본값이 18이므로).
    //   budgetInput, setBudgetInput → budgetInput, onBudgetChange로 교체.
    //   onBlur={saveBudget} → onBlur={onBudgetSave} 로 교체.
    //   onSubmitEditing={saveBudget} → onSubmitEditing={onBudgetSave} 로 교체.
    //   setIsSavingBudget 직접 호출 없음 (onBudgetSave만 호출).
  }
  ```

- [ ] **Step 2: `components/budget/transaction-item.tsx` 생성**

  `budget/[id].tsx` 298~329줄의 거래내역 row를 컴포넌트로 추출:
  ```tsx
  import { View, Text } from 'react-native';
  import { Colors } from '@/constants/colors';
  import { Shadows } from '@/constants/shadows';
  import { TagPill } from '@/components/ui/color-pill';
  import { formatAmount } from '@/utils/format';
  import type { Tables } from '@/types/database';

  const TAG_LABELS: Record<string, string> = {
    me: '나',
    partner: '파트너',
    together: '함께',
  };

  type Transaction = Tables<'transactions'>;

  type Props = {
    transaction: Transaction;
  };

  export function TransactionItem({ transaction: t }: Props) {
    // ← budget/[id].tsx 298~329줄 JSX를 그대로 붙여넣는다.
  }
  ```

- [ ] **Step 3: `budget/[id].tsx` 업데이트**

  - 로컬 `CategoryIcon` 함수 삭제 (공유 컴포넌트로 교체)
  - 로컬 `TAG_LABELS` 상수 삭제 (TransactionItem 내부로 이동)
  - import 추가:
    ```ts
    import { CategorySummaryCard } from '@/components/budget/category-summary-card';
    import { TransactionItem } from '@/components/budget/transaction-item';
    import { MonthNavigator } from '@/components/budget/month-navigator';
    ```
  - 해당 JSX 블록을 컴포넌트 호출로 교체:
    ```tsx
    <CategorySummaryCard
      category={category}
      totalAmount={totalAmount}
      budgetInput={budgetInput}
      isSavingBudget={isSavingBudget}
      onBudgetChange={v => setBudgetInput(v.replace(/[^0-9]/g, ''))}
      onBudgetSave={saveBudget}
    />
    <MonthNavigator year={year} month={month} onPrev={prevMonth} onNext={nextMonth} className='py-3' />
    {/* 거래내역 map */}
    {categoryTransactions.map(t => <TransactionItem key={t.id} transaction={t} />)}
    ```
  - 나머지 상대경로 imports를 `@/` alias로 교체

- [ ] **Step 4: format 확인 후 커밋**
  ```bash
  npm run format:check
  git add components/budget/category-summary-card.tsx components/budget/transaction-item.tsx app/\(tabs\)/budget/\[id\].tsx
  git commit -m "refactor: budget/[id].tsx 컴포넌트 분리 (CategorySummaryCard, TransactionItem)"
  ```

---

### Task 9: CategoryRow 분리 + budget/index.tsx MonthNavigator 적용

**Files:**
- Create: `components/budget/category-row.tsx`
- Modify: `app/(tabs)/budget/categories.tsx`
- Modify: `app/(tabs)/budget/index.tsx`

- [ ] **Step 1: `components/budget/category-row.tsx` 생성**

  `budget/categories.tsx`의 `CategoryRow` 함수(175~201줄)를 파일로 추출:
  ```tsx
  import { View, Text, TouchableOpacity } from 'react-native';
  import { ChevronRight } from 'lucide-react-native';
  import { Shadows } from '@/constants/shadows';
  import { IconBox } from '@/components/ui/icon-box';
  import { CategoryIcon } from '@/components/budget/category-icon';
  import { SwipeableDeleteRow } from '@/components/ui/swipeable-delete-row';
  import { formatAmount } from '@/utils/format';
  import type { Category } from '@/types/database';

  type Props = {
    c: Category;
    onEdit: (c: Category) => void;
    onDelete: (id: string) => void;
  };

  export function CategoryRow({ c, onEdit, onDelete }: Props) {
    // 기존 CategoryRow JSX 그대로
  }
  ```

  > 주의: 기존 `CategoryRow`는 부모 스코프의 `openEdit`, `handleDelete`를 클로저로 참조. 추출 시 props로 변경.

- [ ] **Step 2: `budget/categories.tsx` 업데이트**

  - 로컬 `CategoryRow` 함수 정의 삭제
  - import 추가: `import { CategoryRow } from '@/components/budget/category-row';`
  - `<CategoryRow c={c} />` → `<CategoryRow key={c.id} c={c} onEdit={openEdit} onDelete={handleDelete} />`
  - 로컬 `CategoryIcon` 함수 삭제 (Task 7 Step 3에서 이미 처리됨 — 만약 아직 남아있다면 이 단계에서 삭제)

- [ ] **Step 3: `budget/index.tsx`에 MonthNavigator 적용**

  - import 추가: `import { MonthNavigator } from '@/components/budget/month-navigator';`
  - 기존 월 네비게이터 JSX 블록을 교체:
    ```tsx
    <MonthNavigator year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />
    ```

- [ ] **Step 4: format 확인 후 커밋**
  ```bash
  npm run format:check
  git add components/budget/category-row.tsx app/\(tabs\)/budget/categories.tsx app/\(tabs\)/budget/index.tsx
  git commit -m "refactor: CategoryRow 분리, MonthNavigator 적용"
  ```

---

## Chunk 2: Assets 도메인

### Task 10: components/asset/ → components/assets/ 폴더 이름 변경

**Files:**
- Rename: `components/asset/` → `components/assets/`
- Modify: `app/(tabs)/assets.tsx` (import 경로 업데이트)

- [ ] **Step 1: 폴더 이름 변경**
  ```bash
  mv components/asset components/assets
  ```

- [ ] **Step 2: `assets.tsx`의 import 경로 업데이트**

  기존:
  ```ts
  import { ... } from '../../components/asset/asset-payment-form-screen';
  import { ... } from '../../components/asset/payment-method-form-screen';
  ```
  변경:
  ```ts
  import { ... } from '@/components/assets/asset-payment-form-screen';
  import { ... } from '@/components/assets/payment-method-form-screen';
  ```

  그리고 `assets.tsx`의 나머지 상대경로 imports도 `@/` alias로 교체.

- [ ] **Step 3: format 확인 후 커밋**
  ```bash
  npm run format:check
  git add -A components/assets components/asset app/\(tabs\)/assets.tsx
  git commit -m "refactor: components/asset → components/assets 폴더 이름 변경"
  ```

---

### Task 11: AssetGroups 컴포넌트 분리

**Files:**
- Create: `components/assets/asset-groups.tsx`
- Modify: `app/(tabs)/assets.tsx`

**배경:** `assets.tsx`의 자산/부채/보험 섹션을 컴포넌트로 추출.
**주의:** `totalAssets`, `totalLoans`는 `SummaryCard`에도 사용되므로 부모(`assets.tsx`)에 유지. `AssetGroups`는 전체 `assets` 배열을 받아 내부에서 필터링한다. `assetGroups` 계산도 컴포넌트 내부로 이동.

- [ ] **Step 1: `components/assets/asset-groups.tsx` 생성**

  `assets.tsx` 66~75줄의 필터링 로직 + 204~212줄의 `assetGroups` 계산 + 239~371줄의 JSX를 컴포넌트로 추출:
  ```tsx
  import { View, Text } from 'react-native';
  import { CircleMinus, ShieldCheck } from 'lucide-react-native';
  import { Colors } from '@/constants/colors';
  import { ItemCard } from '@/components/ui/item-card';
  import { IconBox } from '@/components/ui/icon-box';
  import { SwipeableDeleteRow } from '@/components/ui/swipeable-delete-row';
  import { EmptyState } from '@/components/ui/empty-state';
  import { LoadingState } from '@/components/ui/loading-state';
  import { getAssetTypeOption, ASSET_TYPE_OPTIONS } from '@/components/assets/asset-payment-form-screen';
  import { formatAmount } from '@/utils/format';
  import { Landmark } from 'lucide-react-native';
  import type { Asset } from '@/types/database';

  type Props = {
    assets: Asset[];
    isLoading: boolean;
    onEdit: (a: Asset) => void;
    onDelete: (id: string) => void;
  };

  export function AssetGroups({ assets, isLoading, onEdit, onDelete }: Props) {
    // ← assets.tsx 66~75줄의 regularAssets/loanAssets/insuranceAssets 필터링,
    //   204~212줄의 assetGroups 계산,
    //   229~371줄의 조건부 렌더링 JSX (isLoading guard 포함)를 그대로 붙여넣는다.
  }
  ```

- [ ] **Step 2: `assets.tsx` 업데이트**

  - import 추가: `import { AssetGroups } from '@/components/assets/asset-groups';`
  - 자산 섹션 JSX (229~371줄)를 교체:
    ```tsx
    <AssetGroups
      assets={assets}
      isLoading={isLoading}
      onEdit={openEditAsset}
      onDelete={handleDeleteAsset}
    />
    ```
  - `insuranceAssets` 변수와 `assetGroups` 계산 블록 삭제 (컴포넌트 내부로 이동)
  - **주의:** `regularAssets`, `loanAssets`, `totalAssets`, `totalLoans`는 `SummaryCard`(`netWorth` 계산)에 사용되므로 부모에 유지. 다음 4줄은 그대로 남긴다:
    ```ts
    const regularAssets = assets.filter(a => a.type !== 'loan' && a.type !== 'insurance');
    const loanAssets = assets.filter(a => a.type === 'loan');
    const totalAssets = regularAssets.reduce((s, a) => s + (a.amount ?? 0), 0);
    const totalLoans = loanAssets.reduce((s, a) => s + (a.amount ?? 0), 0);
    ```

- [ ] **Step 3: format 확인 후 커밋**
  ```bash
  npm run format:check
  git add components/assets/asset-groups.tsx app/\(tabs\)/assets.tsx
  git commit -m "refactor: AssetGroups 컴포넌트 분리"
  ```

---

### Task 12: PaymentMethodList 컴포넌트 분리

**Files:**
- Create: `components/assets/payment-method-list.tsx`
- Modify: `app/(tabs)/assets.tsx`

- [ ] **Step 1: `components/assets/payment-method-list.tsx` 생성**

  `assets.tsx` 43~48줄의 `getPaymentMethodType` 헬퍼 + 379~420줄의 결제수단 조건부 렌더링을 컴포넌트로 추출.
  **주의:** 외부 `<View className='mx-4 mt-8'>` 섹션 래퍼와 `<Text>결제수단</Text>` 제목은 부모에 남긴다 (이중 래핑 방지). 컴포넌트는 379~420줄의 `{pmLoading ? ... : ...}` 조건부 블록만 포함한다:
  ```tsx
  import { View, Text } from 'react-native';
  import { CreditCard } from 'lucide-react-native';
  import { Colors } from '@/constants/colors';
  import { ItemCard } from '@/components/ui/item-card';
  import { IconBox } from '@/components/ui/icon-box';
  import { SwipeableDeleteRow } from '@/components/ui/swipeable-delete-row';
  import { EmptyState } from '@/components/ui/empty-state';
  import { LoadingState } from '@/components/ui/loading-state';
  import { PM_TYPE_OPTIONS } from '@/components/assets/payment-method-form-screen';
  import { formatAmount } from '@/utils/format';
  import type { PaymentMethod } from '@/types/database';

  type Props = {
    paymentMethods: PaymentMethod[];
    isLoading: boolean;
    onEdit: (pm: PaymentMethod) => void;
    onDelete: (id: string) => void;
  };

  export function PaymentMethodList({ paymentMethods, isLoading, onEdit, onDelete }: Props) {
    // ← assets.tsx 43~48줄의 getPaymentMethodType 헬퍼 함수 포함.
    // ← assets.tsx 379~420줄의 {pmLoading ? <LoadingState> : paymentMethods.length === 0 ? <EmptyState> : <View className='gap-2'>{map}</View>}
    //   조건부 블록만 붙여넣는다. 외부 <View className='mx-4 mt-8'>와 제목 Text는 포함하지 않는다.
  }
  ```

- [ ] **Step 2: `assets.tsx` 업데이트**

  - import 추가: `import { PaymentMethodList } from '@/components/assets/payment-method-list';`
  - 결제수단 섹션 JSX (373~421줄)를 교체:
    ```tsx
    <View className='mx-4 mt-8'>
      <Text className='font-ibm-bold text-base text-neutral-700 mb-3'>결제수단</Text>
      <PaymentMethodList
        paymentMethods={paymentMethods}
        isLoading={pmLoading}
        onEdit={openEditPm}
        onDelete={handleDeletePm}
      />
    </View>
    ```
  - **주의:** prop에 `isLoading`이 아닌 `pmLoading`을 전달한다 (결제수단 로딩 상태).
  - 로컬 `getPaymentMethodType` 함수 삭제 (컴포넌트 내부로 이동)

- [ ] **Step 3: format 확인 후 커밋**
  ```bash
  npm run format:check
  git add components/assets/payment-method-list.tsx app/\(tabs\)/assets.tsx
  git commit -m "refactor: PaymentMethodList 컴포넌트 분리"
  ```

---

## Chunk 3: Fixed 도메인

### Task 13: FixedExpenseItem 컴포넌트 분리

**Files:**
- Create: `components/fixed/fixed-expense-item.tsx`
- Modify: `app/(tabs)/fixed.tsx`

**배경:** `fixed.tsx`의 리스트 아이템 row(170~226줄)를 컴포넌트로 추출.

- [ ] **Step 1: `components/fixed/fixed-expense-item.tsx` 생성**

  ```tsx
  import { View, Text, TouchableOpacity } from 'react-native';
  import { Repeat, Wallet } from 'lucide-react-native';
  import { Colors } from '@/constants/colors';
  import { ICON_MAP } from '@/constants/icon-map';
  import { IconBox } from '@/components/ui/icon-box';
  import { ColorPill } from '@/components/ui/color-pill';
  import { SwipeableDeleteRow } from '@/components/ui/swipeable-delete-row';
  import { formatAmount } from '@/utils/format';
  import type { FixedExpense, Category } from '@/types/database';

  type Props = {
    item: FixedExpense;
    category: Category | undefined;
    onEdit: (item: FixedExpense) => void;
    onDelete: (id: string, name: string) => void;
  };

  function ordinalDay(day: number): string {
    return `매월 ${day}일`;
  }

  export function FixedExpenseItem({ item, category, onEdit, onDelete }: Props) {
    const CatIcon = category ? (ICON_MAP[category.icon] ?? Wallet) : null;
    // ← fixed.tsx 174~226줄의 SwipeableDeleteRow + TouchableOpacity + View JSX를
    //   그대로 붙여넣는다. SwipeableDeleteRow는 컴포넌트 내부에 포함.
    //   onDelete 호출은 () => onDelete(item.id, item.name) 형태 유지.
  }
  ```

- [ ] **Step 2: `fixed.tsx` 업데이트**

  - `ordinalDay` 함수 삭제 (컴포넌트 내부로 이동)
  - import 추가: `import { FixedExpenseItem } from '@/components/fixed/fixed-expense-item';`
  - 리스트 map 내부 JSX를 교체 (`SwipeableDeleteRow`는 `FixedExpenseItem` 내부에 포함됨):
    ```tsx
    {fixedExpenses.map(item => {
      const cat = categories.find(c => c.id === item.category_id);
      return (
        <FixedExpenseItem
          key={item.id}
          item={item}
          category={cat}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      );
    })}
    ```
  - 나머지 상대경로 imports를 `@/` alias로 교체
  - `ICON_MAP` import (line 31) 삭제 — `FixedExpenseItem` 내부로 이동됨

- [ ] **Step 3: format 확인 후 커밋**
  ```bash
  npm run format:check
  git add components/fixed/fixed-expense-item.tsx app/\(tabs\)/fixed.tsx
  git commit -m "refactor: FixedExpenseItem 컴포넌트 분리"
  ```

---

### Task 14: FixedExpenseForm 컴포넌트 분리

**Files:**
- Create: `components/fixed/fixed-expense-form.tsx`
- Modify: `app/(tabs)/fixed.tsx`

**배경:** `fixed.tsx`의 바텀시트 폼(233~371줄)을 컴포넌트로 추출.

- [ ] **Step 1: `components/fixed/fixed-expense-form.tsx` 생성**

  ```tsx
  import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
  import { Wallet } from 'lucide-react-native';
  import * as Haptics from 'expo-haptics';
  import { Colors } from '@/constants/colors';
  import { ICON_MAP } from '@/constants/icon-map';
  import { BottomSheet, BottomSheetHeader } from '@/components/ui/bottom-sheet';
  import { SaveButton } from '@/components/ui/save-button';
  import { ModalTextInput, AmountInput } from '@/components/ui/modal-inputs';
  import type { Category } from '@/types/database';

  // FormData와 INITIAL_FORM은 fixed.tsx에서 가져와 export — fixed.tsx가 다시 import함
  export type FormData = {
    name: string;
    amount: string;
    due_day: number;
    category_id: string | null;
  };

  export const INITIAL_FORM: FormData = {
    name: '',
    amount: '',
    due_day: 1,
    category_id: null,
  };

  type Props = {
    visible: boolean;
    editingId: string | null;
    form: FormData;
    isSaving: boolean;
    categories: Category[];
    onChange: (form: FormData) => void;
    onClose: () => void;
    onSave: () => void;
  };

  export function FixedExpenseForm({
    visible,
    editingId,
    form,
    isSaving,
    categories,
    onChange,
    onClose,
    onSave,
  }: Props) {
    // ← fixed.tsx 234~371줄의 BottomSheet + BottomSheetHeader + 입력 필드 + 카테고리 선택 + 납부일 선택 + SaveButton JSX를
    //   그대로 붙여넣는다. setModal 직접 호출을 onChange({...form, field: value}) 형태로 교체.
    //   closeModal → onClose, handleSave → onSave로 교체.
  }
  ```

- [ ] **Step 2: `fixed.tsx` 업데이트**

  - `FormData` 타입과 `INITIAL_FORM` 상수를 `fixed.tsx`에서 삭제하고 `@/components/fixed/fixed-expense-form`에서 import:
    ```ts
    import { FixedExpenseForm, FormData, INITIAL_FORM } from '@/components/fixed/fixed-expense-form';
    ```
  - 기존 `BottomSheet` 폼 블록 (234~371줄)을 교체:
    ```tsx
    <FixedExpenseForm
      visible={modal.visible}
      editingId={modal.editingId}
      form={modal.form}
      isSaving={isSaving}
      categories={categories}
      onChange={form => setModal(s => ({ ...s, form }))}
      onClose={closeModal}
      onSave={handleSave}
    />
    ```
  - `ICON_MAP` import (line 31) 삭제 — `FixedExpenseForm`이 직접 사용하지 않으므로 제거 (FixedExpenseItem이 이미 보유)

- [ ] **Step 3: format 확인 후 커밋**
  ```bash
  npm run format:check
  git add components/fixed/fixed-expense-form.tsx app/\(tabs\)/fixed.tsx
  git commit -m "refactor: FixedExpenseForm 컴포넌트 분리"
  ```

---

## Chunk 4: Settings 도메인

### Task 15: Settings 공통 컴포넌트 분리

**Files:**
- Create: `components/settings/settings-row.tsx`
- Create: `components/settings/settings-card.tsx`
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: `components/settings/settings-row.tsx` 생성**

  `settings.tsx`의 `SettingsRow` 컴포넌트(40~85줄)를 추출:
  ```tsx
  import { View, Text, TouchableOpacity } from 'react-native';
  import { ChevronRight } from 'lucide-react-native';

  type Props = {
    icon: React.ReactNode;
    label: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
    rightElement?: React.ReactNode;
    disabled?: boolean;
  };

  export function SettingsRow({
    icon,
    label,
    value,
    onPress,
    showChevron = true,
    rightElement,
    disabled = false,
  }: Props) {
    // 기존 SettingsRow JSX 그대로
  }
  ```

- [ ] **Step 2: `components/settings/settings-card.tsx` 생성**

  `settings.tsx`의 `SettingsCard`와 `Divider` 컴포넌트(142~159줄)를 추출:
  ```tsx
  import { View } from 'react-native';

  export function SettingsCard({ children }: { children: React.ReactNode }) {
    // ← settings.tsx 142~156줄의 SettingsCard JSX를 그대로 붙여넣는다.
  }

  export function Divider() {
    return <View className='h-px bg-cream-dark mx-4' />;
  }
  ```

- [ ] **Step 3: `settings.tsx` 업데이트**

  - 로컬 `SettingsRow`, `SettingsCard`, `Divider` 정의 삭제
  - import 추가:
    ```ts
    import { SettingsRow } from '@/components/settings/settings-row';
    import { SettingsCard, Divider } from '@/components/settings/settings-card';
    ```

- [ ] **Step 4: format 확인 후 커밋**
  ```bash
  npm run format:check
  git add components/settings/settings-row.tsx components/settings/settings-card.tsx app/\(tabs\)/settings.tsx
  git commit -m "refactor: SettingsRow, SettingsCard, Divider 컴포넌트 분리"
  ```

---

### Task 16: EditModal 컴포넌트 분리

**Files:**
- Create: `components/settings/edit-modal.tsx`
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: `components/settings/edit-modal.tsx` 생성**

  `settings.tsx`의 `EditModal` 컴포넌트(87~140줄)를 추출:
  ```tsx
  import { useState, useEffect } from 'react';
  import { Text } from 'react-native';
  import { BottomSheet, BottomSheetHeader } from '@/components/ui/bottom-sheet';
  import { ModalTextInput } from '@/components/ui/modal-inputs';
  import { SaveButton } from '@/components/ui/save-button';

  type Props = {
    visible: boolean;
    title: string;
    value: string;
    placeholder?: string;
    onClose: () => void;
    onSave: (value: string) => void;
    isSaving: boolean;
    maxLength?: number;
  };

  export function EditModal({
    visible,
    title,
    value,
    placeholder,
    onClose,
    onSave,
    isSaving,
    maxLength = 20,
  }: Props) {
    // ← settings.tsx 98~140줄의 EditModal 함수 body를 그대로 붙여넣는다.
  }
  ```

- [ ] **Step 2: `settings.tsx` 업데이트**

  - 로컬 `EditModal` 정의 삭제
  - import 추가: `import { EditModal } from '@/components/settings/edit-modal';`

- [ ] **Step 3: format 확인 후 커밋**
  ```bash
  npm run format:check
  git add components/settings/edit-modal.tsx app/\(tabs\)/settings.tsx
  git commit -m "refactor: EditModal 컴포넌트 분리"
  ```

---

### Task 17: NotificationInbox, NotificationSettings 분리

**Files:**
- Create: `components/settings/notification-inbox.tsx`
- Create: `components/settings/notification-settings.tsx`
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: `components/settings/notification-inbox.tsx` 생성**

  `settings.tsx`의 `Modal` 알림 인박스 블록(388~413줄)을 컴포넌트로 추출:
  ```tsx
  import { Modal, SafeAreaView, View, Text, TouchableOpacity } from 'react-native';
  import { Bell, X } from 'lucide-react-native';

  type Props = {
    visible: boolean;
    onClose: () => void;
  };

  export function NotificationInbox({ visible, onClose }: Props) {
    // ← settings.tsx 388~413줄의 Modal JSX를 그대로 붙여넣는다.
    //   setNotifInboxVisible(false) → onClose() 로 교체.
  }
  ```

- [ ] **Step 2: `components/settings/notification-settings.tsx` 생성**

  `settings.tsx`의 알림 토글 섹션(320~371줄)을 컴포넌트로 추출:
  ```tsx
  import { View, Text, Switch } from 'react-native';
  import { Bell } from 'lucide-react-native';
  import * as Haptics from 'expo-haptics';
  import { Colors } from '@/constants/colors';
  import { SettingsCard, Divider } from '@/components/settings/settings-card';
  import { useNotificationSettingsStore } from '@/store/notification-settings';

  export function NotificationSettings() {
    const {
      partnerTransaction,
      comment,
      fixedExpenseReminder,
      setPartnerTransaction,
      setComment,
      setFixedExpenseReminder,
    } = useNotificationSettingsStore();
    // ← settings.tsx 320~371줄의 SettingsCard + 알림 토글 map JSX를 그대로 붙여넣는다.
    //   `SettingsCard`와 `Divider`는 이미 @/components/settings/settings-card에서 import.
  }
  ```

- [ ] **Step 3: `settings.tsx` 업데이트**

  - import 추가:
    ```ts
    import { NotificationInbox } from '@/components/settings/notification-inbox';
    import { NotificationSettings } from '@/components/settings/notification-settings';
    ```
  - 알림 토글 섹션 (320~371줄)을 교체. 외부 `<View className='mt-3'>` 래퍼는 `settings.tsx`에 유지:
    ```tsx
    <View className='mt-3'>
      <NotificationSettings />
    </View>
    ```
  - 알림 인박스 Modal (388~413줄)을 교체:
    ```tsx
    <NotificationInbox visible={notifInboxVisible} onClose={() => setNotifInboxVisible(false)} />
    ```
  - `settings.tsx`에서 `useNotificationSettingsStore` import 및 관련 상태 6줄 삭제 (컴포넌트 내부로 이동)
  - 나머지 상대경로 imports를 `@/` alias로 교체

- [ ] **Step 4: format 확인 후 커밋**
  ```bash
  npm run format:check
  git add components/settings/notification-inbox.tsx components/settings/notification-settings.tsx app/\(tabs\)/settings.tsx
  git commit -m "refactor: NotificationInbox, NotificationSettings 컴포넌트 분리"
  ```

---

## Chunk 5: 전체 Alias Sweep

### Task 18: 나머지 파일 전체 import alias 적용

**Files:**
- Modify: `app/(auth)/login.tsx`
- Modify: `app/(onboarding)/create-couple.tsx`
- Modify: `app/(onboarding)/join-couple.tsx`
- Modify: `app/(onboarding)/nickname.tsx`
- Modify: `app/_layout.tsx`
- Modify: `app/auth/callback.tsx`
- Modify: `hooks/*.ts` (모든 파일)
- Modify: `services/*.ts` (모든 파일)
- Modify: `store/*.ts` (모든 파일)
- Modify: `components/ui/*.tsx` (모든 파일)
- Modify: `components/calendar/*.tsx` (모든 파일)
- Modify: `components/assets/*.tsx` (이미 Task 10~12에서 처리된 것 제외)

**목표:** 모든 파일에서 `../`, `../../`, `../../../` 형태의 상대경로를 `@/`로 교체.

- [ ] **Step 1: 상대경로 import가 남아있는 파일 목록 확인**
  ```bash
  grep -rn "from '\.\." --include="*.tsx" --include="*.ts" app/ components/ hooks/ services/ store/ | grep -v node_modules
  ```

- [ ] **Step 2: 각 파일 순서대로 import 경로 교체**

  패턴:
  ```ts
  // before
  import { X } from '../../constants/colors';
  import { Y } from '../../../hooks/use-categories';
  import { Z } from '../../lib/supabase';

  // after
  import { X } from '@/constants/colors';
  import { Y } from '@/hooks/use-categories';
  import { Z } from '@/lib/supabase';
  ```

  처리 순서 (파일 단위로 하나씩):
  1. `app/(auth)/login.tsx`
  2. `app/auth/callback.tsx`
  3. `app/(onboarding)/create-couple.tsx`
  4. `app/(onboarding)/join-couple.tsx`
  5. `app/(onboarding)/nickname.tsx`
  6. `app/_layout.tsx`
  7. `hooks/` 전체
  8. `services/` 전체
  9. `store/` 전체
  10. `components/ui/` 전체
  11. `components/calendar/` 전체

- [ ] **Step 3: format 확인**
  ```bash
  npm run format:check
  # 실패 시: npm run format
  ```

- [ ] **Step 4: 상대경로 import 잔여 여부 최종 확인**
  ```bash
  grep -rn "from '\.\." --include="*.tsx" --include="*.ts" app/ components/ hooks/ services/ store/ | grep -v node_modules
  # 결과가 없어야 함
  ```

- [ ] **Step 5: 커밋**
  ```bash
  git add app/\(auth\)/login.tsx app/auth/callback.tsx \
    app/\(onboarding\)/create-couple.tsx app/\(onboarding\)/join-couple.tsx \
    app/\(onboarding\)/nickname.tsx app/_layout.tsx \
    hooks/ services/ store/ components/ui/ components/calendar/
  git commit -m "refactor: 전체 import 경로를 @/ alias로 통일"
  ```

---

### Task 19: components/ui/category-form-screen.tsx 정리

**Files:**
- Modify or Delete: `components/ui/category-form-screen.tsx`

**배경:** Task 7에서 re-export 파일로 변환했다. 더 이상 직접 참조하는 파일이 없다면 삭제 가능.

- [ ] **Step 1: 직접 참조 여부 확인**
  ```bash
  grep -rn "components/ui/category-form-screen" --include="*.tsx" --include="*.ts" .
  ```

- [ ] **Step 2: 참조 없으면 파일 삭제**
  ```bash
  rm components/ui/category-form-screen.tsx
  ```

- [ ] **Step 3: format 확인 후 커밋**
  ```bash
  npm run format:check
  git add -A
  git commit -m "refactor: components/ui/category-form-screen.tsx 제거 (budget 도메인으로 이동 완료)"
  ```
