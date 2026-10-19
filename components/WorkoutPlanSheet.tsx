import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SheetHandle, renderBackdrop, sheetBackground, sheetHandle } from '@/components/SheetParts';
import {
  MUSCLES,
  MUSCLE_EXERCISES,
  REP_OPTIONS,
  SET_OPTIONS,
  WEEKDAY_NAMES,
  WorkoutExercise,
} from '@/lib/workout';
import { useAppStore } from '@/store/useAppStore';

const EMPTY: WorkoutExercise[] = [];
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const inputStyle = {
  height: 48,
  borderWidth: 1,
  borderColor: '#6B6F76',
  borderRadius: 8,
  paddingHorizontal: 14,
  fontSize: 16,
  color: '#FFFFFF',
} as const;

function Pill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-4 py-2 ${
        selected ? 'border-[#8B83C9] bg-[#2D2A4A]' : 'border-neutral-600'
      }`}>
      <Text className={`text-sm ${selected ? 'text-white' : 'text-neutral-300'}`}>{label}</Text>
    </Pressable>
  );
}

function Label({ children }: { children: string }) {
  return <Text className="mb-2 mt-5 text-sm font-medium text-neutral-400">{children}</Text>;
}

function ExerciseCard({ ex, onPress, onRemove }: { ex: WorkoutExercise; onPress?: () => void; onRemove?: () => void }) {
  return (
    <Pressable onPress={onPress} className="mb-2 flex-row items-center rounded-2xl bg-[#17181B] px-4 py-3.5">
      <View className="flex-1">
        <Text className="text-base font-semibold text-white">{ex.name}</Text>
        <Text className="mt-0.5 text-sm text-neutral-400">{ex.muscle}</Text>
      </View>
      <Text className="text-base font-semibold text-[#B9B2E0]">
        {ex.sets} × {ex.reps}
      </Text>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={10} className="ml-4">
          <Ionicons name="close-circle" size={22} color="#8E9397" />
        </Pressable>
      )}
    </Pressable>
  );
}

// Content of the sheet. The modal removes it when closed, so it starts fresh each time it opens.
function WorkoutBody({ weekday, onClose }: { weekday: number; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const saved = useAppStore((s) => s.workoutPlans[String(weekday)]) ?? EMPTY;
  const saveWorkoutPlan = useAppStore((s) => s.saveWorkoutPlan);
  const dayName = WEEKDAY_NAMES[weekday];

  const [editing, setEditing] = useState(saved.length === 0); // nothing planned yet -> start in edit mode
  const [draft, setDraft] = useState<WorkoutExercise[]>(saved);

  // the input fields
  const [muscle, setMuscle] = useState('');
  const [exercise, setExercise] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');

  const suggestions =
    MUSCLES.find((m) => m.toLowerCase() === muscle.trim().toLowerCase()) // typed or tapped muscle
      ? MUSCLE_EXERCISES[MUSCLES.find((m) => m.toLowerCase() === muscle.trim().toLowerCase())!]
      : [];

  const setsNum = parseInt(sets, 10);
  const repsNum = parseInt(reps, 10);
  const canAdd =
    muscle.trim() !== '' && exercise.trim() !== '' && setsNum > 0 && repsNum > 0;

  const addExercise = () => {
    if (!canAdd) return;
    setDraft((d) => [
      ...d,
      { id: makeId(), muscle: muscle.trim(), name: exercise.trim(), sets: setsNum, reps: repsNum },
    ]);
    setExercise(''); // keep muscle / sets / reps so adding several exercises is quick
  };

  // tap a row in the draft to load it back into the fields and change it
  const loadForEdit = (ex: WorkoutExercise) => {
    setMuscle(ex.muscle);
    setExercise(ex.name);
    setSets(String(ex.sets));
    setReps(String(ex.reps));
    setDraft((d) => d.filter((x) => x.id !== ex.id));
  };

  const handleSave = () => {
    saveWorkoutPlan(weekday, draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(saved);
    setMuscle('');
    setExercise('');
    if (saved.length === 0) onClose();
    else setEditing(false);
  };

  return (
    <View className="px-6" style={{ paddingBottom: insets.bottom + (editing ? 320 : 32) }}>
      {/* header */}
      <View className="mt-1 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-semibold text-white">{dayName} workout</Text>
          <Text className="mt-0.5 text-sm text-neutral-400">Repeats every {dayName}</Text>
        </View>
        {!editing && (
          <Pressable
            onPress={() => setEditing(true)}
            className="flex-row items-center gap-2 rounded-full bg-[#2B2840] px-4 py-2.5">
            <Ionicons name="pencil" size={16} color="#E6E3F5" />
            <Text className="text-sm font-medium text-[#E6E3F5]">Edit</Text>
          </Pressable>
        )}
      </View>

      {!editing ? (
        // ----- view mode -----
        <View className="mt-5">
          {saved.map((ex) => (
            <ExerciseCard key={ex.id} ex={ex} />
          ))}
        </View>
      ) : (
        // ----- edit mode -----
        <View>
          <Label>Muscle to hit</Label>
          <View className="flex-row flex-wrap gap-2">
            {MUSCLES.map((m) => (
              <Pill
                key={m}
                label={m}
                selected={muscle.trim().toLowerCase() === m.toLowerCase()}
                onPress={() => setMuscle(m)}
              />
            ))}
          </View>
          <BottomSheetTextInput
            value={muscle}
            onChangeText={setMuscle}
            placeholder="Muscle (or type your own)"
            placeholderTextColor="#8E9397"
            style={{ ...inputStyle, marginTop: 12 }}
          />

          <Label>Exercise</Label>
          {suggestions.length > 0 && (
            <View className="mb-3 flex-row flex-wrap gap-2">
              {suggestions.map((e) => (
                <Pill
                  key={e}
                  label={e}
                  selected={exercise.trim().toLowerCase() === e.toLowerCase()}
                  onPress={() => setExercise(e)}
                />
              ))}
            </View>
          )}
          <BottomSheetTextInput
            value={exercise}
            onChangeText={setExercise}
            placeholder="Exercise name (or type your own)"
            placeholderTextColor="#8E9397"
            style={inputStyle}
          />

          <View className="flex-row gap-4">
            <View className="flex-1">
              <Label>Sets</Label>
              <View className="mb-3 flex-row flex-wrap gap-2">
                {SET_OPTIONS.map((n) => (
                  <Pill key={n} label={`${n}`} selected={setsNum === n} onPress={() => setSets(String(n))} />
                ))}
              </View>
              <BottomSheetTextInput
                value={sets}
                onChangeText={setSets}
                keyboardType="number-pad"
                placeholder="Sets"
                placeholderTextColor="#8E9397"
                style={inputStyle}
              />
            </View>
            <View className="flex-1">
              <Label>Reps per set</Label>
              <View className="mb-3 flex-row flex-wrap gap-2">
                {REP_OPTIONS.map((n) => (
                  <Pill key={n} label={`${n}`} selected={repsNum === n} onPress={() => setReps(String(n))} />
                ))}
              </View>
              <BottomSheetTextInput
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
                placeholder="Reps"
                placeholderTextColor="#8E9397"
                style={inputStyle}
              />
            </View>
          </View>

          <Pressable
            onPress={addExercise}
            disabled={!canAdd}
            className={`mt-5 flex-row items-center justify-center gap-2 rounded-full border py-3.5 ${
              canAdd ? 'border-[#8B83C9] bg-[#2B2840]' : 'border-neutral-700'
            }`}>
            <Ionicons name="add" size={20} color={canAdd ? '#E6E3F5' : '#6B6F76'} />
            <Text className={`text-base font-medium ${canAdd ? 'text-[#E6E3F5]' : 'text-neutral-500'}`}>
              Add exercise
            </Text>
          </Pressable>

          {/* what's in the plan so far */}
          <Label>{`${dayName}'s plan (${draft.length})`}</Label>
          {draft.length === 0 ? (
            <Text className="text-sm text-neutral-500">No exercises yet. Pick a muscle and an exercise above.</Text>
          ) : (
            draft.map((ex) => (
              <ExerciseCard
                key={ex.id}
                ex={ex}
                onPress={() => loadForEdit(ex)}
                onRemove={() => setDraft((d) => d.filter((x) => x.id !== ex.id))}
              />
            ))
          )}
          {draft.length > 0 && <Text className="text-xs text-neutral-500">Tap an exercise to change it.</Text>}

          <Pressable onPress={handleSave} className="mt-6 items-center rounded-full bg-neutral-200 py-4">
            <Text className="text-base font-medium text-black">Save changes</Text>
          </Pressable>
          <Pressable onPress={handleCancel} className="mt-1 items-center py-3">
            <Text className="text-base text-neutral-400">Cancel</Text>
          </Pressable>
        </View>
      )}

      {!editing && saved.length === 0 && (
        <Text className="mt-6 text-center text-neutral-500">No workout planned for {dayName}s yet.</Text>
      )}
    </View>
  );
}

// ---------- the sheet ----------
const WorkoutPlanSheet = forwardRef<SheetHandle, { selectedDate: Date }>(function WorkoutPlanSheet(
  { selectedDate },
  ref
) {
  const modalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();

  useImperativeHandle(ref, () => ({
    present: () => modalRef.current?.present(),
    dismiss: () => modalRef.current?.dismiss(),
  }));

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={['92%']}
      enableDynamicSizing={false}
      topInset={insets.top}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustPan"
      backdropComponent={renderBackdrop}
      backgroundStyle={sheetBackground}
      handleIndicatorStyle={sheetHandle}>
      <BottomSheetScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <WorkoutBody weekday={selectedDate.getDay()} onClose={() => modalRef.current?.dismiss()} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

export default WorkoutPlanSheet;
