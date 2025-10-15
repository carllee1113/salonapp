'use client';
import React from "react";
import { useRouter } from "next/navigation";
import { isSupabaseEnvReady } from "@/lib/supabase-client";

// Types
export type ProfilePreferences = {
  marketingEmails: boolean;
  smsReminders: boolean;
};

export type ProfileData = {
  fullName: string;
  phone: string;
  timezone: string;
  avatarUrl?: string;
  preferences: ProfilePreferences;
};

export type ProfileFormProps = {
  initialProfile?: ProfileData;
  onSubmit?: (data: ProfileData) => void;
};

const TIMEZONES: string[] = [
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
];

export default function ProfileForm({ initialProfile, onSubmit }: ProfileFormProps): React.JSX.Element {
  const router = useRouter();
  const [form, setForm] = React.useState<ProfileData>(
    initialProfile ?? {
      fullName: "",
      phone: "",
      timezone: TIMEZONES[0],
      avatarUrl: "",
      preferences: { marketingEmails: true, smsReminders: true },
    }
  );
  const [errors, setErrors] = React.useState<Partial<Record<keyof ProfileData, string>>>({});
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [serverMessage, setServerMessage] = React.useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(isSupabaseEnvReady ? null : false);
  const [editing, setEditing] = React.useState<boolean>(false);

  // Load profile on mount if initialProfile not provided
  React.useEffect(() => {
    if (initialProfile) return;
    let active = true;
    import("@/services/profile").then(async (svc) => {
      const res = await svc.loadCurrentUserProfile();
      if (!active) return;
      if (res.error) {
        const err = res.error.toLowerCase();
        const unauthErrors = [
          "not authenticated",
          "auth session missing",
          "supabase environment not configured",
          "supabase client not initialized",
        ];
        if (unauthErrors.some((s) => err.includes(s))) {
          setIsAuthenticated(false);
          // Use a friendly message instead of exposing raw auth error
          setServerError(null);
        } else {
          setServerError(res.error);
          setIsAuthenticated(null);
        }
        return;
      }
      if (res.data) {
        setForm(res.data);
        setIsAuthenticated(true);
      } else {
        // Authenticated but no profile row yet
        setIsAuthenticated(true);
      }
    }).catch((err) => {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setServerError(msg);
    });
    return () => {
      active = false;
    };
  }, [initialProfile]);

  const validate = (data: ProfileData): Partial<Record<keyof ProfileData, string>> => {
    const nextErrors: Partial<Record<keyof ProfileData, string>> = {};
    if (!data.fullName.trim()) nextErrors.fullName = "Full name is required";
    // Hong Kong phone: exactly 8 digits
    const digitsOnly = data.phone.replace(/\D/g, "");
    const phoneOk = digitsOnly.length === 8;
    if (!phoneOk) nextErrors.phone = "Phone must be 8 digits";
    // Timezone validation removed for Hong Kong focus
    return nextErrors;
  };

  const isValid = Object.keys(validate(form)).length === 0;

  const handleChange = (field: keyof ProfileData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value as never }));
  };

  const handlePrefChange = (field: keyof ProfilePreferences, value: boolean) => {
    setForm((prev) => ({ ...prev, preferences: { ...prev.preferences, [field]: value } }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    setServerError(null);
    setServerMessage(null);
    if (Object.keys(v).length > 0) return;
    if (isAuthenticated === false) {
      setServerError("Please sign in to save your profile.");
      return;
    }
    try {
      setSubmitting(true);
      const { saveCurrentUserProfile } = await import("@/services/profile");
      const res = await saveCurrentUserProfile(form);
      if (!res.ok) {
        setServerError(res.error ?? "Failed to save profile");
        return;
      }
      setServerMessage("Profile saved successfully.");
      if (onSubmit) onSubmit(form);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="fullName" className="block text-sm font-medium text-foreground">Full name</label>
        {editing ? (
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={form.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-gray-900 placeholder:text-gray-500 placeholder:opacity-100"
            placeholder="e.g. Alex Johnson"
          />
        ) : (
          <div className="mt-2 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-foreground">
            {form.fullName || "—"}
          </div>
        )}
        {editing && errors.fullName && (
          <p role="alert" className="mt-1 text-sm text-red-600">{errors.fullName}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-foreground">Phone</label>
        {editing ? (
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-gray-900 placeholder:text-gray-500 placeholder:opacity-100"
            placeholder="e.g. 1234 5678"
          />
        ) : (
          <div className="mt-2 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-foreground">
            {form.phone || "—"}
          </div>
        )}
        {editing && errors.phone && (
          <p role="alert" className="mt-1 text-sm text-red-600">{errors.phone}</p>
        )}
      </div>

      {/* Loyalty Points display (read-only) */}
      <div>
        <span className="block text-sm font-medium text-foreground">Loyalty Points</span>
        <span className="mt-2 inline-block rounded-md bg-gray-200 px-3 py-1 text-sm text-foreground">0</span>
      </div>

      {/* Timezone field removed from UI for Hong Kong users */}

      <div className="sm:col-span-2">
        <fieldset className="rounded-md border border-gray-200 p-3">
          <legend className="px-1 text-sm font-medium text-foreground">Preferences</legend>
          <p className="mt-1 text-xs text-gray-500 italic">These preferences are temporarily disabled; the function will be provided later.</p>
          <label className="mt-2 flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={form.preferences.marketingEmails}
              onChange={(e) => handlePrefChange("marketingEmails", e.currentTarget.checked)}
              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            />
            Receive marketing emails
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={form.preferences.smsReminders}
              onChange={(e) => handlePrefChange("smsReminders", e.currentTarget.checked)}
              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            />
            SMS appointment reminders
          </label>
        </fieldset>
      </div>

      <div className="sm:col-span-2 flex flex-col items-end gap-2">
        {serverError && (
          <p role="alert" className="text-sm text-red-600">{serverError}</p>
        )}
        {serverMessage && (
          <p className="text-sm text-[#1A1A1A]">{serverMessage}</p>
        )}
        <div className="flex items-center justify-end gap-3">
          {editing ? (
            <button
              type="submit"
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isValid || submitting || isAuthenticated === false}
            >
              Save changes
            </button>
          ) : (
            <button
              type="button"
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600"
              onClick={() => setEditing(true)}
            >
              I want to update
            </button>
          )}
          {isAuthenticated === false && (
            <button
              type="button"
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600"
              onClick={() => router.push("/")}
            >
              Sign in
            </button>
          )}
          <button
            type="button"
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
            onClick={() => router.back()}
          >
            Return
          </button>
        </div>
        {isAuthenticated === false && (
          <p className="text-xs text-gray-500">Sign in is required to save changes.</p>
        )}
      </div>
    </form>
  );
}