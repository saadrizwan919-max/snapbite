export type WorkoutExercise = {
  id: string;
  muscle: string; // e.g. "Chest" (or anything the user typed)
  name: string; // e.g. "Bench Press"
  sets: number;
  reps: number; // reps per set
};

export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Muscle pills + the suggested exercise pills for each one
export const MUSCLE_EXERCISES: Record<string, string[]> = {
  Chest: ['Bench Press', 'Incline Dumbbell Press', 'Chest Fly', 'Push-ups', 'Cable Crossover', 'Chest Dips'],
  Back: ['Pull-ups', 'Lat Pulldown', 'Barbell Row', 'Seated Cable Row', 'Deadlift', 'T-Bar Row'],
  Shoulders: ['Overhead Press', 'Lateral Raise', 'Front Raise', 'Rear Delt Fly', 'Arnold Press', 'Shrugs'],
  Biceps: ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl', 'Concentration Curl'],
  Triceps: ['Tricep Pushdown', 'Skull Crushers', 'Overhead Extension', 'Close-Grip Bench Press', 'Bench Dips'],
  Legs: ['Squat', 'Leg Press', 'Lunges', 'Leg Extension', 'Leg Curl', 'Romanian Deadlift'],
  Glutes: ['Hip Thrust', 'Glute Bridge', 'Cable Kickback', 'Bulgarian Split Squat'],
  Calves: ['Standing Calf Raise', 'Seated Calf Raise'],
  Abs: ['Plank', 'Crunches', 'Hanging Leg Raise', 'Russian Twist', 'Cable Crunch'],
  Forearms: ['Wrist Curl', 'Reverse Curl', "Farmer's Walk"],
};

export const MUSCLES = Object.keys(MUSCLE_EXERCISES);
export const SET_OPTIONS = [2, 3, 4];
export const REP_OPTIONS = [8, 10, 12, 15];
