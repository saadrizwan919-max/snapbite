import { Modal, Pressable, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string | null; // null = hide Cancel (for a message with a single OK button)
  destructive?: boolean; // makes the confirm button red
  onConfirm: () => void;
  onCancel: () => void;
};

// Dark, rounded replacement for Alert.alert (the native Android alert can't be styled)
export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      {/* tapping the dark area closes it */}
      <Pressable className="flex-1 items-center justify-center bg-black/60 px-8" onPress={onCancel}>
        {/* inner Pressable stops taps on the card from closing it */}
        <Pressable className="w-full rounded-3xl bg-[#26282B] px-6 pb-4 pt-6" onPress={() => {}}>
          <Text className="text-xl font-semibold text-white">{title}</Text>
          {message ? <Text className="mt-3 text-base leading-6 text-neutral-300">{message}</Text> : null}

          <View className="mt-6 flex-row justify-end gap-2">
            {cancelText !== null && (
              <Pressable onPress={onCancel} className="rounded-full px-4 py-2.5">
                <Text className="text-base font-medium text-neutral-300">{cancelText}</Text>
              </Pressable>
            )}
            <Pressable onPress={onConfirm} className="rounded-full px-4 py-2.5">
              <Text className={`text-base font-semibold ${destructive ? 'text-[#F0746C]' : 'text-white'}`}>
                {confirmText}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
