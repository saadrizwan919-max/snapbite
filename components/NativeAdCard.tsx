import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { NativeAd, NativeAdView, NativeAsset, NativeAssetType } from 'react-native-google-mobile-ads';
import { NATIVE_ID } from '@/lib/ads';
import { useAppStore } from '@/store/useAppStore';

export default function NativeAdCard() {
  const isPro = useAppStore((s) => s.isPro);
  const [ad, setAd] = useState<NativeAd | null>(null);

  useEffect(() => {
    if (isPro) return;
    let cancelled = false;
    let loaded: NativeAd | null = null;

    NativeAd.createForAdRequest(NATIVE_ID)
      .then((result) => {
        if (cancelled) return result.destroy(); // screen closed before the ad arrived
        loaded = result;
        setAd(result);
      })
      .catch(() => {}); // no ad available: show nothing

    return () => {
      cancelled = true;
      loaded?.destroy(); // frees the ad when you leave the screen
    };
  }, [isPro]);

  // while loading, on failure, or for Pro users: render nothing (no empty gap)
  if (isPro || !ad) return null;

  return (
    <NativeAdView nativeAd={ad}>
      <View className="rounded-3xl bg-[#1A1E20] p-4">
        {/* the "Ad" label is required for native ads */}
        <View className="mb-3 self-start rounded-md bg-[#2B2840] px-2 py-0.5">
          <Text className="text-xs text-neutral-300">Ad</Text>
        </View>

        <View className="flex-row items-center gap-3">
          {ad.icon && (
            <NativeAsset assetType={NativeAssetType.ICON}>
              <Image source={{ uri: ad.icon.url }} style={{ width: 56, height: 56, borderRadius: 8 }} />
            </NativeAsset>
          )}
          <View className="flex-1">
            <NativeAsset assetType={NativeAssetType.HEADLINE}>
              <Text className="text-base font-bold text-white" numberOfLines={1}>
                {ad.headline}
              </Text>
            </NativeAsset>
            {ad.body ? (
              <NativeAsset assetType={NativeAssetType.BODY}>
                <Text className="text-sm text-neutral-400" numberOfLines={2}>
                  {ad.body}
                </Text>
              </NativeAsset>
            ) : null}
          </View>
        </View>

        {ad.callToAction ? (
          <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
            <View className="mt-4 items-center rounded-full bg-neutral-300 py-4">
              <Text className="text-base font-medium text-black">{ad.callToAction}</Text>
            </View>
          </NativeAsset>
        ) : null}
      </View>
    </NativeAdView>
  );
}