import { requireAuth, getUser, signOut } from './auth.js';
import { getProfile, getPreferences, createPlanRequest } from './api.js';
import { renderSidebar, renderMobileTabs, showToast, formatDate, formatTime } from './ui.js';
import { SHEET_URL } from './config.js';

// ── Init ──
const session = await requireAuth();
if (!session) throw new Error('Not authenticated');

const user = getUser(session);
const profile = await getProfile(user.id);

renderSidebar('request', user);
renderMobileTabs('request');
document.getElementById('signOutBtn')?.addEventListener('click', signOut);

if (!profile?.couple_id) {
  showToast('Please complete your profile setup first.', 'info');
  window.location.href = './dashboard.html';
  throw new Error('No couple');
}

// ── Pre fill from Preferences ──
const prefs = await getPreferences(profile.couple_id);

if (prefs) {
  if (prefs.city) document.getElementById('reqCity').value = prefs.city;

  // Pre select budget
  if (prefs.budget) {
    const budgetCard = document.querySelector(`#budgetChoices .choice[data-value="${prefs.budget}"]`);
    if (budgetCard) budgetCard.classList.add('selected');
  }

  // Pre select activity
  if (prefs.activity_level) {
    const actCard = document.querySelector(`#activityChoices .choice[data-value="${prefs.activity_level}"]`);
    if (actCard) actCard.classList.add('selected');
  }
}

// ── Form State ──
let currentPage = 1;
const formState = {
  budget: prefs?.budget || '',
  activity: prefs?.activity_level || '',
};

// ── Choice Cards ──
window.selectChoice = function(el, field) {
  el.closest('.choices').querySelectorAll('.choice').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  formState[field] = el.dataset.value;
};

// ── Page Navigation ──
window.nextPage = function(page) {
  // Validate current page
  if (currentPage === 1) {
    const date = document.getElementById('reqDate').value;
    const time = document.getElementById('reqTime').value;
    const city = document.getElementById('reqCity').value.trim();
    if (!date || !time || !city) {
      showToast('Please fill in date, time, and city.', 'error');
      return;
    }
  }

  // If going to review page, build summary
  if (page === 4) buildReview();

  document.getElementById('page' + currentPage).classList.remove('active');
  document.getElementById('page' + page).classList.add('active');
  currentPage = page;

  // Update progress
  const progress = (page / 4) * 100;
  document.getElementById('progressFill').style.width = progress + '%';

  window.scrollTo(0, 0);
};

window.prevPage = function(page) {
  document.getElementById('page' + currentPage).classList.remove('active');
  document.getElementById('page' + page).classList.add('active');
  currentPage = page;

  const progress = (page / 4) * 100;
  document.getElementById('progressFill').style.width = progress + '%';
};

// ── Build Review ──
function buildReview() {
  const budgetLabels = {
    free: 'Free', low: '$1 to $50', mid: '$50 to $150',
    high: '$150 to $300', luxury: '$300+'
  };
  const activityLabels = {
    chill: 'Chill & Relaxed', moderate: 'Moderate', active: 'Active & Adventurous'
  };

  const summary = document.getElementById('reviewSummary');
  summary.innerHTML = `
    <div style="display:grid;gap:16px">
      <div>
        <div style="font-size:.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Occasion</div>
        <div style="font-size:.9rem;color:var(--text-soft)">${document.getElementById('reqOccasion').value || 'Not specified'}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div>
          <div style="font-size:.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Date</div>
          <div style="font-size:.9rem;color:var(--text-soft)">${formatDate(document.getElementById('reqDate').value)}</div>
        </div>
        <div>
          <div style="font-size:.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Time</div>
          <div style="font-size:.9rem;color:var(--text-soft)">${formatTime(document.getElementById('reqTime').value)}</div>
        </div>
      </div>
      <div>
        <div style="font-size:.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">City</div>
        <div style="font-size:.9rem;color:var(--text-soft)">${document.getElementById('reqCity').value}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div>
          <div style="font-size:.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Budget</div>
          <div style="font-size:.9rem;color:var(--text-soft)">${budgetLabels[formState.budget] || 'Not specified'}</div>
        </div>
        <div>
          <div style="font-size:.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Activity</div>
          <div style="font-size:.9rem;color:var(--text-soft)">${activityLabels[formState.activity] || 'Not specified'}</div>
        </div>
      </div>
      ${document.getElementById('reqSpots').value.trim() ? `
        <div>
          <div style="font-size:.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Specific Spots</div>
          <div style="font-size:.9rem;color:var(--text-soft)">${document.getElementById('reqSpots').value.trim()}</div>
        </div>
      ` : ''}
      ${document.getElementById('reqNotes').value.trim() ? `
        <div>
          <div style="font-size:.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Notes</div>
          <div style="font-size:.9rem;color:var(--text-soft)">${document.getElementById('reqNotes').value.trim()}</div>
        </div>
      ` : ''}
    </div>
  `;
}

// ── Submit ──
window.submitRequest = async function() {
  const btn = document.getElementById('submitRequestBtn');
  btn.disabled = true;
  btn.textContent = 'Submitting...';

  const formData = {
    occasion: document.getElementById('reqOccasion').value,
    date: document.getElementById('reqDate').value,
    time: document.getElementById('reqTime').value,
    city: document.getElementById('reqCity').value.trim(),
    budget: formState.budget,
    activity_level: formState.activity,
    specific_spots: document.getElementById('reqSpots').value.trim(),
    extra_notes: document.getElementById('reqNotes').value.trim(),
    // Include saved preferences
    preferences: prefs || {},
    submitted_by: user.email,
    submitted_at: new Date().toISOString(),
  };

  // Submit to Supabase
  const { error } = await createPlanRequest(profile.couple_id, user.id, formData);

  // Also submit to Google Sheets as backup
  try {
    const sheetData = new FormData();
    sheetData.append('type', 'dashboard_request');
    sheetData.append('email', user.email);
    sheetData.append('data', JSON.stringify(formData));
    fetch(SHEET_URL, { method: 'POST', body: sheetData }).catch(() => {});
  } catch (e) {
    // Non critical
  }

  if (error) {
    showToast('Something went wrong. Please try again.', 'error');
    btn.disabled = false;
    btn.innerHTML = 'Submit Request &rarr;';
    return;
  }

  // Show success
  document.getElementById('page4').classList.remove('active');
  document.getElementById('pageSuccess').classList.add('active');
  document.getElementById('progressFill').style.width = '100%';
};
