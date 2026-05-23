export const getRedirectPathByRole = (role: string): string => {
  const map: Record<string, string> = {
    Patient: '/patient/dashboard',
    Doctor: '/doctor/dashboard',
    Admin: '/admin/dashboard',
  };
  return map[role] ?? '/';
};
