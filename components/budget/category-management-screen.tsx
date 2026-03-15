import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { ArrowLeft, Plus, Wallet, TrendingUp } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { CategoryRow } from '@/components/budget/category-row';
import { EmptyState } from '@/components/ui/empty-state';
import type { Category } from '@/types/database';

type Props = {
  categories: Category[];
  filterType?: 'expense' | 'income';
  onBack: () => void;
  onCreate: () => void;
  onEdit: (c: Category) => void;
  onDelete: (id: string) => void;
};

export function CategoryManagementScreen({
  categories,
  filterType,
  onBack,
  onCreate,
  onEdit,
  onDelete,
}: Props) {
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');
  const filteredCategories = filterType
    ? categories.filter(c => c.type === filterType)
    : null;

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
          카테고리 관리
        </Text>
        <TouchableOpacity
          onPress={onCreate}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Plus size={22} color={Colors.brownDarker} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

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
    </SafeAreaView>
  );
}
