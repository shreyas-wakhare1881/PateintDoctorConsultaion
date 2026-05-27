/**
 * Date Utilities — localized for en-IN healthcare context.
 */

/** Format ISO string as readable date: "24 May 2026" */
export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(iso));

/** Format ISO string as date + time: "24 May 2026, 10:30 AM" */
export const formatDateTime = (iso: string): string =>
  new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));

/** Format time string HH:mm as "10:30 AM" */
export const formatTime = (time: string): string => {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return new Intl.DateTimeFormat('en-IN', { timeStyle: 'short' }).format(d);
};

/** Returns age in years from ISO date string. */
export const getAge = (dateOfBirth: string): number => {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};

/** Returns true if the given ISO date+time is within `minutes` from now. */
export const isWithinMinutes = (isoDateTime: string, minutes: number): boolean => {
  const target = new Date(isoDateTime).getTime();
  const now = Date.now();
  const diff = target - now;
  return diff >= 0 && diff <= minutes * 60 * 1000;
};

/** Returns true if the date is today or in the future. */
export const isTodayOrFuture = (isoDate: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(isoDate) >= today;
};

/** Returns true if the date is strictly in the past (for DOB validation). */
export const isPastDate = (isoDate: string): boolean =>
  new Date(isoDate) < new Date();

/** Day-of-week label from 0–6. */
export const getDayLabel = (day: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day] ?? 'Unknown';
};
