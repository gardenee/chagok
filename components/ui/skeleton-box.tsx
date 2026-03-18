import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

type Props = {
  className?: string;
};

export function SkeletonBox({ className = 'w-full h-4 rounded-lg' }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ opacity }}
      className={`bg-neutral-100 ${className}`}
    />
  );
}
