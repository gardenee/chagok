import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useState, useRef } from 'react';
import {
  ArrowLeft,
  Plus,
  Check,
  ArrowUpDown,
  Wallet,
  TrendingUp,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { CategoryRow } from '@/components/budget/category-row';
import { SortableCategoryList } from '@/components/budget/sortable-category-list';
import { EmptyState } from '@/components/ui/empty-state';
import type { Category } from '@/types/database';

type Props = {
  categories: Category[];
  filterType?: 'expense' | 'income';
  onBack: () => void;
  onCreate: () => void;
  onEdit: (c: Category) => void;
  onDelete: (id: string) => void;
  onReorderConfirm?: (reordered: Category[]) => void;
};

export function CategoryManagementScreen({
  categories,
  filterType,
  onBack,
  onCreate,
  onEdit,
  onDelete,
  onReorderConfirm,
}: Props) {
  const [isReordering, setIsReordering] = useState(false);
  const [localCategories, setLocalCategories] =
    useState<Category[]>(categories);

  const scrollRef = useRef<ScrollView>(null);
  const scrollAreaRef = useRef<View>(null);
  const scrollOffsetRef = useRef(0);
  const scrollAreaTopRef = useRef(0);
  const scrollAreaBottomRef = useRef(0);

  const expenseCategories = (
    isReordering ? localCategories : categories
  ).filter(c => c.type === 'expense');
  const incomeCategories = (isReordering ? localCategories : categories).filter(
    c => c.type === 'income',
  );
  const filteredCategories = filterType
    ? (isReordering ? localCategories : categories).filter(
        c => c.type === filterType,
      )
    : null;

  function enterReordering() {
    setLocalCategories(categories);
    setIsReordering(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function confirmReorder() {
    onReorderConfirm?.(localCategories);
    setIsReordering(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <View className='flex-row items-center gap-3 px-6 pt-6 pb-2'>
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={Colors.brownDarker} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text className='font-ibm-bold text-xl text-brown-darker flex-1'>
          {isReordering ? '순서 변경' : '카테고리 관리'}
        </Text>
        {isReordering ? (
          <TouchableOpacity
            onPress={confirmReorder}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Check size={22} color={Colors.brownDarker} strokeWidth={2.5} />
          </TouchableOpacity>
        ) : (
          <View className='flex-row items-center gap-4'>
            <TouchableOpacity
              onPress={enterReordering}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <ArrowUpDown
                size={20}
                color={Colors.brownDarker}
                strokeWidth={2.5}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCreate}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Plus size={22} color={Colors.brownDarker} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isReordering ? (
        <View
          ref={scrollAreaRef}
          style={{ flex: 1 }}
          onLayout={() => {
            scrollAreaRef.current?.measureInWindow((_, y, __, h) => {
              scrollAreaTopRef.current = y;
              scrollAreaBottomRef.current = y + h;
            });
          }}
        >
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
            onScroll={e => {
              scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
          >
            <SortableCategoryList
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              onOrderChange={setLocalCategories}
              scrollRef={scrollRef}
              scrollOffsetRef={scrollOffsetRef}
              scrollAreaTopRef={scrollAreaTopRef}
              scrollAreaBottomRef={scrollAreaBottomRef}
            />
          </ScrollView>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {filteredCategories ? (
            <View className='mx-4 mt-4'>
              {filteredCategories.length === 0 ? (
                <EmptyState
                  icon={filterType === 'income' ? TrendingUp : Wallet}
                  title='카테고리가 없어요'
                  description='우상단 + 버튼으로 만들어보세요'
                />
              ) : (
                <View className='gap-2.5'>
                  {filteredCategories.map(c => (
                    <CategoryRow
                      key={c.id}
                      c={c}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <>
              <View className='mx-4 mt-4 mb-8'>
                <Text className='font-ibm-bold text-lg text-neutral-700 mb-3 pl-2'>
                  지출
                </Text>
                {expenseCategories.length === 0 ? (
                  <EmptyState
                    icon={Wallet}
                    title='지출 카테고리가 없어요'
                    description='우상단 + 버튼으로 만들어보세요'
                  />
                ) : (
                  <View className='gap-2.5'>
                    {expenseCategories.map(c => (
                      <CategoryRow
                        key={c.id}
                        c={c}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))}
                  </View>
                )}
              </View>

              <View className='mx-4'>
                <Text className='font-ibm-bold text-lg text-neutral-700 mb-3 pl-2'>
                  수입
                </Text>
                {incomeCategories.length === 0 ? (
                  <EmptyState
                    icon={TrendingUp}
                    title='수입 카테고리가 없어요'
                    description='우상단 + 버튼으로 만들어보세요'
                  />
                ) : (
                  <View className='gap-2.5'>
                    {incomeCategories.map(c => (
                      <CategoryRow
                        key={c.id}
                        c={c}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
