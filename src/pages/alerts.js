// ═══════════════════════════════════════════════════════
// FundScan UK — Alerts Page
// Weekly scan results, new opportunities, deadlines
// ═══════════════════════════════════════════════════════

import { fundingSources, formatAmount, daysUntil } from '../data/funding-sources.js';
import { getProfile, getLastVisit, setLastVisit, getLastScan, setLastScan } from '../store.js';
import { calculateMatchScore, getMatchLevel } from '../match-engine.js';

export function renderAlerts() {
    const profile = getProfile();
    const lastVisit = getLastVisit();
    const lastScan = getLastScan();

    // Mark current visit
    setLastVisit();

    // Categorize alerts
    const newOpportunities = fundingSources.filter(f => {
        if (!lastVisit) return f.status === 'open' || f.status === 'upcoming';
        return new Date(f.lastUpdated) > new Date(lastVisit);
    });

    const closingSoon = fundingSources
        .filter(f => {
            const days = daysUntil(f.closeDate);
            return f.status === 'open' && days > 0 && days <= 30;
        })
        .sort((a, b) => daysUntil(a.closeDate) - daysUntil(b.closeDate));

    const closingMonth = fundingSources
        .filter(f => {
            const days = daysUntil(f.closeDate);
            return f.status === 'open' && days > 30 && days <= 60;
        })
        .sort((a, b) => daysUntil(a.closeDate) - daysUntil(b.closeDate));

    const upcoming = fundingSources
        .filter(f => f.status === 'upcoming')
        .sort((a, b) => new Date(a.openDate) - new Date(b.openDate));

    const totalAlerts = newOpportunities.length + closingSoon.length;

    const lastScanText = lastScan
        ? new Date(lastScan).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        : 'Never';

    return `
    <div class="container" style="max-width:900px;">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:var(--space-md); margin-bottom:var(--space-xl);">
        <div>
          <h1 style="font-size:var(--font-3xl); font-weight:800; letter-spacing:-0.02em;">
            📢 Alerts & Updates
          </h1>
          <p style="color:var(--text-secondary); font-size:var(--font-sm); margin-top:4px;">
            Stay on top of new opportunities and deadlines
          </p>
        </div>
        <div style="display:flex; align-items:center; gap:var(--space-md);">
          <div class="scan-indicator" id="alert-scan-indicator">
            <span class="scan-dot"></span>
            <span>Last scan: ${lastScanText}</span>
          </div>
          <button class="btn btn-primary" id="alert-scan-btn">⚡ Scan Now</button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="stats-row" style="margin-bottom:var(--space-xl);">
        <div class="card stat-card">
          <div class="stat-number" style="${newOpportunities.length > 0 ? 'background:linear-gradient(135deg,#6366f1,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;' : ''}">${newOpportunities.length}</div>
          <div class="stat-label">New / Updated</div>
        </div>
        <div class="card stat-card">
          <div class="stat-number" style="${closingSoon.length > 0 ? 'background:linear-gradient(135deg,#f59e0b,#ef4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;' : ''}">${closingSoon.length}</div>
          <div class="stat-label">Closing in 30 Days</div>
        </div>
        <div class="card stat-card">
          <div class="stat-number">${upcoming.length}</div>
          <div class="stat-label">Opening Soon</div>
        </div>
      </div>

      <!-- Deadline Warnings -->
      ${closingSoon.length > 0 ? `
      <div class="card" style="margin-bottom:var(--space-lg); border-color:rgba(245,158,11,0.3);">
        <div class="section-header" style="margin-bottom:var(--space-md);">
          <h2 class="section-title" style="color:var(--accent-warning);">⚠️ Deadline Warnings</h2>
        </div>
        ${closingSoon.map(f => {
        const days = daysUntil(f.closeDate);
        const score = profile ? calculateMatchScore(f, profile) : 0;
        return `
          <div class="alert-item" style="cursor:pointer;" onclick="window.location.hash='/detail/${f.id}'">
            <div class="alert-icon deadline" style="color:var(--accent-warning);">⏰</div>
            <div class="alert-content">
              <div class="alert-title">
                ${f.name}
                ${score >= 60 ? `<span class="match-badge high" style="display:inline-flex; vertical-align:middle; margin-left:8px;">🎯 ${score}%</span>` : ''}
              </div>
              <div class="alert-desc">${f.provider} · ${formatAmount(f.amountMin, f.amountMax)}</div>
            </div>
            <div class="alert-time" style="color:var(--accent-warning); font-weight:700;">
              ${days} day${days !== 1 ? 's' : ''} left
            </div>
          </div>`;
    }).join('')}
      </div>` : ''}

      <!-- Closing Within 60 Days -->
      ${closingMonth.length > 0 ? `
      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="section-header" style="margin-bottom:var(--space-md);">
          <h2 class="section-title">📅 Closing Within 60 Days</h2>
        </div>
        ${closingMonth.map(f => {
        const days = daysUntil(f.closeDate);
        const score = profile ? calculateMatchScore(f, profile) : 0;
        return `
          <div class="alert-item" style="cursor:pointer;" onclick="window.location.hash='/detail/${f.id}'">
            <div class="alert-icon deadline" style="color:var(--accent-secondary);">📅</div>
            <div class="alert-content">
              <div class="alert-title">${f.name}</div>
              <div class="alert-desc">${f.provider} · ${formatAmount(f.amountMin, f.amountMax)}</div>
            </div>
            <div class="alert-time">${days} days</div>
          </div>`;
    }).join('')}
      </div>` : ''}

      <!-- New / Updated -->
      ${newOpportunities.length > 0 ? `
      <div class="card" style="margin-bottom:var(--space-lg);">
        <div class="section-header" style="margin-bottom:var(--space-md);">
          <h2 class="section-title">🆕 New & Updated Opportunities</h2>
        </div>
        ${newOpportunities.map(f => {
        const score = profile ? calculateMatchScore(f, profile) : 0;
        return `
          <div class="alert-item" style="cursor:pointer;" onclick="window.location.hash='/detail/${f.id}'">
            <div class="alert-icon new" style="color:var(--accent-primary-light);">✨</div>
            <div class="alert-content">
              <div class="alert-title">
                ${f.name}
                <span class="new-badge">New</span>
              </div>
              <div class="alert-desc">${f.provider} · ${formatAmount(f.amountMin, f.amountMax)} · ${f.status === 'open' ? '🟢 Open' : '🔵 Upcoming'}</div>
            </div>
            <div class="alert-time">${new Date(f.lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
          </div>`;
    }).join('')}
      </div>` : ''}

      <!-- Upcoming -->
      ${upcoming.length > 0 ? `
      <div class="card">
        <div class="section-header" style="margin-bottom:var(--space-md);">
          <h2 class="section-title">🔮 Coming Soon</h2>
        </div>
        ${upcoming.map(f => `
          <div class="alert-item" style="cursor:pointer;" onclick="window.location.hash='/detail/${f.id}'">
            <div class="alert-icon" style="background:rgba(139,92,246,0.15); color:var(--accent-tertiary);">🔮</div>
            <div class="alert-content">
              <div class="alert-title">${f.name}</div>
              <div class="alert-desc">${f.provider} · ${formatAmount(f.amountMin, f.amountMax)}</div>
            </div>
            <div class="alert-time">Opens ${new Date(f.openDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
          </div>
        `).join('')}
      </div>` : ''}
    </div>
  `;
}

export function afterRenderAlerts() {
    const btn = document.getElementById('alert-scan-btn');
    const indicator = document.getElementById('alert-scan-indicator');

    if (btn) {
        btn.addEventListener('click', () => {
            if (indicator) indicator.classList.add('scanning');
            btn.disabled = true;
            btn.textContent = '⚡ Scanning...';

            setTimeout(() => {
                setLastScan();
                if (indicator) {
                    indicator.classList.remove('scanning');
                    indicator.innerHTML = `<span class="scan-dot"></span><span>Last scan: Just now</span>`;
                }
                btn.disabled = false;
                btn.textContent = '⚡ Scan Now';
            }, 2000);
        });
    }
}
