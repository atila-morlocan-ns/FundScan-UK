// ═══════════════════════════════════════════════════════
// FundScan UK — Funding Calendar
// Visual timeline of upcoming funding deadlines
// ═══════════════════════════════════════════════════════

import { fundingSources, formatAmount, daysUntil } from '../data/funding-sources.js';
import { getProfile, isShortlisted } from '../store.js';
import { calculateMatchScore, getEffectiveStatus } from '../match-engine.js';
import { evaluateEligibility } from '../data/eligibility-rules.js';
import { renderEligibilityBadge } from '../components.js';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

let viewFilter = 'closing'; // closing | opening
let showOnlyEligible = false;
let showOnlyShortlisted = false;

export function renderCalendar() {
    const profile = getProfile();

    // Enrich all funds
    const enriched = fundingSources.map(f => {
        const matchScore = calculateMatchScore(f, profile);
        const eligibility = evaluateEligibility(f.id, profile);
        const effectiveStatus = getEffectiveStatus(f);
        const starred = isShortlisted(f.id);
        const closeDays = daysUntil(f.closeDate);
        const openDate = f.openDate ? new Date(f.openDate) : null;
        const closeDate = f.closeDate ? new Date(f.closeDate) : null;
        return { ...f, matchScore, eligibility, effectiveStatus, starred, closeDays, openDateObj: openDate, closeDateObj: closeDate };
    });

    // Filter
    let filtered = enriched;
    if (showOnlyEligible) filtered = filtered.filter(f => f.eligibility?.status === 'eligible');
    if (showOnlyShortlisted) filtered = filtered.filter(f => f.starred);

    // Group by month
    const grouped = groupByMonth(filtered, viewFilter);

    // Stats
    const today = new Date();
    const thisMonth = filtered.filter(f => {
        const d = viewFilter === 'closing' ? f.closeDateObj : f.openDateObj;
        return d && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
    const next30 = filtered.filter(f => {
        const d = viewFilter === 'closing' ? f.closeDateObj : f.openDateObj;
        if (!d) return false;
        const diff = (d - today) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 30;
    });
    const urgentCount = filtered.filter(f => f.closeDays > 0 && f.closeDays <= 14 && f.effectiveStatus === 'open').length;

    return `
    <div class="container" style="max-width:1100px;">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:var(--space-md); margin-bottom:var(--space-xl);">
        <div>
          <h1 style="font-size:var(--font-3xl); font-weight:800; letter-spacing:-0.02em;">
            📅 Funding Calendar
          </h1>
          <p style="color:var(--text-secondary); font-size:var(--font-sm); margin-top:4px;">
            Visual timeline of ${viewFilter === 'closing' ? 'closing deadlines' : 'opening dates'}
          </p>
        </div>
        <div style="display:flex; gap:var(--space-sm);">
          <a href="#/scanner" class="btn btn-secondary">🔍 Scanner</a>
          <a href="#/shortlist" class="btn btn-secondary">⭐ Shortlist</a>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row" style="margin-bottom:var(--space-lg);">
        <div class="card stat-card">
          <div class="stat-number">${filtered.length}</div>
          <div class="stat-label">Total Funds</div>
        </div>
        <div class="card stat-card">
          <div class="stat-number">${thisMonth.length}</div>
          <div class="stat-label">${viewFilter === 'closing' ? 'Closing' : 'Opening'} This Month</div>
        </div>
        <div class="card stat-card">
          <div class="stat-number">${next30.length}</div>
          <div class="stat-label">Next 30 Days</div>
        </div>
        <div class="card stat-card">
          <div class="stat-number" style="${urgentCount > 0 ? 'color:#ef4444;' : ''}">${urgentCount}</div>
          <div class="stat-label">🔥 Urgent (≤14d)</div>
        </div>
      </div>

      <!-- Controls -->
      <div class="calendar-controls">
        <div class="calendar-toggle-group">
          <button class="calendar-toggle ${viewFilter === 'closing' ? 'active' : ''}" data-view="closing">🔴 Closing Dates</button>
          <button class="calendar-toggle ${viewFilter === 'opening' ? 'active' : ''}" data-view="opening">🟢 Opening Dates</button>
        </div>
        <div class="calendar-filters">
          <label class="calendar-filter-check">
            <input type="checkbox" id="cal-eligible" ${showOnlyEligible ? 'checked' : ''}>
            <span>✅ Eligible only</span>
          </label>
          <label class="calendar-filter-check">
            <input type="checkbox" id="cal-shortlisted" ${showOnlyShortlisted ? 'checked' : ''}>
            <span>⭐ Shortlisted</span>
          </label>
        </div>
      </div>

      <!-- Timeline -->
      <div class="calendar-timeline" id="calendar-timeline">
        ${renderTimeline(grouped)}
      </div>
    </div>
  `;
}

function groupByMonth(funds, mode) {
    const groups = {};
    funds.forEach(f => {
        const d = mode === 'closing' ? f.closeDateObj : f.openDateObj;
        if (!d) return;
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
        if (!groups[key]) groups[key] = { year: d.getFullYear(), month: d.getMonth(), funds: [] };
        groups[key].funds.push(f);
    });

    // Sort by month ascending, then sort funds in each group by date
    return Object.values(groups)
        .sort((a, b) => a.year - b.year || a.month - b.month)
        .map(group => {
            group.funds.sort((a, b) => {
                const dA = viewFilter === 'closing' ? a.closeDateObj : a.openDateObj;
                const dB = viewFilter === 'closing' ? b.closeDateObj : b.openDateObj;
                return dA - dB;
            });
            return group;
        });
}

function renderTimeline(groups) {
    if (groups.length === 0) {
        return `
        <div class="card" style="text-align:center; padding:var(--space-2xl) var(--space-xl);">
          <div style="font-size:2rem; margin-bottom:var(--space-md);">📅</div>
          <div style="font-size:var(--font-lg); font-weight:700;">No funds match your filters</div>
          <div style="color:var(--text-secondary); font-size:var(--font-sm); margin-top:4px;">Try changing the filters above.</div>
        </div>
      `;
    }

    const today = new Date();
    const nowKey = `${today.getFullYear()}-${String(today.getMonth()).padStart(2, '0')}`;

    return groups.map(group => {
        const monthKey = `${group.year}-${String(group.month).padStart(2, '0')}`;
        const isCurrentMonth = monthKey === nowKey;
        const isPast = new Date(group.year, group.month + 1, 0) < today;

        return `
        <div class="calendar-month ${isCurrentMonth ? 'current' : ''} ${isPast ? 'past' : ''}">
          <div class="calendar-month-header">
            <div class="calendar-month-label">
              <span class="calendar-month-name">${MONTH_NAMES_FULL[group.month]}</span>
              <span class="calendar-month-year">${group.year}</span>
            </div>
            <span class="calendar-month-count">${group.funds.length} fund${group.funds.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="calendar-month-items">
            ${group.funds.map(f => renderCalendarItem(f, today)).join('')}
          </div>
        </div>
      `;
    }).join('');
}

function renderCalendarItem(fund, today) {
    const dateObj = viewFilter === 'closing' ? fund.closeDateObj : fund.openDateObj;
    const day = dateObj.getDate();
    const monthShort = MONTH_NAMES[dateObj.getMonth()];
    const dayOfWeek = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });

    const isPast = dateObj < today;
    const daysAway = Math.ceil((dateObj - today) / (1000 * 60 * 60 * 24));
    const isUrgent = viewFilter === 'closing' && daysAway > 0 && daysAway <= 14;
    const isSoon = viewFilter === 'closing' && daysAway > 14 && daysAway <= 30;

    let urgencyClass = '';
    let urgencyLabel = '';
    if (isPast) {
        urgencyClass = 'past';
        urgencyLabel = viewFilter === 'closing' ? 'Closed' : 'Opened';
    } else if (isUrgent) {
        urgencyClass = 'urgent';
        urgencyLabel = `${daysAway}d left`;
    } else if (isSoon) {
        urgencyClass = 'soon';
        urgencyLabel = `${daysAway}d left`;
    } else if (daysAway === 0) {
        urgencyClass = 'today';
        urgencyLabel = 'Today!';
    } else {
        urgencyLabel = `${daysAway}d`;
    }

    const eligHtml = fund.eligibility ? renderEligibilityBadge(fund.eligibility) : '';

    return `
    <div class="calendar-item ${urgencyClass}" onclick="window.location.hash='/detail/${fund.id}'">
      <div class="calendar-item-date">
        <span class="cal-day">${day}</span>
        <span class="cal-month">${monthShort}</span>
        <span class="cal-dow">${dayOfWeek}</span>
      </div>
      <div class="calendar-item-body">
        <div class="calendar-item-top">
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:var(--space-sm); flex-wrap:wrap; margin-bottom:2px;">
              <span class="status-badge ${fund.effectiveStatus}" style="font-size:0.6rem;">
                <span class="status-dot"></span>
                ${fund.effectiveStatus === 'open' ? 'Open' : fund.effectiveStatus === 'upcoming' ? 'Upcoming' : 'Closed'}
              </span>
              ${eligHtml}
              ${fund.starred ? '<span style="color:#f59e0b; font-size:0.75rem;">★</span>' : ''}
              ${urgencyLabel ? `<span class="calendar-urgency ${urgencyClass}">${urgencyLabel}</span>` : ''}
            </div>
            <div class="calendar-item-name">${fund.name}</div>
            <div class="calendar-item-provider">${fund.provider}</div>
          </div>
          <div style="text-align:right; flex-shrink:0;">
            <div style="font-size:var(--font-sm); color:var(--accent-success); font-weight:700;">${formatAmount(fund.amountMin, fund.amountMax)}</div>
            ${fund.matchScore > 0 ? `<div style="font-size:var(--font-xs); color:var(--text-muted); margin-top:2px;">${fund.matchScore}% match</div>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function afterRenderCalendar() {
    // View toggle
    document.querySelectorAll('.calendar-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            viewFilter = btn.dataset.view;
            showOnlyEligible = document.getElementById('cal-eligible')?.checked || false;
            showOnlyShortlisted = document.getElementById('cal-shortlisted')?.checked || false;
            refreshCalendar();
        });
    });

    // Filter checkboxes
    document.getElementById('cal-eligible')?.addEventListener('change', () => {
        showOnlyEligible = document.getElementById('cal-eligible').checked;
        refreshCalendar();
    });
    document.getElementById('cal-shortlisted')?.addEventListener('change', () => {
        showOnlyShortlisted = document.getElementById('cal-shortlisted').checked;
        refreshCalendar();
    });
}

function refreshCalendar() {
    const container = document.getElementById('page-container');
    if (container) {
        container.innerHTML = renderCalendar();
        afterRenderCalendar();
    }
}
