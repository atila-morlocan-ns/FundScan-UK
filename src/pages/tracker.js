// ═══════════════════════════════════════════════════════
// FundScan UK — Application Tracker Page
// Kanban pipeline: Researching → Preparing → Submitted → Outcome
// ═══════════════════════════════════════════════════════

import { fundingSources, formatAmount, daysUntil } from '../data/funding-sources.js';
import { getTrackerItems, updateTrackerStage, updateTrackerOutcome, updateTrackerNotes, removeTrackerItem, TRACKER_STAGES, getProfile } from '../store.js';
import { calculateMatchScore, getEffectiveStatus } from '../match-engine.js';
import { showToast } from '../toast.js';

export function renderTracker() {
    const items = getTrackerItems();
    const profile = getProfile();

    // Enrich with fund data
    const enriched = items.map(t => {
        const fund = fundingSources.find(f => f.id === t.fundId);
        if (!fund) return null;
        return {
            ...t,
            fund,
            matchScore: calculateMatchScore(fund, profile),
            effectiveStatus: getEffectiveStatus(fund),
            daysLeft: daysUntil(fund.closeDate),
        };
    }).filter(Boolean);

    // Stats
    const totalTracked = enriched.length;
    const totalPotential = enriched.reduce((sum, i) => sum + (i.fund.amountMax || i.fund.amountMin || 0), 0);
    const wonItems = enriched.filter(i => i.stage === 'outcome' && i.outcome === 'won');
    const wonValue = wonItems.reduce((sum, i) => sum + (i.fund.amountMax || i.fund.amountMin || 0), 0);

    return `
    <div class="container" style="max-width:1400px;">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:var(--space-md); margin-bottom:var(--space-xl);">
        <div>
          <h1 style="font-size:var(--font-3xl); font-weight:800; letter-spacing:-0.02em;">
            📊 Application Tracker
          </h1>
          <p style="color:var(--text-secondary); font-size:var(--font-sm); margin-top:4px;">
            Track your applications from research to outcome
          </p>
        </div>
        <div style="display:flex; gap:var(--space-sm);">
          <a href="#/shortlist" class="btn btn-secondary">⭐ Shortlist</a>
          <a href="#/scanner" class="btn btn-secondary">🔍 Scanner</a>
        </div>
      </div>

      ${totalTracked > 0 ? `
      <!-- Stats -->
      <div class="stats-row" style="margin-bottom:var(--space-xl);">
        <div class="card stat-card">
          <div class="stat-number">${totalTracked}</div>
          <div class="stat-label">Tracked</div>
        </div>
        ${TRACKER_STAGES.map(stage => {
            const count = enriched.filter(i => i.stage === stage.id).length;
            return `<div class="card stat-card">
                <div class="stat-number" style="${count > 0 ? `color:${stage.color};` : ''}">${count}</div>
                <div class="stat-label">${stage.label}</div>
            </div>`;
        }).join('')}
        <div class="card stat-card">
          <div class="stat-number" style="font-size:var(--font-xl); ${wonValue > 0 ? 'color:#10b981;' : ''}">£${wonValue >= 1000000 ? (wonValue / 1000000).toFixed(1) + 'M' : Math.round(wonValue / 1000) + 'K'}</div>
          <div class="stat-label">🏆 Won</div>
        </div>
      </div>

      <!-- Kanban Board -->
      <div class="kanban-board">
        ${TRACKER_STAGES.map((stage, idx) => {
            const stageItems = enriched.filter(i => i.stage === stage.id);
            return `
            <div class="kanban-column">
              <div class="kanban-column-header" style="border-top:3px solid ${stage.color};">
                <span>${stage.label}</span>
                <span class="kanban-count" style="background:${stage.color}20; color:${stage.color};">${stageItems.length}</span>
              </div>
              <div class="kanban-cards">
                ${stageItems.length > 0 ? stageItems.map(item => renderTrackerCard(item, idx)).join('') : `
                <div class="kanban-empty">
                  <span style="font-size:1.2rem; opacity:0.5;">${['🔍','✏️','📤','🏆'][idx]}</span>
                  <span style="font-size:var(--font-xs); color:var(--text-muted);">No items</span>
                </div>
                `}
              </div>
            </div>`;
        }).join('')}
      </div>
      ` : `
      <!-- Empty State -->
      <div class="card" style="text-align:center; padding:var(--space-2xl) var(--space-xl);">
        <div style="font-size:3rem; margin-bottom:var(--space-md);">📊</div>
        <div style="font-size:var(--font-xl); font-weight:700; margin-bottom:var(--space-sm);">No applications being tracked</div>
        <div style="color:var(--text-secondary); font-size:var(--font-sm); margin-bottom:var(--space-lg); max-width:450px; margin-inline:auto;">
          Shortlist funds you're interested in, then click "Start Tracking" to move them into your application pipeline.
        </div>
        <div style="display:flex; gap:var(--space-md); justify-content:center; flex-wrap:wrap;">
          <a href="#/shortlist" class="btn btn-secondary btn-lg">⭐ Shortlist</a>
          <a href="#/scanner" class="btn btn-primary btn-lg">🔍 Browse Scanner</a>
        </div>
      </div>
      `}
    </div>
  `;
}

function renderTrackerCard(item, stageIdx) {
    const { fund, matchScore, effectiveStatus, daysLeft, notes, outcome } = item;
    const stageCount = TRACKER_STAGES.length;

    // Deadline urgency
    let deadlineHtml = '';
    if (effectiveStatus === 'open' && daysLeft > 0 && daysLeft <= 30) {
        deadlineHtml = `<div style="font-size:0.65rem; color:${daysLeft <= 7 ? '#ef4444' : '#f59e0b'}; font-weight:600; margin-top:4px;">⏰ ${daysLeft}d left</div>`;
    }

    // Outcome selector for outcome stage
    const outcomeHtml = item.stage === 'outcome' ? `
    <div class="tracker-outcome" style="margin-top:6px;">
      <select class="form-select" style="font-size:0.65rem; padding:2px 6px; background:var(--bg-secondary);" data-outcome-select data-fund-id="${fund.id}">
        <option value="won" ${outcome === 'won' ? 'selected' : ''}>✅ Won</option>
        <option value="lost" ${outcome === 'lost' ? 'selected' : ''}>❌ Lost</option>
        <option value="withdrawn" ${outcome === 'withdrawn' ? 'selected' : ''}>⚪ Withdrawn</option>
      </select>
    </div>` : '';

    // Move buttons
    const prevStage = stageIdx > 0 ? TRACKER_STAGES[stageIdx - 1] : null;
    const nextStage = stageIdx < stageCount - 1 ? TRACKER_STAGES[stageIdx + 1] : null;

    return `
    <div class="kanban-card" data-fund-id="${fund.id}">
      <a href="#/detail/${fund.id}" class="kanban-card-title">${fund.name}</a>
      <div class="kanban-card-provider">${fund.provider}</div>
      <div style="display:flex; align-items:center; justify-content:space-between; margin:4px 0;">
        <span style="font-size:0.7rem; color:var(--accent-success); font-weight:600;">${formatAmount(fund.amountMin, fund.amountMax)}</span>
        ${matchScore > 0 ? `<span style="font-size:0.65rem; color:var(--text-muted);">${matchScore}% match</span>` : ''}
      </div>
      ${deadlineHtml}
      ${outcomeHtml}

      <!-- Notes -->
      <textarea class="kanban-note" data-note-input data-fund-id="${fund.id}" placeholder="Notes..." rows="2">${notes || ''}</textarea>

      <!-- Actions -->
      <div class="kanban-card-actions">
        <div style="display:flex; gap:4px; flex:1;">
          ${prevStage ? `<button class="kanban-move-btn" data-move="prev" data-fund-id="${fund.id}" data-stage="${prevStage.id}" title="Move to ${prevStage.label}">← ${prevStage.label.split(' ')[0]}</button>` : ''}
          ${nextStage ? `<button class="kanban-move-btn next" data-move="next" data-fund-id="${fund.id}" data-stage="${nextStage.id}" title="Move to ${nextStage.label}">${nextStage.label.split(' ')[0]} →</button>` : ''}
        </div>
        <button class="kanban-remove-btn" data-action="remove-tracker" data-fund-id="${fund.id}" title="Remove from tracker">✕</button>
      </div>
    </div>
  `;
}

export function afterRenderTracker() {
    // Move buttons
    document.querySelectorAll('.kanban-move-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const fundId = btn.dataset.fundId;
            const stage = btn.dataset.stage;
            updateTrackerStage(fundId, stage);
            const stageInfo = TRACKER_STAGES.find(s => s.id === stage);
            showToast(`Moved to ${stageInfo?.label || stage}`, 'info');
            // Re-render
            window.location.hash = '#/tracker';
        });
    });

    // Outcome select
    document.querySelectorAll('[data-outcome-select]').forEach(select => {
        select.addEventListener('change', () => {
            updateTrackerOutcome(select.dataset.fundId, select.value);
        });
    });

    // Notes auto-save
    document.querySelectorAll('[data-note-input]').forEach(textarea => {
        textarea.addEventListener('blur', () => {
            updateTrackerNotes(textarea.dataset.fundId, textarea.value.trim());
            showToast('Notes saved', 'success', 2000);
        });
    });

    // Remove button
    document.querySelectorAll('[data-action="remove-tracker"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Remove this fund from your tracker?')) {
                removeTrackerItem(btn.dataset.fundId);
                showToast('Removed from tracker', 'info');
                window.location.hash = '#/tracker';
            }
        });
    });
}
