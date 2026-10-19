import NativeAdCard from '@/components/NativeAdCard';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView,useSafeAreaInsets  } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import ConfirmDialog from '@/components/ConfirmDialog';
import EditFoodSheet, { EditFoodHandle } from '@/components/EditFoodSheet';
import { mealInfo } from '@/lib/meals';
import { useAppStore } from '@/store/useAppStore';

// 6 -> "6", 47.5 -> "47.5"
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : (Math.round(n * 10) / 10).toString());

// Opened from the home screen with params: { date: "2026-10-15", logId: "..." }
export default function MealDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { date, logId } = useLocalSearchParams<{ date: string; logId: string }>();
  const editSheetRef = useRef<EditFoodHandle>(null);

  const meal = useAppStore((s) => s.dailyMeals[date ?? '']?.find((m) => m.logId === logId));
  const isFavorite = useAppStore((s) => s.savedMeals.find((m) => m.id === meal?.mealId)?.isFavorite ?? false);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const removeLoggedMeal = useAppStore((s) => s.removeLoggedMeal);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [scale, setScale] = useState(1); // portion multiplier, only changes what's shown here

  // the meal disappeared (deleted from the edit sheet) -> leave this screen
  // (this is the ONLY place that goes back after a delete, so we never go back twice)
  useEffect(() => {
    if (!meal && router.canGoBack()) router.back();
  }, [meal, router]);

  const selectedDate = useMemo(() => new Date(`${date}T00:00:00`), [date]);

  if (!meal) return <View className="flex-1 bg-black" />;

  const info = mealInfo(meal.mealType ?? 'snack');
  const kcal = Math.round(meal.calories * scale);
  const protein = fmt(meal.protein * scale);
  const carbs = fmt(meal.carbs * scale);
  const fats = fmt(meal.fats * scale);

  // short labels under the photo, worked out from the numbers we have (sodium/sugar aren't tracked)
  const kc = meal.calories * scale;
  const pg = meal.protein * scale;
  const cg = meal.carbs * scale;
  const fg = meal.fats * scale;
  const tags: string[] = [];
  if (kc > 0 && kc <= 150) tags.push('Low calorie');
  if (pg >= 25 || (pg >= 10 && (pg * 4) / kc >= 0.3)) tags.push('High protein content');
  if (cg >= 80 || (cg >= 30 && (cg * 4) / kc >= 0.65)) tags.push('High carb content');
  if (fg >= 30 || (fg >= 10 && (fg * 9) / kc >= 0.45)) tags.push('High fat content');

  const handleDelete = () => {
    setConfirmOpen(false);
    removeLoggedMeal(date, meal.logId); // the effect above closes this screen once the meal is gone
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* top bar */}
      <View className="h-14 flex-row items-center px-4">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color="white" />
        </Pressable>
        <View className="flex-1" />
        <Text className="mr-6 text-xl font-semibold text-neutral-200">Meal</Text>
        <View className="flex-row items-center gap-6">
          <Pressable onPress={() => toggleFavorite(meal.mealId)} hitSlop={10}>
            <Ionicons name={isFavorite ? 'bookmark' : 'bookmark-outline'} size={26} color="white" />
          </Pressable>
          <Pressable onPress={() => editSheetRef.current?.present(meal)} hitSlop={10}>
            <Ionicons name="pencil" size={24} color="white" />
          </Pressable>
          <Pressable onPress={() => setConfirmOpen(true)} hitSlop={10}>
            <Ionicons name="trash-outline" size={26} color="white" />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
        {/* hero photo with name, meal type and portion stepper on top */}
        <View className="h-[190px] justify-end">
          {meal.photoUri && (
            <Image source={{ uri: meal.photoUri }} className="absolute h-full w-full" resizeMode="cover" />
          )}
          <View className="absolute h-full w-full bg-black/45" />
          <View className="flex-row items-end justify-between px-4 pb-4">
            <View className="flex-1 pr-3">
              <Text className="text-2xl font-bold text-white" numberOfLines={2}>
                {meal.name}
              </Text>
              <View className="mt-1 flex-row items-center gap-2">
                <Ionicons name={info.icon} size={18} color="#D4D4D8" />
                <Text className="text-base text-neutral-300">{info.label}</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-3 rounded-full bg-black/50 p-2">
              <Pressable
                onPress={() => setScale((s) => Math.max(0.5, s - 0.5))}
                className="h-9 w-9 items-center justify-center rounded-full bg-neutral-700">
                <Ionicons name="remove" size={22} color="white" />
              </Pressable>
              <Text className="min-w-[40px] text-center text-base font-semibold text-white">{scale}×</Text>
              <Pressable
                onPress={() => setScale((s) => s + 0.5)}
                className="h-9 w-9 items-center justify-center rounded-full bg-neutral-700">
                <Ionicons name="add" size={22} color="white" />
              </Pressable>
            </View>
          </View>
        </View>

        <View className="px-4">
          {tags.length > 0 && (
            <View className="mt-4 flex-row flex-wrap gap-2">
              {tags.map((t) => (
                <View key={t} className="rounded-full bg-[#1F2327] px-3.5 py-2">
                  <Text className="text-sm text-neutral-400">{t}</Text>
                </View>
              ))}
            </View>
          )}

          {/* calories */}
          <View className="mt-4 flex-row items-center gap-4 rounded-3xl bg-[#1A1E20] px-5 py-5">
            <Text className="text-3xl">🔥</Text>
            <View>
              <Text className="text-base text-neutral-400">Calories</Text>
              <Text className="text-3xl font-bold text-white">{kcal} kcal</Text>
            </View>
          </View>

          {/* macros */}
          <View className="mt-3 flex-row gap-3">
            {[
              { emoji: '🍖', value: protein, label: 'Protein' },
              { emoji: '🍚', value: carbs, label: 'Carbs' },
              { emoji: '🥑', value: fats, label: 'Fats' },
            ].map((m) => (
              <View key={m.label} className="flex-1 items-center rounded-3xl bg-[#1A1E20] py-4">
                <Text className="text-2xl">{m.emoji}</Text>
                <Text className="mt-1 text-lg font-bold text-white">{m.value}g</Text>
                <Text className="text-sm text-neutral-400">{m.label}</Text>
              </View>
            ))}
          </View>

          {/* items: one card, one row per food found in the photo */}
          <Text className="mb-3 mt-6 text-lg font-semibold text-white">Items</Text>
          <View className="rounded-3xl bg-[#1A1E20] px-5">
            {(meal.items && meal.items.length > 0
              ? meal.items
              : [{ name: meal.name, grams: 0, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fats: meal.fats }]
            ).map((item, i) => (
              <View
                key={`${item.name}-${i}`}
                className={`flex-row items-center py-5 ${i > 0 ? 'border-t border-neutral-800' : ''}`}>
                <View className="flex-1">
                  <Text className="text-base font-medium text-white">{item.name}</Text>
                  <View className="mt-1.5 flex-row items-center gap-2">
                    <Text className="text-base font-semibold text-neutral-200">
                      {Math.round(item.calories * scale)} kcal
                    </Text>
                    {item.grams > 0 && (
                      <View className="rounded-full bg-neutral-800 px-2.5 py-0.5">
                        <Text className="text-xs text-neutral-300">{Math.round(item.grams * scale)} g</Text>
                      </View>
                    )}
                  </View>
                  <Text className="mt-1.5 text-sm text-neutral-400">
                    🍖 {fmt(item.protein * scale)}g · 🍚 {fmt(item.carbs * scale)}g · 🥑 {fmt(item.fats * scale)}g
                  </Text>
                </View>
                <Pressable onPress={() => editSheetRef.current?.present(meal)} hitSlop={10}>
                  <Ionicons name="pencil" size={22} color="#D4D4D8" />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View className="px-4 pt-2" style={{ paddingBottom: insets.bottom + 8 }}>
        <NativeAdCard />
      </View>

      <EditFoodSheet ref={editSheetRef} selectedDate={selectedDate} />

      <ConfirmDialog
        visible={confirmOpen}
        title="Delete meal?"
        message="This removes the whole entry from your log."
        confirmText="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </SafeAreaView>
  );
}
