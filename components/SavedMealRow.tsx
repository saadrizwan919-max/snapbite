import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SavedMeal } from '@/store/useAppStore';

// 43.2 -> "43.2", 51 -> "51"
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

type Props = {
  meal: SavedMeal;
  onToggleFavorite: () => void;
  onAdd: () => void;
};

export default function SavedMealRow({ meal, onToggleFavorite, onAdd }: Props) {
  return (
    <View className="mb-3 h-[72px] flex-row items-center overflow-hidden rounded-2xl bg-[#1A1E20]">
      {/* photo if the meal came from a picture, otherwise the sparkles tile (AI / typed meal) */}
      {meal.photoUri ? (
        <Image source={{ uri: meal.photoUri }} className="h-full w-[72px]" />
      ) : (
        <View className="h-full w-14 items-center justify-center bg-[#2B2840]">
          <Ionicons name="sparkles" size={26} color="#E6E3F5" />
        </View>
      )}

      <View className="flex-1 px-4">
        <Text className="text-base font-semibold text-white" numberOfLines={1}>
          {meal.name}
        </Text>
        <Text className="mt-0.5 text-xs text-neutral-400">{Math.round(meal.calories)} kcal</Text>
        <Text className="mt-0.5 text-xs text-neutral-400">
          🍖 {fmt(meal.protein)}g · 🍚 {fmt(meal.carbs)}g · 🥑 {fmt(meal.fats)}g
        </Text>
      </View>

      <Pressable onPress={onToggleFavorite} hitSlop={8} className="p-2">
        <Ionicons
          name={meal.isFavorite ? 'bookmark' : 'bookmark-outline'}
          size={24}
          color={meal.isFavorite ? '#E6E3F5' : '#D4D4D8'}
        />
      </Pressable>
      <Pressable onPress={onAdd} hitSlop={8} className="p-2 pr-4">
        <Ionicons name="add" size={28} color="#D4D4D8" />
      </Pressable>
    </View>
  );
}
