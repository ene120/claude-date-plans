import { requireAuth, getUser } from './auth.js';
import { getPlan, getProfile, addFavorite } from './api.js';
import { showToast } from './ui.js';

// ── Init ──
const session = await requireAuth();
if (!session) throw new Error('Not authenticated');

const user = getUser(session);
const profile = await getProfile(user.id);

// Get plan ID from URL
const params = new URLSearchParams(window.location.search);
const planId = params.get('id');

if (!planId) {
  window.location.href = './dashboard.html';
  throw new Error('No plan ID');
}

// Load plan
const plan = await getPlan(planId);

if (!plan) {
  showToast('Plan not found.', 'error');
  setTimeout(() => { window.location.href = './dashboard.html'; }, 1500);
  throw new Error('Plan not found');
}

// ── Render ──
document.title = `DateFlo | ${plan.title || 'View Plan'}`;
document.getElementById('planTitle').textContent = plan.title || 'Your Date Plan';

const frame = document.getElementById('planFrame');
const loading = document.getElementById('planLoading');

if (plan.plan_html) {
  // Use srcdoc for embedded HTML
  frame.srcdoc = plan.plan_html;
  frame.style.display = 'block';
  loading.style.display = 'none';
  document.getElementById('floatingActions').style.display = 'flex';

  // Auto resize iframe to content height
  frame.addEventListener('load', () => {
    try {
      const doc = frame.contentDocument || frame.contentWindow.document;
      const height = doc.documentElement.scrollHeight || doc.body.scrollHeight;
      frame.style.height = height + 40 + 'px';
    } catch (e) {
      // Cross origin, use fixed height
      frame.style.height = '2000px';
    }
  });
} else if (plan.plan_url) {
  // Legacy: use src URL
  frame.src = plan.plan_url;
  frame.style.display = 'block';
  frame.style.height = '2000px';
  loading.style.display = 'none';
  document.getElementById('floatingActions').style.display = 'flex';
} else {
  loading.innerHTML = `
    <div style="font-size:2rem;margin-bottom:12px">📋</div>
    <h3>Plan In Progress</h3>
    <p style="color:var(--text-soft);font-size:.9rem;margin-top:8px">
      Our team is still working on this plan. You'll get an email when it's ready.
    </p>
    <a href="./dashboard.html" class="btn-ghost" style="margin-top:24px;display:inline-flex">&larr; Back to Plans</a>
  `;
}

// ── Favorite Button ──
const favBtn = document.getElementById('favBtn');
favBtn.addEventListener('click', () => {
  favBtn.innerHTML = '&#9733;';
  favBtn.style.color = 'var(--gold)';
  showToast('Plan saved to favorites!');
});

// ── Share Button ──
document.getElementById('shareBtn').addEventListener('click', () => {
  if (navigator.share) {
    navigator.share({
      title: plan.title,
      text: `Check out our date plan: ${plan.title}`,
      url: window.location.href
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard!');
  }
});

// ── Save Venue Modal ──
const venueModal = document.getElementById('venueModal');
const closeVenueModal = document.getElementById('closeVenueModal');
const cancelVenueBtn = document.getElementById('cancelVenueBtn');
const saveVenuesBtn = document.getElementById('saveVenuesBtn');
const saveVenueBtn = document.getElementById('saveVenueBtn');

saveVenuesBtn?.addEventListener('click', () => {
  venueModal.classList.add('open');
});

closeVenueModal?.addEventListener('click', () => {
  venueModal.classList.remove('open');
});

cancelVenueBtn?.addEventListener('click', () => {
  venueModal.classList.remove('open');
});

venueModal?.addEventListener('click', (e) => {
  if (e.target === venueModal) venueModal.classList.remove('open');
});

saveVenueBtn?.addEventListener('click', async () => {
  const name = document.getElementById('venueName').value.trim();
  if (!name) { showToast('Please enter a venue name.', 'error'); return; }

  const favorite = {
    profile_id: user.id,
    couple_id: profile.couple_id,
    venue_name: name,
    venue_type: document.getElementById('venueType').value,
    address: document.getElementById('venueAddress').value.trim(),
    city: document.getElementById('venueCity').value.trim() || plan.city || '',
    google_maps_url: document.getElementById('venueGoogleUrl').value.trim(),
    notes: document.getElementById('venueNotes').value.trim(),
    source_plan_id: plan.id
  };

  const { error } = await addFavorite(favorite);
  if (error) {
    showToast('Could not save venue. Please try again.', 'error');
    return;
  }

  showToast('Venue saved to favorites!');
  venueModal.classList.remove('open');

  // Clear form
  document.getElementById('venueName').value = '';
  document.getElementById('venueAddress').value = '';
  document.getElementById('venueCity').value = '';
  document.getElementById('venueGoogleUrl').value = '';
  document.getElementById('venueNotes').value = '';
});
