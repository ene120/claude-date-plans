import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, APP_BASE_URL } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Send magic link to email
export async function sendMagicLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: APP_BASE_URL + '/dashboard.html'
    }
  });
  return { error };
}

// Get current session
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Listen for auth state changes
export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

// Sign out
export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = './index.html';
}

// Page guard: redirect to login if not authenticated
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = './index.html';
    return null;
  }
  return session;
}

// Get user from session
export function getUser(session) {
  return session?.user || null;
}
