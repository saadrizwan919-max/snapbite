import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = { isPro: boolean; onPressPro: () => void };

// App icon on the left, name in the middle, Get Pro on the right
export default function AppHeader({ isPro, onPressPro }: Props) {
  return (
    <View className="h-16 flex-row items-center px-4">
      {/* left: app icon. To use your real icon image, replace the Ionicons with:
          <Image source={require('../assets/icon.png')} className="h-10 w-10 rounded-full" /> */}
      <View className="w-24 flex-row">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-[#2B2840]">
          <Ionicons name="flame" size={26} color="#C9BFF5" />
        </View>
      </View>

      {/* middle: name */}
      <Text className="flex-1 text-center text-2xl font-bold text-neutral-300">SnapBite</Text>

      {/* right: Get Pro (or a Pro badge once subscribed) */}
      <View className="w-24 flex-row justify-end">
        <Pressable
          onPress={onPressPro}
          className={`flex-row items-center gap-1.5 rounded-full px-4 py-2.5 ${
            isPro ? 'bg-[#2B2840]' : 'bg-neutral-100'
          }`}>
          <Ionicons name="sparkles" size={14} color={isPro ? '#C9BFF5' : '#000000'} />
          <Text className={`text-sm font-semibold ${isPro ? 'text-[#C9BFF5]' : 'text-black'}`}>
            {isPro ? 'Pro' : 'Get Pro'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
