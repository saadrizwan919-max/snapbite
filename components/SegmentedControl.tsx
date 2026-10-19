import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export default function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View className="flex-row self-center overflow-hidden rounded-full border border-neutral-500">
      {options.map((option, i) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={`flex-row items-center justify-center gap-2 px-6 py-4 ${
              selected ? 'bg-[#2D2A4A]' : 'bg-[#17181B]'
            } ${i > 0 ? 'border-l border-neutral-500' : ''}`}>
            {selected && <Ionicons name="checkmark" size={20} color="#E6E3F5" />}
            <Text className={`text-base ${selected ? 'text-[#E6E3F5]' : 'text-neutral-200'}`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
