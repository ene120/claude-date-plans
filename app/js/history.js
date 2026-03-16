import { requireAuth, getUser, signOut } from './auth.js';
import { getProfile, getPlans } from './api.js';
import { renderSidebar, renderMobileTabs, formatDate, statusBadge } from './ui.js';

// ── Init ──
const session = await requireAuth();
if (!session) throw new Error('Not authenticated');

const user = getUser(session);
const profile = await getProfile(user.id);

renderSidebar('history', user);
renderMobileTabs('history');
document.getElementById('signOutBtn')?.addEventListener('click', signOut);

if (!profile?.couple_id) {
  window.location.href = './dashboard.html';
  throw new Error('No couple');
}

// ── Load Plans as Timeline ──
const plans = await getPlans(profile.couple_id);

const timeline = document.getElementById('timeline');
const empty = document.getElementById('emptyHistory');

if (plans.length === 0) {
  timeline.style.display = 'none';
  empty.classList.remove('hidden');
} else {
  empty.classList.add('hidden');

  // Sort by date_day (upcoming first, then past)
  const now = new Date();
  const sorted = [...plans].sort((a, b) => {
    const da = a.date_day ? new Date(a.date_day + 'T00:00:00') : new Date(a.created_at);
    const db = b.date_day ? new Date(b.date_day + 'T00:00:00') : new Date(b.created_at);
    return db - da; // newest first
  });

  timeline.innerHTML = sorted.map(plan => {
    const planDate = plan.date_day ? new Date(plan.date_day + 'T00:00:00') : null;
    const isPast = planDate && planDate < now;
    const dotClass = isPast ? 'completed' : (plan.status === 'delivered' ? 'upcoming' : '');

    return `
      <div class="timeline-item fade-in">
        <div class="timeline-dot ${dotClass}"></div>
        <a href="./plan.html?id=${plan.id}" class="timeline-card">
          <div class="timeline-date">
            ${plan.date_day ? formatDate(plan.date_day) : 'Date TBD'}
            ${statusBadge(plan.status)}
          </div>
          <div class="timeline-title">${plan.title || 'Untitled Plan'}</div>
          ${plan.city ? `<div class="timeline-city">📍 ${plan.city}</div>` : ''}
        </a>
      </div>
    `;
  }).join('');
}
