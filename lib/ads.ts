import mobileAds, { AdEventType, InterstitialAd, TestIds } from 'react-native-google-mobile-ads';
import { useAppStore } from '@/store/useAppStore';

// Always Google test ad IDs (portfolio build, not published).
export const BANNER_ID = TestIds.BANNER;
const INTERSTITIAL_ID = TestIds.INTERSTITIAL;
export const NATIVE_ID = TestIds.NATIVE;

const interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_ID);
let loaded = false;
let changes = 0;

// Downloads the full-screen ad in the background. show() only works after it has loaded.
const load = () => {
  loaded = false;
  interstitial.load();
};

interstitial.addAdEventListener(AdEventType.LOADED, () => {
  loaded = true;
});
interstitial.addAdEventListener(AdEventType.CLOSED, load); // preload the next one
interstitial.addAdEventListener(AdEventType.ERROR, () => setTimeout(load, 30000)); // try again later

// Call once when the app starts (app/_layout.tsx does this).
export function initAds() {
  mobileAds()
    .initialize()
    .then(() => load());
}

// Every 3rd change shows the full-screen ad. Pro users never see ads.
function countChange() {
  if (useAppStore.getState().isPro) return;
  changes += 1;
  if (changes >= 3 && loaded) {
    changes = 0;
    loaded = false;
    interstitial.show();
  }
}

// Counts every change to meals, water or weight, so no sheet needs extra code.
useAppStore.subscribe((state, prev) => {
  if (!useAppStore.persist.hasHydrated()) return; // ignore the load from storage at launch
  if (state.dailyMeals !== prev.dailyMeals || state.water !== prev.water || state.weights !== prev.weights) {
    countChange();
  }
});
