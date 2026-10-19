import { ComponentProps, ReactNode, useEffect, useMemo, useState } from 'react';
import { BackHandler, Modal, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import CalendarModal from '@/components/CalendarModal';
import HeightRuler, { HeightUnit } from '@/components/HeightRuler';
import WeightRuler from '@/components/WeightRuler';
import { dateKey, startOfDay } from '@/lib/dates';
import {
  Activity,
  Gender,
  Goal,
  MIN_AGE,
  MIN_BMI,
  MIN_CHANGE_KG,
  PACE_OPTIONS,
  PaceGoal,
  Profile,
  bmi,
  bmiInfo,
  buildPlan,
  dateForRate,
  dateRange,
  minCalories,
  rateForDate,
  weightForBmi,
} from '@/lib/plan';
import { kgToLb, lbToKg } from '@/lib/units';
import { WeightUnit, useAppStore } from '@/store/useAppStore';

const APP_NAME = 'SnapBite';

type IconName = ComponentProps<typeof Ionicons>['name'];
type Step = 'goal' | 'gender' | 'height' | 'weight' | 'target' | 'age' | 'activity' | 'pace' | 'plan';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const round1 = (n: number) => Math.round(n * 10) / 10;

const GOAL_OPTIONS: { id: Goal; icon: IconName; title: string; subtitle: string }[] = [
  { id: 'lose', icon: 'trending-down', title: 'Lose weight', subtitle: 'Shed fat with a calorie deficit' },
  { id: 'gain', icon: 'trending-up', title: 'Gain weight', subtitle: 'Put on weight with a calorie surplus' },
  { id: 'muscle', icon: 'barbell', title: 'Gain muscle', subtitle: 'Build lean mass with higher protein' },
  { id: 'maintain', icon: 'arrow-forward', title: 'Maintain weight', subtitle: 'Stay at your current weight' },
];

const ACTIVITY_OPTIONS: { id: Activity; icon: IconName; title: string; subtitle: string }[] = [
  { id: 'sedentary', icon: 'desktop-outline', title: 'Mostly sitting', subtitle: 'Little or no exercise' },
  { id: 'light', icon: 'walk', title: 'Lightly active', subtitle: 'Workouts 1-3 days a week' },
  { id: 'moderate', icon: 'bicycle', title: 'Moderately active', subtitle: 'Workouts 3-5 days a week' },
  { id: 'very', icon: 'flame', title: 'Very active', subtitle: 'Hard workouts 6-7 days a week' },
];

const PACE_ICONS: IconName[] = ['walk', 'footsteps', 'flash', 'flash'];

// ---------- small building blocks ----------

// A big tappable card (goal, gender, activity, pace)
function OptionCard({
  icon,
  title,
  subtitle,
  right,
  selected,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  right?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`mb-4 flex-row items-center rounded-3xl px-6 py-6 ${
        selected ? 'border-2 border-white bg-[#2D2A4A]' : 'border border-[#3A3D40] bg-[#1B1E21]'
      }`}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected ? '#FFFFFF' : 'transparent',
        }}>
        <Ionicons name={icon} size={28} color={selected ? '#000000' : '#A0A0A6'} />
      </View>
      <View className="ml-4 flex-1">
        <Text className={`text-lg font-medium ${selected ? 'text-[#E6E3F5]' : 'text-neutral-100'}`}>{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-sm text-neutral-400">{subtitle}</Text> : null}
      </View>
      {right ? <Text className={`text-base ${selected ? 'text-white' : 'text-neutral-400'}`}>{right}</Text> : null}
    </Pressable>
  );
}

// "kg | lbs", "ft | cm", "Suggested | Set a date"
function PillToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignSelf: 'center', borderRadius: 30, backgroundColor: '#1B1E21', padding: 5 }}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              minWidth: 104,
              height: 46,
              paddingHorizontal: 24,
              borderRadius: 23,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selected ? '#F5F5F5' : 'transparent',
            }}>
            <Text className={`text-base ${selected ? 'font-medium text-black' : 'text-neutral-400'}`}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Type a number instead of scrolling the ruler
function NumberEditModal({
  visible,
  title,
  unit,
  initial,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  title: string;
  unit: string;
  initial: string;
  onSubmit: (value: number) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(initial);
  useEffect(() => {
    if (visible) setText(initial);
  }, [visible, initial]);

  const submit = () => {
    const n = parseFloat(text.replace(',', '.'));
    if (Number.isFinite(n) && n > 0) onSubmit(n);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/60 px-8" onPress={onClose}>
        <Pressable className="w-full rounded-3xl bg-[#26282B] px-6 pb-5 pt-6" onPress={() => {}}>
          <Text className="text-xl font-semibold text-white">{title}</Text>
          <View className="mt-4 flex-row items-center rounded-2xl bg-[#1B1E21] px-4">
            <TextInput
              value={text}
              onChangeText={setText}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
              onSubmitEditing={submit}
              className="flex-1 py-4 text-2xl text-white"
            />
            <Text className="text-lg text-neutral-400">{unit}</Text>
          </View>
          <View className="mt-5 flex-row justify-end gap-8">
            <Pressable onPress={onClose} hitSlop={8}>
              <Text className="text-base text-neutral-300">Cancel</Text>
            </Pressable>
            <Pressable onPress={submit} hitSlop={8}>
              <Text className="text-base font-semibold text-white">OK</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Used for "current weight" and "target weight": kg/lbs toggle, big number, pencil, ruler
function WeightPicker({
  unit,
  onUnit,
  valueKg,
  onChangeKg,
  above,
  below,
}: {
  unit: WeightUnit;
  onUnit: (u: WeightUnit) => void;
  valueKg: number;
  onChangeKg: (kg: number) => void;
  above?: ReactNode;
  below?: ReactNode;
}) {
  const [rulerKey, setRulerKey] = useState(0);
  const [editing, setEditing] = useState(false);
  const shown = unit === 'kg' ? valueKg : kgToLb(valueKg);

  return (
    <View className="flex-1">
      <View className="mt-6">
        <PillToggle<WeightUnit>
          options={[
            { value: 'kg', label: 'kg' },
            { value: 'lb', label: 'lbs' },
          ]}
          value={unit}
          onChange={(u) => {
            onUnit(u);
            setRulerKey((k) => k + 1);
          }}
        />
      </View>

      {above}

      <View className="mt-6 flex-row items-center justify-center">
        <Text className="text-7xl font-bold text-white">{shown.toFixed(1)}</Text>
        <Text className="ml-2 mt-6 text-xl text-neutral-400">{unit === 'kg' ? 'kg' : 'lbs'}</Text>
        <Pressable onPress={() => setEditing(true)} hitSlop={12} className="ml-8">
          <Ionicons name="pencil" size={26} color="white" />
        </Pressable>
      </View>

      <View className="mt-10">
        {/* the key restarts the ruler when the unit changes or a number is typed */}
        <WeightRuler
          key={`${unit}-${rulerKey}`}
          unit={unit}
          initialValue={shown}
          onChange={(v) => onChangeKg(unit === 'kg' ? v : lbToKg(v))}
        />
      </View>

      <View className="mt-8">{below}</View>

      <NumberEditModal
        visible={editing}
        title="Enter weight"
        unit={unit === 'kg' ? 'kg' : 'lbs'}
        initial={shown.toFixed(1)}
        onClose={() => setEditing(false)}
        onSubmit={(n) => {
          const kg = unit === 'kg' ? n : lbToKg(n);
          onChangeKg(Math.min(300, Math.max(20, kg)));
          setRulerKey((k) => k + 1);
        }}
      />
    </View>
  );
}

// ---------- the welcome screen ----------
function Welcome({ onStart }: { onStart: () => void }) {
  const features = [
    'Snap a photo to log your meals',
    'Or just type what you ate',
    'Personalized calorie & macro goals',
    'Track water, weight and workouts',
    'Build a streak, one day at a time',
  ];
  return (
    <View className="flex-1 px-6">
      <View className="mt-14 h-16 w-16 items-center justify-center rounded-2xl bg-[#1B1E21]">
        <Ionicons name="flame" size={36} color="#D4C4FF" />
      </View>
      <Text className="mt-10 text-5xl font-bold text-neutral-100">Welcome to{'\n'}{APP_NAME}</Text>
      <Text className="mt-3 text-xl text-neutral-400">Track your day, your way</Text>

      <View className="mt-14 gap-6">
        {features.map((f) => (
          <View key={f} className="flex-row items-center">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
              <Ionicons name="checkmark" size={22} color="#000000" />
            </View>
            <Text className="ml-4 flex-1 text-lg text-neutral-100">{f}</Text>
          </View>
        ))}
      </View>

      <View className="flex-1" />
      <Pressable
        onPress={onStart}
        style={{
          height: 56,
          borderRadius: 28,
          marginBottom: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F5F5F5',
        }}>
        <Text className="text-lg font-medium text-black">Get started</Text>
      </Pressable>
    </View>
  );
}

// ---------- the flow ----------
export default function Onboarding() {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const today = useMemo(() => startOfDay(new Date()), []);

  const weightUnit = useAppStore((s) => s.weightUnit);
  const setWeightUnit = useAppStore((s) => s.setWeightUnit);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const skipOnboarding = useAppStore((s) => s.skipOnboarding);

  const [index, setIndex] = useState(-1); // -1 = the welcome screen
  const [goal, setGoal] = useState<Goal | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [heightCm, setHeightCm] = useState(170);
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('ft');
  const [weightKg, setWeightKg] = useState(70);
  const [targetKg, setTargetKg] = useState(66);
  const [age, setAge] = useState(25);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [paceMode, setPaceMode] = useState<'suggested' | 'date'>('suggested');
  const [paceId, setPaceId] = useState('moderate');
  const [pickedDate, setPickedDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  // ----- which screens this user sees ("maintain" has no target weight and no pace) -----
  const paceGoal: PaceGoal | null = goal && goal !== 'maintain' ? goal : null;
  const steps: Step[] = [
    'goal',
    'gender',
    'height',
    'weight',
    ...(goal !== 'maintain' ? (['target'] as Step[]) : []),
    'age',
    'activity',
    ...(goal !== 'maintain' ? (['pace'] as Step[]) : []),
    'plan',
  ];
  const step: Step | null = index >= 0 ? steps[Math.min(index, steps.length - 1)] : null;

  // ----- numbers worked out from the answers -----
  const fmtWeight = (kg: number) => (weightUnit === 'kg' ? `${kg.toFixed(1)} kg` : `${kgToLb(kg).toFixed(1)} lbs`);
  const fmtRate = (rate: number) =>
    weightUnit === 'kg' ? `~${+rate.toFixed(2)} kg/week` : `~${+kgToLb(rate).toFixed(1)} lb/week`;

  const diffKg = Math.max(Math.abs(targetKg - weightKg), MIN_CHANGE_KG);
  const range = paceGoal ? dateRange(paceGoal, diffKg, today) : null;
  const option = paceGoal ? PACE_OPTIONS[paceGoal].find((o) => o.id === paceId) ?? PACE_OPTIONS[paceGoal][1] : null;

  const clampDate = (d: Date) => (range ? (d < range.earliest ? range.earliest : d > range.latest ? range.latest : d) : d);
  const defaultDate = option && range ? clampDate(dateForRate(diffKg, option.rate, today)) : null;
  const shownDate = pickedDate && range && pickedDate >= range.earliest && pickedDate <= range.latest ? pickedDate : defaultDate;

  const rate = paceGoal
    ? paceMode === 'suggested'
      ? option?.rate
      : shownDate
        ? rateForDate(diffKg, today, shownDate)
        : undefined
    : undefined;

  const plan =
    goal && gender && activity
      ? buildPlan({ goal, gender, age, heightCm, weightKg, activity, ratePerWeekKg: rate })
      : null;

  const currentBmi = bmi(weightKg, heightCm);
  const bmiResult = bmiInfo(currentBmi);

  // ----- is the target weight OK? -----
  const targetError = (): string | null => {
    if (goal === 'lose') {
      if (targetKg > weightKg - MIN_CHANGE_KG) return 'Target must be at least 1 kg (2.2 lb) below your current weight.';
      if (bmi(targetKg, heightCm) < MIN_BMI)
        return `That would be an underweight BMI. The lowest we can plan for is ${fmtWeight(Math.ceil(weightForBmi(MIN_BMI, heightCm) * 10) / 10)}.`;
    } else if (goal === 'gain' || goal === 'muscle') {
      if (targetKg < weightKg + MIN_CHANGE_KG) return 'Target must be at least 1 kg (2.2 lb) above your current weight.';
    }
    return null;
  };
  const targetProblem = step === 'target' ? targetError() : null;

  const canNext =
    (step === 'goal' && goal !== null) ||
    (step === 'gender' && gender !== null) ||
    step === 'height' ||
    step === 'weight' ||
    (step === 'target' && !targetProblem) ||
    (step === 'age' && age >= MIN_AGE) ||
    (step === 'activity' && activity !== null) ||
    (step === 'pace' && rate !== undefined) ||
    (step === 'plan' && plan !== null);

  // ----- moving between screens -----
  const finish = () => {
    if (!goal || !gender || !activity || !plan) return;
    const profile: Profile = {
      goal,
      gender,
      age,
      heightCm,
      startWeightKg: weightKg,
      activity,
      ...(paceGoal
        ? {
            targetWeightKg: targetKg,
            ratePerWeekKg: rate,
            targetDate: paceMode === 'date' && shownDate ? dateKey(shownDate) : undefined,
          }
        : {}),
    };
    completeOnboarding(
      profile,
      { calories: plan.calories, protein: plan.protein, carbs: plan.carbs, fats: plan.fats },
      dateKey(today)
    );
    router.replace('/');
  };

  const goNext = () => {
    if (!canNext) return;
    if (step === 'plan') return finish();
    if (step === 'weight' && paceGoal) {
      // start the target ruler a sensible distance from the current weight
      const wanted = paceGoal === 'lose' ? weightKg - 4 : weightKg + (paceGoal === 'muscle' ? 3 : 4);
      const floor = paceGoal === 'lose' ? Math.ceil(weightForBmi(MIN_BMI, heightCm) * 10) / 10 : 0;
      setTargetKg(round1(Math.max(wanted, Math.min(floor, weightKg - MIN_CHANGE_KG))));
    }
    setIndex((i) => i + 1);
  };

  const goBack = () => setIndex((i) => Math.max(-1, i - 1));

  const skip = () => {
    skipOnboarding(); // the app keeps its default goals
    router.replace('/');
  };

  // the phone's back button goes to the previous question
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (index >= 0) {
        setIndex((i) => i - 1);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [index]);

  // ----- the screens -----
  const heightInches = Math.round(heightCm / 2.54);
  const rulerHeight = Math.min(380, Math.round(windowHeight * 0.44));

  const renderStep = () => {
    switch (step) {
      case 'goal':
        return (
          <ScrollView key="goal" className="mt-8" showsVerticalScrollIndicator={false}>
            {GOAL_OPTIONS.map((o) => (
              <OptionCard key={o.id} {...o} selected={goal === o.id} onPress={() => setGoal(o.id)} />
            ))}
          </ScrollView>
        );

      case 'gender':
        return (
          <View className="mt-8">
            <OptionCard icon="male" title="Male" selected={gender === 'male'} onPress={() => setGender('male')} />
            <OptionCard icon="female" title="Female" selected={gender === 'female'} onPress={() => setGender('female')} />
            <Text className="mt-2 text-sm text-neutral-500">
              We only use this to estimate how many calories your body burns.
            </Text>
          </View>
        );

      case 'height':
        return (
          <View className="flex-1">
            <View className="mt-6">
              <PillToggle<HeightUnit>
                options={[
                  { value: 'ft', label: 'ft' },
                  { value: 'cm', label: 'cm' },
                ]}
                value={heightUnit}
                onChange={setHeightUnit}
              />
            </View>
            <Text className="mt-6 text-center text-white">
              <Text className="text-6xl font-bold">
                {heightUnit === 'ft'
                  ? `${Math.floor(heightInches / 12)}'${heightInches % 12}"`
                  : String(Math.round(heightCm))}
              </Text>
              <Text className="text-xl text-neutral-400"> {heightUnit}</Text>
            </Text>
            <View className="mt-6">
              {/* key={heightUnit}: switching unit restarts the ruler at the converted height */}
              <HeightRuler
                key={heightUnit}
                unit={heightUnit}
                initialValue={heightUnit === 'ft' ? heightInches : heightCm}
                height={rulerHeight}
                onChange={(v) => setHeightCm(heightUnit === 'ft' ? v * 2.54 : v)}
              />
            </View>
          </View>
        );

      case 'weight':
        return (
          <WeightPicker
            key="weight"
            unit={weightUnit}
            onUnit={setWeightUnit}
            valueKg={weightKg}
            onChangeKg={setWeightKg}
            below={
              <View className="rounded-3xl bg-[#3A3A40] px-6 py-5">
                <View className="flex-row items-center">
                  <Text className="text-lg font-semibold text-white">Your BMI: </Text>
                  <Text
                    className={`text-lg font-semibold ${
                      bmiResult.tone === 'healthy' ? 'text-green-500' : bmiResult.tone === 'under' ? 'text-sky-400' : 'text-orange-400'
                    }`}>
                    {currentBmi.toFixed(1)}
                  </Text>
                  <View
                    style={{
                      marginLeft: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 14,
                      backgroundColor:
                        bmiResult.tone === 'healthy' ? '#15803D' : bmiResult.tone === 'under' ? '#0369A1' : '#C2410C',
                    }}>
                    <Text className="text-sm font-medium text-white">{bmiResult.label}</Text>
                  </View>
                </View>
                <Text className="mt-2 text-base text-neutral-300">{bmiResult.message}</Text>
              </View>
            }
          />
        );

      case 'target':
        return (
          <WeightPicker
            key="target"
            unit={weightUnit}
            onUnit={setWeightUnit}
            valueKg={targetKg}
            onChangeKg={setTargetKg}
            above={<Text className="mt-6 text-center text-base text-neutral-400">Current: {fmtWeight(weightKg)}</Text>}
            below={
              <Text className={`px-2 text-center text-sm ${targetProblem ? 'text-orange-400' : 'text-neutral-400'}`}>
                {targetProblem ??
                  (goal === 'lose'
                    ? 'Target must be at least 1 kg (2.2 lb) below your current weight.'
                    : 'Target must be at least 1 kg (2.2 lb) above your current weight.')}
              </Text>
            }
          />
        );

      case 'age':
        return (
          <View className="mt-16 items-center">
            <View className="flex-row items-center gap-8">
              <Pressable
                onPress={() => setAge((a) => Math.max(MIN_AGE, a - 1))}
                className="h-28 w-28 items-center justify-center rounded-full bg-[#2D2A4A]">
                <Ionicons name="remove" size={48} color="#E6E3F5" />
              </Pressable>
              <View className="items-center">
                <Text className="text-7xl font-bold text-white">{age}</Text>
                <Text className="text-lg text-neutral-400">years</Text>
              </View>
              <Pressable
                onPress={() => setAge((a) => Math.min(100, a + 1))}
                className="h-28 w-28 items-center justify-center rounded-full bg-[#2D2A4A]">
                <Ionicons name="add" size={48} color="#E6E3F5" />
              </Pressable>
            </View>
            <View className="mt-14 flex-row flex-wrap justify-center gap-4 px-6">
              {[20, 25, 30, 35, 40, 45, 50, 60].map((a) => (
                <Pressable
                  key={a}
                  onPress={() => setAge(a)}
                  className={`w-[72px] items-center rounded-xl border py-3 ${
                    age === a ? 'border-[#3A3760] bg-[#2D2A4A]' : 'border-neutral-500'
                  }`}>
                  <Text className={`text-base ${age === a ? 'text-white' : 'text-neutral-400'}`}>{a}</Text>
                </Pressable>
              ))}
            </View>
            <Text className="mt-8 text-sm text-neutral-500">SnapBite goals are for adults (18 and over).</Text>
          </View>
        );

      case 'activity':
        return (
          <ScrollView key="activity" className="mt-8" showsVerticalScrollIndicator={false}>
            {ACTIVITY_OPTIONS.map((o) => (
              <OptionCard key={o.id} {...o} selected={activity === o.id} onPress={() => setActivity(o.id)} />
            ))}
          </ScrollView>
        );

      case 'pace':
        return (
          <View className="flex-1">
            <View className="mt-6">
              <PillToggle<'suggested' | 'date'>
                options={[
                  { value: 'suggested', label: 'Suggested' },
                  { value: 'date', label: 'Set a date' },
                ]}
                value={paceMode}
                onChange={setPaceMode}
              />
            </View>

            {paceMode === 'suggested' && paceGoal ? (
              <ScrollView className="mt-8" showsVerticalScrollIndicator={false}>
                {PACE_OPTIONS[paceGoal].map((o, i) => (
                  <OptionCard
                    key={o.id}
                    icon={PACE_ICONS[i]}
                    title={o.label}
                    right={fmtRate(o.rate)}
                    selected={paceId === o.id}
                    onPress={() => setPaceId(o.id)}
                  />
                ))}
              </ScrollView>
            ) : (
              <View className="mt-10">
                <Text className="text-center text-5xl font-bold text-white">{shownDate ? fmtDate(shownDate) : ''}</Text>
                <Pressable
                  onPress={() => setShowCalendar(true)}
                  className="mt-10 flex-row items-center justify-center gap-3 rounded-full border border-neutral-500 py-5">
                  <Ionicons name="calendar" size={26} color="white" />
                  <Text className="text-base font-medium text-white">Choose date</Text>
                </Pressable>

                {plan && (
                  <View className="mt-8 rounded-3xl bg-[#3A3A40] px-6 py-5">
                    <Text className="text-2xl font-semibold text-white">{plan.calories} kcal/day</Text>
                    <Text className="mt-1 text-base text-neutral-300">
                      Averaging {fmtRate(plan.ratePerWeekKg)} to reach your goal.
                    </Text>
                  </View>
                )}
                {range && (
                  <Text className="mt-6 text-center text-sm text-neutral-400">
                    Pick a date between {fmtDate(range.earliest)} and {fmtDate(range.latest)} for a safe pace.
                  </Text>
                )}

                {range && shownDate && (
                  <CalendarModal
                    visible={showCalendar}
                    value={shownDate}
                    minDate={range.earliest}
                    maxDate={range.latest}
                    onSelect={(d) => {
                      setShowCalendar(false);
                      setPickedDate(startOfDay(d));
                    }}
                    onClose={() => setShowCalendar(false)}
                  />
                )}
              </View>
            )}
          </View>
        );

      case 'plan':
        return plan ? (
          <ScrollView className="mt-6" showsVerticalScrollIndicator={false}>
            <View className="items-center rounded-3xl bg-[#1B1E21] px-6 py-8">
              <Text className="text-base text-neutral-400">Your daily calories</Text>
              <Text className="mt-2 text-7xl font-bold text-white">{plan.calories}</Text>
              <Text className="text-lg text-neutral-400">kcal / day</Text>
            </View>

            <View className="mt-4 flex-row gap-3">
              {[
                { emoji: '🍖', label: 'Protein', value: plan.protein, color: '#FF615E' },
                { emoji: '🍚', label: 'Carbs', value: plan.carbs, color: '#A7D0D6' },
                { emoji: '🥑', label: 'Fats', value: plan.fats, color: '#FFF69D' },
              ].map((m) => (
                <View key={m.label} className="flex-1 items-center rounded-3xl bg-[#1B1E21] py-5">
                  <Text className="text-2xl">{m.emoji}</Text>
                  <Text style={{ color: m.color }} className="mt-2 text-2xl font-bold">
                    {m.value}g
                  </Text>
                  <Text className="mt-1 text-sm text-neutral-400">{m.label}</Text>
                </View>
              ))}
            </View>

            <View className="mt-4 rounded-3xl bg-[#3A3A40] px-6 py-5">
              <Text className="text-base font-semibold text-white">
                {goal === 'maintain'
                  ? 'Goal: stay at your current weight'
                  : `Goal: ${goal === 'lose' ? 'lose' : 'gain'} ${fmtWeight(Math.abs(targetKg - weightKg))}${
                      paceMode === 'date' && shownDate ? ` by ${fmtDate(shownDate)}` : ''
                    }`}
              </Text>
              {goal !== 'maintain' && (
                <Text className="mt-1 text-base text-neutral-300">Pace: {fmtRate(plan.ratePerWeekKg)}</Text>
              )}
              {plan.adjusted && (
                <Text className="mt-3 text-sm text-orange-400">
                  We kept your calories at a safe minimum of {minCalories(gender ?? 'male')} kcal, so this pace is slower
                  than the one you picked.
                </Text>
              )}
            </View>

            <Text className="mb-4 mt-4 px-2 text-center text-xs text-neutral-500">
              These are estimates, not medical advice. Check with a doctor or dietitian before making big changes to your
              diet.
            </Text>
          </ScrollView>
        ) : null;

      default:
        return null;
    }
  };

  const titles: Record<Step, string> = {
    goal: "What's your goal?",
    gender: "What's your gender?",
    height: "What's your height?",
    weight: "What's your current weight?",
    target: "What's your target weight?",
    age: 'How old are you?',
    activity: 'How active are you?',
    pace: 'How fast do you want to go?',
    plan: 'Your daily plan',
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121416]">
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />

      {step === null ? (
        <Welcome onStart={() => setIndex(0)} />
      ) : (
        <View className="flex-1 px-6">
          {/* progress bar + skip */}
          <View className="flex-row items-center pt-3">
            <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#2A2740]">
              <View
                className="h-1.5 rounded-full bg-white"
                style={{ width: `${((Math.min(index, steps.length - 1) + 1) / steps.length) * 100}%` }}
              />
            </View>
            {step !== 'plan' && (
              <Pressable onPress={skip} hitSlop={12} className="ml-4">
                <Text className="text-base text-neutral-200">Skip</Text>
              </Pressable>
            )}
          </View>

          <Text className="mt-10 text-3xl font-bold text-white">{titles[step]}</Text>

          <View className="flex-1">{renderStep()}</View>

          {/* buttons */}
          <View style={{ flexDirection: 'row', gap: 16, paddingTop: 12, paddingBottom: 16 }}>
            {index > 0 && (
              <Pressable
                onPress={goBack}
                style={{
                  flex: 1,
                  height: 56,
                  borderRadius: 28,
                  borderWidth: 1,
                  borderColor: '#A3A3A3',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text className="text-base font-medium text-white">Back</Text>
              </Pressable>
            )}
            <Pressable
              onPress={goNext}
              disabled={!canNext}
              style={{
                flex: 1,
                height: 56,
                borderRadius: 28,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: canNext ? '#F5F5F5' : '#2A2D2F',
              }}>
              <Text className={`text-base font-medium ${canNext ? 'text-black' : 'text-neutral-500'}`}>
                {step === 'plan' ? 'Start tracking' : 'Next'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
