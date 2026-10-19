import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ConfirmDialog from '@/components/ConfirmDialog';
import { renderBackdrop, sheetBackground, sheetHandle } from '@/components/SheetParts';
import { dateKey } from '@/lib/dates';
import { MEAL_TYPES, MealType, needsNutrition } from '@/lib/meals';
import { LoggedMeal, useAppStore } from '@/store/useAppStore';

export type EditFoodHandle = {
  present: (meal: LoggedMeal) => void;
  dismiss: () => void;
};

const baseInput = {
  height: 44,
  borderWidth: 1,
  borderColor: '#6B6F76',
  borderRadius: 6,
  paddingLeft: 12,
  paddingRight: 40,
  fontSize: 18,
  fontWeight: '600',
} as const;

const toNumber = (text: string) => parseFloat(text.replace(',', '.'));
const macro = (text: string) => {
  const n = toNumber(text);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

function Field({
  emoji,
  label,
  unit,
  value,
  color,
  onChange,
  placeholder,
}: {
  emoji: string;
  label: string;
  unit: string;
  value: string;
  color: string;
  onChange: (text: string) => void;
  placeholder?: string;
}) {
  return (
    <View className="flex-1 rounded-2xl bg-[#17181B] p-2.5">
      <Text className="text-sm text-neutral-200">
        {emoji} {label}
      </Text>
      <View className="mt-1.5 justify-center">
        <BottomSheetTextInput
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor="#6B6F76"
          style={{ ...baseInput, color }}
        />
        <Text pointerEvents="none" className="absolute right-3 text-sm text-neutral-400">
          {unit}
        </Text>
      </View>
    </View>
  );
}

// Starts with the tapped meal's values. The modal removes its content when closed, so it's fresh every time.
function EditFoodForm({ day, meal, onDone }: { day: string; meal: LoggedMeal; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const updateLoggedMeal = useAppStore((s) => s.updateLoggedMeal);
  const removeLoggedMeal = useAppStore((s) => s.removeLoggedMeal);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(meal.name);
  const [mealType, setMealType] = useState<MealType>(meal.mealType ?? 'snack');
  // a photo that was just added has no numbers yet: start with empty boxes instead of zeros
  const isNew = needsNutrition(meal);
  const [calories, setCalories] = useState(isNew ? '' : String(meal.calories));
  const [protein, setProtein] = useState(isNew ? '' : String(meal.protein));
  const [carbs, setCarbs] = useState(isNew ? '' : String(meal.carbs));
  const [fats, setFats] = useState(isNew ? '' : String(meal.fats));

  const kcal = toNumber(calories);
  const valid = name.trim().length > 0 && Number.isFinite(kcal) && kcal >= 0;

  const handleSave = () => {
    if (!valid) return;
    updateLoggedMeal(day, meal.logId, {
      name: name.trim(),
      mealType,
      calories: kcal,
      protein: macro(protein),
      carbs: macro(carbs),
      fats: macro(fats),
    });
    onDone();
  };

  const handleDelete = () => setConfirmDelete(true);

  return (
    <View className="px-6" style={{ paddingBottom: insets.bottom + 8 }}>
      <Text className="mt-1 text-center text-xl font-semibold text-white">
        {isNew ? 'Add calories & macros' : 'Edit food'}
      </Text>

      {meal.photoUri && (
        <Image source={{ uri: meal.photoUri }} style={{ height: 130, borderRadius: 16, marginTop: 12 }} resizeMode="cover" />
      )}

      <BottomSheetTextInput
        value={name}
        onChangeText={setName}
        placeholder="Food name"
        placeholderTextColor="#9A9AA0"
        style={{ ...baseInput, height: 52, paddingRight: 14, marginTop: 12, borderColor: '#8A8A90', color: '#FFFFFF', fontWeight: '400' }}
      />

      <View className="mt-3 flex-row gap-2">
        {MEAL_TYPES.map((m) => {
          const selected = m.value === mealType;
          return (
            <Pressable
              key={m.value}
              onPress={() => setMealType(m.value)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-full border border-neutral-500 py-2 ${
                selected ? 'bg-[#2D2A4A]' : ''
              }`}>
              <Ionicons name={m.icon} size={14} color="#E6E3F5" />
              <Text className="text-xs text-[#E6E3F5]">{m.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-3 flex-row gap-2">
        <Field emoji="🔥" label="Calories" unit="kcal" value={calories} color="#E5E5E5" onChange={setCalories} placeholder="0" />
        <Field emoji="🍖" label="Protein" unit="g" value={protein} color="#E0645C" onChange={setProtein} placeholder="0" />
      </View>
      <View className="mt-2 flex-row gap-2">
        <Field emoji="🍚" label="Carbs" unit="g" value={carbs} color="#E0A050" onChange={setCarbs} placeholder="0" />
        <Field emoji="🥑" label="Fat" unit="g" value={fats} color="#4F8FD6" onChange={setFats} placeholder="0" />
      </View>

      <Pressable
        onPress={handleSave}
        disabled={!valid}
        className={`mt-4 items-center rounded-full py-4 ${valid ? 'bg-neutral-200' : 'bg-neutral-700'}`}>
        <Text className={`text-base font-medium ${valid ? 'text-black' : 'text-neutral-500'}`}>{isNew ? 'Save' : 'Save changes'}</Text>
      </Pressable>

      <Pressable onPress={handleDelete} className="mt-2 flex-row items-center justify-center gap-2 py-3">
        <Ionicons name="trash-outline" size={20} color="#E0877F" />
        <Text className="text-base text-[#E0877F]">Delete</Text>
      </Pressable>

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this food?"
        message={meal.name}
        confirmText="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          removeLoggedMeal(day, meal.logId);
          onDone();
        }}
      />
    </View>
  );
}

// ---------- the sheet (same keyboard setup as the Manual entry sheet) ----------
const EditFoodSheet = forwardRef<EditFoodHandle, { selectedDate: Date }>(function EditFoodSheet(
  { selectedDate },
  ref
) {
  const modalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const [meal, setMeal] = useState<LoggedMeal | null>(null);

  useImperativeHandle(ref, () => ({
    present: (m) => {
      setMeal(m);
      modalRef.current?.present();
    },
    dismiss: () => modalRef.current?.dismiss(),
  }));

  return (
    <BottomSheetModal
      ref={modalRef}
      enableDynamicSizing
      topInset={insets.top}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustPan"
      backdropComponent={renderBackdrop}
      backgroundStyle={sheetBackground}
      handleIndicatorStyle={sheetHandle}>
      <BottomSheetView>
        {meal && (
          <EditFoodForm
            key={meal.logId}
            day={dateKey(selectedDate)}
            meal={meal}
            onDone={() => modalRef.current?.dismiss()}
          />
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default EditFoodSheet;
