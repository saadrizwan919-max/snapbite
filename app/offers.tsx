import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import ConfirmDialog from '@/components/ConfirmDialog';
import ProgressRing from '@/components/ProgressRing';
import { PLANS, PRIVACY_URL, PlanId, TERMS_URL, purchasePro } from '@/lib/billing';
import { useAppStore } from '@/store/useAppStore';

// Opened from the Kcal Pro sheet ("See plans")
export default function Offers() {
  const router = useRouter();
  const setPro = useAppStore((s) => s.setPro);
  const [selectedId, setSelectedId] = useState<PlanId>('yearly');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ open: false, title: '', message: '' });
  const showNotice = (title: string, message: string) => setNotice({ open: true, title, message });
  const closeNotice = () => setNotice((n) => ({ ...n, open: false }));

  const plan = PLANS.find((p) => p.id === selectedId)!;

  const subscribe = async () => {
    setBusy(true);
    try {
      const ok = await purchasePro(plan.id);
      if (ok) {
        setPro(true); // from now on every ad checks isPro and stays hidden
        router.back();
      } else {
        showNotice('Not subscribed', 'The purchase was not completed.');
      }
    } catch {
      showNotice('Something went wrong', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121416]">
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_bottom' }} />

      {/* close button */}
      <View className="h-14 flex-row items-center px-5">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={30} color="#D4D4D8" />
        </Pressable>
      </View>

      <View className="flex-1 px-6">
        {/* ring with a flexed arm in the middle */}
        <View className="mt-4 items-center">
          <ProgressRing progress={0.85} size={132} strokeWidth={14} color="#B9A3E8" trackColor="#1B1E21">
            <MaterialCommunityIcons name="arm-flex" size={56} color="white" />
          </ProgressRing>
          <Text className="mt-8 text-4xl font-bold text-white">Go Pro</Text>
          <Text className="mt-4 text-center text-lg text-neutral-400">More AI scans · No ads</Text>
        </View>

        {/* plans */}
        <View className="mt-10">
          {PLANS.map((p) => {
            const active = p.id === selectedId;
            return (
              <Pressable
                key={p.id}
                onPress={() => setSelectedId(p.id)}
                disabled={busy}
                className={`mb-3 flex-row items-center rounded-3xl border-2 px-5 py-5 ${
                  active ? 'border-[#B9A3E8] bg-[#2B2840]' : 'border-[#2D3033] bg-[#1A1E20]'
                }`}>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-white">{p.label}</Text>
                  {p.save ? <Text className="text-sm text-neutral-400">{p.save}</Text> : null}
                </View>
                <Text className="mr-4 text-lg font-bold text-white">
                  {p.price}
                  <Text className="text-base font-normal text-neutral-400">/{p.period}</Text>
                </Text>
                {active ? (
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-[#B9A3E8]">
                    <Ionicons name="checkmark" size={22} color="black" />
                  </View>
                ) : (
                  <View className="h-10 w-10 rounded-full border-2 border-[#4A4D52]" />
                )}
              </Pressable>
            );
          })}
        </View>

        <View className="flex-1" />

        {/* subscribe + auto-renew notice */}
        <Pressable
          onPress={subscribe}
          disabled={busy}
          className="items-center rounded-full bg-neutral-100 py-5">
          {busy ? (
            <ActivityIndicator color="black" />
          ) : (
            <Text className="text-lg font-semibold text-black">
              Subscribe · {plan.price}/{plan.period}
            </Text>
          )}
        </Pressable>

        <Text className="mt-4 px-2 text-center text-sm leading-5 text-neutral-400">
          {plan.price}/{plan.period}. Auto-renews unless you cancel. Cancel anytime in Google Play.
        </Text>
        <View className="mb-4 mt-3 flex-row items-center justify-center gap-3">
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8}>
            <Text className="text-sm text-neutral-300 underline">Terms of Service</Text>
          </Pressable>
          <Text className="text-neutral-500">·</Text>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8}>
            <Text className="text-sm text-neutral-300 underline">Privacy Policy</Text>
          </Pressable>
        </View>
      </View>

      <ConfirmDialog
        visible={notice.open}
        title={notice.title}
        message={notice.message}
        confirmText="OK"
        cancelText={null}
        onConfirm={closeNotice}
        onCancel={closeNotice}
      />
    </SafeAreaView>
  );
}
