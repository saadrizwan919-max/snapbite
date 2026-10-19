import { memo, useMemo, useRef } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Text, View } from 'react-native';

export type HeightUnit = 'ft' | 'cm';

// ft mode counts in inches (one tick = 1 in), cm mode counts in centimetres (one tick = 1 cm)
const RANGE: Record<HeightUnit, { min: number; max: number }> = {
  ft: { min: 36, max: 96 }, // 3'0" to 8'0"
  cm: { min: 90, max: 250 },
};
const TICK_H = 20; // height of one tick row

// the text next to a big tick: 6'0" in ft mode, 180 in cm mode
const labelFor = (value: number, unit: HeightUnit) => {
  if (unit === 'ft') return value % 12 === 0 ? `${value / 12}'0"` : null;
  return value % 10 === 0 ? String(value) : null;
};

const Tick = memo(function Tick({ value, unit }: { value: number; unit: HeightUnit }) {
  const label = labelFor(value, unit);
  return (
    <View style={{ height: TICK_H, flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          width: label ? 40 : 20,
          height: 2,
          borderRadius: 1,
          backgroundColor: label ? '#C9C9CF' : '#6E6E75',
        }}
      />
      {label && <Text style={{ marginLeft: 10, color: '#A0A0A6', fontSize: 16 }}>{label}</Text>}
    </View>
  );
});

type Props = {
  unit: HeightUnit;
  initialValue: number; // inches (ft) or cm (cm). Only read when the ruler mounts: use key={unit} to restart it.
  height: number; // how tall the ruler is on screen
  onChange: (value: number) => void; // inches (ft) or whole cm (cm)
};

// A vertical ruler: taller heights are at the top. The white line in the middle is the chosen value.
export default function HeightRuler({ unit, initialValue, height, onChange }: Props) {
  const { min, max } = RANGE[unit];
  const listRef = useRef<FlatList<number>>(null);

  const values = useMemo(() => Array.from({ length: max - min + 1 }, (_, i) => max - i), [min, max]);
  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  const startValue = useRef(clamp(Math.round(initialValue))).current;
  const lastValue = useRef(startValue);
  const didInitialScroll = useRef(false);

  // so that any tick can reach the middle line
  const sidePadding = height / 2 - TICK_H / 2;
  const startIndex = max - startValue;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // scroll offset 0 = the first (tallest) tick is under the middle line, each tick = TICK_H
    const value = clamp(max - Math.round(e.nativeEvent.contentOffset.y / TICK_H));
    if (value !== lastValue.current) {
      lastValue.current = value;
      onChange(value);
    }
  };

  const handleLayout = () => {
    if (didInitialScroll.current) return;
    didInitialScroll.current = true;
    listRef.current?.scrollToOffset({ offset: startIndex * TICK_H, animated: false });
  };

  return (
    <View style={{ height, width: 260, alignSelf: 'center' }}>
      <FlatList
        ref={listRef}
        data={values}
        keyExtractor={(v) => String(v)}
        renderItem={({ item }) => <Tick value={item} unit={unit} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: sidePadding, paddingLeft: 8 }}
        getItemLayout={(_, index) => ({ length: TICK_H, offset: TICK_H * index, index })}
        initialScrollIndex={startIndex}
        initialNumToRender={30}
        windowSize={11}
        snapToInterval={TICK_H}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onLayout={handleLayout}
      />

      {/* the white line in the middle */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: height / 2 - 1.5,
          left: 0,
          right: 0,
          height: 3,
          borderRadius: 2,
          backgroundColor: '#FFFFFF',
        }}
      />
    </View>
  );
}
