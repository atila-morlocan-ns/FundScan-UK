// ═══════════════════════════════════════════════════════
// FundScan UK — Main Entry Point
// App shell, navigation, and router setup
// ═══════════════════════════════════════════════════════

import './styles/index.css';
import { Router } from './router.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderScanner, afterRenderScanner } from './pages/scanner.js';
import { renderDetail } from './pages/detail.js';
import { renderProfile, afterRenderProfile } from './pages/profile.js';
import { renderAlerts, afterRenderAlerts } from './pages/alerts.js';
import { renderVault, afterRenderVault } from './pages/vault.js';
import { renderStack, afterRenderStack } from './pages/stack.js';
import { renderStrategy } from './pages/strategy.js';
import { renderRegional } from './pages/regional.js';
import { fundingSources, daysUntil } from './data/funding-sources.js';
import { setLastVisit } from './store.js';

// Count urgent alerts
function getUrgentCount() {
    let count = 0;
    fundingSources.forEach(f => {
        if (f.status === 'open' && daysUntil(f.closeDate) > 0 && daysUntil(f.closeDate) <= 30) {
            count++;
        }
    });
    return count;
}

// Render app shell
function renderShell() {
    const urgentCount = getUrgentCount();

    const app = document.getElementById('app');
    app.innerHTML = `
    <!-- Navigation -->
    <nav class="navbar" id="navbar">
      <a href="#/dashboard" class="navbar-brand">
        <span class="brand-icon">⚡</span>
        FundScan UK
      </a>
      <ul class="navbar-links" id="nav-links">
        <li><a href="#/dashboard" data-route="/dashboard">🏠 Dashboard</a></li>
        <li><a href="#/scanner" data-route="/scanner">🔍 Scanner</a></li>
        <li>
          <a href="#/alerts" data-route="/alerts">
            📢 Alerts
            ${urgentCount > 0 ? `<span class="nav-badge">${urgentCount}</span>` : ''}
          </a>
        </li>
        <li><a href="#/vault" data-route="/vault">📂 Vault</a></li>
        <li><a href="#/stack" data-route="/stack">🧩 Stack</a></li>
        <li><a href="#/strategy" data-route="/strategy">⏰ Strategy</a></li>
        <li><a href="#/regional" data-route="/regional">🗺️ Surrey</a></li>
        <li><a href="#/profile" data-route="/profile">⚙️ Profile</a></li>
      </ul>
      <button class="mobile-menu-btn" id="mobile-menu-btn">☰</button>
    </nav>

    <!-- Page Container -->
    <main class="main-content" id="page-container"></main>

    <!-- Footer -->
    <footer style="
      text-align:center;
      padding: var(--space-xl) var(--space-xl) var(--space-2xl);
      color: var(--text-muted);
      font-size: var(--font-xs);
      border-top: 1px solid var(--border-glass);
    ">
      <div style="margin-bottom:var(--space-sm);">
        <span class="navbar-brand" style="font-size:var(--font-sm); display:inline-flex;">
          <span class="brand-icon" style="width:20px;height:20px;font-size:0.7rem;">⚡</span>
          FundScan UK
        </span>
      </div>
      <p>Helping UK startups find the right funding since 2026</p>
      <p style="margin-top:4px;">Data sourced from Innovate UK, UKRI, HMRC & more. Always verify details on official sources.</p>
    </footer>
  `;

    return document.getElementById('page-container');
}

// Setup router
function setupRouter(container) {
    const router = new Router([
        {
            path: '/dashboard',
            render: () => renderDashboard(),
        },
        {
            path: '/scanner',
            render: () => renderScanner(),
            afterRender: () => afterRenderScanner(),
        },
        {
            path: '/detail',
            render: (params) => renderDetail(params),
        },
        {
            path: '/profile',
            render: () => renderProfile(),
            afterRender: () => afterRenderProfile(),
        },
        {
            path: '/alerts',
            render: () => renderAlerts(),
            afterRender: () => afterRenderAlerts(),
        },
        {
            path: '/vault',
            render: () => renderVault(),
            afterRender: () => afterRenderVault(),
        },
        {
            path: '/stack',
            render: () => renderStack(),
            afterRender: () => afterRenderStack(),
        },
        {
            path: '/strategy',
            render: () => renderStrategy(),
        },
        {
            path: '/regional',
            render: () => renderRegional(),
        },
    ]);

    // Update active nav link
    router.onNavigate = (path) => {
        document.querySelectorAll('.navbar-links a').forEach(link => {
            const route = link.getAttribute('data-route');
            if (route === path) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    };

    router.mount(container);
}

// Mobile menu toggle
function setupMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const links = document.getElementById('nav-links');

    if (btn && links) {
        btn.addEventListener('click', () => {
            links.classList.toggle('open');
            btn.textContent = links.classList.contains('open') ? '✕' : '☰';
        });

        // Close menu on link click
        links.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                links.classList.remove('open');
                btn.textContent = '☰';
            });
        });
    }
}

// Initialize
function init() {
    const container = renderShell();
    setupRouter(container);
    setupMobileMenu();
}

// Boot
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
