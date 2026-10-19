// ----- weight (the store always keeps kg) -----
export const KG_PER_LB = 0.45359237;
export const kgToLb = (kg: number) => kg / KG_PER_LB;
export const lbToKg = (lb: number) => lb * KG_PER_LB;

// ----- water (the store always keeps ml) -----
export type WaterUnit = 'ml' | 'fl oz' | 'glasses';

export const ML_PER_FL_OZ = 29.5735;
export const ML_PER_GLASS = 250;
export const ML_PER_BOTTLE = 500;

export const toMl = (amount: number, unit: WaterUnit) => {
  if (unit === 'fl oz') return amount * ML_PER_FL_OZ;
  if (unit === 'glasses') return amount * ML_PER_GLASS;
  return amount;
};
