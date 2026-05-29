'use client';

/**
 * Doctor Profile Setup
 * Route: /doctor/setup
 *
 * Source of truth:
 *  - backend/Modules/Doctor/SDD/APIs.md #POST /api/doctors/profile
 *  - frontend/SDD/doctor.md §6.2 Profile Setup Screen
 *
 * Called once after first login.
 * On success → redirect to /doctor/pending
 * On 409 PROFILE_EXISTS → already set up, redirect to /doctor/pending
 */

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BrandMark } from '@/components/auth/brand-mark';
import { DoctorGuard } from '@/guards/doctor.guard';
import { doctorApi } from '@/modules/doctor/api/doctor.api';
import { useDoctorProfile, DOCTOR_QUERY_KEYS } from '@/modules/doctor/hooks/useDoctor';
import { ROUTES } from '@/config/routes';
import { Spinner } from '@/components/shared/spinner';

type SetupForm = {
  specialization: string;
  qualification: string;
  experienceYears: string;
  licenseNumber: string;
  consultationFee: string;
  city: string;
  bio: string;
  hospitalName: string;
  clinicAddress: string;
  state: string;
  country: string;
  languagesSpoken: string; // comma-separated
};

const EMPTY_FORM: SetupForm = {
  specialization: '',
  qualification: '',
  experienceYears: '',
  licenseNumber: '',
  consultationFee: '',
  city: '',
  bio: '',
  hospitalName: '',
  clinicAddress: '',
  state: '',
  country: '',
  languagesSpoken: '',
};

function FormField({
  label,
  id,
  required,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60';

function DoctorSetupPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profile, isLoading: isProfileLoading, isError, error } = useDoctorProfile();
  const [form, setForm] = useState<SetupForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isProfileLoading) return;

    if (isError) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      // 404 means no doctor row yet; setup is the correct destination.
      if (status === 404) return;
      return;
    }

    if (!profile) return;
    if (!profile.isProfileCompleted) return;

    const statusRoutes: Record<string, string> = {
      Approved: ROUTES.doctor.dashboard,
      Pending: ROUTES.doctor.pending,
      Rejected: ROUTES.doctor.rejected,
      Suspended: ROUTES.doctor.suspended,
    };

    router.replace(statusRoutes[profile.approvalStatus] ?? ROUTES.doctor.pending);
  }, [isProfileLoading, isError, error, profile, router]);

  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const set = (field: keyof SetupForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate all required fields (must match backend CreateDoctorProfileRequest record)
    const missing: string[] = [];
    if (!form.specialization)   missing.push('Specialization');
    if (!form.qualification)    missing.push('Qualification');
    if (!form.licenseNumber)    missing.push('License Number');
    if (!form.city)             missing.push('City');
    if (!form.experienceYears)  missing.push('Years of Experience');
    if (!form.consultationFee)  missing.push('Consultation Fee');
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.join(', ')}`);
      return;
    }

    const expYears = parseInt(form.experienceYears, 10);
    const fee      = parseFloat(form.consultationFee);
    if (Number.isNaN(expYears) || expYears < 0) {
      toast.error('Years of experience must be a valid number (0 or more).');
      return;
    }
    if (Number.isNaN(fee) || fee < 0) {
      toast.error('Consultation fee must be a valid positive number.');
      return;
    }

    const payload = {
      specialization: form.specialization.trim(),
      qualification: form.qualification.trim(),
      experienceYears: expYears,
      licenseNumber: form.licenseNumber.trim(),
      consultationFee: fee,
      city: form.city.trim(),
      bio: form.bio.trim() || undefined,
      hospitalName: form.hospitalName.trim() || undefined,
      clinicAddress: form.clinicAddress.trim() || undefined,
      state: form.state.trim() || undefined,
      country: form.country.trim() || undefined,
      languagesSpoken: form.languagesSpoken
        ? form.languagesSpoken.split(',').map((l) => l.trim()).filter(Boolean)
        : undefined,
    };

    setSubmitting(true);
    try {
      const response = await doctorApi.createProfile(payload);
      // Write the fresh profile (isProfileCompleted: true) into the React Query
      // cache BEFORE the redirect so useDoctorPendingPoller on /doctor/pending
      // reads the updated data instead of stale data that would redirect back to setup.
      queryClient.setQueryData(DOCTOR_QUERY_KEYS.profile, response.data.data);
      toast.success('Profile submitted! Your application is now under admin review.');
      router.replace(ROUTES.doctor.pending);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

      if (status === 409) {
        // Profile already completed — go to pending/dashboard
        toast.info('Profile already completed — redirecting.');
        router.replace(ROUTES.doctor.pending);
        return;
      }
      toast.error(message ?? 'Failed to save profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <BrandMark size="sm" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in your professional details. These will be reviewed by our admin team.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="rounded-2xl border bg-white p-8 shadow-sm space-y-6">
          {/* ── Required fields ───────────────────────────────────── */}
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Required Information
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Specialization" id="specialization" required>
                <select
                  id="specialization"
                  value={form.specialization}
                  onChange={set('specialization')}
                  disabled={submitting}
                  required
                  className={inputCls}
                >
                  <option value="">Select specialization</option>
                  {['General Physician', 'Cardiologist', 'Dermatologist', 'Paediatrician', 'Neurologist', 'Gynaecologist', 'Psychiatrist', 'Orthopaedic', 'Ophthalmologist', 'ENT Specialist', 'Dentist', 'Other'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Qualification" id="qualification" required>
                <input
                  type="text"
                  id="qualification"
                  placeholder="e.g. MBBS, MD Cardiology"
                  value={form.qualification}
                  onChange={set('qualification')}
                  disabled={submitting}
                  required
                  className={inputCls}
                />
              </FormField>

              <FormField label="Medical License Number" id="licenseNumber" required>
                <input
                  type="text"
                  id="licenseNumber"
                  placeholder="e.g. MH-2021-12345"
                  value={form.licenseNumber}
                  onChange={set('licenseNumber')}
                  disabled={submitting}
                  required
                  className={inputCls}
                />
              </FormField>

              <FormField label="City" id="city" required>
                <input
                  type="text"
                  id="city"
                  placeholder="e.g. Mumbai"
                  value={form.city}
                  onChange={set('city')}
                  disabled={submitting}
                  required
                  className={inputCls}
                />
              </FormField>

              <FormField label="Years of Experience" id="experienceYears" required>
                <input
                  type="number"
                  id="experienceYears"
                  placeholder="e.g. 5"
                  min={0}
                  max={80}
                  value={form.experienceYears}
                  onChange={set('experienceYears')}
                  disabled={submitting}
                  required
                  className={inputCls}
                />
              </FormField>

              <FormField label="Consultation Fee (₹)" id="consultationFee" required>
                <input
                  type="number"
                  id="consultationFee"
                  placeholder="e.g. 500"
                  min={0}
                  value={form.consultationFee}
                  onChange={set('consultationFee')}
                  disabled={submitting}
                  required
                  className={inputCls}
                />
              </FormField>
            </div>
          </section>

          {/* ── Optional fields ───────────────────────────────────── */}
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Optional Details (helps patients find you)
            </p>

            <FormField label="Bio" id="bio">
              <textarea
                id="bio"
                rows={3}
                placeholder="Brief introduction about yourself and your practice…"
                value={form.bio}
                onChange={set('bio')}
                disabled={submitting}
                className={inputCls}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Hospital / Clinic Name" id="hospitalName">
                <input
                  type="text"
                  id="hospitalName"
                  placeholder="e.g. Apollo Hospital"
                  value={form.hospitalName}
                  onChange={set('hospitalName')}
                  disabled={submitting}
                  className={inputCls}
                />
              </FormField>

              <FormField label="State" id="state">
                <input
                  type="text"
                  id="state"
                  placeholder="e.g. Maharashtra"
                  value={form.state}
                  onChange={set('state')}
                  disabled={submitting}
                  className={inputCls}
                />
              </FormField>

              <FormField label="Country" id="country">
                <input
                  type="text"
                  id="country"
                  placeholder="e.g. India"
                  value={form.country}
                  onChange={set('country')}
                  disabled={submitting}
                  className={inputCls}
                />
              </FormField>

              <FormField label="Languages Spoken" id="languagesSpoken">
                <input
                  type="text"
                  id="languagesSpoken"
                  placeholder="e.g. Hindi, English, Marathi"
                  value={form.languagesSpoken}
                  onChange={set('languagesSpoken')}
                  disabled={submitting}
                  className={inputCls}
                />
              </FormField>
            </div>

            <FormField label="Clinic Address" id="clinicAddress">
              <input
                type="text"
                id="clinicAddress"
                placeholder="Full clinic/hospital address"
                value={form.clinicAddress}
                onChange={set('clinicAddress')}
                disabled={submitting}
                className={inputCls}
              />
            </FormField>
          </section>

          {/* ── Submit ────────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit Profile for Review'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function DoctorSetupPage() {
  return (
    <DoctorGuard>
      <DoctorSetupPageContent />
    </DoctorGuard>
  );
}
