import { dateKey } from '@/lib/dates';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Saturday, 5 Sep"
export const dayHeading = (d: Date) => `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;

// Number of days in a row (ending today) on which the user logged at least one meal.
// If today has nothing logged yet, the streak still counts up to yesterday, so it only
// resets to 0 after a full day was missed.
export function computeStreak(dailyMeals: Record<string, unknown[] | undefined>, now: Date = new Date()): number {
  const logged = (d: Date) => (dailyMeals[dateKey(d)]?.length ?? 0) > 0;

  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!logged(cursor)) cursor.setDate(cursor.getDate() - 1); // today not logged yet: start from yesterday

  let streak = 0;
  while (logged(cursor)) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
