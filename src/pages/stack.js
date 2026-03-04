// ═══════════════════════════════════════════════════════
// FundScan UK — Funding Stack Planner
// Plan your multi-source funding strategy
// ═══════════════════════════════════════════════════════

import { fundingSources, formatAmount, daysUntil } from '../data/funding-sources.js';
import { STACK_RULES } from '../data/grant-strategy.js';
import { getStack, addToStack, removeFromStack, updateStackItem, getProfile } from '../store.js';
import { calculateMatchScore } from '../match-engine.js';

const STACK_STATUSES = [
    { id: 'target', label: '🎯 Target', color: '#6366f1' },
    { id: 'preparing', label: '📋 Preparing', color: '#f59e0b' },
    { id: 'submitted', label: '📨 Submitted', color: '#06b6d4' },
    { id: 'won', label: '✅ Won', color: '#10b981' },
    { id: 'rejected', label: '❌ Rejected', color: '#ef4444' },
];

function detectConflicts(stack) {
    const warnings = [];
    const fundNames = stack.map(s => {
        const fund = fundingSources.find(f => f.id === s.fundId);
        return fund ? fund.name : '';
    });

    for (const rule of STACK_RULES) {
        if (rule.funds[0] === '*') {
            if (stack.length >= 2) warnings.push({ type: rule.type, desc: rule.desc, level: 'info' });
        } else {
            const matches = rule.funds.filter(f => fundNames.some(fn => fn.includes(f)));
            if (matches.length >= 2) {
                warnings.push({ type: rule.type, desc: rule.desc, level: 'warning' });
            }
        }
    }
    return warnings;
}

export function renderStack() {
    const stack = getStack();
    const profile = getProfile();
    const conflicts = detectConflicts(stack);

    // Calculate totals by status
    const totals = {};
    for (const s of STACK_STATUSES) totals[s.id] = { count: 0, amount: 0 };

    stack.forEach(item => {
        const fund = fundingSources.find(f => f.id === item.fundId);
        const status = item.status || 'target';
        if (totals[status] && fund) {
            totals[status].count++;
            totals[status].amount += fund.amountMax;
        }
    });

    const totalTarget = stack.reduce((sum, item) => {
        const fund = fundingSources.find(f => f.id === item.fundId);
        return sum + (fund ? fund.amountMax : 0);
    }, 0);

    // Available funds to add (not already in stack)
    const available = fundingSources
        .filter(f => !stack.find(s => s.fundId === f.id))
        .map(f => ({ ...f, matchScore: calculateMatchScore(f, profile) }))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 15);

    return `
    <div class="container" style="max-width:1100px;">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:var(--space-md); margin-bottom:var(--space-xl);">
        <div>
          <h1 style="font-size:var(--font-3xl); font-weight:800; letter-spacing:-0.02em;">🧩 Funding Stack</h1>
          <p style="color:var(--text-secondary); font-size:var(--font-sm); margin-top:4px;">
            Plan your multi-source funding strategy
          </p>
        </div>
        <div class="card" style="padding:var(--space-md) var(--space-lg); text-align:center;">
          <div style="font-size:var(--font-3xl); font-weight:800; background:linear-gradient(135deg,#10b981,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">
            £${(totalTarget / 1000).toFixed(0)}K
          </div>
          <div style="font-size:var(--font-xs); color:var(--text-muted);">Total Stack Value</div>
        </div>
      </div>

      <!-- Status Summary -->
      <div class="stats-row" style="margin-bottom:var(--space-lg);">
        ${STACK_STATUSES.map(s => `
          <div class="card stat-card" style="border-color:${totals[s.id].count > 0 ? s.color + '40' : 'transparent'};">
            <div class="stat-number" style="color:${s.color};">${totals[s.id].count}</div>
            <div class="stat-label">${s.label}</div>
          </div>
        `).join('')}
      </div>

      ${conflicts.length > 0 ? `
      <!-- Conflict Warnings -->
      <div class="card" style="margin-bottom:var(--space-lg); border-color:rgba(245,158,11,0.3); background:rgba(245,158,11,0.04);">
        <h3 style="color:var(--accent-warning); margin-bottom:var(--space-sm);">⚠️ Stack Alerts</h3>
        ${conflicts.map(c => `
          <div style="font-size:var(--font-sm); color:var(--text-secondary); padding:var(--space-xs) 0; border-bottom:1px solid rgba(255,255,255,0.04);">
            ${c.desc}
          </div>
        `).join('')}
      </div>` : ''}

      <!-- Current Stack -->
      ${stack.length > 0 ? `
      <h2 style="margin-bottom:var(--space-md);">Your Funding Stack</h2>
      <div style="display:flex; flex-direction:column; gap:var(--space-sm); margin-bottom:var(--space-2xl);">
        ${stack.map(item => {
        const fund = fundingSources.find(f => f.id === item.fundId);
        if (!fund) return '';
        const status = STACK_STATUSES.find(s => s.id === (item.status || 'target'));
        const days = daysUntil(fund.closeDate);
        const score = calculateMatchScore(fund, profile);
        return `
          <div class="card" style="padding:var(--space-md); display:flex; align-items:center; gap:var(--space-md); flex-wrap:wrap;">
            <div style="flex:1; min-width:200px;">
              <a href="#/detail/${fund.id}" style="font-weight:700; color:var(--text-primary); text-decoration:none;">${fund.name}</a>
              <div style="font-size:var(--font-xs); color:var(--text-muted);">${fund.provider} · ${formatAmount(fund.amountMin, fund.amountMax)}</div>
            </div>
            <div style="display:flex; align-items:center; gap:var(--space-sm);">
              <span class="match-badge" style="font-size:var(--font-xs);">🎯 ${score}%</span>
              ${days > 0 && days <= 30 ? `<span style="font-size:var(--font-xs); color:var(--accent-warning);">⏰ ${days}d</span>` : ''}
              <select class="filter-select" style="font-size:var(--font-xs); min-width:120px;" onchange="window.__updateStackStatus('${fund.id}', this.value)">
                ${STACK_STATUSES.map(s => `<option value="${s.id}" ${(item.status || 'target') === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}
              </select>
              <button class="btn btn-secondary" style="font-size:var(--font-xs); padding:4px 8px;" onclick="window.__removeFromStack('${fund.id}')">✕</button>
            </div>
          </div>`;
    }).join('')}
      </div>` : `
      <div class="empty-state" style="margin-bottom:var(--space-2xl);">
        <div class="empty-icon">🧩</div>
        <div class="empty-title">No funds in your stack yet</div>
        <div class="empty-desc">Add funds below to start planning your strategy</div>
      </div>`}

      <!-- Add to Stack -->
      <h2 style="margin-bottom:var(--space-md);">➕ Add to Your Stack</h2>
      <p style="font-size:var(--font-sm); color:var(--text-muted); margin-bottom:var(--space-md);">Top matches not yet in your stack:</p>
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:var(--space-sm);">
        ${available.map(fund => `
          <div class="card" style="padding:var(--space-md); cursor:pointer;" onclick="window.__addToStack('${fund.id}')">
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <div>
                <div style="font-weight:600; font-size:var(--font-sm);">${fund.name}</div>
                <div style="font-size:var(--font-xs); color:var(--text-muted);">${fund.provider} · ${formatAmount(fund.amountMin, fund.amountMax)}</div>
              </div>
              <div style="display:flex; align-items:center; gap:var(--space-xs);">
                <span class="match-badge" style="font-size:var(--font-xs);">🎯 ${fund.matchScore}%</span>
                <span style="font-size:1.2rem; color:var(--accent-primary);">+</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
}

export function afterRenderStack() {
    window.__addToStack = (fundId) => {
        addToStack({ fundId, status: 'target' });
        location.hash = '#/stack';
        location.reload();
    };

    window.__removeFromStack = (fundId) => {
        removeFromStack(fundId);
        location.reload();
    };

    window.__updateStackStatus = (fundId, status) => {
        updateStackItem(fundId, { status });
    };
}
