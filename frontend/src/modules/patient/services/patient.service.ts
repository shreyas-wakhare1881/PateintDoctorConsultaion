// Patient-specific client-side business logic
export const patientService = {
  formatBloodGroup: (group?: string): string => group ?? 'N/A',
  calculateAge: (dateOfBirth?: string): number | null => {
    if (!dateOfBirth) return null;
    const diff = Date.now() - new Date(dateOfBirth).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  },
};
