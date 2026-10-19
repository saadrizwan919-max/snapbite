import { Ionicons } from '@expo/vector-icons';

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

// Order here = order of the sections on the home screen and in the dropdown
export const MEAL_TYPES: { value: MealType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: 'cafe' },
  { value: 'lunch', label: 'Lunch', icon: 'fast-food' },
  { value: 'snack', label: 'Snack', icon: 'ice-cream' },
  { value: 'dinner', label: 'Dinner', icon: 'restaurant' },
];

export const mealInfo = (type: MealType) => MEAL_TYPES.find((m) => m.value === type)!;

// A photo meal that was just added: it has a picture but the user hasn't typed the calories and macros yet.
export const needsNutrition = (m: { photoUri?: string; calories: number; protein: number; carbs: number; fats: number }) =>
  !!m.photoUri && m.calories === 0 && m.protein === 0 && m.carbs === 0 && m.fats === 0;
