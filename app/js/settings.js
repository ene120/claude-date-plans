import { requireAuth, getUser, signOut, supabase } from './auth.js';
import { getProfile, updateProfile, getCouple, getCoupleMembers, createInvite } from './api.js';
import { renderSidebar, renderMobileTabs, showToast, showConfirm } from './ui.js';
import { APP_BASE_URL } from './config.js';

// ── Init ──
const session = await requireAuth();
if (!session) throw new Error('Not authenticated');

const user = getUser(session);
const profile = await getProfile(user.id);

renderSidebar('settings', user);
renderMobileTabs('settings');
document.getElementById('signOutBtn')?.addEventListener('click', signOut);

// ── Populate Profile ──
document.getElementById('settingsName').value = profile?.display_name || '';
document.getElementById('settingsEmail').value = user.email || '';
document.getElementById('settingsPhone').value = profile?.phone || '';

// ── Save Profile ──
document.getElementById('saveProfileBtn').addEventListener('click', async () => {
  const name = document.getElementById('settingsName').value.trim();
  const phone = document.getElementById('settingsPhone').value.trim();

  const { error } = await updateProfile(user.id, {
    display_name: name,
    phone: phone
  });

  if (error) {
    showToast('Could not save. Please try again.', 'error');
    return;
  }
  showToast('Profile updated!');
});

// ── Partner Section ──
async function renderPartnerSection() {
  const container = document.getElementById('partnerStatus');

  if (!profile?.couple_id) {
    container.innerHTML = `
      <p style="color:var(--text-soft);font-size:.9rem;margin-bottom:16px">
        You haven't set up a couple profile yet.
      </p>
      <a href="./dashboard.html" class="btn-primary btn-small">Set Up Profile</a>
    `;
    return;
  }

  const couple = await getCouple(profile.couple_id);
  const members = await getCoupleMembers(profile.couple_id);
  const partner = members.find(m => m.id !== user.id);

  if (partner) {
    // Partner connected
    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;padding:16px;background:rgba(0,184,148,.08);border:1px solid rgba(0,184,148,.2);border-radius:14px;margin-bottom:16px">
        <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--rose),var(--rose-deep));display:flex;align-items:center;justify-content:center;color:white;font-weight:700;flex-shrink:0">
          ${(partner.display_name || partner.email || '?')[0].toUpperCase()}
        </div>
        <div>
          <div style="font-weight:600;font-size:.95rem">${partner.display_name || 'Partner'}</div>
          <div style="font-size:.82rem;color:var(--text-muted)">${partner.email || ''}</div>
        </div>
        <span class="badge badge-delivered" style="margin-left:auto">Connected</span>
      </div>
    `;
  } else {
    // No partner yet, show invite options
    const inviteCode = couple?.invite_code || generateCode();

    container.innerHTML = `
      <p style="color:var(--text-soft);font-size:.9rem;margin-bottom:20px">
        Invite your partner so you both can view and manage your date plans together.
      </p>

      <div class="form-group">
        <label>Send invite via email</label>
        <div style="display:flex;gap:8px">
          <input type="email" class="form-input" id="inviteEmail" placeholder="partner@email.com" style="flex:1">
          <button class="btn-primary btn-small" id="sendInviteBtn">Send</button>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:16px;margin:20px 0;color:var(--text-muted);font-size:.8rem">
        <span style="flex:1;height:1px;background:var(--glass-border)"></span>
        or share a link
        <span style="flex:1;height:1px;background:var(--glass-border)"></span>
      </div>

      <div style="display:flex;gap:8px;align-items:center">
        <input type="text" class="form-input" id="inviteLink" value="${APP_BASE_URL}/invite.html?code=${inviteCode}" readonly style="font-size:.82rem;flex:1">
        <button class="btn-ghost btn-small" id="copyLinkBtn">Copy</button>
      </div>
      <div class="form-hint">This link expires in 7 days.</div>
    `;

    // Send invite email
    document.getElementById('sendInviteBtn')?.addEventListener('click', async () => {
      const email = document.getElementById('inviteEmail').value.trim();
      if (!email) { showToast('Enter an email address.', 'error'); return; }

      const { error } = await createInvite(profile.couple_id, user.id, email, inviteCode);
      if (error) { showToast('Could not send invite. Try again.', 'error'); return; }

      showToast(`Invite sent to ${email}!`);
    });

    // Copy link
    document.getElementById('copyLinkBtn')?.addEventListener('click', () => {
      const link = document.getElementById('inviteLink').value;
      navigator.clipboard.writeText(link);
      showToast('Invite link copied!');
      document.getElementById('copyLinkBtn').textContent = 'Copied!';
      setTimeout(() => { document.getElementById('copyLinkBtn').textContent = 'Copy'; }, 2000);
    });
  }
}

await renderPartnerSection();

// ── Subscription ──
if (profile?.subscription_status === 'active') {
  document.getElementById('subStatus').textContent = `Active until ${profile.subscription_expires_at || 'N/A'}`;
}

// ── Sign Out ──
document.getElementById('signOutBtn')?.addEventListener('click', signOut);

// ── Delete Account ──
document.getElementById('deleteAccountBtn')?.addEventListener('click', () => {
  showConfirm(
    'Delete Account',
    'This will permanently delete your account and all associated data. This cannot be undone.',
    async () => {
      // For now, just sign out. Full deletion requires admin API.
      showToast('Please contact support@dateflo.com to complete account deletion.', 'info');
      setTimeout(signOut, 2000);
    }
  );
});

// ── Helper ──
function generateCode() {
  return Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
