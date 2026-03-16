import { getSession, sendMagicLink, getUser } from './auth.js';
import { acceptInvite } from './api.js';
import { showToast } from './ui.js';

// ── Get invite code from URL ──
const params = new URLSearchParams(window.location.search);
const code = params.get('code');

const loadingEl = document.getElementById('inviteLoading');
const signInEl = document.getElementById('inviteSignIn');
const emailSentEl = document.getElementById('inviteEmailSent');
const successEl = document.getElementById('inviteSuccess');
const errorEl = document.getElementById('inviteError');

function showState(state) {
  [loadingEl, signInEl, emailSentEl, successEl, errorEl].forEach(el => el.classList.add('hidden'));
  state.classList.remove('hidden');
}

if (!code) {
  showState(errorEl);
  document.getElementById('inviteErrorMsg').textContent =
    'No invite code found in the URL. Please check the link your partner sent.';
} else {
  // Check if user is already signed in
  const session = await getSession();

  if (session) {
    // Already signed in, try to accept invite
    const { error } = await acceptInvite(code);
    if (error) {
      showState(errorEl);
      document.getElementById('inviteErrorMsg').textContent =
        'This invite code is invalid or has already been used. Ask your partner to send a new one.';
    } else {
      showState(successEl);
    }
  } else {
    // Not signed in, show email form
    showState(signInEl);
  }
}

// ── Send Magic Link ──
document.getElementById('inviteSendLink')?.addEventListener('click', async () => {
  const email = document.getElementById('inviteEmail').value.trim();
  if (!email) { showToast('Please enter your email.', 'error'); return; }

  const btn = document.getElementById('inviteSendLink');
  btn.disabled = true;
  btn.textContent = 'Sending...';

  // Store invite code for after sign in
  localStorage.setItem('dateflo_invite_code', code);

  const { error } = await sendMagicLink(email);

  if (error) {
    showToast('Something went wrong. Please try again.', 'error');
    btn.disabled = false;
    btn.innerHTML = 'Sign In &amp; Join &rarr;';
    return;
  }

  showState(emailSentEl);
  document.getElementById('inviteSentEmail').textContent = email;
});

// Handle Enter key
document.getElementById('inviteEmail')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('inviteSendLink')?.click();
});
