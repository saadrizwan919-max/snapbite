import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { renderBackdrop, sheetBackground, sheetHandle } from '@/components/SheetParts';
import { dateKey } from '@/lib/dates';
import { MEAL_TYPES, MealType } from '@/lib/meals';
import { useAppStore } from '@/store/useAppStore';

export type ManualEntryHandle = {
  present: (mealType: MealType, name?: string) => void;
  dismiss: () => void;
};

const inputStyle = {
  height: 44,
  borderWidth: 1,
  borderColor: '#6B6F76',
  borderRadius: 6,
  paddingLeft: 12,
  paddingRight: 40,
  fontSize: 16,
  color: '#FFFFFF',
} as const;

// "12,5" or "12.5" -> 12.5. Empty / invalid -> NaN
const toNumber = (text: string) => parseFloat(text.replace(',', '.'));

function NutrientField({
  emoji,
  label,
  unit,
  value,
  onChange,
}: {
  emoji: string;
  label: string;
  unit: string;
  value: string;
  onChange: (text: string) => void;
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
          style={inputStyle}
        />
        <Text pointerEvents="none" className="absolute right-3 text-sm text-neutral-400">
          {unit}
        </Text>
      </View>
    </View>
  );
}

// The form inside the sheet. The modal removes its content when closed,
// so this starts fresh every time the sheet opens.
// Everything (including the button) is one block, so it all moves together with the keyboard.
// It is kept compact on purpose so the whole form fits above the keyboard.
function ManualEntryForm({
  day,
  initialMealType,
  initialName,
  onDone,
}: {
  day: string;
  initialMealType: MealType;
  initialName: string;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const logNewMeal = useAppStore((s) => s.logNewMeal);

  const [name, setName] = useState(initialName);
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');

  const kcal = toNumber(calories);
  const valid = name.trim().length > 0 && Number.isFinite(kcal) && kcal >= 0;

  // macros are optional: empty or invalid counts as 0
  const macro = (text: string) => {
    const n = toNumber(text);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const handleAdd = () => {
    if (!valid) return;
    logNewMeal(day, mealType, {
      name: name.trim(),
      calories: kcal,
      protein: macro(protein),
      carbs: macro(carbs),
      fats: macro(fats),
    });
    onDone();
  };

  return (
    <View className="px-6" style={{ paddingBottom: insets.bottom + 12 }}>
      <Text className="mt-1 text-center text-xl font-semibold text-white">Add food</Text>

      <BottomSheetTextInput
        value={name}
        onChangeText={setName}
        placeholder="Food name"
        placeholderTextColor="#9A9AA0"
        style={{ ...inputStyle, height: 52, paddingRight: 14, marginTop: 12, borderColor: '#8A8A90', fontSize: 17 }}
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
        <NutrientField emoji="🔥" label="Calories" unit="kcal" value={calories} onChange={setCalories} />
        <NutrientField emoji="🍖" label="Protein" unit="g" value={protein} onChange={setProtein} />
      </View>
      <View className="mt-2 flex-row gap-2">
        <NutrientField emoji="🍚" label="Carbs" unit="g" value={carbs} onChange={setCarbs} />
        <NutrientField emoji="🥑" label="Fat" unit="g" value={fats} onChange={setFats} />
      </View>

      <Pressable
        onPress={handleAdd}
        disabled={!valid}
        className={`mt-4 items-center rounded-full py-4 ${valid ? 'bg-neutral-200' : 'bg-neutral-700'}`}>
        <Text className={`text-base font-medium ${valid ? 'text-black' : 'text-neutral-500'}`}>Add to log</Text>
      </Pressable>
    </View>
  );
}

// ---------- the sheet itself ----------
// Same setup as the Log water "Add water" sheet (which moves up correctly with the keyboard).
const ManualEntrySheet = forwardRef<ManualEntryHandle, { selectedDate: Date }>(function ManualEntrySheet(
  { selectedDate },
  ref
) {
  const modalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const [initial, setInitial] = useState<{ mealType: MealType; name: string }>({
    mealType: 'breakfast',
    name: '',
  });

  useImperativeHandle(ref, () => ({
    present: (mealType, name = '') => {
      setInitial({ mealType, name });
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
      // "adjustResize" does nothing on newer Expo/Android (edge-to-edge); "adjustPan" makes the library move the sheet
      android_keyboardInputMode="adjustPan"
      backdropComponent={renderBackdrop}
      backgroundStyle={sheetBackground}
      handleIndicatorStyle={sheetHandle}>
      <BottomSheetView>
        <ManualEntryForm
          day={dateKey(selectedDate)}
          initialMealType={initial.mealType}
          initialName={initial.name}
          onDone={() => modalRef.current?.dismiss()}
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default ManualEntrySheet;
