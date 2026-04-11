// ═══════════════════════════════════════════════════════
// FundScan UK — Shortlist / Favourites Page
// Save, annotate, and manage favourite funding sources
// ═══════════════════════════════════════════════════════

import { fundingSources, formatAmount, daysUntil } from '../data/funding-sources.js';
import { getShortlist, removeFromShortlist, updateShortlistNote, addTrackerItem, getTrackerItem } from '../store.js';
import { getProfile } from '../store.js';
import { calculateMatchScore, getEffectiveStatus } from '../match-engine.js';
import { evaluateEligibility } from '../data/eligibility-rules.js';
import { renderMatchRing, renderEligibilityBadge } from '../components.js';

export function renderShortlist() {
    const shortlist = getShortlist();
    const profile = getProfile();
    const count = shortlist.length;

    // Enrich shortlist items with fund data
    const items = shortlist.map(s => {
        const fund = fundingSources.find(f => f.id === s.fundId);
        if (!fund) return null;
        const matchScore = calculateMatchScore(fund, profile);
        const eligibility = evaluateEligibility(fund.id, profile);
        const effectiveStatus = getEffectiveStatus(fund);
        const trackerItem = getTrackerItem(fund.id);
        return { ...s, fund, matchScore, eligibility, effectiveStatus, trackerItem };
    }).filter(Boolean);

    // Stats
    const totalValue = items.reduce((sum, i) => sum + (i.fund.amountMax || i.fund.amountMin || 0), 0);
    const eligibleCount = items.filter(i => i.eligibility?.status === 'eligible').length;
    const openCount = items.filter(i => i.effectiveStatus === 'open').length;

    return `
    <div class="container" style="max-width:1100px;">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:var(--space-md); margin-bottom:var(--space-xl);">
        <div>
          <h1 style="font-size:var(--font-3xl); font-weight:800; letter-spacing:-0.02em;">
            ⭐ Shortlist
          </h1>
          <p style="color:var(--text-secondary); font-size:var(--font-sm); margin-top:4px;">
            Your favourite funding opportunities — annotated and ready
          </p>
        </div>
        <div style="display:flex; gap:var(--space-sm);">
          <a href="#/scanner" class="btn btn-secondary">🔍 Find More</a>
          <a href="#/tracker" class="btn btn-primary">📊 Tracker</a>
        </div>
      </div>

      ${count > 0 ? `
      <!-- Stats -->
      <div class="stats-row" style="margin-bottom:var(--space-xl);">
        <div class="card stat-card">
          <div class="stat-number">${count}</div>
          <div class="stat-label">Shortlisted</div>
        </div>
        <div class="card stat-card">
          <div class="stat-number">${openCount}</div>
          <div class="stat-label">Open Now</div>
        </div>
        <div class="card stat-card">
          <div class="stat-number" style="${eligibleCount > 0 ? 'color:#10b981;' : ''}">${eligibleCount}</div>
          <div class="stat-label">✅ Eligible</div>
        </div>
        <div class="card stat-card">
          <div class="stat-number" style="font-size:var(--font-xl);">£${totalValue >= 1000000 ? (totalValue / 1000000).toFixed(1) + 'M' : Math.round(totalValue / 1000) + 'K'}</div>
          <div class="stat-label">Total Potential</div>
        </div>
      </div>

      <!-- Shortlist Cards -->
      <div class="shortlist-grid">
        ${items.map(item => renderShortlistCard(item)).join('')}
      </div>
      ` : `
      <!-- Empty State -->
      <div class="card" style="text-align:center; padding:var(--space-2xl) var(--space-xl);">
        <div style="font-size:3rem; margin-bottom:var(--space-md);">⭐</div>
        <div style="font-size:var(--font-xl); font-weight:700; margin-bottom:var(--space-sm);">No funds shortlisted yet</div>
        <div style="color:var(--text-secondary); font-size:var(--font-sm); margin-bottom:var(--space-lg); max-width:400px; margin-inline:auto;">
          Browse the Scanner and click the ⭐ star on any funding card to add it to your shortlist for quick access.
        </div>
        <a href="#/scanner" class="btn btn-primary btn-lg">🔍 Browse Scanner</a>
      </div>
      `}
    </div>
  `;
}

function renderShortlistCard(item) {
    const { fund, matchScore, eligibility, effectiveStatus, note, addedAt, trackerItem } = item;
    const days = daysUntil(fund.closeDate);
    const isTracked = !!trackerItem;

    let deadlineHtml = '';
    if (effectiveStatus === 'open' && days > 0) {
        const urgency = days <= 14 ? 'color:#ef4444; font-weight:700;' : days <= 30 ? 'color:#f59e0b;' : '';
        deadlineHtml = `<span style="font-size:var(--font-xs); ${urgency}">${days} days left</span>`;
    } else if (effectiveStatus === 'open') {
        deadlineHtml = `<span style="font-size:var(--font-xs); color:var(--text-muted);">Deadline passed</span>`;
    } else if (effectiveStatus === 'upcoming') {
        deadlineHtml = `<span style="font-size:var(--font-xs); color:var(--accent-primary-light);">Opens ${new Date(fund.openDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>`;
    }

    return `
    <div class="card shortlist-card" data-fund-id="${fund.id}">
      <div class="shortlist-card-header">
        <div style="flex:1; min-width:0;">
          <div style="display:flex; align-items:center; gap:var(--space-sm); margin-bottom:4px; flex-wrap:wrap;">
            <span class="status-badge ${effectiveStatus}" style="font-size:0.65rem;">
              <span class="status-dot"></span>
              ${effectiveStatus === 'open' ? 'Open' : effectiveStatus === 'upcoming' ? 'Upcoming' : 'Closed'}
            </span>
            ${renderEligibilityBadge(eligibility)}
            ${deadlineHtml}
          </div>
          <div style="font-size:var(--font-xs); color:var(--text-muted); text-transform:uppercase; letter-spacing:0.04em;">${fund.provider}</div>
          <a href="#/detail/${fund.id}" style="font-size:var(--font-md); font-weight:700; color:var(--text-primary); text-decoration:none; display:block; margin-top:2px;">
            ${fund.name}
          </a>
        </div>
        ${matchScore > 0 ? renderMatchRing(matchScore, 44) : ''}
      </div>

      <div style="display:flex; align-items:center; justify-content:space-between; margin:var(--space-sm) 0;">
        <span style="font-size:var(--font-sm); color:var(--accent-success); font-weight:700;">${formatAmount(fund.amountMin, fund.amountMax)}</span>
        <span style="font-size:var(--font-xs); color:var(--text-muted);">Added ${new Date(addedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
      </div>

      <!-- Notes -->
      <div class="shortlist-notes-wrapper">
        <textarea class="shortlist-note-input" data-fund-id="${fund.id}" placeholder="Add notes... (e.g. 'Good fit for Phase 1')" rows="2">${note || ''}</textarea>
      </div>

      <!-- Actions -->
      <div class="shortlist-actions">
        ${!isTracked ? `
        <button class="btn btn-primary" style="font-size:var(--font-xs); padding:4px 12px;" data-action="track" data-fund-id="${fund.id}">
          📊 Start Tracking
        </button>` : `
        <a href="#/tracker" class="btn btn-secondary" style="font-size:var(--font-xs); padding:4px 12px;">
          📊 In Pipeline →
        </a>`}
        <button class="btn" style="font-size:var(--font-xs); padding:4px 10px; background:rgba(239,68,68,0.1); color:#f87171; border:1px solid rgba(239,68,68,0.2);" data-action="remove" data-fund-id="${fund.id}">
          ✕ Remove
        </button>
      </div>
    </div>
  `;
}

export function afterRenderShortlist() {
    // Note auto-save on blur
    document.querySelectorAll('.shortlist-note-input').forEach(textarea => {
        textarea.addEventListener('blur', () => {
            const fundId = textarea.dataset.fundId;
            updateShortlistNote(fundId, textarea.value.trim());
        });
    });

    // Track button
    document.querySelectorAll('[data-action="track"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const fundId = btn.dataset.fundId;
            addTrackerItem(fundId, 'researching');
            btn.outerHTML = `<a href="#/tracker" class="btn btn-secondary" style="font-size:var(--font-xs); padding:4px 12px;">📊 In Pipeline →</a>`;
        });
    });

    // Remove button
    document.querySelectorAll('[data-action="remove"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const fundId = btn.dataset.fundId;
            removeFromShortlist(fundId);
            const card = document.querySelector(`.shortlist-card[data-fund-id="${fundId}"]`);
            if (card) {
                card.style.transition = 'opacity 0.3s, transform 0.3s';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    card.remove();
                    // If no more cards, reload to show empty state
                    if (!document.querySelector('.shortlist-card')) {
                        window.location.hash = '#/shortlist';
                    }
                }, 300);
            }
        });
    });
}
