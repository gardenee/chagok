import { useRef } from 'react';
import { Text, View } from 'react-native';
import type { ScrollView } from 'react-native';
import type { RefObject, MutableRefObject } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { GripVertical } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { resolveColor } from '@/constants/color-map';
import { IconBox } from '@/components/ui/icon-box';
import { CategoryIcon } from '@/components/budget/category-icon';
import type { Category } from '@/types/database';
import type { SharedValue } from 'react-native-reanimated';

const ITEM_HEIGHT = 60;
const MAX_SCROLL_SPEED = 12;

type Props = {
  expenseCategories: Category[];
  incomeCategories: Category[];
  onOrderChange: (reordered: Category[]) => void;
  scrollRef?: RefObject<ScrollView | null>;
  scrollOffsetRef?: MutableRefObject<number>;
  scrollAreaTopRef?: MutableRefObject<number>;
  scrollAreaBottomRef?: MutableRefObject<number>;
};

export function SortableCategoryList({
  expenseCategories,
  incomeCategories,
  onOrderChange,
  scrollRef,
  scrollOffsetRef,
  scrollAreaTopRef,
  scrollAreaBottomRef,
}: Props) {
  function handleExpenseReorder(orderedIds: string[]) {
    const reordered = orderedIds.map((id, i) => ({
      ...expenseCategories.find(c => c.id === id)!,
      sort_order: i,
    }));
    onOrderChange([...reordered, ...incomeCategories]);
  }

  function handleIncomeReorder(orderedIds: string[]) {
    const reordered = orderedIds.map((id, i) => ({
      ...incomeCategories.find(c => c.id === id)!,
      sort_order: i,
    }));
    onOrderChange([...expenseCategories, ...reordered]);
  }

  return (
    <View className='mx-4'>
      <View className='mb-8'>
        <Text className='font-ibm-bold text-lg text-neutral-700 mb-3 pl-2'>
          지출
        </Text>
        {expenseCategories.length > 0 && (
          <SortableSection
            items={expenseCategories}
            onReorder={handleExpenseReorder}
            scrollRef={scrollRef}
            scrollOffsetRef={scrollOffsetRef}
            scrollAreaTopRef={scrollAreaTopRef}
            scrollAreaBottomRef={scrollAreaBottomRef}
          />
        )}
      </View>
      <View>
        <Text className='font-ibm-bold text-lg text-neutral-700 mb-3 pl-2'>
          수입
        </Text>
        {incomeCategories.length > 0 && (
          <SortableSection
            items={incomeCategories}
            onReorder={handleIncomeReorder}
            scrollRef={scrollRef}
            scrollOffsetRef={scrollOffsetRef}
            scrollAreaTopRef={scrollAreaTopRef}
            scrollAreaBottomRef={scrollAreaBottomRef}
          />
        )}
      </View>
    </View>
  );
}

function SortableSection({
  items,
  onReorder,
  scrollRef,
  scrollOffsetRef,
  scrollAreaTopRef,
  scrollAreaBottomRef,
}: {
  items: Category[];
  onReorder: (ids: string[]) => void;
  scrollRef?: RefObject<ScrollView | null>;
  scrollOffsetRef?: MutableRefObject<number>;
  scrollAreaTopRef?: MutableRefObject<number>;
  scrollAreaBottomRef?: MutableRefObject<number>;
}) {
  const positions = useSharedValue<Record<string, number>>(
    Object.fromEntries(items.map((item, i) => [item.id, i])),
  );

  function handleDragEnd(posMap: Record<string, number>) {
    const sorted = [...items]
      .sort((a, b) => (posMap[a.id] ?? 0) - (posMap[b.id] ?? 0))
      .map(c => c.id);
    onReorder(sorted);
  }

  return (
    <View style={{ height: items.length * ITEM_HEIGHT }}>
      {items.map((item, index) => (
        <SortableRow
          key={item.id}
          item={item}
          index={index}
          itemCount={items.length}
          positions={positions}
          onDragEnd={handleDragEnd}
          scrollRef={scrollRef}
          scrollOffsetRef={scrollOffsetRef}
          scrollAreaTopRef={scrollAreaTopRef}
          scrollAreaBottomRef={scrollAreaBottomRef}
        />
      ))}
    </View>
  );
}

type RowProps = {
  item: Category;
  index: number;
  itemCount: number;
  positions: SharedValue<Record<string, number>>;
  onDragEnd: (posMap: Record<string, number>) => void;
  scrollRef?: RefObject<ScrollView | null>;
  scrollOffsetRef?: MutableRefObject<number>;
  scrollAreaTopRef?: MutableRefObject<number>;
  scrollAreaBottomRef?: MutableRefObject<number>;
};

function SortableRow({
  item,
  index,
  itemCount,
  positions,
  onDragEnd,
  scrollRef,
  scrollOffsetRef,
  scrollAreaTopRef,
  scrollAreaBottomRef,
}: RowProps) {
  const isActive = useSharedValue(false);
  const startY = useSharedValue(index * ITEM_HEIGHT);
  const translateY = useSharedValue(0);

  const autoScrollDirectionRef = useRef<'up' | 'down' | null>(null);
  const autoScrollSpeedRef = useRef(0);
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function applyAutoScroll(direction: 'up' | 'down' | null, speed: number) {
    autoScrollDirectionRef.current = direction;
    autoScrollSpeedRef.current = speed;

    if (direction && !scrollIntervalRef.current) {
      scrollIntervalRef.current = setInterval(() => {
        const dir = autoScrollDirectionRef.current;
        const spd = autoScrollSpeedRef.current;
        if (!dir || !scrollRef?.current || !scrollOffsetRef) return;
        const delta = dir === 'up' ? -spd : spd;
        const newY = Math.max(0, scrollOffsetRef.current + delta);
        scrollOffsetRef.current = newY;
        scrollRef.current.scrollTo({ y: newY, animated: false });
      }, 16);
    } else if (!direction && scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }

  function computeAutoScroll(absY: number) {
    const areaTop = scrollAreaTopRef?.current ?? 0;
    const areaBottom = scrollAreaBottomRef?.current ?? 0;
    if (!scrollRef?.current || !scrollOffsetRef || areaTop === 0) return;

    const itemTop = absY - ITEM_HEIGHT / 2;
    const itemBottom = absY + ITEM_HEIGHT / 2;

    if (itemTop < areaTop) {
      const overshoot = areaTop - itemTop;
      const speed = Math.max(
        1,
        Math.min(MAX_SCROLL_SPEED, Math.round(overshoot / 3)),
      );
      applyAutoScroll('up', speed);
    } else if (itemBottom > areaBottom) {
      const overshoot = itemBottom - areaBottom;
      const speed = Math.max(
        1,
        Math.min(MAX_SCROLL_SPEED, Math.round(overshoot / 3)),
      );
      applyAutoScroll('down', speed);
    } else {
      applyAutoScroll(null, 0);
    }
  }

  function stopAutoScroll() {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    autoScrollDirectionRef.current = null;
  }

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const pan = Gesture.Pan()
    .activateAfterLongPress(150)
    .onStart(() => {
      isActive.value = true;
      startY.value = (positions.value[item.id] ?? index) * ITEM_HEIGHT;
      runOnJS(triggerHaptic)();
    })
    .onUpdate(e => {
      translateY.value = e.translationY;

      runOnJS(computeAutoScroll)(e.absoluteY);

      const rawY = startY.value + e.translationY;
      const targetIndex = Math.max(
        0,
        Math.min(itemCount - 1, Math.round(rawY / ITEM_HEIGHT)),
      );
      const currentIndex = positions.value[item.id] ?? index;

      if (targetIndex !== currentIndex) {
        const swapId = Object.keys(positions.value).find(
          k => positions.value[k] === targetIndex,
        );
        if (swapId && swapId !== item.id) {
          positions.value = {
            ...positions.value,
            [item.id]: targetIndex,
            [swapId]: currentIndex,
          };
        }
      }
    })
    .onEnd(() => {
      isActive.value = false;
      translateY.value = withTiming(0, { duration: 150 });
      runOnJS(stopAutoScroll)();
      const snapshot = { ...positions.value };
      runOnJS(onDragEnd)(snapshot);
    })
    .onFinalize(() => {
      if (isActive.value) {
        isActive.value = false;
        translateY.value = withTiming(0, { duration: 150 });
      }
      runOnJS(stopAutoScroll)();
    });

  const color = resolveColor(item.color);

  const animatedStyle = useAnimatedStyle(() => {
    const myPosition = positions.value[item.id] ?? index;
    const targetTop = myPosition * ITEM_HEIGHT;

    if (isActive.value) {
      return {
        position: 'absolute' as const,
        top: startY.value,
        left: 0,
        right: 0,
        height: ITEM_HEIGHT,
        transform: [{ translateY: translateY.value }],
        zIndex: 100,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 10,
      };
    }

    return {
      position: 'absolute' as const,
      top: targetTop,
      left: 0,
      right: 0,
      height: ITEM_HEIGHT,
      transform: [{ translateY: 0 }],
      zIndex: 1,
      shadowColor: '#000',
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={animatedStyle}>
        <View
          className='bg-white rounded-2xl pl-3 pr-4 flex-row items-center gap-3.5'
          style={{ height: ITEM_HEIGHT }}
        >
          <GripVertical size={18} color={Colors.neutralDark} strokeWidth={2} />
          <IconBox color={color}>
            <CategoryIcon iconKey={item.icon} color={color} />
          </IconBox>
          <Text className='flex-1 font-ibm-semibold text-base text-neutral-800'>
            {item.name}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
