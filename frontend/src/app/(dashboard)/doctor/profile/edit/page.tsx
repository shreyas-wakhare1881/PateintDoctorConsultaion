'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DoctorGuard } from '@/guards/doctor.guard';
import { Spinner } from '@/components/shared/spinner';
import { ROUTES } from '@/config/routes';
import { doctorApi } from '@/modules/doctor/api/doctor.api';
import { useDoctorProfile } from '@/modules/doctor/hooks/useDoctor';
import { parseApiError } from '@/utils/errors';

type EditForm = {
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
  languagesSpoken: string;
};

const EMPTY_FORM: EditForm = {
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

function DoctorProfileEditContent() {
  const router = useRouter();
  const { data: profile, isLoading } = useDoctorProfile();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<EditForm>(EMPTY_FORM);

  useEffect(() => {
    if (!profile) return;
    setForm({
      specialization: profile.specialization ?? '',
      qualification: profile.qualification ?? '',
      experienceYears: profile.experienceYears != null ? String(profile.experienceYears) : '',
      licenseNumber: profile.licenseNumber ?? '',
      consultationFee: profile.consultationFee != null ? String(profile.consultationFee) : '',
      city: profile.city ?? '',
      bio: profile.bio ?? '',
      hospitalName: profile.hospitalName ?? '',
      clinicAddress: profile.clinicAddress ?? '',
      state: profile.state ?? '',
      country: profile.country ?? '',
      languagesSpoken: profile.languagesSpoken.join(', '),
    });
  }, [profile]);

  const pageTitle = useMemo(() => {
    if (!profile) return 'Edit Profile';
    if (profile.approvalStatus === 'Rejected') return 'Update Profile for Re-Review';
    return 'Edit Profile';
  }, [profile]);

  const set = (field: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const payload: Record<string, unknown> = {
      specialization: form.specialization.trim() || null,
      qualification: form.qualification.trim() || null,
      experienceYears: form.experienceYears ? Number(form.experienceYears) : null,
      licenseNumber: form.licenseNumber.trim() || null,
      consultationFee: form.consultationFee ? Number(form.consultationFee) : null,
      city: form.city.trim() || null,
      bio: form.bio.trim() || null,
      hospitalName: form.hospitalName.trim() || null,
      clinicAddress: form.clinicAddress.trim() || null,
      state: form.state.trim() || null,
      country: form.country.trim() || null,
      languagesSpoken: form.languagesSpoken
        ? form.languagesSpoken.split(',').map((l) => l.trim()).filter(Boolean)
        : [],
    };

    setSubmitting(true);
    try {
      const response = await doctorApi.updateProfile(payload);
      const updated = response.data?.data as { approvalStatus?: string } | undefined;

      if (updated?.approvalStatus === 'Pending') {
        toast.success('Profile updated and submitted for admin re-review.');
        router.replace(ROUTES.doctor.pending);
        return;
      }

      if (updated?.approvalStatus === 'Rejected') {
        toast.success('Profile updated.');
        router.replace(ROUTES.doctor.rejected);
        return;
      }

      if (updated?.approvalStatus === 'Suspended') {
        toast.success('Profile updated.');
        router.replace(ROUTES.doctor.suspended);
        return;
      }

      toast.success('Profile updated successfully.');
      router.replace(ROUTES.doctor.profile);
    } catch (err) {
      toast.error(parseApiError(err).message ?? 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep your professional details accurate for moderation and patient visibility.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Specialization" id="specialization" required>
            <input id="specialization" value={form.specialization} onChange={set('specialization')} className={inputCls} required />
          </Field>
          <Field label="Qualification" id="qualification" required>
            <input id="qualification" value={form.qualification} onChange={set('qualification')} className={inputCls} required />
          </Field>
          <Field label="Experience (years)" id="experienceYears" required>
            <input id="experienceYears" type="number" min={0} value={form.experienceYears} onChange={set('experienceYears')} className={inputCls} required />
          </Field>
          <Field label="License Number" id="licenseNumber" required>
            <input id="licenseNumber" value={form.licenseNumber} onChange={set('licenseNumber')} className={inputCls} required />
          </Field>
          <Field label="Consultation Fee" id="consultationFee" required>
            <input id="consultationFee" type="number" min={0} value={form.consultationFee} onChange={set('consultationFee')} className={inputCls} required />
          </Field>
          <Field label="City" id="city" required>
            <input id="city" value={form.city} onChange={set('city')} className={inputCls} required />
          </Field>
        </div>

        <Field label="Bio" id="bio">
          <textarea id="bio" rows={3} value={form.bio} onChange={set('bio')} className={inputCls} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hospital Name" id="hospitalName">
            <input id="hospitalName" value={form.hospitalName} onChange={set('hospitalName')} className={inputCls} />
          </Field>
          <Field label="Clinic Address" id="clinicAddress">
            <input id="clinicAddress" value={form.clinicAddress} onChange={set('clinicAddress')} className={inputCls} />
          </Field>
          <Field label="State" id="state">
            <input id="state" value={form.state} onChange={set('state')} className={inputCls} />
          </Field>
          <Field label="Country" id="country">
            <input id="country" value={form.country} onChange={set('country')} className={inputCls} />
          </Field>
        </div>

        <Field label="Languages Spoken" id="languagesSpoken">
          <input
            id="languagesSpoken"
            value={form.languagesSpoken}
            onChange={set('languagesSpoken')}
            placeholder="Hindi, English"
            className={inputCls}
          />
        </Field>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-10 items-center justify-center rounded-lg border px-5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
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

export default function DoctorProfileEditPage() {
  return (
    <DoctorGuard>
      <DoctorProfileEditContent />
    </DoctorGuard>
  );
}
