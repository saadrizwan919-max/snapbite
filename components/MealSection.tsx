import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MealType, mealInfo, needsNutrition } from '@/lib/meals';
import type { LoggedMeal } from '@/store/useAppStore';

// 43.2 -> "43.2", 51 -> "51"
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

type Props = {
  type: MealType;
  meals: LoggedMeal[];
  onPressMeal: (meal: LoggedMeal) => void;
};

// One block on the home screen: "Breakfast ..... 334 kcal" followed by its meal cards
export default function MealSection({ type, meals, onPressMeal }: Props) {
  const info = mealInfo(type);
  const total = meals.reduce((sum, m) => sum + m.calories, 0);

  return (
    <View className="mb-6">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Ionicons name={info.icon} size={26} color="#D4D4D8" />
          <Text className="text-2xl font-semibold text-neutral-200">{info.label}</Text>
        </View>
        <Text className="text-base text-neutral-400">{Math.round(total)} kcal</Text>
      </View>

      {meals.map((meal) => (
        <Pressable
          key={meal.logId}
          onPress={() => onPressMeal(meal)}
          className="mb-3 h-[84px] flex-row overflow-hidden rounded-2xl bg-[#1A1E20]">
          {meal.photoUri ? (
            <Image source={{ uri: meal.photoUri }} className="h-full w-[88px]" resizeMode="cover" />
          ) : (
            <View className="h-full w-[88px] items-center justify-center bg-[#2B2840]">
              <Ionicons name="restaurant" size={30} color="#E6E3F5" />
            </View>
          )}

          {meal.items && meal.items.length > 1 && (
            <View className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-2 py-0.5">
              <Text className="text-xs text-white">{meal.items.length} items</Text>
            </View>
          )}

          <View className="flex-1 justify-center px-4">
            <Text className="text-lg font-semibold text-white" numberOfLines={1}>
              {meal.name}
            </Text>
            {needsNutrition(meal) ? (
              <Text className="mt-1 text-sm text-[#C9BFF5]">Tap to add calories & macros</Text>
            ) : (
              <>
                <Text className="mt-1 text-base font-semibold text-neutral-200">
                  🔥 {Math.round(meal.calories)} kcal
                </Text>
                <Text className="mt-1 text-sm text-neutral-400">
                  🍖 {fmt(meal.protein)}g   🍚 {fmt(meal.carbs)}g   🥑 {fmt(meal.fats)}g
                </Text>
              </>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );
}
