# 예산결산 카드 리디자인 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 예산결산 화면의 지출/수입 카드를 풀 와이드 레이아웃으로 재설계하여 카테고리·목표·사용·차액을 계층적으로 표시한다.

**Architecture:** `app/(tabs)/budget/index.tsx` 내 `ExpenseCard`와 `IncomeCard` 컴포넌트를 풀 와이드 카드로 교체한다. 2컬럼 그리드(`flex-row flex-wrap`)를 단일 컬럼 리스트로 변경하고, 각 카드에 프로그레스바와 차액 뱃지를 추가한다. 외부 컴포넌트 파일 분리 없이 같은 파일 내에서 처리한다.

**Tech Stack:** React Native, NativeWind (className), Lucide icons, Colors 상수

---

## 카드 스펙 요약

### ExpenseCard (지출)
```
┌─────────────────────────────────────────────┐
│ [아이콘] 식비                   절약 +15,000원│
│                                              │
│  목표              사용                      │
│  100,000원         85,000원                 │
│                                              │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░  85%           │
└─────────────────────────────────────────────┘
```
- 차액 뱃지: 목표 미설정이면 숨김
- 프로그레스바: 0~79% olive, 80~99% butter, 100%+ peach
- 차액 색: 절약(olive), 초과(peach)

### IncomeCard (수입)
- 목표(budget_amount) 있으면 → ExpenseCard와 동일 구조, 라벨만 "수입"
- 목표 없으면 → 아이콘+카테고리명 + 수입금액 + "이번달 수입" 2줄

---

### Task 1: ExpenseCard 풀 와이드 카드로 교체

**Files:**
- Modify: `app/(tabs)/budget/index.tsx` (ExpenseCard 컴포넌트, 약 51~100라인)

**Step 1: ExpenseCard 컴포넌트 교체**

현재 코드(51~100라인)의 `ExpenseCard`를 아래로 교체:

```tsx
function ExpenseCard({
  c,
  spent,
  onPress,
}: {
  c: Category;
  spent: number;
  onPress: () => void;
}) {
  const hasBudget = c.budget_amount > 0;
  const over = hasBudget && spent > c.budget_amount;
  const diff = hasBudget ? c.budget_amount - spent : 0;
  const ratio = hasBudget ? Math.min(spent / c.budget_amount, 1) : 0;

  const barColor = (() => {
    if (!hasBudget) return Colors.olive;
    const pct = (spent / c.budget_amount) * 100;
    if (pct >= 100) return Colors.peachDark;
    if (pct >= 80) return Colors.butter;
    return Colors.olive;
  })();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View className='bg-white rounded-3xl p-4' style={cardShadow}>
        {/* 1행: 카테고리 + 차액 뱃지 */}
        <View className='flex-row items-center justify-between mb-3'>
          <View className='flex-row items-center gap-2'>
            <IconBox color={c.color}>
              <CategoryIcon iconKey={c.icon} color={c.color} />
            </IconBox>
            <Text
              className='font-ibm-semibold text-sm text-neutral-700'
              numberOfLines={1}
            >
              {c.name}
            </Text>
          </View>
          {hasBudget && (
            <View
              className='px-2 py-0.5 rounded-full'
              style={{
                backgroundColor: over
                  ? `${Colors.peach}40`
                  : `${Colors.olive}30`,
              }}
            >
              <Text
                className='font-ibm-bold text-xs'
                style={{ color: over ? Colors.peachDarker : Colors.oliveDarker }}
              >
                {over
                  ? `초과 ${formatAmount(Math.abs(diff))}원`
                  : `절약 +${formatAmount(diff)}원`}
              </Text>
            </View>
          )}
        </View>

        {/* 2행: 목표 vs 사용 수치 */}
        {hasBudget ? (
          <View className='flex-row justify-between mb-3'>
            <View>
              <Text className='font-ibm-regular text-xs text-neutral-400 mb-0.5'>
                목표
              </Text>
              <Text className='font-ibm-bold text-base text-neutral-700'>
                {formatAmount(c.budget_amount)}원
              </Text>
            </View>
            <View className='items-end'>
              <Text className='font-ibm-regular text-xs text-neutral-400 mb-0.5'>
                사용
              </Text>
              <Text
                className='font-ibm-bold text-base'
                style={{ color: over ? Colors.peachDark : '#404040' }}
              >
                {formatAmount(spent)}원
              </Text>
            </View>
          </View>
        ) : (
          <View className='mb-3'>
            <Text className='font-ibm-bold text-base text-neutral-700'>
              {formatAmount(spent)}원
            </Text>
            <Text className='font-ibm-regular text-xs text-neutral-400'>
              이번달 사용
            </Text>
          </View>
        )}

        {/* 3행: 프로그레스바 */}
        {hasBudget && (
          <View className='bg-neutral-100 rounded-full overflow-hidden' style={{ height: 6 }}>
            <View
              className='rounded-full h-full'
              style={{ width: `${ratio * 100}%`, backgroundColor: barColor }}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
```

**Step 2: IncomeCard 컴포넌트 교체**

현재 코드(102~138라인)의 `IncomeCard`를 아래로 교체:

```tsx
function IncomeCard({
  c,
  income,
  onPress,
}: {
  c: Category;
  income: number;
  onPress: () => void;
}) {
  const hasTarget = c.budget_amount > 0;
  const over = hasTarget && income > c.budget_amount;
  const diff = hasTarget ? income - c.budget_amount : 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View className='bg-white rounded-3xl p-4' style={cardShadow}>
        {/* 1행: 카테고리 + 차액 뱃지 */}
        <View className='flex-row items-center justify-between mb-3'>
          <View className='flex-row items-center gap-2'>
            <IconBox color={c.color}>
              <CategoryIcon iconKey={c.icon} color={c.color} />
            </IconBox>
            <Text
              className='font-ibm-semibold text-sm text-neutral-700'
              numberOfLines={1}
            >
              {c.name}
            </Text>
          </View>
          {hasTarget && (
            <View
              className='px-2 py-0.5 rounded-full'
              style={{
                backgroundColor: over
                  ? `${Colors.olive}30`
                  : `${Colors.peach}40`,
              }}
            >
              <Text
                className='font-ibm-bold text-xs'
                style={{ color: over ? Colors.oliveDarker : Colors.peachDarker }}
              >
                {over
                  ? `초과달성 +${formatAmount(diff)}원`
                  : `미달 -${formatAmount(Math.abs(diff))}원`}
              </Text>
            </View>
          )}
        </View>

        {/* 2행: 목표 vs 수입 수치 */}
        {hasTarget ? (
          <View className='flex-row justify-between mb-3'>
            <View>
              <Text className='font-ibm-regular text-xs text-neutral-400 mb-0.5'>
                목표
              </Text>
              <Text className='font-ibm-bold text-base text-neutral-700'>
                {formatAmount(c.budget_amount)}원
              </Text>
            </View>
            <View className='items-end'>
              <Text className='font-ibm-regular text-xs text-neutral-400 mb-0.5'>
                수입
              </Text>
              <Text
                className='font-ibm-bold text-base'
                style={{ color: over ? Colors.oliveDark : '#404040' }}
              >
                {formatAmount(income)}원
              </Text>
            </View>
          </View>
        ) : (
          <View>
            <Text className='font-ibm-bold text-base text-neutral-700'>
              {formatAmount(income)}원
            </Text>
            <Text className='font-ibm-regular text-xs text-neutral-400'>
              이번달 수입
            </Text>
          </View>
        )}

        {/* 3행: 프로그레스바 (목표 있을 때만) */}
        {hasTarget && (
          <View className='bg-neutral-100 rounded-full overflow-hidden' style={{ height: 6 }}>
            <View
              className='rounded-full h-full'
              style={{
                width: `${Math.min((income / c.budget_amount) * 100, 100)}%`,
                backgroundColor: over ? Colors.oliveDark : Colors.olive,
              }}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
```

**Step 3: 그리드 → 단일 컬럼 변경**

수입 섹션 카드 리스트 (약 369~377라인):
```tsx
// 변경 전
<View className='flex-row flex-wrap gap-3'>
  {incomeCategories.map(c => (
    <IncomeCard ... style={{ width: '47.5%' }} ... />
  ))}
</View>

// 변경 후
<View className='gap-3'>
  {incomeCategories.map(c => (
    <IncomeCard key={c.id} c={c} income={incomeByCategory[c.id] ?? 0} onPress={() => goToDetail(c.id)} />
  ))}
</View>
```

지출 섹션 카드 리스트 (약 412~420라인)도 동일하게:
```tsx
// 변경 후
<View className='gap-3'>
  {expenseCategories.map(c => (
    <ExpenseCard key={c.id} c={c} spent={spendingByCategory[c.id] ?? 0} onPress={() => goToDetail(c.id)} />
  ))}
</View>
```

참고: `ExpenseCard`와 `IncomeCard` 컴포넌트에서 `style={{ width: '47.5%' }}` prop도 제거됨.

**Step 4: 포맷 확인**

```bash
npm run format:check
# 실패 시
npm run format
npm run format:check
```

**Step 5: 커밋**

```bash
git add app/(tabs)/budget/index.tsx
git commit -m "style: 예산결산 카드 풀 와이드 레이아웃으로 리디자인"
```

---

## 완료 기준
- 지출 카드: 목표/사용 수치 표시, 프로그레스바, 차액 뱃지
- 수입 카드: 목표 있으면 동일 구조, 없으면 수입금액+라벨만
- 단일 컬럼 레이아웃
- 크림 배경 위 흰 카드 + 소프트 섀도우 구분감 유지
