// ── Toast Notifications ──
export function showToast(message, type = 'success') {
  // Remove existing toasts
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;

  const colors = {
    success: { bg: 'rgba(0,184,148,.15)', border: 'rgba(0,184,148,.3)', color: '#00b894' },
    error: { bg: 'rgba(214,48,49,.15)', border: 'rgba(214,48,49,.3)', color: '#ff6b6b' },
    info: { bg: 'rgba(116,185,255,.15)', border: 'rgba(116,185,255,.3)', color: '#74b9ff' },
  };
  const c = colors[type] || colors.success;

  toast.style.cssText = `
    position:fixed;top:24px;right:24px;z-index:200;
    padding:14px 24px;border-radius:14px;
    background:${c.bg};border:1px solid ${c.border};color:${c.color};
    font-size:.9rem;font-weight:600;
    animation:fadeIn .3s ease;
    max-width:400px;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity .3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Loading Overlay ──
export function showLoading(container) {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = '<div class="loading-spinner"></div>';
  overlay.style.cssText = `
    position:absolute;top:0;left:0;width:100%;height:100%;
    background:rgba(26,10,16,.8);backdrop-filter:blur(4px);
    display:flex;align-items:center;justify-content:center;
    z-index:50;border-radius:inherit;
  `;
  const spinner = overlay.querySelector('.loading-spinner');
  spinner.style.cssText = `
    width:36px;height:36px;border:3px solid rgba(255,255,255,.1);
    border-top-color:var(--rose);border-radius:50%;
    animation:spin .8s linear infinite;
  `;
  if (!document.getElementById('spin-style')) {
    const style = document.createElement('style');
    style.id = 'spin-style';
    style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(style);
  }
  container.style.position = 'relative';
  container.appendChild(overlay);
  return overlay;
}

export function hideLoading(overlay) {
  if (overlay) overlay.remove();
}

// ── Confirm Modal ──
export function showConfirm(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      <p style="color:var(--text-soft);font-size:.9rem;line-height:1.7">${message}</p>
      <div class="modal-actions">
        <button class="btn-ghost btn-small cancel-btn">Cancel</button>
        <button class="btn-danger confirm-btn">Confirm</button>
      </div>
    </div>
  `;
  overlay.querySelector('.cancel-btn').onclick = () => overlay.remove();
  overlay.querySelector('.confirm-btn').onclick = () => {
    overlay.remove();
    onConfirm();
  };
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
}

// ── Format Date ──
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ── Format Time ──
export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

// ── Get Initials ──
export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ── Render Sidebar ──
export function renderSidebar(activePage, user) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const pages = [
    { id: 'dashboard', icon: '📋', label: 'My Date Plans', href: './dashboard.html' },
    { id: 'request', icon: '➕', label: 'Request a Plan', href: './request.html' },
    { id: 'preferences', icon: '💕', label: 'Our Preferences', href: './preferences.html' },
    { id: 'favorites', icon: '⭐', label: 'Favorites', href: './favorites.html' },
    { id: 'history', icon: '🕐', label: 'Date History', href: './history.html' },
    { id: 'settings', icon: '⚙️', label: 'Settings', href: './settings.html' },
  ];

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';

  sidebar.innerHTML = `
    <div class="sidebar-logo">DateFlo</div>
    <nav class="sidebar-nav">
      ${pages.map(p => `
        <a href="${p.href}" class="nav-item ${p.id === activePage ? 'active' : ''}">
          <span class="nav-icon">${p.icon}</span>
          <span class="nav-label">${p.label}</span>
        </a>
      `).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="sidebar-avatar">${getInitials(displayName)}</div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">${displayName}</div>
          <div class="sidebar-user-email">${email}</div>
        </div>
      </div>
      <button class="nav-signout" id="signOutBtn">
        <span class="nav-icon">🚪</span>
        <span>Sign Out</span>
      </button>
    </div>
  `;
}

// ── Render Mobile Tabs ──
export function renderMobileTabs(activePage) {
  const tabs = document.getElementById('mobileTabs');
  if (!tabs) return;

  const items = [
    { id: 'dashboard', icon: '📋', label: 'Plans', href: './dashboard.html' },
    { id: 'request', icon: '➕', label: 'New', href: './request.html' },
    { id: 'preferences', icon: '💕', label: 'Prefs', href: './preferences.html' },
    { id: 'favorites', icon: '⭐', label: 'Favs', href: './favorites.html' },
    { id: 'settings', icon: '⚙️', label: 'Settings', href: './settings.html' },
  ];

  tabs.innerHTML = `
    <div class="mobile-tabs-inner">
      ${items.map(i => `
        <a href="${i.href}" class="tab-item ${i.id === activePage ? 'active' : ''}">
          <span class="tab-icon">${i.icon}</span>
          ${i.label}
        </a>
      `).join('')}
    </div>
  `;
}

// ── Status Badge HTML ──
export function statusBadge(status) {
  const map = {
    requested: { cls: 'badge-requested', label: 'Requested' },
    in_progress: { cls: 'badge-progress', label: 'In Progress' },
    delivered: { cls: 'badge-delivered', label: 'Delivered' },
    archived: { cls: 'badge-archived', label: 'Archived' },
  };
  const s = map[status] || map.requested;
  return `<span class="badge ${s.cls}">${s.label}</span>`;
}
