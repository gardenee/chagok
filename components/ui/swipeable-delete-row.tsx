import { View, TouchableOpacity, PanResponder, Animated } from 'react-native';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { Trash2 } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

type Props = {
  onDelete: () => void;
  children: ReactNode;
  deleteLabel?: string;
};

const DELETE_WIDTH = 72;

export function SwipeableDeleteRow({ onDelete, children }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const currentX = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        translateX.stopAnimation(val => {
          currentX.current = val;
        });
        translateX.setOffset(currentX.current);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        const next = Math.min(0, Math.max(-DELETE_WIDTH, g.dx));
        translateX.setValue(next - currentX.current);
      },
      onPanResponderRelease: (_, g) => {
        translateX.flattenOffset();
        const target = g.dx < -DELETE_WIDTH / 2 ? -DELETE_WIDTH : 0;
        currentX.current = target;
        Animated.spring(translateX, {
          toValue: target,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      },
    }),
  ).current;

  function handleDelete() {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start(() => {
      currentX.current = 0;
    });
    onDelete();
  }

  return (
    <View className='overflow-hidden rounded-3xl'>
      {/* 삭제 버튼 (뒤에 고정) */}
      <View
        className='absolute right-0 top-0 bottom-0 items-center justify-center'
        style={{ width: DELETE_WIDTH, backgroundColor: Colors.peach + 'CC' }}
      >
        <TouchableOpacity
          onPress={handleDelete}
          className='flex-1 items-center justify-center w-full'
          activeOpacity={0.7}
        >
          <Trash2 size={20} color='#fff' strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* 콘텐츠 */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}
