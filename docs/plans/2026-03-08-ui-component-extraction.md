# UI Component Extraction & Design Consistency

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 탭 화면 전반에 걸쳐 중복된 UI 패턴을 공통 컴포넌트로 추출하고, settings.tsx 기준 디자인을 전체에 통일 적용한다.

**Architecture:** 9개 공통 컴포넌트를 `components/ui/`에 생성한 뒤, 5개 탭 화면과 `category-form-screen.tsx`에 순차 적용한다. 각 컴포넌트는 기존 인라인 코드를 대체하며 기능 변화 없이 UI 일관성을 확보한다.

**Tech Stack:** React Native, NativeWind v4 (Tailwind v3), Lucide icons, expo-haptics

---

## 컴포넌트 설계 요약

| 컴포넌트 | 파일 | 적용 화면 |
|---|---|---|
| `BottomSheet` + `BottomSheetHeader` | `bottom-sheet.tsx` | fixed, assets, settings, calendar |
| `SaveButton` | `save-button.tsx` | fixed, assets, settings, calendar, category-form |
| `ModalTextInput` + `AmountInput` | `modal-inputs.tsx` | fixed, assets, settings, calendar, category-form |
| `ScreenHeader` | `screen-header.tsx` | fixed, budget, assets |
| `SummaryCard` | `summary-card.tsx` | fixed, assets |
| `ItemCard` | `item-card.tsx` | fixed, assets |
| `LoadingState` | `loading-state.tsx` | fixed, budget, assets, calendar |

---

### Task 1: BottomSheet + BottomSheetHeader

**Files:**
- Create: `components/ui/bottom-sheet.tsx`

**Step 1: 컴포넌트 작성**

```tsx
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Trash2 } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType='slide'
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className='flex-1 justify-end'
      >
        <TouchableOpacity
          className='flex-1'
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          className='bg-white rounded-t-3xl px-6 pt-5 pb-10'
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: -4 },
          }}
        >
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type BottomSheetHeaderProps = {
  title: string;
  onClose: () => void;
  onDelete?: () => void;
  className?: string;
};

export function BottomSheetHeader({
  title,
  onClose,
  onDelete,
  className = 'mb-5',
}: BottomSheetHeaderProps) {
  return (
    <View className={`flex-row items-center justify-between ${className}`}>
      <Text className='font-ibm-bold text-lg text-neutral-800'>{title}</Text>
      <View className='flex-row items-center gap-3'>
        {onDelete && (
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 size={18} color={Colors.brown + '60'} strokeWidth={2} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={22} color='#737373' strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

**Step 2: Format check**

```bash
cd /Users/garden/Documents/chagok && npm run format:check
```
실패 시: `npm run format`

**Step 3: Commit**

```bash
git add components/ui/bottom-sheet.tsx
git commit -m "feat: BottomSheet + BottomSheetHeader 공통 컴포넌트 추가"
```

---

### Task 2: SaveButton

**Files:**
- Create: `components/ui/save-button.tsx`

**Step 1: 컴포넌트 작성**

```tsx
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Check } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

type SaveButtonProps = {
  onPress: () => void;
  label?: string;
  isSaving?: boolean;
  disabled?: boolean;
};

export function SaveButton({
  onPress,
  label = '저장',
  isSaving = false,
  disabled = false,
}: SaveButtonProps) {
  const isDisabled = isSaving || disabled;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      className='bg-butter rounded-2xl py-4 items-center flex-row justify-center gap-2'
      style={{
        opacity: isDisabled ? 0.45 : 1,
        shadowColor: Colors.butter,
        shadowOpacity: 0.25,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        borderTopWidth: 2,
        borderTopColor: 'rgba(255, 255, 255, 0.65)',
      }}
    >
      {isSaving ? (
        <ActivityIndicator color={Colors.brown} />
      ) : (
        <>
          <Check size={18} color={Colors.brown} strokeWidth={2.5} />
          <Text className='font-ibm-bold text-base text-brown'>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
```

**Step 2: Format check + Commit**

```bash
cd /Users/garden/Documents/chagok && npm run format:check
git add components/ui/save-button.tsx
git commit -m "feat: SaveButton 공통 컴포넌트 추가"
```

---

### Task 3: ModalTextInput + AmountInput

**Files:**
- Create: `components/ui/modal-inputs.tsx`

**Step 1: 컴포넌트 작성**

```tsx
import { View, Text, TextInput } from 'react-native';
import type { TextInputProps } from 'react-native';
import { Colors } from '../../constants/colors';

type ModalTextInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  className?: string;
};

export function ModalTextInput({
  value,
  onChangeText,
  placeholder,
  maxLength,
  autoFocus,
  keyboardType,
  className = '',
}: ModalTextInputProps) {
  return (
    <View className={`bg-neutral-100 rounded-2xl px-4 py-3.5 ${className}`}>
      <TextInput
        className='font-ibm-regular text-sm text-neutral-800'
        placeholder={placeholder}
        placeholderTextColor='#A3A3A3'
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
      />
    </View>
  );
}

type AmountInputProps = {
  value: string;
  onChangeText: (raw: string) => void;
  placeholder?: string;
  className?: string;
};

export function AmountInput({
  value,
  onChangeText,
  placeholder = '금액 입력',
  className = '',
}: AmountInputProps) {
  return (
    <View
      className={`bg-neutral-100 rounded-2xl px-4 py-3.5 flex-row items-center ${className}`}
    >
      <Text className='font-ibm-semibold text-neutral-500 text-base mr-2'>
        ₩
      </Text>
      <TextInput
        className='flex-1 font-ibm-semibold text-base text-neutral-800'
        placeholder={placeholder}
        placeholderTextColor='#A3A3A3'
        keyboardType='numeric'
        value={value}
        onChangeText={v => onChangeText(v.replace(/[^0-9]/g, ''))}
      />
      <Text className='font-ibm-regular text-sm text-brown/40'>원</Text>
    </View>
  );
}
```

**Step 2: Format check + Commit**

```bash
cd /Users/garden/Documents/chagok && npm run format:check
git add components/ui/modal-inputs.tsx
git commit -m "feat: ModalTextInput + AmountInput 공통 컴포넌트 추가"
```

---

### Task 4: ScreenHeader + SummaryCard + ItemCard + LoadingState

**Files:**
- Create: `components/ui/screen-header.tsx`
- Create: `components/ui/summary-card.tsx`
- Create: `components/ui/item-card.tsx`
- Create: `components/ui/loading-state.tsx`

**Step 1: screen-header.tsx**

```tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

type ScreenHeaderProps = {
  title: string;
  onAdd?: () => void;
};

export function ScreenHeader({ title, onAdd }: ScreenHeaderProps) {
  return (
    <View className='flex-row items-center justify-between px-6 pt-6 pb-2'>
      <Text className='font-ibm-bold text-2xl text-brown-darker'>{title}</Text>
      {onAdd && (
        <TouchableOpacity
          onPress={onAdd}
          className='w-10 h-10 rounded-full items-center justify-center'
          activeOpacity={0.6}
        >
          <Plus size={22} color={Colors.brownDarker} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
}
```

**Step 2: summary-card.tsx**

```tsx
import { View, Text } from 'react-native';

type SummaryCardProps = {
  label: string;
  amount: number;
  subtext: string;
};

export function SummaryCard({ label, amount, subtext }: SummaryCardProps) {
  return (
    <View
      className='mx-4 mt-3 bg-butter rounded-3xl px-6 py-5'
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
      }}
    >
      <Text className='font-ibm-semibold text-sm text-brown-dark mb-1'>
        {label}
      </Text>
      <Text className='font-ibm-bold text-3xl text-brown-dark'>
        {amount.toLocaleString('ko-KR')}원
      </Text>
      <Text className='font-ibm-regular text-xs text-brown-dark mt-1'>
        {subtext}
      </Text>
    </View>
  );
}
```

**Step 3: item-card.tsx**

```tsx
import { View, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';

type ItemCardProps = {
  onPress?: () => void;
  children: React.ReactNode;
};

export function ItemCard({ onPress, children }: ItemCardProps) {
  const content = (
    <View
      className='bg-white rounded-3xl px-4 py-4 flex-row items-center gap-3'
      style={{
        shadowColor: Colors.brown,
        shadowOpacity: 0.07,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      {children}
    </View>
  );

  if (!onPress) return content;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      {content}
    </TouchableOpacity>
  );
}
```

**Step 4: loading-state.tsx**

```tsx
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/colors';

type LoadingStateProps = {
  className?: string;
};

export function LoadingState({ className = 'py-12' }: LoadingStateProps) {
  return (
    <View className={`items-center ${className}`}>
      <ActivityIndicator color={Colors.butter} />
    </View>
  );
}
```

**Step 5: Format check + Commit**

```bash
cd /Users/garden/Documents/chagok && npm run format:check
git add components/ui/screen-header.tsx components/ui/summary-card.tsx components/ui/item-card.tsx components/ui/loading-state.tsx
git commit -m "feat: ScreenHeader, SummaryCard, ItemCard, LoadingState 공통 컴포넌트 추가"
```

---

### Task 5: settings.tsx 적용

**Files:**
- Modify: `app/(tabs)/settings.tsx`

**Step 1: import 교체**

기존 import에서 제거:
- `Modal, KeyboardAvoidingView, Platform, ActivityIndicator` (RN imports)
- `X, Check` (lucide imports)

추가:
```tsx
import { BottomSheet, BottomSheetHeader } from '../../components/ui/bottom-sheet';
import { SaveButton } from '../../components/ui/save-button';
import { ModalTextInput } from '../../components/ui/modal-inputs';
```

**Step 2: EditModal 컴포넌트 교체**

기존 `EditModal` 함수(94~193줄) 전체를 아래로 교체:

```tsx
function EditModal({
  visible,
  title,
  value,
  placeholder,
  onClose,
  onSave,
  isSaving,
  maxLength = 20,
}: EditModalProps) {
  const [text, setText] = useState(value);

  useEffect(() => {
    if (visible) setText(value);
  }, [visible, value]);

  const trimmed = text.trim();
  const isDisabled = isSaving || !trimmed || trimmed === value.trim();

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <BottomSheetHeader title={title} onClose={onClose} className='mb-5' />

      <ModalTextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus
        className='mb-1'
      />
      <Text className='font-ibm-regular text-xs text-neutral-400 text-right mb-4 mr-1'>
        {text.length}/{maxLength}
      </Text>

      <SaveButton
        onPress={() => onSave(trimmed)}
        isSaving={isSaving}
        disabled={isDisabled}
      />
    </BottomSheet>
  );
}
```

**Step 3: Format check + Commit**

```bash
cd /Users/garden/Documents/chagok && npm run format:check
git add app/(tabs)/settings.tsx
git commit -m "refactor: settings.tsx 공통 컴포넌트 적용"
```

---

### Task 6: fixed.tsx 적용

**Files:**
- Modify: `app/(tabs)/fixed.tsx`

**Step 1: import 교체**

제거: `Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator`
제거 lucide: `X, Check`

추가:
```tsx
import { BottomSheet, BottomSheetHeader } from '../../components/ui/bottom-sheet';
import { SaveButton } from '../../components/ui/save-button';
import { ModalTextInput, AmountInput } from '../../components/ui/modal-inputs';
import { ScreenHeader } from '../../components/ui/screen-header';
import { SummaryCard } from '../../components/ui/summary-card';
import { ItemCard } from '../../components/ui/item-card';
import { LoadingState } from '../../components/ui/loading-state';
```

**Step 2: 헤더 교체** (149~160줄)

```tsx
// 기존
<View className='flex-row items-center justify-between px-6 pt-6 pb-2'>
  <Text className='font-ibm-bold text-2xl text-brown-darker'>고정지출</Text>
  <TouchableOpacity onPress={openCreate} ...>
    <Plus ... />
  </TouchableOpacity>
</View>

// 교체
<ScreenHeader title='고정지출' onAdd={openCreate} />
```

**Step 3: SummaryCard 교체** (162~183줄)

```tsx
// 기존 View 블록 전체를
<SummaryCard
  label='매월 고정지출'
  amount={totalAmount}
  subtext={`총 ${fixedExpenses.length}개 항목`}
/>
```

**Step 4: LoadingState + ItemCard 교체** (187~255줄)

```tsx
{isLoading ? (
  <LoadingState />
) : fixedExpenses.length === 0 ? (
  <EmptyState ... />
) : (
  <View className='gap-2.5'>
    {fixedExpenses.map(item => (
      <ItemCard key={item.id} onPress={() => openEdit(item)}>
        <View className='w-11 h-11 rounded-2xl items-center justify-center bg-peach/40'>
          <Repeat size={19} color={Colors.peach} strokeWidth={2.5} />
        </View>
        <View className='flex-1'>
          <Text className='font-ibm-semibold text-sm text-neutral-800'>
            {item.name}
          </Text>
          <Text className='font-ibm-regular text-xs text-neutral-500 mt-0.5'>
            {ordinalDay(item.due_day)}
          </Text>
        </View>
        <View className='items-end gap-2'>
          <Text className='font-ibm-bold text-sm text-neutral-800'>
            {formatAmount(item.amount)}원
          </Text>
          <TouchableOpacity
            onPress={() => handleDelete(item.id, item.name)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 size={13} color={Colors.brown + '50'} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </ItemCard>
    ))}
  </View>
)}
```

**Step 5: 모달 교체** (258~400줄)

```tsx
<BottomSheet visible={modal.visible} onClose={closeModal}>
  <BottomSheetHeader
    title={modal.editingId ? '고정지출 수정' : '고정지출 추가'}
    onClose={closeModal}
    className='mb-6'
  />

  <ModalTextInput
    value={modal.form.name}
    onChangeText={v => setModal(s => ({ ...s, form: { ...s.form, name: v } }))}
    placeholder='항목 이름 (예: 월세, 넷플릭스)'
    maxLength={20}
    autoFocus={!modal.editingId}
    className='mb-4'
  />

  <AmountInput
    value={modal.form.amount}
    onChangeText={v => setModal(s => ({ ...s, form: { ...s.form, amount: v } }))}
    className='mb-4'
  />

  {/* 납부일 */}
  <View className='mb-6'>
    <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
      납부일
    </Text>
    <View className='bg-neutral-100 rounded-2xl px-4 py-3 flex-row items-center justify-between'>
      <TouchableOpacity
        onPress={() => adjustDueDay(-1)}
        disabled={modal.form.due_day <= 1}
        className='w-9 h-9 rounded-xl bg-cream items-center justify-center'
        activeOpacity={0.7}
      >
        <ChevronLeft
          size={18}
          color={modal.form.due_day <= 1 ? Colors.brown + '30' : Colors.brown}
          strokeWidth={2.5}
        />
      </TouchableOpacity>
      <Text className='font-ibm-bold text-base text-neutral-800'>
        매월 {modal.form.due_day}일
      </Text>
      <TouchableOpacity
        onPress={() => adjustDueDay(1)}
        disabled={modal.form.due_day >= 31}
        className='w-9 h-9 rounded-xl bg-cream items-center justify-center'
        activeOpacity={0.7}
      >
        <ChevronRight
          size={18}
          color={modal.form.due_day >= 31 ? Colors.brown + '30' : Colors.brown}
          strokeWidth={2.5}
        />
      </TouchableOpacity>
    </View>
  </View>

  <SaveButton
    onPress={handleSave}
    isSaving={isSaving}
    label={modal.editingId ? '수정 완료' : '저장'}
  />
</BottomSheet>
```

**Step 6: 더 이상 직접 사용하지 않는 import 정리**

`Plus`, `Wallet` (lucide), `Modal`, `TextInput`, `KeyboardAvoidingView`, `Platform`, `ActivityIndicator` (RN) 제거

**Step 7: Format check + Commit**

```bash
cd /Users/garden/Documents/chagok && npm run format:check
git add app/(tabs)/fixed.tsx
git commit -m "refactor: fixed.tsx 공통 컴포넌트 적용"
```

---

### Task 7: assets.tsx 적용

**Files:**
- Modify: `app/(tabs)/assets.tsx`

**Step 1: import 교체**

```tsx
import { BottomSheet, BottomSheetHeader } from '../../components/ui/bottom-sheet';
import { SaveButton } from '../../components/ui/save-button';
import { ModalTextInput, AmountInput } from '../../components/ui/modal-inputs';
import { ScreenHeader } from '../../components/ui/screen-header';
import { SummaryCard } from '../../components/ui/summary-card';
import { ItemCard } from '../../components/ui/item-card';
import { LoadingState } from '../../components/ui/loading-state';
```

제거: `Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator` (RN)
제거 lucide: `X, Check, Plus`

**Step 2: 헤더 교체** (177~186줄)

```tsx
<ScreenHeader title='자산' onAdd={openCreate} />
```

**Step 3: SummaryCard 교체** (188~207줄)

```tsx
<SummaryCard
  label='총 자산'
  amount={totalAssets}
  subtext={`항목 ${assets.length}개`}
/>
```

**Step 4: LoadingState 교체** (210~213줄)

```tsx
{isLoading ? (
  <LoadingState className='py-16' />
) : ...}
```

**Step 5: ItemCard 교체** (자산 리스트 아이템 243~275줄)

```tsx
<ItemCard key={a.id} onPress={() => openEdit(a)}>
  <View
    className='w-11 h-11 rounded-2xl items-center justify-center'
    style={{ backgroundColor: group.color + '80' }}
  >
    <group.Icon size={20} color={Colors.brown} strokeWidth={2.5} />
  </View>
  <Text className='flex-1 font-ibm-semibold text-sm text-neutral-800'>
    {a.name}
  </Text>
  <Text className='font-ibm-bold text-base text-neutral-800'>
    {formatAmount(a.amount)}원
  </Text>
</ItemCard>
```

**Step 6: 모달 교체** (285~428줄)

```tsx
<BottomSheet
  visible={modal.visible}
  onClose={() => setModal(s => ({ ...s, visible: false }))}
>
  <BottomSheetHeader
    title={modal.editingId ? '자산 수정' : '자산 추가'}
    onClose={() => setModal(s => ({ ...s, visible: false }))}
    onDelete={modal.editingId ? () => handleDelete(modal.editingId!) : undefined}
    className='mb-5'
  />

  {/* 자산 유형 */}
  <Text className='font-ibm-semibold text-xs text-neutral-500 mb-2 ml-1'>
    유형
  </Text>
  <View className='flex-row flex-wrap gap-2 mb-4'>
    {ASSET_TYPES.map(({ key, label, Icon, color }) => {
      const isSelected = modal.form.type === key;
      return (
        <TouchableOpacity
          key={key}
          onPress={() => setModal(s => ({ ...s, form: { ...s.form, type: key } }))}
          className={`flex-row items-center gap-1.5 px-3 py-2 rounded-2xl ${isSelected ? '' : 'bg-neutral-100'}`}
          style={isSelected ? { backgroundColor: color } : {}}
          activeOpacity={0.7}
        >
          <Icon size={14} color={Colors.brown} strokeWidth={2.5} />
          <Text className={`font-ibm-semibold text-xs ${isSelected ? 'text-neutral-800' : 'text-neutral-500'}`}>
            {label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>

  <ModalTextInput
    value={modal.form.name}
    onChangeText={v => setModal(s => ({ ...s, form: { ...s.form, name: v } }))}
    placeholder='자산 이름 (예: 국민은행, 비상금)'
    maxLength={20}
    className='mb-4'
  />

  <AmountInput
    value={modal.form.amount}
    onChangeText={v => setModal(s => ({ ...s, form: { ...s.form, amount: v } }))}
    placeholder='현재 잔액'
    className='mb-5'
  />

  <SaveButton
    onPress={handleSave}
    isSaving={isSaving}
    label={modal.editingId ? '수정 완료' : '저장'}
  />
</BottomSheet>
```

**Step 7: 불필요 import 정리 + Format + Commit**

```bash
cd /Users/garden/Documents/chagok && npm run format:check
git add app/(tabs)/assets.tsx
git commit -m "refactor: assets.tsx 공통 컴포넌트 적용"
```

---

### Task 8: budget.tsx 적용

**Files:**
- Modify: `app/(tabs)/budget.tsx`

**Step 1: import 교체**

```tsx
import { ScreenHeader } from '../../components/ui/screen-header';
import { LoadingState } from '../../components/ui/loading-state';
```

제거: `Plus` (lucide), `ActivityIndicator` (RN - 더 이상 직접 사용 안 함)

**Step 2: 헤더 교체** (190~201줄)

```tsx
<ScreenHeader title='예산·결산' onAdd={openCreate} />
```

**Step 3: LoadingState 교체** (275~278줄)

```tsx
{isLoading ? (
  <LoadingState />
) : ...}
```

**Step 4: Format + Commit**

```bash
cd /Users/garden/Documents/chagok && npm run format:check
git add app/(tabs)/budget.tsx
git commit -m "refactor: budget.tsx 공통 컴포넌트 적용"
```

---

### Task 9: category-form-screen.tsx 적용

**Files:**
- Modify: `components/ui/category-form-screen.tsx`

**Step 1: import 교체**

```tsx
import { SaveButton } from './save-button';
import { ModalTextInput, AmountInput } from './modal-inputs';
```

제거: `Check` (lucide), `ActivityIndicator` (RN)

**Step 2: 이름 입력 교체** (141~152줄)

```tsx
<ModalTextInput
  value={form.name}
  onChangeText={v => onChange({ ...form, name: v })}
  placeholder='카테고리 이름 (예: 식비, 교통비)'
  maxLength={10}
  autoFocus
  className='mb-6'
/>
```

**Step 3: 월 예산 입력 교체** (213~230줄)

```tsx
<AmountInput
  value={form.budget_amount}
  onChangeText={v => onChange({ ...form, budget_amount: v })}
  placeholder='월 예산 금액'
  className='mb-2'
/>
```

**Step 4: 저장 버튼 교체** (235~257줄)

```tsx
<View className='px-6 pb-6 pt-3'>
  <SaveButton
    onPress={onSave}
    isSaving={isSaving}
    label={editingId ? '수정 완료' : '저장'}
  />
</View>
```

**Step 5: Format + Commit**

```bash
cd /Users/garden/Documents/chagok && npm run format:check
git add components/ui/category-form-screen.tsx
git commit -m "refactor: category-form-screen.tsx 공통 컴포넌트 적용"
```

---

### Task 10: calendar.tsx 적용 + 디자인 개선

**Files:**
- Modify: `app/(tabs)/calendar.tsx`

**Step 1: import 교체**

```tsx
import { BottomSheet, BottomSheetHeader } from '../../components/ui/bottom-sheet';
import { SaveButton } from '../../components/ui/save-button';
import { ModalTextInput, AmountInput } from '../../components/ui/modal-inputs';
import { LoadingState } from '../../components/ui/loading-state';
```

제거: `X, Check` (lucide), `Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator` (이미 안 쓰이는 것들)
주의: calendar.tsx에는 Modal이 여러 개 있으므로, BottomSheet로 교체 후 `Modal` import 제거

**Step 2: txModal BottomSheet로 교체**

`txModal.view === 'tx'` 일 때 보이는 바텀시트 (지출/수입 입력):

```tsx
<BottomSheet
  visible={txModal.visible && txModal.view === 'tx'}
  onClose={() => setTxModal(s => ({ ...s, visible: false, view: 'tx' }))}
>
  <BottomSheetHeader
    title={txModal.editingId ? '내역 수정' : `${getSelectedDateLabel(selectedDate)} 내역 추가`}
    onClose={() => setTxModal(s => ({ ...s, visible: false, view: 'tx' }))}
    onDelete={txModal.editingId ? () => handleTxDelete(txModal.editingId!) : undefined}
    className='mb-5'
  />
  {/* 지출/수입 타입 토글 */}
  ...기존 타입 선택 UI 유지...
  {/* 태그 선택 */}
  ...기존 태그 선택 UI 유지...
  {/* 카테고리 선택 */}
  ...기존 카테고리 선택 UI 유지...
  <AmountInput
    value={txModal.form.amount}
    onChangeText={v => setTxModal(s => ({ ...s, form: { ...s.form, amount: v } }))}
    className='mb-4'
  />
  <ModalTextInput
    value={txModal.form.memo}
    onChangeText={v => setTxModal(s => ({ ...s, form: { ...s.form, memo: v } }))}
    placeholder='메모'
    maxLength={50}
    className='mb-5'
  />
  <SaveButton
    onPress={handleTxSave}
    isSaving={isTxSaving}
    label={txModal.editingId ? '수정 완료' : '저장'}
  />
</BottomSheet>
```

**Step 3: scheduleModal BottomSheet로 교체**

```tsx
<BottomSheet
  visible={scheduleModal.visible}
  onClose={() => setScheduleModal(s => ({ ...s, visible: false }))}
>
  <BottomSheetHeader
    title={scheduleModal.editingId ? '일정 수정' : '일정 추가'}
    onClose={() => setScheduleModal(s => ({ ...s, visible: false }))}
    onDelete={scheduleModal.editingId ? () => handleScheduleDelete(scheduleModal.editingId!) : undefined}
    className='mb-5'
  />
  {/* 태그 선택 */}
  ...기존 태그 선택 UI 유지...
  <ModalTextInput
    value={scheduleModal.form.title}
    onChangeText={v => setScheduleModal(s => ({ ...s, form: { ...s.form, title: v } }))}
    placeholder='일정 제목'
    maxLength={30}
    autoFocus
    className='mb-5'
  />
  <SaveButton
    onPress={handleScheduleSave}
    isSaving={isScheduleSaving}
    label={scheduleModal.editingId ? '수정 완료' : '저장'}
  />
</BottomSheet>
```

**Step 4: fixedModal BottomSheet로 교체**

```tsx
<BottomSheet
  visible={fixedModal.visible}
  onClose={() => setFixedModal(s => ({ ...s, visible: false }))}
>
  <BottomSheetHeader
    title={fixedModal.editingId ? '고정지출 수정' : '고정지출 추가'}
    onClose={() => setFixedModal(s => ({ ...s, visible: false }))}
    className='mb-6'
  />
  <ModalTextInput
    value={fixedModal.form.name}
    onChangeText={v => setFixedModal(s => ({ ...s, form: { ...s.form, name: v } }))}
    placeholder='항목 이름 (예: 월세, 넷플릭스)'
    maxLength={20}
    autoFocus
    className='mb-4'
  />
  <AmountInput
    value={fixedModal.form.amount}
    onChangeText={v => setFixedModal(s => ({ ...s, form: { ...s.form, amount: v } }))}
    className='mb-6'
  />
  <SaveButton
    onPress={handleFixedSave}
    isSaving={createFixedExpense.isPending || updateFixedExpense.isPending}
    label={fixedModal.editingId ? '수정 완료' : '저장'}
  />
</BottomSheet>
```

**Step 5: 선택된 날짜 리스트 디자인 개선**

선택된 날짜 아래 거래 내역/일정 섹션을 더 읽기 좋게:

지출/수입 합계 표시줄:
```tsx
{/* 날짜 헤더 + 요약 */}
<View className='flex-row items-center justify-between px-4 mb-3'>
  <Text className='font-ibm-bold text-base text-neutral-800'>
    {getSelectedDateLabel(selectedDate)}
  </Text>
  {(totalExpense > 0 || totalIncome > 0) && (
    <View className='flex-row gap-2'>
      {totalExpense > 0 && (
        <View className='flex-row items-center gap-1 bg-peach/20 rounded-full px-2.5 py-1'>
          <TrendingDown size={11} color={Colors.peach} strokeWidth={2.5} />
          <Text className='font-ibm-semibold text-xs text-peach'>
            -{formatAmount(totalExpense)}
          </Text>
        </View>
      )}
      {totalIncome > 0 && (
        <View className='flex-row items-center gap-1 bg-lavender/30 rounded-full px-2.5 py-1'>
          <TrendingUp size={11} color='#7B68B0' strokeWidth={2.5} />
          <Text className='font-ibm-semibold text-xs' style={{ color: '#7B68B0' }}>
            +{formatAmount(totalIncome)}
          </Text>
        </View>
      )}
    </View>
  )}
</View>
```

거래 내역 아이템 (`ItemCard` 적용):
```tsx
{selectedTransactions.map(t => {
  const cat = categories.find(c => c.id === t.category_id);
  const CatIcon = cat ? (ICON_MAP[cat.icon] ?? Wallet) : Wallet;
  const isExpense = t.type === 'expense';
  return (
    <ItemCard key={t.id} onPress={() => setDetailTx(t)}>
      <View
        className='w-10 h-10 rounded-2xl items-center justify-center'
        style={{ backgroundColor: cat ? cat.color + '55' : '#F5F5F5' }}
      >
        <CatIcon
          size={18}
          color={cat ? cat.color : '#A3A3A3'}
          strokeWidth={2.5}
        />
      </View>
      <View className='flex-1'>
        <Text className='font-ibm-semibold text-sm text-neutral-800' numberOfLines={1}>
          {t.memo ?? (cat?.name ?? '기타')}
        </Text>
        <View className='flex-row items-center gap-1.5 mt-0.5'>
          <View
            className='px-1.5 py-0.5 rounded-full'
            style={{ backgroundColor: getTagBgColor(t.tag) + '99' }}
          >
            <Text className='font-ibm-semibold text-brown' style={{ fontSize: 9 }}>
              {resolveTagLabel(t.tag, t.user_id)}
            </Text>
          </View>
          {cat && (
            <Text className='font-ibm-regular text-xs text-neutral-400'>
              {cat.name}
            </Text>
          )}
        </View>
      </View>
      <Text
        className={`font-ibm-bold text-sm ${isExpense ? 'text-neutral-800' : 'text-lavender-dark'}`}
      >
        {isExpense ? '-' : '+'}{formatAmount(t.amount)}원
      </Text>
    </ItemCard>
  );
})}
```

일정 아이템:
```tsx
{selectedSchedules.map(s => (
  <ItemCard key={s.id} onPress={() => openScheduleEdit(s)}>
    <View
      className='w-10 h-10 rounded-2xl items-center justify-center'
      style={{ backgroundColor: getTagBgColor(s.tag) + '80' }}
    >
      <CalendarDays size={18} color={Colors.brown} strokeWidth={2.5} />
    </View>
    <Text className='flex-1 font-ibm-semibold text-sm text-neutral-800'>
      {s.title}
    </Text>
    <View
      className='px-2 py-1 rounded-full'
      style={{ backgroundColor: getTagBgColor(s.tag) }}
    >
      <Text className='font-ibm-semibold text-xs text-brown'>
        {resolveTagLabel(s.tag, s.user_id)}
      </Text>
    </View>
  </ItemCard>
))}
```

**Step 6: yearMonthModal BottomSheet로 교체**

```tsx
<BottomSheet
  visible={yearMonthModal}
  onClose={() => setYearMonthModal(false)}
>
  <BottomSheetHeader
    title='월 선택'
    onClose={() => setYearMonthModal(false)}
    className='mb-5'
  />
  {/* 연도 선택 + 월 그리드 - 기존 UI 유지 */}
  ...
</BottomSheet>
```

**Step 7: 로딩 상태 교체**

```tsx
{(txLoading || scheduleLoading) && <LoadingState className='py-6' />}
```

**Step 8: 불필요 import 정리 + Format + Commit**

```bash
cd /Users/garden/Documents/chagok && npm run format:check
git add app/(tabs)/calendar.tsx
git commit -m "refactor: calendar.tsx 공통 컴포넌트 적용 + 리스트 디자인 개선"
```

---

### Task 11: 최종 확인

**Step 1: 전체 포맷 확인**

```bash
cd /Users/garden/Documents/chagok && npm run format:check
```

실패 시:
```bash
npm run format && npm run format:check
```

**Step 2: 모든 새 컴포넌트가 export되는지 확인**

```bash
grep -r "from '../../components/ui" app/(tabs)/ --include="*.tsx"
```

**Step 3: TypeScript 오류 확인**

```bash
cd /Users/garden/Documents/chagok && npx tsc --noEmit 2>&1 | head -40
```

**Step 4: 최종 커밋 (오류가 있을 경우)**

```bash
git add -A
git commit -m "chore: 포맷/타입 오류 수정"
```
