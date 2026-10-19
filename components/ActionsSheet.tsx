import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SheetHandle, renderBackdrop, sheetBackground, sheetHandle } from '@/components/SheetParts';

type Props = {
  onLogWeight: () => void;
  onLogWater: () => void;
  onManualEntry: () => void;
};

type Item = { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void };

// The "+" sheet: three quick actions in one row
const ActionsSheet = forwardRef<SheetHandle, Props>(function ActionsSheet(
  { onLogWeight, onLogWater, onManualEntry },
  ref
) {
  const modalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();

  useImperativeHandle(ref, () => ({
    present: () => modalRef.current?.present(),
    dismiss: () => modalRef.current?.dismiss(),
  }));

  const items: Item[] = [
    { icon: 'speedometer-outline', label: 'Log weight', onPress: onLogWeight },
    { icon: 'water-outline', label: 'Log water', onPress: onLogWater },
    { icon: 'create-outline', label: 'Manual entry', onPress: onManualEntry },
  ];

  // close this sheet first, then run the action (which opens another sheet)
  const run = (item: Item) => {
    modalRef.current?.dismiss();
    item.onPress();
  };

  return (
    <BottomSheetModal
      ref={modalRef}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      backgroundStyle={sheetBackground}
      handleIndicatorStyle={sheetHandle}>
      <BottomSheetView>
        <View className="flex-row gap-3 px-5 pt-4" style={{ paddingBottom: insets.bottom + 16 }}>
          {items.map((item) => (
            <Pressable key={item.label} onPress={() => run(item)} className="flex-1 items-center">
              <View className="h-[72px] w-full items-center justify-center rounded-2xl bg-[#2A2B2F]">
                <Ionicons name={item.icon} size={30} color="white" />
              </View>
              <Text className="mt-2 text-center text-sm text-white">{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default ActionsSheet;
