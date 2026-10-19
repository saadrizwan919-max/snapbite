import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SheetHandle, renderBackdrop, sheetBackground, sheetHandle } from '@/components/SheetParts';
import { useAppStore } from '@/store/useAppStore';

const BENEFITS = [
  { emoji: '📸', text: 'More daily AI meal scans' },
  { emoji: '🚫', text: 'No ads' },
];

const ProSheet = forwardRef<SheetHandle, object>(function ProSheet(_props, ref) {
  const modalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isPro = useAppStore((s) => s.isPro);
  const setPro = useAppStore((s) => s.setPro);

  useImperativeHandle(ref, () => ({
    present: () => modalRef.current?.present(),
    dismiss: () => modalRef.current?.dismiss(),
  }));

  const seePlans = () => {
    modalRef.current?.dismiss();
    router.push('/offers');
  };

  return (
    <BottomSheetModal
      ref={modalRef}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      backgroundStyle={sheetBackground}
      handleIndicatorStyle={sheetHandle}>
      <BottomSheetView>
        <View className="px-6" style={{ paddingBottom: insets.bottom + 20 }}>
          <View className="items-center">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-[#2B2840]">
              <Ionicons name="sparkles" size={26} color="#C9BFF5" />
            </View>
            <Text className="mt-3 text-2xl font-bold text-white">{isPro ? "You're on Kcal Pro" : 'Kcal Pro'}</Text>
            {isPro && <Text className="mt-1 text-neutral-400">Thanks for supporting the app.</Text>}
          </View>

          <View className="mt-6 gap-4">
            {BENEFITS.map((b) => (
              <View key={b.text} className="flex-row items-center gap-4">
                <Text className="w-8 text-center text-2xl">{b.emoji}</Text>
                <Text className="text-base text-neutral-200">{b.text}</Text>
              </View>
            ))}
          </View>

          {!isPro && (
            <Pressable onPress={seePlans} className="mt-7 items-center rounded-full bg-neutral-100 py-4">
              <Text className="text-base font-semibold text-black">See plans</Text>
            </Pressable>
          )}

          {/* Lets you go back to the free version after trying Pro. */}
          {isPro && (
            <Pressable onPress={() => setPro(false)} className="mt-6 items-center py-3">
              <Text className="text-base text-neutral-500">Reset to free</Text>
            </Pressable>
          )}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default ProSheet;
