import { BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

// What a parent can do with a sheet: sheetRef.current?.present()
export type SheetHandle = {
  present: () => void;
  dismiss: () => void;
};

// Dark overlay behind the sheet. Tapping it closes the sheet.
export const renderBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop
    {...props}
    appearsOnIndex={0}
    disappearsOnIndex={-1}
    pressBehavior="close"
    opacity={0.6}
  />
);

export const sheetBackground = { backgroundColor: '#1D1C22' };
export const sheetHandle = { backgroundColor: '#8A8A90', width: 48 };
