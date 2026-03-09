import {
  View,
  TouchableOpacity,
  PanResponder,
  Animated,
  Pressable,
  Modal,
} from 'react-native';
import type { ReactNode } from 'react';
import { useRef, useState, useCallback } from 'react';
import { Trash2 } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

type Props = {
  onDelete: () => void;
  children: ReactNode;
};

const DELETE_WIDTH = 80;
const RADIUS = 24;

type BtnLayout = { x: number; y: number; width: number; height: number };

export function SwipeableDeleteRow({ onDelete, children }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [btnLayout, setBtnLayout] = useState<BtnLayout | null>(null);
  const rowRef = useRef<View>(null);

  const close = useCallback(() => {
    isOpen.current = false;
    setModalVisible(false);
    setBtnLayout(null);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  }, [translateX]);

  const openRow = useCallback(() => {
    rowRef.current?.measureInWindow((x, y, width, height) => {
      setBtnLayout({
        x: x + width - DELETE_WIDTH,
        y,
        width: DELETE_WIDTH,
        height,
      });
      isOpen.current = true;
      setModalVisible(true);
    });
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        translateX.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        const base = isOpen.current ? -DELETE_WIDTH : 0;
        const next = Math.min(0, Math.max(-DELETE_WIDTH, base + g.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const base = isOpen.current ? -DELETE_WIDTH : 0;
        const projected = base + g.dx;
        const shouldOpen = projected < -DELETE_WIDTH / 2;
        Animated.spring(translateX, {
          toValue: shouldOpen ? -DELETE_WIDTH : 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
        if (shouldOpen && !isOpen.current) {
          openRow();
        } else if (!shouldOpen && isOpen.current) {
          isOpen.current = false;
          setModalVisible(false);
          setBtnLayout(null);
        }
      },
    }),
  ).current;

  function handleDelete() {
    onDelete();
    close();
  }

  return (
    <View
      ref={rowRef}
      collapsable={false}
      style={{
        borderRadius: RADIUS,
        backgroundColor: 'white',
        shadowColor: Colors.brown,
        shadowOpacity: 0.07,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      {/* 카드 슬라이드 영역 */}
      <View
        style={{
          borderTopLeftRadius: RADIUS,
          borderBottomLeftRadius: RADIUS,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            transform: [{ translateX }],
            backgroundColor: 'white',
          }}
          {...panResponder.panHandlers}
        >
          {children}
        </Animated.View>
      </View>

      {/* 전체화면 투명 Modal — 바깥 탭 감지 + 삭제 버튼 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType='none'
        onRequestClose={close}
      >
        {/* 전체화면 backdrop: 어디든 탭하면 닫힘 */}
        <Pressable style={{ flex: 1 }} onPress={close}>
          {/* 삭제 버튼: 원래 위치에 렌더 (measureInWindow 좌표) */}
          {btnLayout && (
            <Pressable
              onPress={handleDelete}
              style={{
                position: 'absolute',
                left: btnLayout.x,
                top: btnLayout.y,
                width: btnLayout.width,
                height: btnLayout.height,
                backgroundColor: '#EF4444',
                borderTopRightRadius: RADIUS,
                borderBottomRightRadius: RADIUS,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 size={22} color='#fff' strokeWidth={2.5} />
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
