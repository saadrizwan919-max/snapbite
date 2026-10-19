import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { dateKey, startOfDay } from '@/lib/dates';

export type DayStatus = 'within' | 'over' | undefined;

type Props = {
  visible: boolean;
  value: Date; // the currently selected day
  maxDate?: Date; // days after this can't be picked (default: today)
  minDate?: Date; // days before this can't be picked (default: any past day is fine)
  onSelect: (date: Date) => void; // called with the tapped day (the parent should also close the modal)
  onClose: () => void;
  getDayStatus?: (key: string) => DayStatus; // optional: tints days green/red and shows the legend
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; // week starts on Monday

const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

// Dark replacement for the native date picker
export default function CalendarModal({ visible, value, maxDate, minDate, onSelect, onClose, getDayStatus }: Props) {
  const max = startOfDay(maxDate ?? new Date());
  const min = minDate ? startOfDay(minDate) : null;
  const [month, setMonth] = useState(monthStart(value));

  // always open on the month of the selected day
  useEffect(() => {
    if (visible) setMonth(monthStart(value));
  }, [visible, value]);

  const year = month.getFullYear();
  const m = month.getMonth();
  const leadingBlanks = (new Date(year, m, 1).getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, m + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  const canGoNext = new Date(year, m + 1, 1) <= max;
  const canGoPrev = !min || new Date(year, m, 0) >= min; // last day of the previous month
  const selectedKey = dateKey(value);

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/60 px-5" onPress={onClose}>
        <Pressable className="w-full rounded-[32px] bg-[#202325] px-4 pb-5 pt-6" onPress={() => {}}>
          {/* month header */}
          <View className="flex-row items-center justify-between px-4">
            <Pressable onPress={() => canGoPrev && setMonth(new Date(year, m - 1, 1))} hitSlop={12}>
              <Ionicons name="chevron-back" size={26} color={canGoPrev ? 'white' : '#4B4F53'} />
            </Pressable>
            <Text className="text-lg font-semibold text-neutral-200">
              {MONTHS[m]} {year}
            </Text>
            <Pressable onPress={() => canGoNext && setMonth(new Date(year, m + 1, 1))} hitSlop={12}>
              <Ionicons name="chevron-forward" size={26} color={canGoNext ? 'white' : '#4B4F53'} />
            </Pressable>
          </View>

          {/* weekday letters */}
          <View className="mt-6 flex-row">
            {WEEKDAYS.map((d, i) => (
              <Text key={i} className="flex-1 text-center text-sm text-neutral-400">
                {d}
              </Text>
            ))}
          </View>

          {/* days */}
          <View className="mt-2">
            {rows.map((row, r) => (
              <View key={r} className="flex-row">
                {row.map((day, c) => {
                  if (day === null) return <View key={c} className="h-[46px] flex-1" />;

                  const date = new Date(year, m, day);
                  const key = dateKey(date);
                  const disabled = date > max || (min !== null && date < min);
                  const selected = key === selectedKey;
                  const status = getDayStatus?.(key);

                  const circle = selected
                    ? 'bg-neutral-300'
                    : status === 'within'
                      ? 'bg-[#1E3A2A]'
                      : status === 'over'
                        ? 'bg-[#4A2525]'
                        : '';
                  const text = selected ? 'text-black' : disabled ? 'text-neutral-600' : 'text-neutral-200';

                  return (
                    <Pressable
                      key={c}
                      disabled={disabled}
                      onPress={() => onSelect(date)}
                      className="h-[46px] flex-1 items-center justify-center">
                      <View className={`h-10 w-10 items-center justify-center rounded-full ${circle}`}>
                        <Text className={`text-base ${text}`}>{day}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          {getDayStatus && (
            <View className="mt-4 flex-row items-center gap-6 px-3">
              <View className="flex-row items-center gap-2">
                <View className="h-5 w-5 rounded-full bg-[#2A5A3C]" />
                <Text className="text-sm text-neutral-400">Within goal</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="h-5 w-5 rounded-full bg-[#6A2E2E]" />
                <Text className="text-sm text-neutral-400">Over goal</Text>
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
