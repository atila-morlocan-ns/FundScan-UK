// ═══════════════════════════════════════════════════════
// FundScan UK — Evidence Vault Page
// Track your application evidence documents
// ═══════════════════════════════════════════════════════

import { EVIDENCE_TYPES, FUNDER_INTELLIGENCE } from '../data/grant-strategy.js';
import { getEvidence, saveEvidence, removeEvidence } from '../store.js';

export function renderVault() {
    const evidence = getEvidence();
    const totalTypes = EVIDENCE_TYPES.length;
    const completedCount = Object.keys(evidence).length;
    const completionPct = Math.round((completedCount / totalTypes) * 100);

    return `
    <div class="container" style="max-width:1000px;">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:var(--space-md); margin-bottom:var(--space-xl);">
        <div>
          <h1 style="font-size:var(--font-3xl); font-weight:800; letter-spacing:-0.02em;">📂 Evidence Vault</h1>
          <p style="color:var(--text-secondary); font-size:var(--font-sm); margin-top:4px;">
            Track the evidence you need for strong applications
          </p>
        </div>
        <div class="card" style="padding:var(--space-md) var(--space-lg); display:flex; align-items:center; gap:var(--space-md);">
          <div style="position:relative; width:56px; height:56px;">
            <svg viewBox="0 0 36 36" style="width:56px;height:56px;transform:rotate(-90deg);">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="${completionPct >= 80 ? '#10b981' : completionPct >= 50 ? '#f59e0b' : '#6366f1'}" stroke-width="3"
                stroke-dasharray="${completionPct} ${100 - completionPct}" stroke-linecap="round"/>
            </svg>
            <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:var(--font-sm);">${completionPct}%</span>
          </div>
          <div>
            <div style="font-weight:700; font-size:var(--font-lg);">${completedCount}/${totalTypes}</div>
            <div style="color:var(--text-muted); font-size:var(--font-xs);">Evidence Ready</div>
          </div>
        </div>
      </div>

      <!-- Evidence Cards -->
      <div class="vault-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:var(--space-md);">
        ${EVIDENCE_TYPES.map(type => {
        const saved = evidence[type.id];
        const isComplete = !!saved;
        return `
          <div class="card vault-card ${isComplete ? 'vault-complete' : ''}" style="position:relative; ${isComplete ? 'border-color:rgba(16,185,129,0.3);' : ''}">
            <div style="display:flex; align-items:center; gap:var(--space-sm); margin-bottom:var(--space-sm);">
              <span style="font-size:1.5rem;">${type.icon}</span>
              <div style="flex:1;">
                <div style="font-weight:700; font-size:var(--font-md);">${type.name}</div>
                <div style="font-size:var(--font-xs); color:var(--text-muted);">${type.desc}</div>
              </div>
              <span style="font-size:1.2rem;">${isComplete ? '✅' : '⬜'}</span>
            </div>
            
            <div style="font-size:var(--font-xs); color:var(--text-secondary); margin-bottom:var(--space-sm);">
              <strong>Needed by:</strong> ${type.funders.join(', ')}
            </div>

            ${isComplete ? `
              <div style="background:rgba(16,185,129,0.08); border-radius:8px; padding:var(--space-sm); margin-bottom:var(--space-sm);">
                <div style="font-size:var(--font-xs); color:#10b981; font-weight:600;">📎 ${saved.fileName || 'Document ready'}</div>
                ${saved.notes ? `<div style="font-size:var(--font-xs); color:var(--text-muted); margin-top:2px;">${saved.notes}</div>` : ''}
                <div style="font-size:var(--font-xs); color:var(--text-muted); margin-top:2px;">Updated: ${new Date(saved.updatedAt).toLocaleDateString('en-GB')}</div>
              </div>
              <div style="display:flex; gap:var(--space-xs);">
                <button class="btn btn-secondary" style="font-size:var(--font-xs); flex:1;" onclick="window.__editEvidence('${type.id}')">✏️ Edit</button>
                <button class="btn btn-secondary" style="font-size:var(--font-xs); color:var(--accent-warning);" onclick="window.__removeEvidence('${type.id}')">🗑️</button>
              </div>
            ` : `
              <button class="btn btn-primary" style="font-size:var(--font-xs); width:100%;" onclick="window.__addEvidence('${type.id}')">
                + Mark as Ready
              </button>
            `}
          </div>
        `}).join('')}
      </div>

      <!-- Per-Funder Readiness -->
      <h2 style="margin-top:var(--space-2xl); margin-bottom:var(--space-md);">🎯 Your Readiness per Funder</h2>
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:var(--space-md);">
        ${Object.entries(FUNDER_INTELLIGENCE).map(([funder, intel]) => {
            const relevantTypes = EVIDENCE_TYPES.filter(t => t.funders.includes(funder));
            const ready = relevantTypes.filter(t => evidence[t.id]);
            const pct = relevantTypes.length > 0 ? Math.round((ready.length / relevantTypes.length) * 100) : 0;
            return `
          <div class="card" style="padding:var(--space-md);">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--space-sm);">
              <strong style="font-size:var(--font-sm);">${funder}</strong>
              <span style="font-size:var(--font-xs); font-weight:700; color:${pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'};">${pct}%</span>
            </div>
            <div style="height:6px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden;">
              <div style="height:100%; width:${pct}%; background:${pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#6366f1'}; border-radius:3px; transition:width 0.4s;"></div>
            </div>
            <div style="font-size:var(--font-xs); color:var(--text-muted); margin-top:var(--space-xs);">
              ${ready.length}/${relevantTypes.length} evidence items ready
            </div>
            <div style="margin-top:var(--space-xs);">
              ${relevantTypes.map(t => `<span style="font-size:0.7rem; margin-right:4px;" title="${t.name}">${evidence[t.id] ? '✅' : '⬜'}</span>`).join('')}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

export function afterRenderVault() {
    window.__addEvidence = (typeId) => {
        const type = EVIDENCE_TYPES.find(t => t.id === typeId);
        const fileName = prompt(`📎 ${type.name}\n\nEnter a document name or description:`);
        if (fileName) {
            const notes = prompt('Any notes? (optional)') || '';
            saveEvidence(typeId, { fileName, notes, status: 'ready' });
            location.reload();
        }
    };

    window.__editEvidence = (typeId) => {
        const existing = getEvidence()[typeId];
        const type = EVIDENCE_TYPES.find(t => t.id === typeId);
        const fileName = prompt(`✏️ ${type.name}\n\nUpdate document name:`, existing?.fileName || '');
        if (fileName) {
            const notes = prompt('Update notes:', existing?.notes || '') || '';
            saveEvidence(typeId, { fileName, notes, status: 'ready' });
            location.reload();
        }
    };

    window.__removeEvidence = (typeId) => {
        if (confirm('Remove this evidence item?')) {
            removeEvidence(typeId);
            location.reload();
        }
    };
}
