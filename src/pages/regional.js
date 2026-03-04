// ═══════════════════════════════════════════════════════
// FundScan UK — Regional Hub Page
// Surrey-focused Growth Hub, AHSN, Catapult, and local funds
// ═══════════════════════════════════════════════════════

import { REGIONAL_HUBS } from '../data/grant-strategy.js';

export function renderRegional() {
    const hub = REGIONAL_HUBS.surrey;

    return `
    <div class="container" style="max-width:1000px;">
      <div style="margin-bottom:var(--space-xl);">
        <h1 style="font-size:var(--font-3xl); font-weight:800; letter-spacing:-0.02em;">🗺️ Your Regional Hub</h1>
        <p style="color:var(--text-secondary); font-size:var(--font-sm); margin-top:4px;">
          Local funding, networks, and support for <strong>${hub.region}</strong>
        </p>
      </div>

      <!-- Growth Hub -->
      <div class="card" style="margin-bottom:var(--space-lg); border-color:rgba(99,102,241,0.3);">
        <div style="display:flex; align-items:center; gap:var(--space-md); margin-bottom:var(--space-md);">
          <span style="font-size:2rem;">🏛️</span>
          <div>
            <h2 style="margin:0; font-size:var(--font-xl);">${hub.growthHub.name}</h2>
            <a href="${hub.growthHub.url}" target="_blank" rel="noopener" style="font-size:var(--font-xs); color:var(--accent-primary-light);">${hub.growthHub.url} ↗</a>
          </div>
        </div>
        <p style="font-size:var(--font-sm); color:var(--text-secondary); margin-bottom:var(--space-md);">
          Your primary Growth Hub for business support, grants, and innovation programmes. Strong relationship with Surrey businesses.
        </p>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:var(--space-sm);">
          ${hub.growthHub.programmes.map(p => `
            <div style="background:rgba(99,102,241,0.06); border-radius:10px; padding:var(--space-md);">
              <div style="font-weight:700; font-size:var(--font-sm);">${p.name}</div>
              <div style="font-size:var(--font-xs); color:var(--accent-primary-light); font-weight:600; margin:4px 0;">${p.amount}</div>
              <div style="font-size:var(--font-xs); color:var(--text-muted);">${p.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- AHSN -->
      <div class="card" style="margin-bottom:var(--space-lg); border-color:rgba(236,72,153,0.3);">
        <div style="display:flex; align-items:center; gap:var(--space-md); margin-bottom:var(--space-md);">
          <span style="font-size:2rem;">🏥</span>
          <div>
            <h2 style="margin:0; font-size:var(--font-xl);">${hub.ahsn.name}</h2>
            <a href="${hub.ahsn.url}" target="_blank" rel="noopener" style="font-size:var(--font-xs); color:var(--accent-primary-light);">${hub.ahsn.url} ↗</a>
          </div>
        </div>
        <div style="background:rgba(236,72,153,0.06); border-radius:10px; padding:var(--space-md); margin-bottom:var(--space-md);">
          <div style="font-size:var(--font-sm); color:var(--text-secondary); font-style:italic;">
            "${hub.ahsn.relevance}"
          </div>
        </div>
        <div style="font-size:var(--font-xs); color:var(--text-muted); margin-bottom:var(--space-md);">
          <strong>Focus Areas:</strong> ${hub.ahsn.focus}
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:var(--space-sm);">
          ${hub.ahsn.programmes.map(p => `
            <div style="background:rgba(236,72,153,0.06); border-radius:10px; padding:var(--space-md);">
              <div style="font-weight:700; font-size:var(--font-sm);">${p.name}</div>
              <div style="font-size:var(--font-xs); color:var(--text-muted); margin-top:4px;">${p.desc}</div>
            </div>
          `).join('')}
        </div>
        <div class="card" style="margin-top:var(--space-md); background:rgba(16,185,129,0.06); border-color:rgba(16,185,129,0.2); padding:var(--space-md);">
          <div style="font-size:var(--font-sm); font-weight:700; color:#10b981; margin-bottom:var(--space-xs);">💡 Action for N&S</div>
          <div style="font-size:var(--font-sm); color:var(--text-secondary);">
            Contact KSS AHSN's Patient Safety team about your fall detection AI. They actively support falls prevention innovations and can introduce you to NHS trusts in Surrey for pilot partnerships. A letter of support from KSS AHSN significantly strengthens any SBRI or NIHR application.
          </div>
        </div>
      </div>

      <!-- Catapult -->
      <div class="card" style="margin-bottom:var(--space-lg); border-color:rgba(6,182,212,0.3);">
        <div style="display:flex; align-items:center; gap:var(--space-md); margin-bottom:var(--space-md);">
          <span style="font-size:2rem;">⚡</span>
          <div>
            <h2 style="margin:0; font-size:var(--font-xl);">${hub.catapult.name}</h2>
            <a href="${hub.catapult.url}" target="_blank" rel="noopener" style="font-size:var(--font-xs); color:var(--accent-primary-light);">${hub.catapult.url} ↗</a>
            <span style="font-size:var(--font-xs); color:var(--text-muted); margin-left:var(--space-sm);">${hub.catapult.distance}</span>
          </div>
        </div>
        <p style="font-size:var(--font-sm); color:var(--text-secondary); margin-bottom:var(--space-md);">
          ${hub.catapult.relevance}
        </p>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:var(--space-sm);">
          ${hub.catapult.programmes.map(p => `
            <div style="background:rgba(6,182,212,0.06); border-radius:10px; padding:var(--space-md);">
              <div style="font-weight:700; font-size:var(--font-sm);">${p.name}</div>
              <div style="font-size:var(--font-xs); color:var(--text-muted); margin-top:4px;">${p.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Universities (KTP Partners) -->
      <div class="card" style="margin-bottom:var(--space-lg); border-color:rgba(139,92,246,0.3);">
        <div style="display:flex; align-items:center; gap:var(--space-md); margin-bottom:var(--space-md);">
          <span style="font-size:2rem;">🎓</span>
          <h2 style="margin:0; font-size:var(--font-xl);">University Partners (KTP Eligible)</h2>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:var(--space-sm);">
          ${hub.universities.map(u => `
            <div style="background:rgba(139,92,246,0.06); border-radius:10px; padding:var(--space-md);">
              <div style="display:flex; align-items:center; gap:var(--space-sm); margin-bottom:var(--space-xs);">
                <strong style="font-size:var(--font-sm);">${u.name}</strong>
                ${u.ktp ? '<span style="font-size:var(--font-xs); background:rgba(139,92,246,0.2); color:#a855f7; padding:2px 6px; border-radius:4px;">KTP</span>' : ''}
              </div>
              <div style="font-size:var(--font-xs); color:var(--text-secondary); margin-bottom:var(--space-xs);">${u.strength}</div>
              <a href="${u.url}" target="_blank" rel="noopener" style="font-size:var(--font-xs); color:var(--accent-primary-light);">Visit ↗</a>
            </div>
          `).join('')}
        </div>
        <div class="card" style="margin-top:var(--space-md); background:rgba(16,185,129,0.06); border-color:rgba(16,185,129,0.2); padding:var(--space-md);">
          <div style="font-size:var(--font-sm); font-weight:700; color:#10b981; margin-bottom:var(--space-xs);">💡 Action for N&S</div>
          <div style="font-size:var(--font-sm); color:var(--text-secondary);">
            University of Surrey's AI and computer vision research group is an ideal KTP partner. A Knowledge Transfer Partnership covers 67% of associate costs for 12-24 months — use it to embed a computer vision researcher in your team. Next KTP Round: 24 June 2026.
          </div>
        </div>
      </div>

      <!-- Regional Investment Funds -->
      <div class="card" style="margin-bottom:var(--space-lg); border-color:rgba(16,185,129,0.3);">
        <div style="display:flex; align-items:center; gap:var(--space-md); margin-bottom:var(--space-md);">
          <span style="font-size:2rem;">💷</span>
          <h2 style="margin:0; font-size:var(--font-xl);">Regional Investment Funds</h2>
        </div>
        <div style="display:flex; flex-direction:column; gap:var(--space-sm);">
          ${hub.nearbyFunds.map(f => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:var(--space-md); background:rgba(16,185,129,0.04); border-radius:10px; flex-wrap:wrap; gap:var(--space-sm);">
              <div>
                <div style="font-weight:700; font-size:var(--font-sm);">${f.name}</div>
                <div style="font-size:var(--font-xs); color:var(--text-muted);">${f.desc}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-weight:700; color:#10b981; font-size:var(--font-sm);">${f.amount}</div>
                <div style="font-size:var(--font-xs); color:var(--text-muted);">${f.type}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Surrey Council -->
      <div class="card" style="border-color:rgba(148,163,184,0.3);">
        <div style="display:flex; align-items:center; gap:var(--space-md); margin-bottom:var(--space-md);">
          <span style="font-size:2rem;">🏛️</span>
          <div>
            <h2 style="margin:0; font-size:var(--font-xl);">${hub.council.name}</h2>
            <a href="${hub.council.url}" target="_blank" rel="noopener" style="font-size:var(--font-xs); color:var(--accent-primary-light);">${hub.council.url} ↗</a>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:var(--space-sm);">
          ${hub.council.programmes.map(p => `
            <div style="background:rgba(148,163,184,0.06); border-radius:10px; padding:var(--space-md);">
              <div style="font-weight:700; font-size:var(--font-sm);">${p.name}</div>
              <div style="font-size:var(--font-xs); color:var(--text-muted); margin-top:4px;">${p.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
}
