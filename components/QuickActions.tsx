import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

type Props = {
  onLogWeight: () => void;
  onMealHistory: () => void;
  onLogWater: () => void;
};

export default function QuickActions({ onLogWeight, onMealHistory, onLogWater }: Props) {
  const items: { icon: IconName; label: string; onPress: () => void }[] = [
    { icon: 'speedometer-outline', label: 'Log weight', onPress: onLogWeight },
    { icon: 'bookmark-outline', label: 'Meal History', onPress: onMealHistory },
    { icon: 'water-outline', label: 'Log water', onPress: onLogWater },
  ];

  return (
    <View className="mx-4 mt-3 flex-row rounded-3xl bg-[#1A1E20] py-4">
      {items.map((item) => (
        <Pressable key={item.label} onPress={item.onPress} className="flex-1 items-center gap-2">
          <Ionicons name={item.icon} size={26} color="#A0A6AC" />
          <Text className="text-xs text-[#A0A6AC]">{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
