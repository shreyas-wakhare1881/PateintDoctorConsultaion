'use client';

/**
 * Patient Profile Setup
 * Route: /patient/setup
 * Source of truth: frontend/SDD/auth.md §6.7
 *
 * Displayed once after first OTP login when GET /api/patients/me returns 404.
 * POST /api/patients/profile → redirect to /patient/dashboard
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ROUTES } from '@/config/routes';
import { apiClient } from '@/services/api-client';
import { apiConfig } from '@/config/api.config';
import { parseApiError } from '@/utils/errors';
import { patientSetupSchema, PatientSetupInput } from '@/modules/auth/schemas/auth.schema';
import { PatientGuard } from '@/guards/patient.guard';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthButton } from '@/components/auth/auth-button';
import { AuthErrorBanner } from '@/components/auth/auth-error-banner';
import { FormField } from '@/components/auth/form-field';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthIllustration } from '@/components/auth/auth-illustration';
import { BrandMark } from '@/components/auth/brand-mark';
import { cn } from '@/utils/cn';

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
  { value: 'PreferNotToSay', label: 'Prefer not to say' },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

function SetupForm() {
  const router = useRouter();
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PatientSetupInput>({
    resolver: zodResolver(patientSetupSchema),
    defaultValues: { country: 'India' },
  });

  const selectedGender = watch('gender');
  const selectedBloodGroup = watch('bloodGroup');

  const onSubmit = async (data: PatientSetupInput) => {
    setBannerError(null);
    setLoading(true);
    try {
      await apiClient.post(apiConfig.endpoints.patients.profile, data);
      toast.success('Profile saved! Welcome to HealthConsult.');
      router.replace(ROUTES.patient.dashboard);
    } catch (err) {
      const parsed = parseApiError(err);
      setBannerError(parsed.message ?? 'Could not save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    toast.info('You can complete your profile anytime from Settings.');
    router.replace(ROUTES.patient.dashboard);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center auth-gradient px-4 py-10">
      <div className="mb-6">
        <BrandMark size="md" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-[480px]"
      >
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-[0_2px_20px_-6px_rgba(0,0,0,0.08)] sm:p-8">
          {/* Illustration + header */}
          <div className="mb-6 flex items-center gap-4">
            <AuthIllustration type="patient" className="h-16 w-16 flex-shrink-0" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Complete Your Profile</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Help us personalize your care experience
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Gender — pill buttons */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Gender <span className="text-destructive">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue('gender', opt.value as PatientSetupInput['gender'])}
                    className={cn(
                      'rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-all',
                      selectedGender === opt.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-foreground hover:border-primary/50'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {errors.gender && (
                <p className="text-xs text-destructive">{errors.gender.message}</p>
              )}
              <input type="hidden" {...register('gender')} />
            </div>

            {/* Date of Birth */}
            <FormField
              label="Date of Birth"
              htmlFor="dateOfBirth"
              error={errors.dateOfBirth?.message}
              required
            >
              <AuthInput
                id="dateOfBirth"
                type="date"
                error={!!errors.dateOfBirth}
                {...register('dateOfBirth')}
              />
            </FormField>

            {/* Blood Group — optional */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Blood Group
                <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setValue('bloodGroup', bg as PatientSetupInput['bloodGroup'])}
                    className={cn(
                      'rounded-lg border-2 px-3 py-1 text-xs font-semibold transition-all',
                      selectedBloodGroup === bg
                        ? 'text-white'
                        : 'border-border bg-background text-foreground'
                    )}
                    style={selectedBloodGroup === bg
                      ? { borderColor: '#304F6D', background: '#304F6D' }
                      : { }
                    }
                  >
                    {bg}
                  </button>
                ))}
              </div>
              <input type="hidden" {...register('bloodGroup')} />
            </div>

            {/* Height + Weight */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Height (cm)" htmlFor="heightCm" error={errors.heightCm?.message}>
                <AuthInput
                  id="heightCm"
                  type="number"
                  inputMode="numeric"
                  placeholder="170"
                  error={!!errors.heightCm}
                  {...register('heightCm')}
                />
              </FormField>
              <FormField label="Weight (kg)" htmlFor="weightKg" error={errors.weightKg?.message}>
                <AuthInput
                  id="weightKg"
                  type="number"
                  inputMode="numeric"
                  placeholder="65"
                  error={!!errors.weightKg}
                  {...register('weightKg')}
                />
              </FormField>
            </div>

            {/* City */}
            <FormField label="City" htmlFor="city" error={errors.city?.message}>
              <AuthInput
                id="city"
                type="text"
                placeholder="Mumbai"
                error={!!errors.city}
                {...register('city')}
              />
            </FormField>

            <AuthErrorBanner message={bannerError} />

            <AuthButton type="submit" loading={loading}>
              Save & Continue
            </AuthButton>
          </form>

          <button
            type="button"
            onClick={handleSkip}
            className="mt-3 w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip for now →
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function PatientSetupPage() {
  return (
    <PatientGuard>
      <SetupForm />
    </PatientGuard>
  );
}
