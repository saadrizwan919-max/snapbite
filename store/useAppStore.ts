import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MealType } from '@/lib/meals';
import type { WorkoutExercise } from '@/lib/workout';
import type { Goals, Profile } from '@/lib/plan';

export type WeightUnit = 'kg' | 'lb';

export type Nutrition = {
  calories: number;
  protein: number; // g
  carbs: number; // g
  fats: number; // g
};

// One food inside a meal (a photo can contain several)
export type MealItem = Nutrition & { name: string; grams: number };

// A meal the user has logged before. Shown on the Saved meals screen.
export type SavedMeal = Nutrition & {
  id: string;
  name: string;
  photoUri?: string; // set when the meal came from a photo
  items?: MealItem[]; // the foods the photo contained
  isFavorite: boolean;
  createdAt: number;
};

// One entry in a day's log (a copy of the meal at the time it was logged)
export type LoggedMeal = Nutrition & {
  logId: string;
  mealId: string;
  name: string;
  photoUri?: string;
  items?: MealItem[];
  mealType?: MealType; // optional: entries saved before this field existed don't have it
};

// What you pass when logging a brand new meal (manual entry or photo)
export type NewMeal = Nutrition & { name: string; photoUri?: string; items?: MealItem[] };

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// TODO: remove when the AI creates real meals through addSavedMeal()
const now = Date.now();
const DUMMY_MEALS: SavedMeal[] = [
  { id: 'dummy-1', name: 'Chicken With Roti', calories: 553, protein: 43.2, carbs: 73.5, fats: 9.7, isFavorite: false, createdAt: now },
  { id: 'dummy-2', name: 'Fried Chicken Meal', calories: 870, protein: 51, carbs: 38, fats: 55, isFavorite: false, createdAt: now - 1000 },
  { id: 'dummy-3', name: 'Egg Omelette Toast', calories: 334, protein: 16, carbs: 29.2, fats: 16.4, isFavorite: false, createdAt: now - 2000 },
  { id: 'dummy-4', name: 'Homemade Wheat Roti', calories: 105, protein: 3.6, carbs: 22.5, fats: 0.5, isFavorite: false, createdAt: now - 3000 },
  { id: 'dummy-5', name: 'Besan Chilla Meal', calories: 356, protein: 13.3, carbs: 34.8, fats: 18.2, isFavorite: false, createdAt: now - 4000 },
];

// used until the user finishes (or skips) the onboarding
const DEFAULT_GOALS: Goals = { calories: 2345, protein: 100, carbs: 295, fats: 79 };

type AppState = {
  // ----- onboarding + daily goals -----
  onboardingDone: boolean; // false until the user finishes or skips the first-launch screens
  profile: Profile | null; // what the user told us (null if they skipped)
  goals: Goals; // daily calories and macros. The rings and the calendar read these.
  completeOnboarding: (profile: Profile, goals: Goals, day: string) => void;
  skipOnboarding: () => void;

  // ----- weight -----
  weightUnit: WeightUnit; // which unit the Log weight sheet shows
  weights: Record<string, number>; // dateKey -> kg
  setWeightUnit: (unit: WeightUnit) => void;
  saveWeight: (day: string, kg: number) => void;

  // ----- water -----
  waterGoal: number; // ml
  water: Record<string, number>; // dateKey -> ml logged that day
  addWater: (day: string, ml: number) => void;

  // ----- pro (cached copy: Google Play is the real source of truth) -----
  isPro: boolean;
  setPro: (value: boolean) => void;

  // ----- workout plan -----
  // Keyed by weekday (0 = Sunday ... 6 = Saturday), NOT by date: a Monday plan repeats every Monday.
  workoutPlans: Record<string, WorkoutExercise[]>;
  saveWorkoutPlan: (weekday: number, exercises: WorkoutExercise[]) => void;

  // ----- meals -----
  savedMeals: SavedMeal[];
  dailyMeals: Record<string, LoggedMeal[]>; // dateKey -> meals logged that day
  addSavedMeal: (meal: Omit<SavedMeal, 'id' | 'createdAt' | 'isFavorite'>) => string; // returns the new id
  toggleFavorite: (id: string) => void;
  logMeal: (day: string, mealId: string, mealType: MealType) => void; // log an existing saved meal
  logNewMeal: (day: string, mealType: MealType, meal: NewMeal) => void; // save it AND log it
  removeLoggedMeal: (day: string, logId: string) => void;
  updateLoggedMeal: (day: string, logId: string, patch: Partial<Nutrition & { name: string; mealType: MealType }>) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      onboardingDone: false,
      profile: null,
      goals: DEFAULT_GOALS,
      // saves the answers + goals, and logs the starting weight on the first day
      completeOnboarding: (profile, goals, day) =>
        set((s) => ({
          onboardingDone: true,
          profile,
          goals,
          weights: { ...s.weights, [day]: profile.startWeightKg },
        })),
      skipOnboarding: () => set({ onboardingDone: true }),

      weightUnit: 'kg',
      weights: {},
      setWeightUnit: (unit) => set({ weightUnit: unit }),
      saveWeight: (day, kg) => set((s) => ({ weights: { ...s.weights, [day]: kg } })),

      waterGoal: 2000,
      water: {},
      addWater: (day, ml) => set((s) => ({ water: { ...s.water, [day]: (s.water[day] ?? 0) + ml } })),

      isPro: false,
      setPro: (value) => set({ isPro: value }),

      workoutPlans: {},
      saveWorkoutPlan: (weekday, exercises) =>
        set((s) => ({ workoutPlans: { ...s.workoutPlans, [String(weekday)]: exercises } })),

      savedMeals: DUMMY_MEALS,
      dailyMeals: {},

      addSavedMeal: (meal) => {
        const id = makeId();
        set((s) => ({
          savedMeals: [{ ...meal, id, isFavorite: false, createdAt: Date.now() }, ...s.savedMeals],
        }));
        return id;
      },

      toggleFavorite: (id) =>
        set((s) => ({
          savedMeals: s.savedMeals.map((m) => (m.id === id ? { ...m, isFavorite: !m.isFavorite } : m)),
        })),

      logMeal: (day, mealId, mealType) =>
        set((s) => {
          const meal = s.savedMeals.find((m) => m.id === mealId);
          if (!meal) return s;
          const entry: LoggedMeal = {
            logId: makeId(),
            mealId,
            mealType,
            name: meal.name,
            photoUri: meal.photoUri,
            items: meal.items,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
          };
          return { dailyMeals: { ...s.dailyMeals, [day]: [...(s.dailyMeals[day] ?? []), entry] } };
        }),

      // Manual entry and photo meals go through here: they appear under the meal type
      // on the day AND get saved, so they also show up in Meal History.
      logNewMeal: (day, mealType, meal) =>
        set((s) => {
          const mealId = makeId();
          const saved: SavedMeal = { ...meal, id: mealId, isFavorite: false, createdAt: Date.now() };
          const entry: LoggedMeal = { ...meal, logId: makeId(), mealId, mealType };
          return {
            savedMeals: [saved, ...s.savedMeals],
            dailyMeals: { ...s.dailyMeals, [day]: [...(s.dailyMeals[day] ?? []), entry] },
          };
        }),

      updateLoggedMeal: (day, logId, patch) =>
        set((s) => {
          const current = (s.dailyMeals[day] ?? []).find((m) => m.logId === logId);
          // A photo that was added without numbers: filling them in also fixes its Meal History entry,
          // so history doesn't keep a "0 kcal" copy.
          const wasEmptyPhoto =
            !!current && !!current.photoUri && current.calories === 0 && current.protein === 0 && current.carbs === 0 && current.fats === 0;

          return {
            dailyMeals: {
              ...s.dailyMeals,
              [day]: (s.dailyMeals[day] ?? []).map((m) => {
                if (m.logId !== logId) return m;
                // if the user changed the totals, the per-food breakdown no longer adds up, so drop it
                const totalsChanged = (['calories', 'protein', 'carbs', 'fats'] as const).some(
                  (k) => patch[k] !== undefined && patch[k] !== m[k]
                );
                return { ...m, ...patch, ...(totalsChanged ? { items: undefined } : {}) };
              }),
            },
            ...(wasEmptyPhoto && current
              ? {
                  savedMeals: s.savedMeals.map((sm) =>
                    sm.id === current.mealId
                      ? {
                          ...sm,
                          name: patch.name ?? sm.name,
                          calories: patch.calories ?? sm.calories,
                          protein: patch.protein ?? sm.protein,
                          carbs: patch.carbs ?? sm.carbs,
                          fats: patch.fats ?? sm.fats,
                        }
                      : sm
                  ),
                }
              : {}),
          };
        }),

      removeLoggedMeal: (day, logId) =>
        set((s) => ({
          dailyMeals: {
            ...s.dailyMeals,
            [day]: (s.dailyMeals[day] ?? []).filter((m) => m.logId !== logId),
          },
        })),
    }),
    { name: 'gym-app-store', storage: createJSONStorage(() => AsyncStorage) }
  )
);

// true once the saved data has been read from the phone (it loads a moment after the app starts)
export const useStoreHydrated = () => {
  const [hydrated, setHydrated] = useState(() => useAppStore.persist.hasHydrated());
  useEffect(() => {
    const unsubscribe = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAppStore.persist.hasHydrated());
    return unsubscribe;
  }, []);
  return hydrated;
};

// ----- helpers (plain functions, not store state) -----

// Most recent saved weight in kg, or undefined if the user never logged one
export const latestWeightKg = (weights: Record<string, number>): number | undefined => {
  const keys = Object.keys(weights).sort(); // "YYYY-MM-DD" keys sort by date
  return keys.length ? weights[keys[keys.length - 1]] : undefined;
};

// Add up a list of meals, e.g. sumNutrition(dailyMeals[dateKey] ?? [])
export const sumNutrition = (meals: Nutrition[]): Nutrition =>
  meals.reduce<Nutrition>(
    (t, m) => ({
      calories: t.calories + m.calories,
      protein: t.protein + m.protein,
      carbs: t.carbs + m.carbs,
      fats: t.fats + m.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
