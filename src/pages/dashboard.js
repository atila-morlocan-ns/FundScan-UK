// ═══════════════════════════════════════════════════════
// FundScan UK — Dashboard Page
// ═══════════════════════════════════════════════════════

import { fundingSources, SECTORS, formatAmount, daysUntil } from '../data/funding-sources.js';
import { getProfile, getProfileCompleteness } from '../store.js';
import { sortByMatch, getMatchLevel } from '../match-engine.js';
import { renderMatchRing, renderFundingCard } from '../components.js';

export function renderDashboard() {
  const profile = getProfile();
  const completeness = getProfileCompleteness(profile);
  const matched = sortByMatch(fundingSources, profile);
  const openCount = fundingSources.filter(f => f.status === 'open').length;
  const upcomingCount = fundingSources.filter(f => f.status === 'upcoming').length;

  // Recently updated (last 30 days)
  const recentlyUpdated = fundingSources
    .filter(f => {
      const d = daysUntil(f.lastUpdated);
      return d >= -30;
    })
    .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
    .slice(0, 5);

  // Sector counts
  const sectorCounts = {};
  fundingSources.forEach(f => {
    f.sectors.forEach(s => {
      sectorCounts[s] = (sectorCounts[s] || 0) + 1;
    });
  });

  const topMatches = matched.slice(0, 4);
  const closingSoon = fundingSources
    .filter(f => f.status === 'open' && daysUntil(f.closeDate) > 0 && daysUntil(f.closeDate) <= 60)
    .sort((a, b) => daysUntil(a.closeDate) - daysUntil(b.closeDate))
    .slice(0, 3);

  return `
    <div class="container">
      <!-- Hero -->
      <section class="hero">
        <div class="hero-glow"></div>
        <h1 class="hero-title">
          <span class="gradient-text">Find Your Funding</span><br>
          in the UK Innovation Ecosystem
        </h1>
        <p class="hero-subtitle">
          FundScan UK scans the landscape weekly to surface the grants, loans,
          and programmes that match your startup's sector and stage.
        </p>
        <div style="display:flex; gap: var(--space-md); justify-content: center; flex-wrap: wrap;">
          <a href="#/scanner" class="btn btn-primary btn-lg">🔍 Scan Opportunities</a>
          ${completeness < 100 ? `<a href="#/profile" class="btn btn-secondary btn-lg">⚙️ Set Up Profile</a>` : ''}
        </div>
      </section>

      <!-- Profile Banner -->
      ${completeness < 100 ? `
      <div class="card" style="margin-bottom: var(--space-2xl); background: var(--gradient-card);">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:var(--space-md);">
          <div>
            <div style="font-weight:700; margin-bottom:4px;">Complete your startup profile</div>
            <div style="font-size:var(--font-sm); color:var(--text-secondary);">
              Get personalised match scores by telling us about your business
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:var(--space-md);">
            <div style="width:120px;">
              <div style="font-size:var(--font-xs); color:var(--text-muted); margin-bottom:4px;">${completeness}% complete</div>
              <div class="completion-bar"><div class="completion-fill" style="width:${completeness}%"></div></div>
            </div>
            <a href="#/profile" class="btn btn-primary">Complete →</a>
          </div>
        </div>
      </div>` : ''}

      <!-- Stats -->
      <div class="stats-row">
        <div class="card stat-card">
          <div class="stat-number">${fundingSources.length}</div>
          <div class="stat-label">Total Opportunities</div>
        </div>
        <div class="card stat-card">
          <div class="stat-number">${openCount}</div>
          <div class="stat-label">Open Now</div>
        </div>
        <div class="card stat-card">
          <div class="stat-number">${upcomingCount}</div>
          <div class="stat-label">Coming Soon</div>
        </div>
        <div class="card stat-card">
          <div class="stat-number">${profile ? topMatches.filter(f => f.matchScore >= 60).length : '—'}</div>
          <div class="stat-label">Strong Matches</div>
        </div>
      </div>

      <!-- Top Matches -->
      <section>
        <div class="section-header">
          <h2 class="section-title">🎯 Top Matches for You</h2>
          <a href="#/scanner" class="section-action">View all →</a>
        </div>
        ${profile ? `
        <div class="funding-grid">
          ${topMatches.map(f => renderFundingCard(f, f.matchScore)).join('')}
        </div>
        ` : `
        <div class="card" style="text-align:center; padding:var(--space-2xl);">
          <div style="font-size:2rem; margin-bottom:var(--space-md);">🎯</div>
          <div style="font-weight:600; margin-bottom:var(--space-sm);">Set up your profile to see matches</div>
          <div style="color:var(--text-secondary); font-size:var(--font-sm); margin-bottom:var(--space-lg);">
            Tell us your sector, stage, and funding needs for personalised results
          </div>
          <a href="#/profile" class="btn btn-primary">Set Up Profile</a>
        </div>
        `}
      </section>

      <!-- Closing Soon -->
      ${closingSoon.length > 0 ? `
      <section style="margin-top:var(--space-2xl);">
        <div class="section-header">
          <h2 class="section-title">⏰ Closing Soon</h2>
        </div>
        <div class="funding-grid">
          ${closingSoon.map(f => {
    const score = profile ? matched.find(m => m.id === f.id)?.matchScore || 0 : 0;
    return renderFundingCard(f, score);
  }).join('')}
        </div>
      </section>` : ''}

      <!-- Sector Heatmap -->
      <section style="margin-top:var(--space-2xl);">
        <div class="section-header">
          <h2 class="section-title">🗺️ Sector Landscape</h2>
          <span class="section-action" style="cursor:default;">Opportunities by sector</span>
        </div>
        <div class="sector-grid">
          ${SECTORS.filter(s => s.id !== 'general').map(s => `
            <div class="sector-item card" onclick="window.location.hash='/scanner?sector=${s.id}'"
                 style="border-color: ${s.color}22;">
              <div class="sector-icon">${s.icon}</div>
              <div class="sector-name">${s.name}</div>
              <div class="sector-count">${sectorCounts[s.id] || 0} opportunities</div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Recent Activity Timeline -->
      <section style="margin-top:var(--space-2xl);">
        <div class="section-header">
          <h2 class="section-title">📋 Recently Updated</h2>
        </div>
        <div class="card-flat" style="padding:var(--space-lg);">
          <div class="timeline">
            ${recentlyUpdated.map(f => `
              <div class="timeline-item" style="cursor:pointer;" onclick="window.location.hash='/detail/${f.id}'">
                <div class="timeline-date">${new Date(f.lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                <div class="timeline-title">${f.name}</div>
                <div class="timeline-desc">${f.provider} · ${f.status === 'open' ? '🟢 Open' : f.status === 'upcoming' ? '🔵 Upcoming' : '⚪ Closed'}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    </div>
  `;
}
