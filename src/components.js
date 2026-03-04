// ═══════════════════════════════════════════════════════
// FundScan UK — Shared Components
// Reusable UI building blocks
// ═══════════════════════════════════════════════════════

import { formatAmount, daysUntil, getSectorById } from './data/funding-sources.js';
import { getMatchLevel } from './match-engine.js';

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

// Funding card component
export function renderFundingCard(funding, matchScore = 0) {
    const days = daysUntil(funding.closeDate);
    const level = getMatchLevel(matchScore);
    const isUrgent = funding.status === 'open' && days > 0 && days <= 30;
    const sectorTags = funding.sectors.slice(0, 3).map(s => {
        const sec = getSectorById(s);
        return sec ? `<span class="meta-tag sector">${sec.icon} ${sec.name}</span>` : '';
    }).join('');

    let deadlineText = '';
    if (funding.status === 'open') {
        if (days <= 0) {
            deadlineText = 'Closed';
        } else if (days <= 7) {
            deadlineText = `⚠️ ${days}d left!`;
        } else if (days <= 30) {
            deadlineText = `${days} days left`;
        } else {
            deadlineText = `Closes ${new Date(funding.closeDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
        }
    } else if (funding.status === 'upcoming') {
        deadlineText = `Opens ${new Date(funding.openDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
    } else {
        deadlineText = 'Closed';
    }

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
        <span class="status-badge ${funding.status}">
          <span class="status-dot"></span>
          ${funding.status === 'open' ? 'Open' : funding.status === 'upcoming' ? 'Upcoming' : 'Closed'}
        </span>
        ${sectorTags}
      </div>
      <div class="funding-card-footer">
        <span class="funding-amount">${formatAmount(funding.amountMin, funding.amountMax)}</span>
        <span class="funding-deadline ${isUrgent ? 'urgent' : ''}">${deadlineText}</span>
      </div>
    </div>
  `;
}
