import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type OAuthProvider = "google";

export interface ProfileRecord {
  id?: string;
  email: string | null;
  full_name: string;
  avatar_url: string | null;
}

export const LOCAL_GUEST_PROFILE_KEY = "transpo_guest_profile";

export function profileFromUser(user: User): ProfileRecord {
  return {
    id: user.id,
    email: user.email ?? null,
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || "Google User",
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
  };
}

export function getLocalGuestProfile(): ProfileRecord {
  const stored = localStorage.getItem(LOCAL_GUEST_PROFILE_KEY);
  if (!stored) {
    return { email: null, full_name: "Guest User", avatar_url: null };
  }

  try {
    const parsed = JSON.parse(stored) as Partial<ProfileRecord>;
    return {
      id: parsed.id,
      email: parsed.email ?? null,
      full_name: parsed.full_name || "Guest User",
      avatar_url: parsed.avatar_url ?? null,
    };
  } catch {
    return { email: null, full_name: "Guest User", avatar_url: null };
  }
}

export function hasLocalGuestProfile() {
  return Boolean(localStorage.getItem(LOCAL_GUEST_PROFILE_KEY));
}

export function saveLocalGuestProfile(profile: ProfileRecord) {
  localStorage.setItem(LOCAL_GUEST_PROFILE_KEY, JSON.stringify({
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name || "Guest User",
    avatar_url: profile.avatar_url,
  }));
}

export function clearLocalGuestProfile() {
  localStorage.removeItem(LOCAL_GUEST_PROFILE_KEY);
}

export async function signInWithOAuth(provider: OAuthProvider) {
  if (!supabase) {
    return { error: new Error("Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local first.") };
  }

  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin,
    },
  });
}

export async function loadProfile(user: User) {
  if (!supabase) return profileFromUser(user);

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return profileFromUser(user);

  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name || profileFromUser(user).full_name,
    avatar_url: data.avatar_url,
  } satisfies ProfileRecord;
}

export async function upsertProfile(profile: ProfileRecord) {
  if (!supabase) {
    return { error: new Error("Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local first.") };
  }

  if (!profile.id) {
    return { error: new Error("A Supabase auth user is required before writing to profiles.") };
  }

  return supabase.from("profiles").upsert({
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name || "Guest User",
    avatar_url: profile.avatar_url,
  }, { onConflict: "id" });
}

export async function ensureGuestUser() {
  if (!supabase) {
    return { user: null, error: new Error("Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local first.") };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user) {
    return { user: sessionData.session.user, error: null };
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  return { user: data.user, error };
}
