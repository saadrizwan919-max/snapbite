import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CalendarModal from '@/components/CalendarModal';
import SegmentedControl from '@/components/SegmentedControl';
import { SheetHandle, renderBackdrop, sheetBackground, sheetHandle } from '@/components/SheetParts';
import WeightRuler from '@/components/WeightRuler';
import { dateKey, formatLongDate, startOfDay } from '@/lib/dates';
import { kgToLb, lbToKg } from '@/lib/units';
import { WeightUnit, latestWeightKg, useAppStore } from '@/store/useAppStore';

const DEFAULT_WEIGHT_KG = 70;

// ---------- the form inside the sheet ----------
// BottomSheetModal removes its content when it closes, so this component starts fresh
// (new date, new ruler position) every time the sheet opens.
function WeightForm({ initialDate, onDone }: { initialDate: Date; onDone: () => void }) {
  const insets = useSafeAreaInsets();

  const unit = useAppStore((s) => s.weightUnit);
  const setWeightUnit = useAppStore((s) => s.setWeightUnit);
  const saveWeight = useAppStore((s) => s.saveWeight);

  const [date, setDate] = useState(startOfDay(initialDate));
  const [showPicker, setShowPicker] = useState(false);

  // Always kept in kg. Start from the last saved weight so the ruler opens somewhere sensible.
  const [valueKg, setValueKg] = useState(
    () => latestWeightKg(useAppStore.getState().weights) ?? DEFAULT_WEIGHT_KG
  );

  const shown = unit === 'kg' ? valueKg : kgToLb(valueKg);

  const handleSave = () => {
    saveWeight(dateKey(date), valueKg);
    onDone();
  };

  return (
    <View style={{ flex: 1, paddingBottom: insets.bottom + 16 }}>
      <View className="px-6">
        <Text className="mt-2 text-center text-2xl font-semibold text-white">Log weight</Text>

        {/* date button: opens the calendar */}
        <Pressable
          onPress={() => setShowPicker(true)}
          className="mt-6 flex-row items-center gap-3 self-center rounded-full border border-neutral-500 px-8 py-4">
          <Ionicons name="calendar-outline" size={26} color="white" />
          <Text className="text-base text-white">{formatLongDate(date)}</Text>
        </Pressable>

        <View className="mt-5">
          <SegmentedControl<WeightUnit>
            options={[
              { value: 'kg', label: 'Kilograms' },
              { value: 'lb', label: 'Pounds' },
            ]}
            value={unit}
            onChange={setWeightUnit}
          />
        </View>

        <Text className="mt-8 text-center text-white">
          <Text className="text-7xl font-bold">{shown.toFixed(1)}</Text>
          <Text className="text-2xl font-light text-neutral-400"> {unit === 'kg' ? 'kg' : 'lbs'}</Text>
        </Text>
      </View>

      <View className="mt-10">
        {/* key={unit}: switching unit restarts the ruler at the converted value */}
        <WeightRuler
          key={unit}
          unit={unit}
          initialValue={shown}
          onChange={(v) => setValueKg(unit === 'kg' ? v : lbToKg(v))}
        />
      </View>

      <View style={{ flex: 1 }} />

      <View className="px-6">
        <Pressable onPress={handleSave} className="items-center rounded-full bg-neutral-200 py-5">
          <Text className="text-base font-medium text-black">Save weight</Text>
        </Pressable>
      </View>

      <CalendarModal
        visible={showPicker}
        value={date}
        onSelect={(picked) => {
          setShowPicker(false);
          setDate(startOfDay(picked));
        }}
        onClose={() => setShowPicker(false)}
      />
    </View>
  );
}

// ---------- the sheet itself ----------
type Props = { selectedDate: Date };

const LogWeightSheet = forwardRef<SheetHandle, Props>(function LogWeightSheet({ selectedDate }, ref) {
  const modalRef = useRef<BottomSheetModal>(null);

  useImperativeHandle(ref, () => ({
    present: () => modalRef.current?.present(),
    dismiss: () => modalRef.current?.dismiss(),
  }));

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={['68%']}
      enableDynamicSizing={false}
      // the ruler scrolls sideways, so don't let dragging the content move the sheet
      enableContentPanningGesture={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={sheetBackground}
      handleIndicatorStyle={sheetHandle}>
      <BottomSheetView style={{ flex: 1 }}>
        <WeightForm initialDate={selectedDate} onDone={() => modalRef.current?.dismiss()} />
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default LogWeightSheet;
