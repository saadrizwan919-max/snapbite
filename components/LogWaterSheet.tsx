import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ProgressRing from '@/components/ProgressRing';
import SegmentedControl from '@/components/SegmentedControl';
import { SheetHandle, renderBackdrop, sheetBackground, sheetHandle } from '@/components/SheetParts';
import { dateKey } from '@/lib/dates';
import { ML_PER_BOTTLE, ML_PER_GLASS, WaterUnit, toMl } from '@/lib/units';
import { useAppStore } from '@/store/useAppStore';

// ---------- sheet 1: Hydration (Glass / Bottle / Custom) ----------
const QUICK_ADD = [
  { label: 'Glass', emoji: '🥛', ml: ML_PER_GLASS },
  { label: 'Bottle', emoji: '🍼', ml: ML_PER_BOTTLE },
];

function HydrationContent({ day, onCustom }: { day: string; onCustom: () => void }) {
  const insets = useSafeAreaInsets();
  const logged = useAppStore((s) => s.water[day] ?? 0);
  const goal = useAppStore((s) => s.waterGoal);
  const addWater = useAppStore((s) => s.addWater);

  return (
    <View className="px-6" style={{ paddingBottom: insets.bottom + 16 }}>
      <View className="mt-6 flex-row items-center gap-3">
        <Ionicons name="water" size={28} color="white" />
        <Text className="text-2xl font-semibold text-white">Hydration</Text>
      </View>

      <View className="mt-6 flex-row items-center justify-between">
        <View>
          <Text className="text-white">
            <Text className="text-4xl font-bold">{Math.round(logged)}</Text>
            <Text className="text-xl text-neutral-300"> / {goal} ml</Text>
          </Text>
          <Text className="mt-1 text-base text-neutral-400">
            Water <Text className="font-semibold text-neutral-200">logged</Text>
          </Text>
        </View>

        <ProgressRing size={96} strokeWidth={10} progress={goal > 0 ? logged / goal : 0} color="#FFFFFF">
          <Ionicons name="water" size={34} color="#FFFFFF" />
        </ProgressRing>
      </View>

      <View className="mt-8 flex-row gap-3">
        {QUICK_ADD.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => addWater(day, item.ml)}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-neutral-500 py-4">
            <Text className="text-lg">{item.emoji}</Text>
            <Text className="text-base text-white">{item.label}</Text>
          </Pressable>
        ))}

        <Pressable
          onPress={onCustom}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-neutral-500 py-4">
          <Ionicons name="add" size={22} color="#A3A3A3" />
          <Text className="text-base text-white">Custom</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------- sheet 2: Add water (custom amount) ----------
function AddWaterContent({ day, onClose }: { day: string; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const addWater = useAppStore((s) => s.addWater);

  const [unit, setUnit] = useState<WaterUnit>('ml');
  const [text, setText] = useState('');

  // "250" or "8,5" -> number. Anything else -> NaN, which makes the Add button disabled.
  const amount = parseFloat(text.replace(',', '.'));
  const valid = Number.isFinite(amount) && amount > 0;

  const handleAdd = () => {
    if (!valid) return;
    addWater(day, Math.round(toMl(amount, unit))); // the store always keeps ml
    onClose();
  };

  return (
    <View className="px-6" style={{ paddingBottom: insets.bottom + 16 }}>
      <Text className="mt-6 text-center text-2xl font-semibold text-white">Add water</Text>

      <View className="mt-6">
        <SegmentedControl<WaterUnit>
          options={[
            { value: 'ml', label: 'ml' },
            { value: 'fl oz', label: 'fl oz' },
            { value: 'glasses', label: 'glasses' },
          ]}
          value={unit}
          onChange={setUnit}
        />
      </View>

      {/* BottomSheetTextInput (not TextInput) so the sheet moves up with the keyboard */}
      <BottomSheetTextInput
        value={text}
        onChangeText={setText}
        placeholder={`Amount (${unit})`}
        placeholderTextColor="#9A9AA0"
        keyboardType="decimal-pad"
        style={{
          marginTop: 24,
          height: 64,
          borderWidth: 1,
          borderColor: '#8A8A90',
          borderRadius: 6,
          paddingHorizontal: 20,
          fontSize: 18,
          color: '#FFFFFF',
        }}
      />

      <View className="mt-6 flex-row items-center justify-end gap-6">
        <Pressable onPress={onClose} hitSlop={10}>
          <Text className="text-base text-white">Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleAdd}
          disabled={!valid}
          className={`rounded-full px-12 py-5 ${valid ? 'bg-neutral-200' : 'bg-neutral-700'}`}>
          <Text className={`text-base font-medium ${valid ? 'text-black' : 'text-neutral-500'}`}>Add</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------- both sheets, controlled through one ref ----------
type Props = { selectedDate: Date };

const LogWaterSheet = forwardRef<SheetHandle, Props>(function LogWaterSheet({ selectedDate }, ref) {
  const hydrationRef = useRef<BottomSheetModal>(null);
  const addRef = useRef<BottomSheetModal>(null);
  const day = dateKey(selectedDate);

  useImperativeHandle(ref, () => ({
    present: () => hydrationRef.current?.present(),
    dismiss: () => {
      hydrationRef.current?.dismiss();
      addRef.current?.dismiss();
    },
  }));

  // "Custom": swap the Hydration sheet for the Add water sheet
  const openCustom = () => {
    hydrationRef.current?.dismiss();
    addRef.current?.present();
  };

  return (
    <>
      <BottomSheetModal
        ref={hydrationRef}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={sheetBackground}
        handleIndicatorStyle={sheetHandle}>
        <BottomSheetView>
          <HydrationContent day={day} onCustom={openCustom} />
        </BottomSheetView>
      </BottomSheetModal>

      <BottomSheetModal
        ref={addRef}
        enableDynamicSizing
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustPan"
        backdropComponent={renderBackdrop}
        backgroundStyle={sheetBackground}
        handleIndicatorStyle={sheetHandle}>
        <BottomSheetView>
          <AddWaterContent day={day} onClose={() => addRef.current?.dismiss()} />
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
});

export default LogWaterSheet;
