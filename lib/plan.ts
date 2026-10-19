// All the maths behind the onboarding: BMI, daily calories, macros and pace.
// No React in here, so it is easy to test and to reuse (e.g. a future "edit my goals" screen).

export type Goal = 'lose' | 'gain' | 'muscle' | 'maintain';
export type Gender = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'very';

export type Profile = {
  goal: Goal;
  gender: Gender;
  age: number;
  heightCm: number;
  startWeightKg: number;
  targetWeightKg?: number; // not used when the goal is "maintain"
  activity: Activity;
  ratePerWeekKg?: number; // how fast the user wants to go (kg per week), not used for "maintain"
  targetDate?: string; // "YYYY-MM-DD", only when the user picked a date
};

export type Goals = { calories: number; protein: number; carbs: number; fats: number };

export const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
};

export const KCAL_PER_KG = 7700; // roughly the energy in 1 kg of body weight
export const MIN_AGE = 18; // diet targets are only for adults
export const MIN_BMI = 18.5; // a weight-loss target may not go below this
export const MIN_CHANGE_KG = 1; // target must differ from the current weight by at least this much

// the lowest daily calories we will ever suggest
export const minCalories = (gender: Gender) => (gender === 'male' ? 1500 : 1200);

// ---------- BMI ----------
export const bmi = (weightKg: number, heightCm: number) => {
  const m = heightCm / 100;
  return weightKg / (m * m);
};

export type BmiInfo = { label: string; message: string; tone: 'under' | 'healthy' | 'over' | 'obese' };

export const bmiInfo = (value: number): BmiInfo => {
  if (value < 18.5) return { label: 'Underweight', message: 'Below the healthy range for your height.', tone: 'under' };
  if (value < 25) return { label: 'Healthy weight', message: "You're in the healthy range, keep it up!", tone: 'healthy' };
  if (value < 30) return { label: 'Overweight', message: 'A little above the healthy range for your height.', tone: 'over' };
  return { label: 'Obese', message: 'Well above the healthy range for your height.', tone: 'obese' };
};

// the weight (kg) that gives a certain BMI at this height
export const weightForBmi = (b: number, heightCm: number) => b * (heightCm / 100) ** 2;

// ---------- calories ----------
// Mifflin-St Jeor: the usual formula for the calories your body burns at rest
export const bmr = (p: { gender: Gender; weightKg: number; heightCm: number; age: number }) => {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.gender === 'male' ? base + 5 : base - 161;
};

export const tdee = (p: { gender: Gender; weightKg: number; heightCm: number; age: number; activity: Activity }) =>
  bmr(p) * ACTIVITY_FACTOR[p.activity];

// protein in grams per kg of body weight
const PROTEIN_PER_KG: Record<Goal, number> = { lose: 1.8, gain: 1.6, muscle: 2.0, maintain: 1.4 };

export type Plan = Goals & {
  tdee: number; // calories burned per day without changing weight
  ratePerWeekKg: number; // the pace this plan really gives (can be slower than asked, see `adjusted`)
  adjusted: boolean; // true when calories were raised to the safe minimum
};

export const buildPlan = (p: {
  goal: Goal;
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  ratePerWeekKg?: number;
}): Plan => {
  const burn = tdee(p);
  const rate = p.goal === 'maintain' ? 0 : p.ratePerWeekKg ?? 0;
  const dailyChange = (rate * KCAL_PER_KG) / 7;

  let calories = p.goal === 'lose' ? burn - dailyChange : p.goal === 'maintain' ? burn : burn + dailyChange;
  let adjusted = false;
  if (p.goal === 'lose' && calories < minCalories(p.gender)) {
    calories = minCalories(p.gender);
    adjusted = true;
  }
  calories = Math.round(calories);

  const effectiveRate = p.goal === 'lose' ? Math.max(0, ((burn - calories) * 7) / KCAL_PER_KG) : rate;

  // protein: by body weight, but never more than 30% of the calories
  const protein = Math.round(Math.min(p.weightKg * PROTEIN_PER_KG[p.goal], (calories * 0.3) / 4));
  const fats = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fats * 9) / 4));

  return { calories, protein, carbs, fats, tdee: Math.round(burn), ratePerWeekKg: effectiveRate, adjusted };
};

// ---------- pace ----------
export type PaceGoal = Exclude<Goal, 'maintain'>;
export type PaceOption = { id: string; label: string; rate: number }; // rate = kg per week

export const PACE_OPTIONS: Record<PaceGoal, PaceOption[]> = {
  lose: [
    { id: 'slow', label: 'Slow & steady', rate: 0.3 },
    { id: 'moderate', label: 'Moderate', rate: 0.5 },
    { id: 'aggressive', label: 'Aggressive', rate: 0.8 },
    { id: 'very', label: 'Very aggressive', rate: 1 },
  ],
  gain: [
    { id: 'slow', label: 'Slow & steady', rate: 0.2 },
    { id: 'moderate', label: 'Moderate', rate: 0.35 },
    { id: 'fast', label: 'Fast', rate: 0.5 },
    { id: 'very', label: 'Very fast', rate: 0.75 },
  ],
  muscle: [
    { id: 'slow', label: 'Lean & slow', rate: 0.15 },
    { id: 'moderate', label: 'Moderate', rate: 0.25 },
    { id: 'fast', label: 'Faster', rate: 0.35 },
    { id: 'very', label: 'Fastest', rate: 0.5 },
  ],
};

export const DEFAULT_PACE: Record<PaceGoal, string> = { lose: 'moderate', gain: 'moderate', muscle: 'moderate' };

// slowest and fastest pace we allow when the user picks a date
export const RATE_LIMITS: Record<PaceGoal, { min: number; max: number }> = {
  lose: { min: 0.2, max: 1 },
  gain: { min: 0.15, max: 0.75 },
  muscle: { min: 0.1, max: 0.5 },
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const addDays = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
const daysBetween = (from: Date, to: Date) =>
  Math.round((Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) - Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / MS_PER_DAY);

// the day you reach the target if you go at `rate` kg per week
export const dateForRate = (diffKg: number, rate: number, from: Date) => addDays(from, Math.max(1, Math.ceil((diffKg / rate) * 7)));

// the pace (kg per week) needed to reach the target on `to`
export const rateForDate = (diffKg: number, from: Date, to: Date) => diffKg / (Math.max(1, daysBetween(from, to)) / 7);

// earliest and latest date we allow for a target
export const dateRange = (goal: PaceGoal, diffKg: number, from: Date) => ({
  earliest: dateForRate(diffKg, RATE_LIMITS[goal].max, from),
  latest: dateForRate(diffKg, RATE_LIMITS[goal].min, from),
});
