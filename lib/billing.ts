// Google Play Billing placeholders. Nothing is charged yet.
// Later, replace the bodies with react-native-iap (or RevenueCat). The rest of the app only uses these functions.
//
// Pro status lives in Google Play (not in AsyncStorage), so after a reinstall the app asks Play again.
// fetchProStatus() runs on every launch (app/index.tsx), so when a subscription expires or is
// cancelled, Play answers false and the app turns Pro off (ads come back) by itself.

export type PlanId = 'yearly' | 'quarterly' | 'monthly';

export type Plan = {
  id: PlanId;
  label: string;
  price: string; // fallback text: once billing is connected, show the price Google Play returns instead
  period: string; // "year", "3 months", "month"
  save?: string;
  basePlanId: string; // the base plan id you create under the subscription in Play Console
};

// One subscription in Play Console with three base plans (all auto-renewing).
export const PRO_PRODUCT_ID = 'kcal_pro';

export const PLANS: Plan[] = [
  { id: 'yearly', label: 'Yearly', price: 'Rs 1,999.00', period: 'year', save: 'Save 44%', basePlanId: 'yearly' },
  { id: 'quarterly', label: '3 Months', price: 'Rs 699.00', period: '3 months', save: 'Save 22%', basePlanId: 'quarterly' },
  { id: 'monthly', label: 'Monthly', price: 'Rs 299.00', period: 'month', basePlanId: 'monthly' },
];

// TODO: put your real pages here (Google Play requires a privacy policy link)
export const TERMS_URL = 'https://example.com/terms';
export const PRIVACY_URL = 'https://example.com/privacy';

// Returns true / false when Play answered, or null when it couldn't be checked (then the app keeps its cached value).
export async function fetchProStatus(): Promise<boolean | null> {
  // TODO: query Play for an active PRO_PRODUCT_ID subscription
  return null;
}

// Starts the Play purchase flow for the chosen plan. Returns true if the user is now subscribed.
export async function purchasePro(_planId: PlanId): Promise<boolean> {
  // Portfolio build: pretend the purchase worked so "Pro = no ads" can be demoed.
  if (!BILLING_READY) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return true;
  }
  // TODO: launch the Play Billing purchase sheet for PRO_PRODUCT_ID with the plan's basePlanId
  return false;
}

export const BILLING_READY = false; // flip to true once the functions above are implemented
