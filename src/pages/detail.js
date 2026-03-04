// ═══════════════════════════════════════════════════════
// FundScan UK — Detail Page
// Full funding opportunity breakdown
// ═══════════════════════════════════════════════════════

import { fundingSources, SECTORS, STAGES, FUNDING_TYPES, formatAmount, daysUntil, getSectorById, getStageById } from '../data/funding-sources.js';
import { getProfile } from '../store.js';
import { calculateMatchScore, getMatchLevel } from '../match-engine.js';
import { renderMatchRing, renderFundingCard } from '../components.js';

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
    const days = daysUntil(funding.closeDate);
    const typeInfo = FUNDING_TYPES.find(t => t.id === funding.type);

    // Related funding: same sector, different id
    const related = fundingSources
        .filter(f => f.id !== funding.id && f.sectors.some(s => funding.sectors.includes(s)))
        .map(f => ({ ...f, matchScore: calculateMatchScore(f, profile) }))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 3);

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
            <span class="status-badge ${funding.status}">
              <span class="status-dot"></span>
              ${funding.status === 'open' ? 'Open' : funding.status === 'upcoming' ? 'Upcoming' : 'Closed'}
            </span>
            <span class="meta-tag">${typeInfo ? typeInfo.icon + ' ' + typeInfo.name : funding.type}</span>
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
                <span class="status-badge ${funding.status}" style="font-size:var(--font-xs);">
                  <span class="status-dot"></span>
                  ${funding.status === 'open' ? 'Open' : funding.status === 'upcoming' ? 'Upcoming' : 'Closed'}
                </span>
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
              </span>
            </div>
            <div class="detail-info-row">
              <span class="detail-info-label">Success Rate</span>
              <span class="detail-info-value">${funding.successRate}</span>
            </div>
            <div class="detail-info-row" style="border:none;">
              <span class="detail-info-label">Last Updated</span>
              <span class="detail-info-value">${new Date(funding.lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>

            <!-- CTA -->
            <div style="margin-top:var(--space-lg); display:flex; flex-direction:column; gap:var(--space-sm);">
              <a href="${funding.applicationUrl}" target="_blank" rel="noopener" class="btn btn-success btn-lg" style="justify-content:center;">
                🚀 Apply Now
              </a>
              <a href="#/scanner" class="btn btn-secondary" style="justify-content:center;">
                ← Back to Scanner
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
