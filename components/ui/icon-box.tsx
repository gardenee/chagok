import { View } from 'react-native';
import type { ReactNode } from 'react';

type Props = {
  color: string;
  size?: 'sm' | 'md';
  children: ReactNode;
};

export function IconBox({ color, size = 'sm', children }: Props) {
  return (
    <View
      className={`${size === 'sm' ? 'w-10 h-10' : 'w-11 h-11'} rounded-2xl items-center justify-center`}
      style={{ backgroundColor: color + '33' }}
    >
      {children}
    </View>
  );
}
