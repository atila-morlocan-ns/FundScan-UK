// ═══════════════════════════════════════════════════════
// FundScan UK — Deadline Sprint + Funder Intelligence Page
// Application countdown sprints and funder scoring rubrics
// ═══════════════════════════════════════════════════════

import { fundingSources, formatAmount, daysUntil } from '../data/funding-sources.js';
import { FUNDER_INTELLIGENCE, SPRINT_TEMPLATE } from '../data/grant-strategy.js';
import { getProfile } from '../store.js';
import { calculateMatchScore } from '../match-engine.js';

function getSprintPhase(daysLeft) {
    if (daysLeft <= 7) return SPRINT_TEMPLATE[5];  // Submit
    if (daysLeft <= 14) return SPRINT_TEMPLATE[4];  // Polish
    if (daysLeft <= 28) return SPRINT_TEMPLATE[3];  // Review
    if (daysLeft <= 42) return SPRINT_TEMPLATE[2];  // Evidence
    if (daysLeft <= 56) return SPRINT_TEMPLATE[1];  // Draft
    return SPRINT_TEMPLATE[0];  // Discover
}

export function renderStrategy() {
    const profile = getProfile();

    // Open funds with deadlines, sorted by days remaining
    const openFunds = fundingSources
        .filter(f => f.status === 'open' && daysUntil(f.closeDate) > 0)
        .map(f => ({
            ...f,
            daysLeft: daysUntil(f.closeDate),
            matchScore: calculateMatchScore(f, profile),
            sprint: getSprintPhase(daysUntil(f.closeDate)),
        }))
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 10);

    return `
    <div class="container" style="max-width:1100px;">
      <div style="margin-bottom:var(--space-xl);">
        <h1 style="font-size:var(--font-3xl); font-weight:800; letter-spacing:-0.02em;">⏰ Sprints & Intelligence</h1>
        <p style="color:var(--text-secondary); font-size:var(--font-sm); margin-top:4px;">
          Deadline countdown plans and funder scoring rubrics
        </p>
      </div>

      <!-- Active Deadline Sprints -->
      <h2 style="margin-bottom:var(--space-md);">🏃 Active Deadline Sprints</h2>
      <p style="font-size:var(--font-sm); color:var(--text-muted); margin-bottom:var(--space-md);">
        Each fund has an 8-week sprint plan. Your current phase depends on time remaining.
      </p>

      ${openFunds.length > 0 ? `
      <div style="display:flex; flex-direction:column; gap:var(--space-md); margin-bottom:var(--space-2xl);">
        ${openFunds.map(fund => {
        const urgency = fund.daysLeft <= 14 ? '#ef4444' : fund.daysLeft <= 30 ? '#f59e0b' : '#6366f1';
        return `
          <div class="card" style="border-color:${urgency}30;">
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:var(--space-sm); margin-bottom:var(--space-md);">
              <div>
                <a href="#/detail/${fund.id}" style="font-weight:700; color:var(--text-primary); text-decoration:none; font-size:var(--font-md);">${fund.name}</a>
                <div style="font-size:var(--font-xs); color:var(--text-muted);">${fund.provider} · ${formatAmount(fund.amountMin, fund.amountMax)}</div>
              </div>
              <div style="display:flex; align-items:center; gap:var(--space-sm);">
                <span class="match-badge" style="font-size:var(--font-xs);">🎯 ${fund.matchScore}%</span>
                <span style="font-weight:800; color:${urgency}; font-size:var(--font-lg);">${fund.daysLeft}d</span>
              </div>
            </div>

            <!-- Sprint Progress Bar -->
            <div style="display:flex; gap:2px; margin-bottom:var(--space-sm);">
              ${SPRINT_TEMPLATE.map((phase, i) => {
            const isActive = phase.phase === fund.sprint.phase;
            const isPast = SPRINT_TEMPLATE.indexOf(fund.sprint) > i;
            return `
                <div style="flex:1; height:6px; border-radius:3px; background:${isPast ? '#10b981' : isActive ? urgency : 'rgba(255,255,255,0.06)'};" title="${phase.phase}"></div>`;
        }).join('')}
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:var(--space-md);">
              ${SPRINT_TEMPLATE.map((phase, i) => {
            const isActive = phase.phase === fund.sprint.phase;
            return `<span style="font-size:0.6rem; color:${isActive ? 'var(--text-primary)' : 'var(--text-muted)'}; font-weight:${isActive ? '700' : '400'};">${phase.icon} ${phase.phase}</span>`;
        }).join('')}
            </div>

            <!-- Current Phase Tasks -->
            <div style="background:rgba(255,255,255,0.03); border-radius:8px; padding:var(--space-md);">
              <div style="font-weight:700; font-size:var(--font-sm); margin-bottom:var(--space-sm);">
                ${fund.sprint.icon} Current Phase: ${fund.sprint.phase}
              </div>
              <ul style="margin:0; padding-left:var(--space-lg);">
                ${fund.sprint.tasks.map(task => `
                  <li style="font-size:var(--font-xs); color:var(--text-secondary); margin-bottom:4px;">${task}</li>
                `).join('')}
              </ul>
            </div>
          </div>`;
    }).join('')}
      </div>` : `
      <div class="empty-state" style="margin-bottom:var(--space-2xl);">
        <div class="empty-icon">📅</div>
        <div class="empty-title">No open deadlines</div>
        <div class="empty-desc">All funds are either closed or upcoming</div>
      </div>`}

      <!-- Funder Intelligence Profiles -->
      <h2 style="margin-bottom:var(--space-md);">🏢 Know Your Funders</h2>
      <p style="font-size:var(--font-sm); color:var(--text-muted); margin-bottom:var(--space-lg);">
        Hidden scoring rubrics and strategy for each funder. This is what £5K–£15K grant consultants charge for.
      </p>

      <div style="display:flex; flex-direction:column; gap:var(--space-lg);">
        ${Object.entries(FUNDER_INTELLIGENCE).map(([funder, intel]) => `
          <div class="card" id="funder-${funder.replace(/[^a-z]/gi, '')}">
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:var(--space-sm); margin-bottom:var(--space-md);">
              <h3 style="margin:0; font-size:var(--font-lg);">🏢 ${funder}</h3>
              <span style="font-size:var(--font-xs); color:var(--text-muted);">Success rate: ${intel.successRate}</span>
            </div>

            <!-- Scoring Weights -->
            <div style="margin-bottom:var(--space-md);">
              <div style="font-weight:700; font-size:var(--font-sm); margin-bottom:var(--space-sm);">📊 Scoring Criteria</div>
              ${intel.scoringWeights.map(w => `
                <div style="margin-bottom:var(--space-xs);">
                  <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                    <span style="font-size:var(--font-xs);">${w.area}</span>
                    <span style="font-size:var(--font-xs); font-weight:700;">${w.weight}%</span>
                  </div>
                  <div style="height:5px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden;">
                    <div style="height:100%; width:${w.weight}%; background:linear-gradient(90deg,#6366f1,#06b6d4); border-radius:3px;"></div>
                  </div>
                  <div style="font-size:0.65rem; color:var(--text-muted); margin-top:1px;">${w.desc}</div>
                </div>
              `).join('')}
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-md); margin-bottom:var(--space-md);">
              <!-- Green Flags -->
              <div style="background:rgba(16,185,129,0.04); border-radius:8px; padding:var(--space-md);">
                <div style="font-weight:700; font-size:var(--font-sm); color:#10b981; margin-bottom:var(--space-sm);">✅ Green Flags</div>
                ${intel.greenFlags.map(f => `<div style="font-size:var(--font-xs); color:var(--text-secondary); margin-bottom:4px;">• ${f}</div>`).join('')}
              </div>
              <!-- Red Flags -->
              <div style="background:rgba(239,68,68,0.04); border-radius:8px; padding:var(--space-md);">
                <div style="font-weight:700; font-size:var(--font-sm); color:#ef4444; margin-bottom:var(--space-sm);">🚩 Red Flags</div>
                ${intel.redFlags.map(f => `<div style="font-size:var(--font-xs); color:var(--text-secondary); margin-bottom:4px;">• ${f}</div>`).join('')}
              </div>
            </div>

            <!-- Strategy -->
            <div style="background:rgba(99,102,241,0.04); border-radius:8px; padding:var(--space-md); margin-bottom:var(--space-sm);">
              <div style="font-weight:700; font-size:var(--font-sm); margin-bottom:var(--space-xs);">🏆 Typical Winner</div>
              <div style="font-size:var(--font-xs); color:var(--text-secondary);">${intel.typicalWinner}</div>
            </div>
            <div style="background:rgba(99,102,241,0.04); border-radius:8px; padding:var(--space-md);">
              <div style="font-weight:700; font-size:var(--font-sm); margin-bottom:var(--space-xs);">✍️ Application Style</div>
              <div style="font-size:var(--font-xs); color:var(--text-secondary);">${intel.applicationStyle}</div>
            </div>

            <!-- Tips -->
            <div style="margin-top:var(--space-md);">
              <div style="font-weight:700; font-size:var(--font-sm); margin-bottom:var(--space-xs);">💡 Pro Tips</div>
              <ul style="margin:0; padding-left:var(--space-lg);">
                ${intel.tips.map(t => `<li style="font-size:var(--font-xs); color:var(--text-secondary); margin-bottom:3px;">${t}</li>`).join('')}
              </ul>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
}
