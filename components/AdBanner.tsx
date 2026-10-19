import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { BANNER_ID } from '@/lib/ads';
import { useAppStore } from '@/store/useAppStore';

type Props = {
  variant?: 'banner' | 'rectangle'; // banner = 320x100, rectangle = 300x250 (much taller)
};

export default function AdBanner({ variant = 'banner' }: Props) {
  const isPro = useAppStore((s) => s.isPro);
  if (isPro) return null; // Pro users: no ad and no empty space

  return (
    <View className="mt-3 items-center">
      {/* overflow-hidden + rounded-2xl is what clips the ad's corners */}
      <View className="overflow-hidden rounded-2xl">
        <BannerAd
          unitId={BANNER_ID}
          size={variant === 'rectangle' ? BannerAdSize.MEDIUM_RECTANGLE : BannerAdSize.LARGE_BANNER}
        />
      </View>
    </View>
  );
}