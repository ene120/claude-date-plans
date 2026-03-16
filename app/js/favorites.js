import { requireAuth, getUser, signOut } from './auth.js';
import { getProfile, getFavorites, addFavorite, deleteFavorite } from './api.js';
import { renderSidebar, renderMobileTabs, showToast, showConfirm } from './ui.js';

// ── Init ──
const session = await requireAuth();
if (!session) throw new Error('Not authenticated');

const user = getUser(session);
const profile = await getProfile(user.id);

renderSidebar('favorites', user);
renderMobileTabs('favorites');
document.getElementById('signOutBtn')?.addEventListener('click', signOut);

// ── Load Favorites ──
let favorites = [];

async function loadFavorites() {
  favorites = await getFavorites(user.id);
  render();
}

function render() {
  const grid = document.getElementById('favGrid');
  const empty = document.getElementById('emptyFavs');
  const fab = document.getElementById('fabWrap');

  if (favorites.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    fab.style.display = 'none';
    return;
  }

  empty.classList.add('hidden');
  fab.style.display = 'block';

  const typeLabels = {
    restaurant: 'Restaurant',
    bar: 'Bar',
    activity: 'Activity',
    park: 'Park',
    other: 'Other'
  };

  grid.innerHTML = favorites.map(fav => `
    <div class="fav-card fade-in" data-id="${fav.id}">
      <div class="fav-card-header">
        <div class="fav-card-name">${fav.venue_name}</div>
        <span class="fav-card-type">${typeLabels[fav.venue_type] || fav.venue_type}</span>
      </div>
      ${fav.city ? `<div class="fav-card-city">📍 ${fav.city}</div>` : ''}
      ${fav.notes ? `<div class="fav-card-notes">${fav.notes}</div>` : ''}
      <div class="fav-card-actions">
        ${fav.google_maps_url ? `<a href="${fav.google_maps_url}" target="_blank" class="map-btn map-btn-google" title="Google Maps"><img src="assets/google-logo.png" alt="Google Maps" onerror="this.parentElement.textContent='G'"></a>` : ''}
        ${fav.apple_maps_url ? `<a href="${fav.apple_maps_url}" target="_blank" class="map-btn map-btn-apple" title="Apple Maps"><img src="assets/apple-logo-white.png" alt="Apple Maps" onerror="this.parentElement.textContent='A'"></a>` : ''}
        <button class="btn-icon" style="margin-left:auto" title="Delete" onclick="removeFav('${fav.id}', '${fav.venue_name.replace(/'/g, "\\'")}')">🗑️</button>
      </div>
      ${fav.plans?.title ? `<div class="fav-card-source">From: <a href="./plan.html?id=${fav.source_plan_id}">${fav.plans.title}</a></div>` : ''}
    </div>
  `).join('');
}

// ── Delete ──
window.removeFav = function(id, name) {
  showConfirm(
    'Remove Venue',
    `Are you sure you want to remove "${name}" from your favorites?`,
    async () => {
      const { error } = await deleteFavorite(id);
      if (error) { showToast('Could not remove. Try again.', 'error'); return; }
      showToast('Venue removed.');
      await loadFavorites();
    }
  );
};

// ── Add Venue Modal ──
const modal = document.getElementById('favModal');

function openModal() {
  document.getElementById('favModalTitle').textContent = 'Add a Venue';
  modal.classList.add('open');
}

function closeModal() {
  modal.classList.remove('open');
  // Clear form
  ['favName','favCity','favAddress','favGoogleUrl','favAppleUrl','favNotes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('favType').value = 'restaurant';
}

document.getElementById('openAddModal')?.addEventListener('click', openModal);
document.getElementById('addFavBtn')?.addEventListener('click', openModal);
document.getElementById('closeFavModal')?.addEventListener('click', closeModal);
document.getElementById('cancelFavBtn')?.addEventListener('click', closeModal);
modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

document.getElementById('saveFavBtn')?.addEventListener('click', async () => {
  const name = document.getElementById('favName').value.trim();
  if (!name) { showToast('Please enter a venue name.', 'error'); return; }

  const favorite = {
    profile_id: user.id,
    couple_id: profile?.couple_id,
    venue_name: name,
    venue_type: document.getElementById('favType').value,
    city: document.getElementById('favCity').value.trim(),
    address: document.getElementById('favAddress').value.trim(),
    google_maps_url: document.getElementById('favGoogleUrl').value.trim(),
    apple_maps_url: document.getElementById('favAppleUrl').value.trim(),
    notes: document.getElementById('favNotes').value.trim(),
  };

  const { error } = await addFavorite(favorite);
  if (error) { showToast('Could not save. Try again.', 'error'); return; }

  showToast('Venue added to favorites!');
  closeModal();
  await loadFavorites();
});

// ── Initial Load ──
await loadFavorites();
