// ═══════════════════════════════════════════════════════
// FundScan UK — Shared Components
// Reusable UI building blocks (v2 — with eligibility/staleness)
// ═══════════════════════════════════════════════════════

import { formatAmount, daysUntil, getSectorById } from './data/funding-sources.js';
import { getMatchLevel, getEffectiveStatus, getStaleness } from './match-engine.js';

// Circular match score ring (SVG)
export function renderMatchRing(score, size = 48) {
    const level = getMatchLevel(score);
    const colors = {
        high: '#10b981',
        mid: '#f59e0b',
        low: '#6b7280',
    };
    const color = colors[level];
    const radius = (size / 2) - 4;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return `
    <div class="match-ring" style="width:${size}px; height:${size}px; color:${color};">
      <svg viewBox="0 0 ${size} ${size}">
        <circle class="track" cx="${size / 2}" cy="${size / 2}" r="${radius}" />
        <circle class="progress" cx="${size / 2}" cy="${size / 2}" r="${radius}"
          stroke="${color}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${offset}" />
      </svg>
      <span style="font-size:${size < 50 ? '0.7rem' : '0.85rem'}; color:${color};">${score}%</span>
    </div>
  `;
}

// Eligibility badge
export function renderEligibilityBadge(eligibility) {
    if (!eligibility) return '';
    const styles = {
        eligible: 'background:rgba(16,185,129,0.12); color:#34d399;',
        partial: 'background:rgba(245,158,11,0.12); color:#fbbf24;',
        ineligible: 'background:rgba(239,68,68,0.12); color:#f87171;',
    };
    const labels = {
        eligible: '✅ Eligible',
        partial: '⚠️ Check Fit',
        ineligible: '❌ Ineligible',
    };
    return `<span class="eligibility-badge" style="${styles[eligibility.status] || ''} padding:2px 8px; border-radius:9999px; font-size:0.7rem; font-weight:600; white-space:nowrap;" title="${eligibility.checks?.map(c => `${c.pass ? '✅' : c.pass === false ? '❌' : '❓'} ${c.field}${c.detail ? ': ' + c.detail : ''}`).join('\n') || ''}">${labels[eligibility.status] || ''}</span>`;
}

// Staleness badge
export function renderStalenessBadge(fund) {
    const staleness = getStaleness(fund);
    if (staleness.level === 'fresh') return '';
    const styles = {
        stale: 'color:#f87171; background:rgba(239,68,68,0.1);',
        aging: 'color:#fbbf24; background:rgba(245,158,11,0.1);',
    };
    return `<span style="${styles[staleness.level]} padding:2px 8px; border-radius:9999px; font-size:0.65rem; font-weight:600; white-space:nowrap;">${staleness.label}</span>`;
}

// Funding card component (v2)
export function renderFundingCard(funding, matchScore = 0) {
    const effectiveStatus = getEffectiveStatus(funding);
    const days = daysUntil(funding.closeDate);
    const isUrgent = effectiveStatus === 'open' && days > 0 && days <= 30;
    const sectorTags = funding.sectors.slice(0, 3).map(s => {
        const sec = getSectorById(s);
        return sec ? `<span class="meta-tag sector">${sec.icon} ${sec.name}</span>` : '';
    }).join('');

    let deadlineText = '';
    if (effectiveStatus === 'open') {
        if (days <= 0) {
            deadlineText = 'Closed';
        } else if (days <= 7) {
            deadlineText = `⚠️ ${days}d left!`;
        } else if (days <= 30) {
            deadlineText = `${days} days left`;
        } else {
            deadlineText = `Closes ${new Date(funding.closeDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
        }
    } else if (effectiveStatus === 'upcoming') {
        deadlineText = `Opens ${new Date(funding.openDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
    } else {
        deadlineText = 'Closed';
    }

    // Eligibility badge
    const eligibilityHtml = funding._eligibility ? renderEligibilityBadge(funding._eligibility) : '';

    // Staleness badge
    const stalenessHtml = renderStalenessBadge(funding);

    return `
    <div class="card funding-card" onclick="window.location.hash='/detail/${funding.id}'">
      <div class="funding-card-header">
        <div>
          <div class="funding-card-provider">${funding.provider}</div>
          <div class="funding-card-name">${funding.name}</div>
        </div>
        ${matchScore > 0 ? renderMatchRing(matchScore) : ''}
      </div>
      <div class="funding-card-desc">${funding.description}</div>
      <div class="funding-card-meta">
        <span class="status-badge ${effectiveStatus}">
          <span class="status-dot"></span>
          ${effectiveStatus === 'open' ? 'Open' : effectiveStatus === 'upcoming' ? 'Upcoming' : 'Closed'}
        </span>
        ${eligibilityHtml}
        ${stalenessHtml}
        ${sectorTags}
      </div>
      <div class="funding-card-footer">
        <span class="funding-amount">${formatAmount(funding.amountMin, funding.amountMax)}</span>
        <span class="funding-deadline ${isUrgent ? 'urgent' : ''}">${deadlineText}</span>
      </div>
    </div>
  `;
}
