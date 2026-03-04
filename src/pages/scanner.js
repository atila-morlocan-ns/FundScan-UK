// ═══════════════════════════════════════════════════════
// FundScan UK — Scanner Page
// Search, filter, and discover funding opportunities
// ═══════════════════════════════════════════════════════

import { fundingSources, SECTORS, STAGES, FUNDING_TYPES, formatAmount, daysUntil } from '../data/funding-sources.js';
import { getProfile, getLastScan, setLastScan } from '../store.js';
import { sortByMatch, calculateMatchScore } from '../match-engine.js';
import { renderFundingCard } from '../components.js';

let currentFilters = {
    search: '',
    sector: '',
    stage: '',
    type: '',
    status: '',
    sort: 'match',
};

function filterFunding() {
    const profile = getProfile();
    let results = sortByMatch(fundingSources, profile);

    // Search
    if (currentFilters.search) {
        const q = currentFilters.search.toLowerCase();
        results = results.filter(f =>
            f.name.toLowerCase().includes(q) ||
            f.provider.toLowerCase().includes(q) ||
            f.description.toLowerCase().includes(q)
        );
    }

    // Sector
    if (currentFilters.sector) {
        results = results.filter(f => f.sectors.includes(currentFilters.sector));
    }

    // Stage
    if (currentFilters.stage) {
        results = results.filter(f => f.stages.includes(currentFilters.stage));
    }

    // Type
    if (currentFilters.type) {
        results = results.filter(f => f.type === currentFilters.type);
    }

    // Status
    if (currentFilters.status) {
        results = results.filter(f => f.status === currentFilters.status);
    }

    // Sort
    if (currentFilters.sort === 'deadline') {
        results.sort((a, b) => {
            const da = daysUntil(a.closeDate);
            const db = daysUntil(b.closeDate);
            if (da <= 0 && db <= 0) return 0;
            if (da <= 0) return 1;
            if (db <= 0) return -1;
            return da - db;
        });
    } else if (currentFilters.sort === 'amount') {
        results.sort((a, b) => b.amountMax - a.amountMax);
    }
    // default: match (already sorted)

    return results;
}

function updateResults() {
    const results = filterFunding();
    const grid = document.getElementById('scanner-results');
    const countEl = document.getElementById('result-count');

    if (grid) {
        if (results.length === 0) {
            grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">No matching opportunities</div>
          <div class="empty-desc">Try adjusting your filters or search terms</div>
        </div>
      `;
        } else {
            grid.innerHTML = results.map(f => renderFundingCard(f, f.matchScore)).join('');
        }
    }

    if (countEl) {
        countEl.textContent = `${results.length} opportunit${results.length === 1 ? 'y' : 'ies'} found`;
    }
}

export function renderScanner() {
    const lastScan = getLastScan();
    const lastScanText = lastScan
        ? new Date(lastScan).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        : 'Never';

    // Check for URL params (e.g., from sector click)
    const hash = window.location.hash;
    const sectorParam = hash.includes('?sector=') ? hash.split('?sector=')[1] : '';
    if (sectorParam) currentFilters.sector = sectorParam;

    return `
    <div class="container">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:var(--space-md); margin-bottom:var(--space-lg);">
        <div>
          <h1 style="font-size:var(--font-3xl); font-weight:800; letter-spacing:-0.02em;">Funding Scanner</h1>
          <p style="color:var(--text-secondary); font-size:var(--font-sm); margin-top:4px;">Discover opportunities matched to your startup</p>
        </div>
        <div style="display:flex; align-items:center; gap:var(--space-md);">
          <div class="scan-indicator" id="scan-indicator">
            <span class="scan-dot"></span>
            <span>Last scan: ${lastScanText}</span>
          </div>
          <button class="btn btn-primary" id="scan-btn" onclick="window.__doScan()">
            ⚡ Scan Now
          </button>
        </div>
      </div>

      <!-- Search -->
      <div class="search-container">
        <span class="search-icon">🔍</span>
        <input type="text" class="search-input" id="search-input"
          placeholder="Search grants, programmes, providers..."
          value="${currentFilters.search}">
      </div>

      <!-- Filters -->
      <div class="card-flat filter-bar">
        <div class="filter-group">
          <label class="filter-label">Sector</label>
          <select class="filter-select" id="filter-sector">
            <option value="">All Sectors</option>
            ${SECTORS.map(s => `<option value="${s.id}" ${currentFilters.sector === s.id ? 'selected' : ''}>${s.icon} ${s.name}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Stage</label>
          <select class="filter-select" id="filter-stage">
            <option value="">All Stages</option>
            ${STAGES.map(s => `<option value="${s.id}" ${currentFilters.stage === s.id ? 'selected' : ''}>${s.icon} ${s.name}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Type</label>
          <select class="filter-select" id="filter-type">
            <option value="">All Types</option>
            ${FUNDING_TYPES.map(t => `<option value="${t.id}" ${currentFilters.type === t.id ? 'selected' : ''}>${t.icon} ${t.name}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Status</label>
          <select class="filter-select" id="filter-status">
            <option value="">All</option>
            <option value="open" ${currentFilters.status === 'open' ? 'selected' : ''}>🟢 Open</option>
            <option value="upcoming" ${currentFilters.status === 'upcoming' ? 'selected' : ''}>🔵 Upcoming</option>
            <option value="closed" ${currentFilters.status === 'closed' ? 'selected' : ''}>⚪ Closed</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Sort By</label>
          <select class="filter-select" id="filter-sort">
            <option value="match" ${currentFilters.sort === 'match' ? 'selected' : ''}>🎯 Best Match</option>
            <option value="deadline" ${currentFilters.sort === 'deadline' ? 'selected' : ''}>⏰ Deadline</option>
            <option value="amount" ${currentFilters.sort === 'amount' ? 'selected' : ''}>💰 Amount</option>
          </select>
        </div>
      </div>

      <!-- Results -->
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--space-md);">
        <span id="result-count" style="font-size:var(--font-sm); color:var(--text-secondary);"></span>
        <button class="btn btn-secondary" style="font-size:var(--font-xs);" onclick="window.__resetFilters()">✕ Clear filters</button>
      </div>

      <div class="funding-grid" id="scanner-results"></div>
    </div>
  `;
}

export function afterRenderScanner() {
    // Bind events
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentFilters.search = e.target.value;
            updateResults();
        });
    }

    ['sector', 'stage', 'type', 'status', 'sort'].forEach(key => {
        const el = document.getElementById(`filter-${key}`);
        if (el) {
            el.addEventListener('change', (e) => {
                currentFilters[key] = e.target.value;
                updateResults();
            });
        }
    });

    // Scan button
    window.__doScan = () => {
        const indicator = document.getElementById('scan-indicator');
        const btn = document.getElementById('scan-btn');
        if (indicator) indicator.classList.add('scanning');
        if (btn) { btn.disabled = true; btn.textContent = '⚡ Scanning...'; }

        setTimeout(() => {
            setLastScan();
            if (indicator) {
                indicator.classList.remove('scanning');
                indicator.innerHTML = `<span class="scan-dot"></span><span>Last scan: Just now</span>`;
            }
            if (btn) { btn.disabled = false; btn.textContent = '⚡ Scan Now'; }
            updateResults();
        }, 2000);
    };

    // Reset filters
    window.__resetFilters = () => {
        currentFilters = { search: '', sector: '', stage: '', type: '', status: '', sort: 'match' };
        document.getElementById('search-input').value = '';
        document.getElementById('filter-sector').value = '';
        document.getElementById('filter-stage').value = '';
        document.getElementById('filter-type').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-sort').value = 'match';
        updateResults();
    };

    // Initial render
    updateResults();
}
