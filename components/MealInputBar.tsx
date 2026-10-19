import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MEAL_TYPES, MealType, mealInfo } from '@/lib/meals';

type Props = {
  mealType: MealType;
  onChangeMealType: (type: MealType) => void;
  onPlus: () => void; // opens the actions sheet
  onPressInput: () => void; // tapping the "What did you eat..." text
  onGallery: () => void;
  onCamera: () => void;
  busy?: boolean; // true while a photo is being analyzed
};

// Floating bar pinned to the bottom of the home screen.
// It fills the screen (but lets touches through) so the dropdown can sit above the bar
// and still receive taps on Android.
export default function MealInputBar({
  mealType,
  onChangeMealType,
  onPlus,
  onPressInput,
  onGallery,
  onCamera,
  busy = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const current = mealInfo(mealType);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" className="justify-end">
      {/* tap anywhere outside the dropdown to close it */}
      {menuOpen && <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />}

      <View pointerEvents="box-none" className="px-4" style={{ paddingBottom: insets.bottom + 8 }}>
        {menuOpen && (
          <View
            className="mb-2 w-52 self-start rounded-2xl bg-[#26282B] py-2"
            style={{ marginLeft: 80, elevation: 8 }}>
            {MEAL_TYPES.map((m) => (
              <Pressable
                key={m.value}
                onPress={() => {
                  onChangeMealType(m.value);
                  setMenuOpen(false);
                }}
                className={`flex-row items-center gap-4 px-5 py-3 ${
                  m.value === mealType ? 'bg-[#2D2A4A]' : ''
                }`}>
                <Ionicons name={m.icon} size={24} color="white" />
                <Text className="text-base text-white">{m.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View className="rounded-[32px] bg-[#1A1E20] px-5 pb-4 pt-5">
          <Pressable onPress={onPressInput} disabled={busy} className="min-h-[28px] justify-center">
            {busy ? (
              <View className="flex-row items-center gap-3">
                <ActivityIndicator color="#A0A6AC" />
                <Text className="text-lg text-neutral-400">Analyzing photo...</Text>
              </View>
            ) : (
              <Text className="text-lg text-neutral-400" numberOfLines={1}>
                What did you eat in {current.label}?
              </Text>
            )}
          </Pressable>

          <View className="mt-4 flex-row items-center gap-3">
            <Pressable
              onPress={() => {
                setMenuOpen(false);
                onPlus();
              }}
              className="h-12 w-12 items-center justify-center rounded-full bg-[#2B2840]">
              <Ionicons name="add" size={28} color="#E6E3F5" />
            </Pressable>

            <Pressable
              onPress={() => setMenuOpen((open) => !open)}
              className="h-12 flex-row items-center gap-2 rounded-full bg-[#2B2840] px-4">
              <Ionicons name={current.icon} size={22} color="#E6E3F5" />
              <Ionicons name="caret-down" size={14} color="#A0A6AC" />
            </Pressable>

            <View className="flex-1" />

            <Pressable
              onPress={onGallery}
              disabled={busy}
              className={`h-12 w-12 items-center justify-center rounded-full bg-[#2B2840] ${busy ? 'opacity-50' : ''}`}>
              <Ionicons name="images-outline" size={24} color="#E6E3F5" />
            </Pressable>
            <Pressable
              onPress={onCamera}
              disabled={busy}
              className={`h-12 w-12 items-center justify-center rounded-full bg-[#2B2840] ${busy ? 'opacity-50' : ''}`}>
              <Ionicons name="camera-outline" size={24} color="#E6E3F5" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
