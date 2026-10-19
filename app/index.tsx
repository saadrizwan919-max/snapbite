import AdBanner from '@/components/AdBanner';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { computeStreak, dayHeading } from '@/lib/streak';
import AppHeader from '@/components/AppHeader';
import ProSheet from '@/components/ProSheet';
import { fetchProStatus } from '@/lib/billing';
import DataStrip from '@/components/DataStrip';
import CaloriesRing from '@/components/CaloriesRing';
import MacrosStrip from '@/components/MacrosStrip';
import QuickActions from '@/components/QuickActions';
import LogWeightSheet from '@/components/LogWeightSheet';
import LogWaterSheet from '@/components/LogWaterSheet';
import ActionsSheet from '@/components/ActionsSheet';
import ManualEntrySheet, { ManualEntryHandle } from '@/components/ManualEntrySheet';
import EditFoodSheet, { EditFoodHandle } from '@/components/EditFoodSheet';
import WorkoutPlanSheet from '@/components/WorkoutPlanSheet';
import { WEEKDAY_NAMES } from '@/lib/workout';
import MealInputBar from '@/components/MealInputBar';
import MealSection from '@/components/MealSection';
import { SheetHandle } from '@/components/SheetParts';
import { dateKey } from '@/lib/dates';
import { MEAL_TYPES, MealType, needsNutrition } from '@/lib/meals';
import { LoggedMeal, sumNutrition, useAppStore, useStoreHydrated } from '@/store/useAppStore';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const today = startOfDay(new Date());

const NO_MEALS: LoggedMeal[] = []; // stable empty array so the selector doesn't re-render for nothing
const round1 = (n: number) => Math.round(n * 10) / 10;

const Home = () => {
  const [selectedDate, setSelectedDate] = useState(today);
  const [mealType, setMealType] = useState<MealType>('breakfast');

  // daily goals come from the onboarding (or the defaults if the user skipped it)
  const goals = useAppStore((s) => s.goals);
  const goal = goals.calories;
  const pGoal = goals.protein;
  const cGoal = goals.carbs;
  const fGoal = goals.fats;

  const router = useRouter();
  const [notice, setNotice] = useState({ open: false, title: '', message: '' });
  const showNotice = (title: string, message: string) => setNotice({ open: true, title, message });
  const closeNotice = () => setNotice((n) => ({ ...n, open: false }));
  const insets = useSafeAreaInsets();
  const proSheetRef = useRef<SheetHandle>(null);
  const isPro = useAppStore((s) => s.isPro);
  const setPro = useAppStore((s) => s.setPro);

  // on launch ask Google Play whether Pro is active (null = couldn't check, keep the cached value)
  useEffect(() => {
    fetchProStatus().then((active) => {
      if (active !== null) setPro(active);
    });
  }, [setPro]);
  const weightSheetRef = useRef<SheetHandle>(null);
  const waterSheetRef = useRef<SheetHandle>(null);
  const actionsSheetRef = useRef<SheetHandle>(null);
  const manualSheetRef = useRef<ManualEntryHandle>(null);
  const editSheetRef = useRef<EditFoodHandle>(null);
  const workoutSheetRef = useRef<SheetHandle>(null);

  // ----- what was eaten on the selected day (comes from the store, so rings update) -----
  const day = dateKey(selectedDate);
  const dayMeals = useAppStore((s) => s.dailyMeals[day]) ?? NO_MEALS;
  const logNewMeal = useAppStore((s) => s.logNewMeal);
  const workoutCount = useAppStore((s) => s.workoutPlans[String(selectedDate.getDay())]?.length ?? 0);

  const totals = useMemo(() => sumNutrition(dayMeals), [dayMeals]);

  // days in a row with something logged (counted up to today, not the selected day)
  const allMeals = useAppStore((s) => s.dailyMeals);
  const streak = useMemo(() => computeStreak(allMeals), [allMeals]);

  // only sections that have meals are shown. Entries without a type (old data) go under Snack.
  const sections = useMemo(
    () =>
      MEAL_TYPES.map((t) => ({
        type: t.value,
        meals: dayMeals.filter((m) => (m.mealType ?? 'snack') === t.value),
      })).filter((s) => s.meals.length > 0),
    [dayMeals]
  );

  // ----- actions -----
  const openManualEntry = (name?: string) => manualSheetRef.current?.present(mealType, name);

  const openSavedMeals = () =>
    router.push({ pathname: '/saved-meals', params: { date: day, mealType } });

  // photo -> added under the selected meal type with 0 kcal. The user taps it to type the calories and macros.
  const logPhoto = (uri: string) => {
    logNewMeal(day, mealType, { name: 'Photo meal', calories: 0, protein: 0, carbs: 0, fats: 0, photoUri: uri });
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) logPhoto(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showNotice('Camera permission needed', 'Allow camera access in your phone settings to snap meals.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) logPhoto(result.assets[0].uri);
  };

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />
      {/* header with its own background, which also fills the status bar area */}
      <View className="bg-[#1B1E21]" style={{ paddingTop: insets.top }}>
        <AppHeader isPro={isPro} onPressPro={() => proSheetRef.current?.present()} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 230 }} // room for the floating bar
      >
        <DataStrip selectedDate={selectedDate} onSelectedDate={setSelectedDate} />

        {/* selected day + streak */}
        <View className="mb-3 mt-4 flex-row items-center justify-between px-6">
          <Text className="text-base text-neutral-300">{dayHeading(selectedDate)}</Text>
          <View className="flex-row items-center gap-2 rounded-full bg-[#2B2840] px-4 py-2">
            <Ionicons name="flame" size={16} color="#C9BFF5" />
            <Text className="text-sm font-medium text-[#C9BFF5]">{streak} day streak</Text>
          </View>
        </View>

        <CaloriesRing goal={goal} eaten={Math.round(totals.calories)} />

        <AdBanner />

        <View className="mt-2 flex-row gap-3 px-4">
          <MacrosStrip name="Protien" emoji="🍖" macros={round1(totals.protein)} goal={pGoal} color="#FF615E" />
          <MacrosStrip name="Carbs" emoji="🍚" macros={round1(totals.carbs)} goal={cGoal} color="#A7D0D6" />
          <MacrosStrip name="Fats" emoji="🥑" macros={round1(totals.fats)} goal={fGoal} color="#FFF69D" />
        </View>

        <AdBanner /> 

        <QuickActions
          onLogWeight={() => weightSheetRef.current?.present()}
          onMealHistory={openSavedMeals}
          onLogWater={() => waterSheetRef.current?.present()}
        />

        {/* gym workout plan: opens a bottom sheet for the selected weekday */}
        <Pressable
          onPress={() => workoutSheetRef.current?.present()}
          className="mx-4 mt-3 flex-row items-center gap-4 rounded-3xl bg-[#1A1E20] px-5 py-4">
          <Ionicons name="barbell-outline" size={28} color="#E6E3F5" />
          <View className="flex-1">
            <Text className="text-base font-semibold text-white">Gym workout plan</Text>
            <Text className="text-sm text-neutral-400">
              {workoutCount > 0
                ? `${WEEKDAY_NAMES[selectedDate.getDay()]}: ${workoutCount} exercise${workoutCount === 1 ? '' : 's'}`
                : `Plan your ${WEEKDAY_NAMES[selectedDate.getDay()]} workout`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#8E9397" />
        </Pressable>

        <View className="mt-8 px-4">
          {sections.length === 0 && (
            <Text className="px-6 pt-10 text-center text-base leading-6 text-neutral-500">
              Nothing logged yet. Type what you ate, or add a photo and fill in the calories.
            </Text>
          )}
          {sections.map((s) => (
            <MealSection key={s.type} type={s.type} meals={s.meals} onPressMeal={(meal) =>
                // a photo with numbers opens the detail screen; manual entries and photos that still
                // need their calories and macros open the edit sheet
                meal.photoUri && !needsNutrition(meal)
                  ? router.push({ pathname: '/meal-detail', params: { date: day, logId: meal.logId } })
                  : editSheetRef.current?.present(meal)
              } />
          ))}
        </View>
      </ScrollView>

      <MealInputBar
        mealType={mealType}
        onChangeMealType={setMealType}
        onPlus={() => actionsSheetRef.current?.present()}
        onPressInput={() => openManualEntry()}
        onGallery={pickFromGallery}
        onCamera={takePhoto}
      />

      {/* sheets */}
      <ActionsSheet
        ref={actionsSheetRef}
        onLogWeight={() => weightSheetRef.current?.present()}
        onLogWater={() => waterSheetRef.current?.present()}
        onManualEntry={() => openManualEntry()}
      />
      <ManualEntrySheet ref={manualSheetRef} selectedDate={selectedDate} />
      <EditFoodSheet ref={editSheetRef} selectedDate={selectedDate} />
      <ProSheet ref={proSheetRef} />
      <WorkoutPlanSheet ref={workoutSheetRef} selectedDate={selectedDate} />
      <LogWeightSheet ref={weightSheetRef} selectedDate={selectedDate} />
      <LogWaterSheet ref={waterSheetRef} selectedDate={selectedDate} />
      <ConfirmDialog
        visible={notice.open}
        title={notice.title}
        message={notice.message}
        confirmText="OK"
        cancelText={null}
        onConfirm={closeNotice}
        onCancel={closeNotice}
      />
    </View>
  );
};

// First launch: show the onboarding once, then the home screen.
// (Waiting for the saved data avoids flashing the onboarding for people who already finished it.)
export default function Index() {
  const hydrated = useStoreHydrated();
  const onboardingDone = useAppStore((s) => s.onboardingDone);

  if (!hydrated) return <View style={{ flex: 1, backgroundColor: 'black' }} />;
  if (!onboardingDone) return <Redirect href="/onboarding" />;
  return <Home />;
}
