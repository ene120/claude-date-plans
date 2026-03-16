import { supabase } from './auth.js';

// ── Profile ──
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) console.error('getProfile error:', error);
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) console.error('updateProfile error:', error);
  return { data, error };
}

// ── Couples ──
export async function createCouple(name, userId) {
  const { data, error } = await supabase
    .from('couples')
    .insert({ name, created_by: userId })
    .select()
    .single();
  if (error) { console.error('createCouple error:', error); return { data: null, error }; }

  // Link profile to couple
  await supabase
    .from('profiles')
    .update({ couple_id: data.id, role: 'owner' })
    .eq('id', userId);

  return { data, error: null };
}

export async function getCouple(coupleId) {
  const { data, error } = await supabase
    .from('couples')
    .select('*')
    .eq('id', coupleId)
    .single();
  if (error) console.error('getCouple error:', error);
  return data;
}

export async function getCoupleMembers(coupleId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, email, role')
    .eq('couple_id', coupleId);
  if (error) console.error('getCoupleMembers error:', error);
  return data || [];
}

// ── Invites ──
export async function createInvite(coupleId, userId, email, inviteCode) {
  const { data, error } = await supabase
    .from('couple_invites')
    .insert({
      couple_id: coupleId,
      invited_by: userId,
      invited_email: email,
      invite_code: inviteCode,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single();
  if (error) console.error('createInvite error:', error);
  return { data, error };
}

export async function acceptInvite(inviteCode) {
  const { data, error } = await supabase
    .rpc('accept_invite', { p_invite_code: inviteCode });
  if (error) console.error('acceptInvite error:', error);
  return { data, error };
}

// ── Preferences ──
export async function getPreferences(coupleId) {
  const { data, error } = await supabase
    .from('preferences')
    .select('*')
    .eq('couple_id', coupleId)
    .single();
  if (error && error.code !== 'PGRST116') console.error('getPreferences error:', error);
  return data;
}

export async function upsertPreferences(coupleId, prefs) {
  const { data, error } = await supabase
    .from('preferences')
    .upsert({
      couple_id: coupleId,
      ...prefs,
      updated_at: new Date().toISOString()
    }, { onConflict: 'couple_id' })
    .select()
    .single();
  if (error) console.error('upsertPreferences error:', error);
  return { data, error };
}

// ── Plans ──
export async function getPlans(coupleId) {
  const { data, error } = await supabase
    .from('plans')
    .select('id, title, occasion, date_day, start_time, city, status, thumbnail_url, created_at, delivered_at')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false });
  if (error) console.error('getPlans error:', error);
  return data || [];
}

export async function getPlan(planId) {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();
  if (error) console.error('getPlan error:', error);
  return data;
}

// ── Plan Requests ──
export async function createPlanRequest(coupleId, profileId, formData) {
  const { data, error } = await supabase
    .from('plan_requests')
    .insert({
      couple_id: coupleId,
      profile_id: profileId,
      form_data: formData
    })
    .select()
    .single();
  if (error) console.error('createPlanRequest error:', error);
  return { data, error };
}

// ── Favorites ──
export async function getFavorites(profileId) {
  const { data, error } = await supabase
    .from('favorites')
    .select('*, plans(title)')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
  if (error) console.error('getFavorites error:', error);
  return data || [];
}

export async function addFavorite(favorite) {
  const { data, error } = await supabase
    .from('favorites')
    .insert(favorite)
    .select()
    .single();
  if (error) console.error('addFavorite error:', error);
  return { data, error };
}

export async function deleteFavorite(id) {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('id', id);
  if (error) console.error('deleteFavorite error:', error);
  return { error };
}

export async function updateFavorite(id, updates) {
  const { data, error } = await supabase
    .from('favorites')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) console.error('updateFavorite error:', error);
  return { data, error };
}
