import { Text } from 'react-native';

type Props = {
  label: string;
  className?: string;
};

export function SettingsSectionLabel({ label, className }: Props) {
  return (
    <Text
      className={`font-ibm-semibold text-base text-neutral-600 px-6 mb-1${className ? ` ${className}` : ''}`}
    >
      {label}
    </Text>
  );
}
