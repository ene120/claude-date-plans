import { requireAuth, getUser, signOut } from './auth.js';
import { getProfile, getPreferences, upsertPreferences } from './api.js';
import { renderSidebar, renderMobileTabs, showToast } from './ui.js';

// ── Init ──
const session = await requireAuth();
if (!session) throw new Error('Not authenticated');

const user = getUser(session);
const profile = await getProfile(user.id);

renderSidebar('preferences', user);
renderMobileTabs('preferences');
document.getElementById('signOutBtn')?.addEventListener('click', signOut);

if (!profile?.couple_id) {
  showToast('Please complete your profile setup first.', 'info');
  window.location.href = './dashboard.html';
  throw new Error('No couple');
}

// ── Load Preferences ──
let prefs = await getPreferences(profile.couple_id) || {};

// Map of view element IDs to pref fields
const fieldMap = {
  viewName1: 'partner1_name',
  viewName2: 'partner2_name',
  viewStage: 'relationship_stage',
  viewCity: 'city',
  viewBudget: 'budget',
  viewActivity: 'activity_level',
  viewTransport: 'transport',
  viewFood1Likes: 'food1_likes',
  viewFood1Dislikes: 'food1_dislikes',
  viewFood1Allergies: 'food1_allergies',
  viewFood2Likes: 'food2_likes',
  viewFood2Dislikes: 'food2_dislikes',
  viewFood2Allergies: 'food2_allergies',
  viewVibes: 'vibes',
  viewDealbreakers: 'dealbreakers',
  viewLoveLangs1: 'love_langs1',
  viewLoveLangs2: 'love_langs2',
  viewAccessibility: 'accessibility',
  viewSurprise: 'surprise_pref',
  viewNotes: 'extra_notes',
};

// Friendly labels
const labels = {
  dating: 'Dating',
  exclusive: 'Exclusive',
  engaged: 'Engaged',
  married: 'Married',
  long_term: 'Long Term',
  free: 'Free / No Cost',
  low: '$1 to $50',
  mid: '$50 to $150',
  high: '$150 to $300',
  luxury: '$300+',
  chill: 'Chill & Relaxed',
  moderate: 'Moderate',
  active: 'Active & Adventurous',
  car: 'Driving',
  rideshare: 'Rideshare (Uber/Lyft)',
  public: 'Public Transit',
  walking: 'Walking / Biking',
  full_surprise: "Full surprise (don't tell us anything)",
  partial: 'Give us the general idea',
  no_surprise: 'We want to know everything ahead of time',
};

function populateView() {
  for (const [elId, field] of Object.entries(fieldMap)) {
    const el = document.getElementById(elId);
    if (!el) continue;
    const val = prefs[field];
    if (val && val.length > 0) {
      // Check if it's an array (vibes)
      if (Array.isArray(val)) {
        el.textContent = val.map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ');
      } else {
        el.textContent = labels[val] || val;
      }
    } else {
      el.textContent = field.includes('allerg') ? 'None' : 'Not set';
    }
  }

  // Update food section titles with names
  if (prefs.partner1_name) {
    document.getElementById('food1Title').textContent = `${prefs.partner1_name}'s Food Preferences`;
  }
  if (prefs.partner2_name) {
    document.getElementById('food2Title').textContent = `${prefs.partner2_name}'s Food Preferences`;
  }
}

function populateEditFields() {
  // Text inputs
  const textMap = {
    editName1: 'partner1_name',
    editName2: 'partner2_name',
    editCity: 'city',
    editFood1Likes: 'food1_likes',
    editFood1Dislikes: 'food1_dislikes',
    editFood1Allergies: 'food1_allergies',
    editFood2Likes: 'food2_likes',
    editFood2Dislikes: 'food2_dislikes',
    editFood2Allergies: 'food2_allergies',
    editDealbreakers: 'dealbreakers',
    editLoveLangs1: 'love_langs1',
    editLoveLangs2: 'love_langs2',
    editAccessibility: 'accessibility',
    editNotes: 'extra_notes',
  };

  for (const [elId, field] of Object.entries(textMap)) {
    const el = document.getElementById(elId);
    if (el && prefs[field]) el.value = prefs[field];
  }

  // Selects
  const selectMap = {
    editStage: 'relationship_stage',
    editBudget: 'budget',
    editActivity: 'activity_level',
    editTransport: 'transport',
    editSurprise: 'surprise_pref',
  };

  for (const [elId, field] of Object.entries(selectMap)) {
    const el = document.getElementById(elId);
    if (el && prefs[field]) el.value = prefs[field];
  }

  // Vibe chips
  const vibes = prefs.vibes || [];
  document.querySelectorAll('#vibeChips .chip').forEach(chip => {
    const vibe = chip.dataset.vibe;
    if (vibes.includes(vibe)) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
}

populateView();
populateEditFields();

// ── Vibe Chip Clicks ──
document.querySelectorAll('#vibeChips .chip').forEach(chip => {
  chip.addEventListener('click', () => chip.classList.toggle('active'));
});

// ── Section Edit/Save/Cancel ──
window.toggleEdit = function(section) {
  const el = document.getElementById('section' + section);
  el.classList.toggle('section-editing');
  populateEditFields();
};

window.cancelEdit = function(section) {
  document.getElementById('section' + section).classList.remove('section-editing');
};

window.saveSection = async function(section) {
  let updates = {};

  switch (section) {
    case 'About':
      updates = {
        partner1_name: document.getElementById('editName1').value.trim(),
        partner2_name: document.getElementById('editName2').value.trim(),
        relationship_stage: document.getElementById('editStage').value,
      };
      break;
    case 'Logistics':
      updates = {
        city: document.getElementById('editCity').value.trim(),
        budget: document.getElementById('editBudget').value,
        activity_level: document.getElementById('editActivity').value,
        transport: document.getElementById('editTransport').value,
      };
      break;
    case 'Food1':
      updates = {
        food1_likes: document.getElementById('editFood1Likes').value.trim(),
        food1_dislikes: document.getElementById('editFood1Dislikes').value.trim(),
        food1_allergies: document.getElementById('editFood1Allergies').value.trim(),
      };
      break;
    case 'Food2':
      updates = {
        food2_likes: document.getElementById('editFood2Likes').value.trim(),
        food2_dislikes: document.getElementById('editFood2Dislikes').value.trim(),
        food2_allergies: document.getElementById('editFood2Allergies').value.trim(),
      };
      break;
    case 'Vibes':
      const selectedVibes = [];
      document.querySelectorAll('#vibeChips .chip.active').forEach(c => {
        selectedVibes.push(c.dataset.vibe);
      });
      updates = {
        vibes: selectedVibes,
        dealbreakers: document.getElementById('editDealbreakers').value.trim(),
      };
      break;
    case 'Additional':
      updates = {
        love_langs1: document.getElementById('editLoveLangs1').value.trim(),
        love_langs2: document.getElementById('editLoveLangs2').value.trim(),
        accessibility: document.getElementById('editAccessibility').value.trim(),
        surprise_pref: document.getElementById('editSurprise').value,
        extra_notes: document.getElementById('editNotes').value.trim(),
      };
      break;
  }

  const { error } = await upsertPreferences(profile.couple_id, updates);

  if (error) {
    showToast('Could not save. Please try again.', 'error');
    return;
  }

  // Update local prefs
  prefs = { ...prefs, ...updates };
  populateView();
  document.getElementById('section' + section).classList.remove('section-editing');
  showToast('Preferences saved!');
};
