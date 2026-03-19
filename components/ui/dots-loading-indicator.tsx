import { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { Colors } from '@/constants/colors';

type Props = {
  color?: string;
  size?: number;
};

export function DotsLoadingIndicator({
  color = Colors.brown,
  size = 7,
}: Props) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createBounce = (anim: Animated.Value) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: -(size + 1),
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.delay(560),
        ]),
      );

    const anims = [
      Animated.sequence([Animated.delay(0), createBounce(dot1)]),
      Animated.sequence([Animated.delay(140), createBounce(dot2)]),
      Animated.sequence([Animated.delay(280), createBounce(dot3)]),
    ];

    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, [dot1, dot2, dot3, size]);

  const dotStyle = (anim: Animated.Value) => ({
    transform: [{ translateY: anim }],
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color + '70',
  });

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 3,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
      }}
    >
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={dotStyle(dot2)} />
      <Animated.View style={dotStyle(dot3)} />
    </View>
  );
}
