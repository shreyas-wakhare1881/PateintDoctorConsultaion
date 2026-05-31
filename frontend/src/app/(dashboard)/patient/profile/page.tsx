'use client';

/**
 * Patient Profile Page
 * Route: /patient/profile
 * Guard: PatientGuard
 *
 * Displays patient profile data and allows updating personal info.
 * Uses usePatientProfile + useUpdatePatientProfile hooks.
 * UI Refactor: gradient avatar card, clean info grid, consistent form inputs.
 * All logic, hooks, mutations, validation unchanged.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { PatientGuard } from '@/guards/patient.guard';
import { Spinner } from '@/components/shared/spinner';
import { usePatientProfile, useUpdatePatientProfile } from '@/modules/patient/hooks/usePatient';
import { parseApiError } from '@/utils/errors';

const inputCls =
  'h-10 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-[#304F6D] focus:ring-2 focus:ring-[#304F6D]/20 disabled:opacity-60';
const inputStyle = { borderColor: 'rgba(48,79,109,0.15)' };

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748B' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

type EditForm = {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
};

function PatientProfileContent() {
  const { data: profile, isLoading } = usePatientProfile();
  const updateMutation = useUpdatePatientProfile();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm>({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      fullName: profile.fullName ?? '',
      dateOfBirth: profile.dateOfBirth ?? '',
      gender: (profile as Record<string, unknown>).gender as string ?? '',
      bloodGroup: (profile as Record<string, unknown>).bloodGroup as string ?? '',
    });
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border p-6 text-center" style={{ borderColor: '#FECACA', background: '#FEF2F2' }}>
        <p className="text-sm font-medium" style={{ color: '#991B1B' }}>Failed to load profile. Please refresh.</p>
      </div>
    );
  }

  const set = (field: keyof EditForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        fullName: form.fullName.trim() || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup || undefined,
      });
      toast.success('Profile updated successfully.');
      setEditing(false);
    } catch (err) {
      toast.error(parseApiError(err).message ?? 'Failed to update profile.');
    }
  };

  const initials = profile.fullName
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  const infoRows = [
    { label: 'Email', value: profile.email, icon: '✉️' },
    { label: 'Phone', value: (profile as Record<string, unknown>).phoneNumber as string ?? '—', icon: '📱' },
    { label: 'Date of Birth', value: (profile as Record<string, unknown>).dateOfBirth as string ?? '—', icon: '🎂' },
    { label: 'Gender', value: (profile as Record<string, unknown>).gender as string ?? '—', icon: '👤' },
    { label: 'Blood Group', value: (profile as Record<string, unknown>).bloodGroup as string ?? '—', icon: '🩸' },
    { label: 'City', value: (profile as Record<string, unknown>).city as string ?? '—', icon: '📍' },
    { label: 'Member Since', value: new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), icon: '📅' },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1F2937', letterSpacing: '-0.02em' }}>
            My Profile
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>
            View and update your personal information.
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all duration-150 hover:opacity-90"
            style={{ background: '#E2F3FD', color: '#304F6D', border: '1px solid rgba(48,79,109,0.15)' }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
            </svg>
            Edit Profile
          </button>
        )}
      </div>

      {/* Avatar + name hero card */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 flex items-center gap-5"
        style={{
          background: '#304F6D',
        }}
      >
        {/* Decorative circle */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10" style={{ background: '#FFE1A0' }} />
        {/* Avatar */}
        <div
          className="relative z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
          style={{ background: '#304F6D', boxShadow: '0 4px 16px rgba(48,79,109,0.40)' }}
        >
          {initials}
        </div>
        <div className="relative z-10">
          <p className="text-lg font-bold text-white">{profile.fullName}</p>
          <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>{profile.email}</p>
          <span
            className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: 'rgba(255,225,160,0.20)', color: '#FFE1A0' }}
          >
            Patient
          </span>
        </div>
      </div>

      {editing ? (
        /* ── Edit Form ──────────────────────────────────────────────── */
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl p-6"
          style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: '#64748B' }}>
            Edit Information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" id="fullName">
              <input
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={set('fullName')}
                className={inputCls}
                style={inputStyle}
                placeholder="Your full name"
              />
            </Field>

            <Field label="Date of Birth" id="dob">
              <input
                id="dob"
                type="date"
                value={form.dateOfBirth}
                onChange={set('dateOfBirth')}
                className={inputCls}
                style={inputStyle}
              />
            </Field>

            <Field label="Gender" id="gender">
              <select id="gender" value={form.gender} onChange={set('gender')} className={inputCls} style={inputStyle}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="PreferNotToSay">Prefer not to say</option>
              </select>
            </Field>

            <Field label="Blood Group" id="bloodGroup">
              <select id="bloodGroup" value={form.bloodGroup} onChange={set('bloodGroup')} className={inputCls} style={inputStyle}>
                <option value="">Select blood group</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white transition-all duration-150 hover:opacity-90 disabled:opacity-60"
              style={{ background: '#E07D54', color: '#000000', boxShadow: '0 4px 12px rgba(224,125,84,0.35)' }}
            >
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={updateMutation.isPending}
              className="inline-flex h-10 items-center justify-center rounded-xl border px-5 text-sm font-medium transition-all duration-150 hover:bg-slate-50 disabled:opacity-50"
              style={{ color: '#64748B', borderColor: '#E2E8F0' }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        /* ── Profile View ────────────────────────────────────────────── */
        <div
          className="rounded-2xl p-6"
          style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <h2 className="mb-5 text-sm font-bold uppercase tracking-wide" style={{ color: '#64748B' }}>
            Personal Information
          </h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            {infoRows.map(({ label, value, icon }) => (
              <div key={label} className="rounded-xl p-3.5" style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>
                  <span>{icon}</span>
                  {label}
                </dt>
                <dd className="mt-1.5 text-sm font-semibold" style={{ color: '#0F172A' }}>
                  {value || '—'}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

export default function PatientProfilePage() {
  return (
    <PatientGuard>
      <PatientProfileContent />
    </PatientGuard>
  );
}
