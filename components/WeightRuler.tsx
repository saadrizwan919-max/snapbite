import { memo, useMemo, useRef } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { WeightUnit } from '@/store/useAppStore';

// Layout: each whole number (e.g. 98) is one "unit" made of 10 ticks (0.1 each).
const TICK_W = 8; // width of one tick cell
const TICKS_PER_UNIT = 10;
const UNIT_W = TICK_W * TICKS_PER_UNIT; // 80

const RANGE: Record<WeightUnit, { min: number; max: number }> = {
  kg: { min: 20, max: 300 },
  lb: { min: 44, max: 660 },
};

// One whole number: 10 ticks + its label. memo = React won't redraw it while scrolling.
const RulerUnit = memo(function RulerUnit({ n }: { n: number }) {
  return (
    <View style={{ width: UNIT_W, height: 90 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {Array.from({ length: TICKS_PER_UNIT }, (_, k) => (
          <View key={k} style={{ width: TICK_W, alignItems: 'center' }}>
            <View
              style={{
                width: 2,
                borderRadius: 1,
                height: k === 0 ? 40 : k === 5 ? 28 : 18,
                backgroundColor: k === 0 ? '#C9C9CF' : '#6E6E75',
              }}
            />
          </View>
        ))}
      </View>
      {/* label is centered under the first tick of this unit */}
      <Text
        style={{
          position: 'absolute',
          top: 50,
          left: TICK_W / 2 - 20,
          width: 40,
          textAlign: 'center',
          color: '#A0A0A6',
          fontSize: 16,
        }}>
        {n}
      </Text>
    </View>
  );
});

type Props = {
  unit: WeightUnit;
  initialValue: number; // only read when the ruler mounts. Use key={unit} to restart it.
  onChange: (value: number) => void; // called with the value in the ruler's unit, e.g. 98.1
};

export default function WeightRuler({ unit, initialValue, onChange }: Props) {
  const { width } = useWindowDimensions();
  const { min, max } = RANGE[unit];
  const listRef = useRef<FlatList<number>>(null);

  // Empty space before the first / after the last unit so any tick can reach the center.
  const sidePadding = width / 2 - TICK_W / 2;

  const units = useMemo(() => Array.from({ length: max - min + 1 }, (_, i) => min + i), [min, max]);

  // Work in "tenths" (981 = 98.1) so we never deal with floating point errors.
  const clampTenths = (t: number) => Math.min(max * 10, Math.max(min * 10, t));
  const startTenths = useRef(clampTenths(Math.round(initialValue * 10))).current;
  const lastTenths = useRef(startTenths);
  const didInitialScroll = useRef(false);

  const startOffset = (startTenths - min * 10) * TICK_W;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // scroll offset 0 = the first tick sits under the center line, each tick = TICK_W px
    const tenths = clampTenths(min * 10 + Math.round(e.nativeEvent.contentOffset.x / TICK_W));
    if (tenths !== lastTenths.current) {
      lastTenths.current = tenths;
      onChange(tenths / 10);
    }
  };

  const handleLayout = () => {
    if (didInitialScroll.current) return;
    didInitialScroll.current = true;
    listRef.current?.scrollToOffset({ offset: startOffset, animated: false });
  };

  return (
    <View style={{ height: 100 }}>
      <FlatList
        ref={listRef}
        data={units}
        keyExtractor={(n) => String(n)}
        renderItem={({ item }) => <RulerUnit n={item} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: sidePadding }}
        // sizes are fixed, so the list can jump anywhere without measuring items
        getItemLayout={(_, index) => ({ length: UNIT_W, offset: UNIT_W * index, index })}
        initialScrollIndex={Math.floor((startTenths - min * 10) / 10)}
        initialNumToRender={12}
        windowSize={11}
        // snap to every tick
        snapToInterval={TICK_W}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onLayout={handleLayout}
      />

      {/* the white center line */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: width / 2 - 1.5,
          width: 3,
          height: 52,
          borderRadius: 2,
          backgroundColor: '#FFFFFF',
        }}
      />
    </View>
  );
}
