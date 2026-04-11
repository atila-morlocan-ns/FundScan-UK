// ═══════════════════════════════════════════════════════
// FundScan UK — Detail Page (v2)
// Full funding breakdown with eligibility checks
// ═══════════════════════════════════════════════════════

import { fundingSources, SECTORS, STAGES, FUNDING_TYPES, formatAmount, daysUntil, getSectorById, getStageById } from '../data/funding-sources.js';
import { getProfile, isShortlisted, addToShortlist, removeFromShortlist, getTrackerItem, addTrackerItem } from '../store.js';
import { calculateMatchScore, getMatchLevel, getEffectiveStatus, getStaleness } from '../match-engine.js';
import { evaluateEligibility } from '../data/eligibility-rules.js';
import { renderMatchRing, renderFundingCard, renderEligibilityBadge } from '../components.js';

export function renderDetail(params) {
    const id = params[0];
    const funding = fundingSources.find(f => f.id === id);
    if (!funding) {
        return `
      <div class="container">
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">Funding not found</div>
          <div class="empty-desc">This opportunity may have been removed.</div>
          <a href="#/scanner" class="btn btn-primary" style="margin-top:var(--space-lg);">Back to Scanner</a>
        </div>
      </div>`;
    }

    const profile = getProfile();
    const matchScore = calculateMatchScore(funding, profile);
    const matchLevel = getMatchLevel(matchScore);
    const effectiveStatus = getEffectiveStatus(funding);
    const staleness = getStaleness(funding);
    const eligibility = evaluateEligibility(funding.id, profile);
    const days = daysUntil(funding.closeDate);
    const typeInfo = FUNDING_TYPES.find(t => t.id === funding.type);

    // Related funding: same sector, different id
    const related = fundingSources
        .filter(f => f.id !== funding.id && f.sectors.some(s => funding.sectors.includes(s)))
        .map(f => ({
            ...f,
            matchScore: calculateMatchScore(f, profile),
            _eligibility: evaluateEligibility(f.id, profile),
            _effectiveStatus: getEffectiveStatus(f),
            _staleness: getStaleness(f),
        }))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 3);

    // Build eligibility checks HTML
    const eligibilityChecksHtml = eligibility.checks.length > 0 ? `
        <div style="margin-top:var(--space-md);">
          ${eligibility.checks.map(c => {
            const icon = c.pass === true ? '✅' : c.pass === false ? '❌' : '❓';
            const color = c.pass === true ? '#10b981' : c.pass === false ? '#ef4444' : '#f59e0b';
            const tag = c.required ? '<span style="font-size:0.6rem; background:rgba(239,68,68,0.15); color:#f87171; padding:1px 6px; border-radius:4px; margin-left:6px;">Required</span>' :
                        c.preferred ? '<span style="font-size:0.6rem; background:rgba(245,158,11,0.15); color:#fbbf24; padding:1px 6px; border-radius:4px; margin-left:6px;">Preferred</span>' : '';
            return `<div style="display:flex; align-items:center; gap:var(--space-sm); padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
              <span style="color:${color}; font-size:1rem;">${icon}</span>
              <span style="flex:1; font-size:var(--font-sm);">${c.field}${tag}</span>
              ${c.detail ? `<span style="font-size:var(--font-xs); color:var(--text-muted);">${c.detail}</span>` : ''}
            </div>`;
          }).join('')}
        </div>
    ` : '';

    // Staleness badge
    const stalenessHtml = staleness.level !== 'fresh'
        ? `<span style="color:${staleness.level === 'stale' ? '#f87171' : '#fbbf24'}; font-size:var(--font-xs); margin-left:var(--space-sm);">${staleness.label}</span>`
        : `<span style="color:#10b981; font-size:var(--font-xs); margin-left:var(--space-sm);">✅ Recently verified</span>`;

    const starred = isShortlisted(funding.id);
    const tracked = getTrackerItem(funding.id);

    return `
    <div class="container">
      <!-- Breadcrumb -->
      <div class="detail-breadcrumb">
        <a href="#/dashboard">Home</a>
        <span>›</span>
        <a href="#/scanner">Scanner</a>
        <span>›</span>
        <span style="color:var(--text-primary);">${funding.name}</span>
      </div>

      <div class="detail-grid">
        <!-- Main Content -->
        <div class="detail-main">
          <div style="display:flex; align-items:center; gap:var(--space-sm); margin-bottom:var(--space-sm);">
            <span class="status-badge ${effectiveStatus}">
              <span class="status-dot"></span>
              ${effectiveStatus === 'open' ? 'Open' : effectiveStatus === 'upcoming' ? 'Upcoming' : 'Closed'}
            </span>
            <span class="meta-tag">${typeInfo ? typeInfo.icon + ' ' + typeInfo.name : funding.type}</span>
            ${renderEligibilityBadge(eligibility)}
          </div>

          <h1 style="font-size:var(--font-3xl); font-weight:800; letter-spacing:-0.02em; line-height:1.2; margin-bottom:var(--space-sm);">
            ${funding.name}
          </h1>
          <div style="font-size:var(--font-sm); color:var(--text-muted); margin-bottom:var(--space-xl);">
            by ${funding.provider}
          </div>

          <p style="font-size:var(--font-lg); color:var(--text-secondary); line-height:1.8; margin-bottom:var(--space-xl);">
            ${funding.description}
          </p>

          <!-- Eligibility Check Panel -->
          ${eligibility.checks.length > 0 ? `
          <div class="card" style="margin-bottom:var(--space-xl); border-color:${eligibility.status === 'eligible' ? 'rgba(16,185,129,0.3)' : eligibility.status === 'ineligible' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'};">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--space-sm);">
              <h2 style="margin:0;">📋 Eligibility Check</h2>
              <div style="display:flex; align-items:center; gap:var(--space-sm);">
                ${renderEligibilityBadge(eligibility)}
                <span style="font-size:var(--font-sm); font-weight:700; color:var(--text-secondary);">${eligibility.score}% fit</span>
              </div>
            </div>
            <p style="font-size:var(--font-xs); color:var(--text-muted); margin-bottom:var(--space-sm);">
              Based on your profile. <a href="#/profile" style="color:var(--accent-primary-light);">Update profile →</a> for more accurate results.
            </p>
            ${eligibilityChecksHtml}
          </div>
          ` : ''}

          <!-- Sectors & Stages -->
          <h2>Sectors</h2>
          <div style="display:flex; flex-wrap:wrap; gap:var(--space-sm); margin-bottom:var(--space-lg);">
            ${funding.sectors.map(s => {
        const sec = getSectorById(s);
        return sec ? `<span class="meta-tag sector">${sec.icon} ${sec.name}</span>` : '';
    }).join('')}
          </div>

          <h2>Innovation Stages</h2>
          <div style="display:flex; flex-wrap:wrap; gap:var(--space-sm); margin-bottom:var(--space-lg);">
            ${funding.stages.map(s => {
        const stg = getStageById(s);
        return stg ? `<span class="meta-tag stage">${stg.icon} ${stg.name}</span>` : '';
    }).join('')}
          </div>

          <!-- Eligibility -->
          <h2>Eligibility Requirements</h2>
          <ul style="margin-bottom:var(--space-xl);">
            ${funding.eligibility.map(e => `<li>${e}</li>`).join('')}
          </ul>

          <!-- Tips -->
          ${funding.tips ? `
          <h2>💡 Application Tips</h2>
          <div class="card" style="background:var(--gradient-card); margin-bottom:var(--space-xl);">
            <ul style="padding-left:var(--space-lg); margin:0;">
              ${funding.tips.map(t => `<li style="margin-bottom:var(--space-sm); color:var(--text-secondary);">${t}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          <!-- Related -->
          ${related.length > 0 ? `
          <h2 style="margin-top:var(--space-2xl);">Related Opportunities</h2>
          <div class="funding-grid" style="margin-top:var(--space-md);">
            ${related.map(f => renderFundingCard(f, f.matchScore)).join('')}
          </div>
          ` : ''}
        </div>

        <!-- Sidebar -->
        <div class="detail-sidebar">
          <div class="card">
            <!-- Match Score -->
            ${profile ? `
            <div style="text-align:center; margin-bottom:var(--space-lg);">
              <div style="display:flex; justify-content:center; margin-bottom:var(--space-sm);">
                ${renderMatchRing(matchScore, 64)}
              </div>
              <div style="font-size:var(--font-sm); font-weight:600;">Your Match Score</div>
            </div>
            ` : ''}

            <!-- Key Info -->
            <div class="detail-info-row">
              <span class="detail-info-label">Amount</span>
              <span class="detail-info-value" style="color:var(--accent-success);">${formatAmount(funding.amountMin, funding.amountMax)}</span>
            </div>
            <div class="detail-info-row">
              <span class="detail-info-label">Status</span>
              <span class="detail-info-value">
                <span class="status-badge ${effectiveStatus}" style="font-size:var(--font-xs);">
                  <span class="status-dot"></span>
                  ${effectiveStatus === 'open' ? 'Open' : effectiveStatus === 'upcoming' ? 'Upcoming' : 'Closed'}
                </span>
              </span>
            </div>
            <div class="detail-info-row">
              <span class="detail-info-label">Eligibility</span>
              <span class="detail-info-value">
                ${renderEligibilityBadge(eligibility)}
              </span>
            </div>
            <div class="detail-info-row">
              <span class="detail-info-label">Opens</span>
              <span class="detail-info-value">${new Date(funding.openDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div class="detail-info-row">
              <span class="detail-info-label">Closes</span>
              <span class="detail-info-value ${days > 0 && days <= 30 ? 'style="color:var(--accent-warning);"' : ''}">
                ${new Date(funding.closeDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                ${days > 0 && days <= 60 ? `<br><span style="font-size:var(--font-xs); color:var(--accent-warning);">${days} days left</span>` : ''}
                ${days <= 0 && effectiveStatus === 'open' ? '' : days <= 0 ? `<br><span style="font-size:var(--font-xs); color:var(--text-muted);">Deadline passed</span>` : ''}
              </span>
            </div>
            <div class="detail-info-row">
              <span class="detail-info-label">Success Rate</span>
              <span class="detail-info-value">${funding.successRate}</span>
            </div>
            <div class="detail-info-row" style="border:none;">
              <span class="detail-info-label">Last Updated</span>
              <span class="detail-info-value">
                ${new Date(funding.lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                ${stalenessHtml}
              </span>
            </div>

            <!-- CTA -->
            <div style="margin-top:var(--space-lg); display:flex; flex-direction:column; gap:var(--space-sm);">
              ${effectiveStatus !== 'closed' ? `
              <a href="${funding.applicationUrl}" target="_blank" rel="noopener" class="btn btn-success btn-lg" style="justify-content:center;">
                🚀 Apply Now
              </a>` : `
              <button class="btn btn-secondary btn-lg" style="justify-content:center; opacity:0.5;" disabled>
                ⚪ Applications Closed
              </button>`}
              <a href="#/scanner" class="btn btn-secondary" style="justify-content:center;">
                ← Back to Scanner
              </a>
              <div style="display:flex; gap:var(--space-sm);">
                <button class="btn ${starred ? 'btn-primary' : 'btn-secondary'}" style="flex:1; justify-content:center; font-size:var(--font-xs);" id="detail-star-btn" data-fund-id="${funding.id}">
                  ${starred ? '★ Shortlisted' : '☆ Shortlist'}
                </button>
                ${!tracked ? `
                <button class="btn btn-secondary" style="flex:1; justify-content:center; font-size:var(--font-xs);" id="detail-track-btn" data-fund-id="${funding.id}">
                  📊 Track
                </button>` : `
                <a href="#/tracker" class="btn btn-secondary" style="flex:1; justify-content:center; font-size:var(--font-xs);">
                  📊 In Pipeline →
                </a>`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function afterRenderDetail() {
    // Star toggle
    const starBtn = document.getElementById('detail-star-btn');
    if (starBtn) {
        starBtn.addEventListener('click', () => {
            const fundId = starBtn.dataset.fundId;
            if (isShortlisted(fundId)) {
                removeFromShortlist(fundId);
                starBtn.className = 'btn btn-secondary';
                starBtn.style.cssText += 'flex:1; justify-content:center; font-size:var(--font-xs);';
                starBtn.textContent = '☆ Shortlist';
            } else {
                addToShortlist(fundId);
                starBtn.className = 'btn btn-primary';
                starBtn.style.cssText += 'flex:1; justify-content:center; font-size:var(--font-xs);';
                starBtn.textContent = '★ Shortlisted';
            }
        });
    }

    // Track button
    const trackBtn = document.getElementById('detail-track-btn');
    if (trackBtn) {
        trackBtn.addEventListener('click', () => {
            const fundId = trackBtn.dataset.fundId;
            addTrackerItem(fundId, 'researching');
            trackBtn.outerHTML = `<a href="#/tracker" class="btn btn-secondary" style="flex:1; justify-content:center; font-size:var(--font-xs);">📊 In Pipeline →</a>`;
        });
    }
}
