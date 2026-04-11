// ═══════════════════════════════════════════════════════
// FundScan UK — Toast Notification System
// Lightweight, stackable, auto-dismiss toasts
// ═══════════════════════════════════════════════════════

let toastContainer = null;

function ensureContainer() {
    if (toastContainer && document.body.contains(toastContainer)) return;
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastContainer);
}

/**
 * Show a toast notification
 * @param {string} message — The toast text
 * @param {'success'|'info'|'warning'|'error'} type — Colour variant
 * @param {number} duration — Auto-dismiss in ms (default 3000)
 */
export function showToast(message, type = 'success', duration = 3000) {
    ensureContainer();

    const icons = { success: '✅', info: 'ℹ️', warning: '⚠️', error: '❌' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || '✅'}</span>
        <span class="toast-message">${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => toast.classList.add('show'));

    // Auto-dismiss
    const timer = setTimeout(() => dismissToast(toast), duration);

    // Click to dismiss
    toast.addEventListener('click', () => {
        clearTimeout(timer);
        dismissToast(toast);
    });
}

function dismissToast(toast) {
    toast.classList.remove('show');
    toast.classList.add('hide');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    // Fallback removal
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400);
}
