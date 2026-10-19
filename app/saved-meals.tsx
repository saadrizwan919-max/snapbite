import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import SavedMealRow from '@/components/SavedMealRow';
import { dateKey } from '@/lib/dates';
import { MEAL_TYPES, MealType } from '@/lib/meals';
import { useAppStore } from '@/store/useAppStore';

export default function SavedMeals() {
  const router = useRouter();

  // The home screen opens this with params: { date: "2026-10-15", mealType: "lunch" },
  // so "+" logs to that day under that meal
  const { date, mealType } = useLocalSearchParams<{ date?: string; mealType?: string }>();
  const day = date ?? dateKey(new Date());
  const type: MealType = MEAL_TYPES.some((t) => t.value === mealType) ? (mealType as MealType) : 'snack';

  const savedMeals = useAppStore((s) => s.savedMeals);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const logMeal = useAppStore((s) => s.logMeal);

  const [query, setQuery] = useState('');

  const history = useMemo(() => {
    const q = query.trim().toLowerCase();
    return savedMeals
      .filter((m) => m.name.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [savedMeals, query]);

  const favorites = history.filter((m) => m.isFavorite);

  const handleAdd = (mealId: string) => {
    logMeal(day, mealId, type);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />

      {/* header: back arrow + centered title */}
      <View className="h-14 flex-row items-center justify-center">
        <Pressable onPress={() => router.back()} hitSlop={10} className="absolute left-4">
          <Ionicons name="arrow-back" size={26} color="white" />
        </Pressable>
        <Text className="text-xl font-semibold text-white">Saved meals</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* search */}
        <View className="mt-3 h-14 flex-row items-center gap-4 rounded-full border border-neutral-400 px-5">
          <Ionicons name="search" size={22} color="#D4D4D8" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search saved meals"
            placeholderTextColor="#8E9397"
            className="flex-1 text-base text-white"
          />
        </View>

        {/* favorites */}
        <Text className="mb-3 mt-8 text-lg font-semibold text-white">Favorite Meals</Text>
        {favorites.length === 0 ? (
          <Text className="mb-2 leading-5 text-neutral-400">
            No favorite meals yet.{'\n'}Bookmark a meal to keep it here for quick re-use.
          </Text>
        ) : (
          favorites.map((meal) => (
            <SavedMealRow
              key={`fav-${meal.id}`}
              meal={meal}
              onToggleFavorite={() => toggleFavorite(meal.id)}
              onAdd={() => handleAdd(meal.id)}
            />
          ))
        )}

        {/* history */}
        <Text className="mb-3 mt-6 text-lg font-semibold text-white">Meal History</Text>
        {history.length === 0 ? (
          <Text className="text-neutral-400">No meals found.</Text>
        ) : (
          history.map((meal) => (
            <SavedMealRow
              key={meal.id}
              meal={meal}
              onToggleFavorite={() => toggleFavorite(meal.id)}
              onAdd={() => handleAdd(meal.id)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
