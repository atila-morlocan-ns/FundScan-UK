// ═══════════════════════════════════════════════════════
// FundScan UK — Client-Side Router
// Hash-based SPA routing with transitions
// ═══════════════════════════════════════════════════════

export class Router {
    constructor(routes) {
        this.routes = routes;
        this.currentRoute = null;
        this.container = null;
        this.onNavigate = null;

        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    mount(container) {
        this.container = container;
        this.handleRoute();
    }

    handleRoute() {
        const hash = window.location.hash.slice(1) || '/dashboard';
        const parts = hash.split('/').filter(Boolean);
        const path = '/' + parts[0];
        const params = parts.slice(1);

        const route = this.routes.find(r => r.path === path);
        if (!route) {
            this.navigate('/dashboard');
            return;
        }

        this.currentRoute = path;

        if (this.container && route.render) {
            try {
                this.container.innerHTML = '<div class="page">' + route.render(params) + '</div>';

                if (route.afterRender) {
                    route.afterRender(params);
                }
            } catch (err) {
                console.error(`[FundScan] Page crash on ${path}:`, err);
                this.container.innerHTML = `
                    <div class="page">
                      <div class="container" style="text-align:center; padding:var(--space-3xl) var(--space-xl);">
                        <div style="font-size:3rem; margin-bottom:var(--space-md);">⚠️</div>
                        <h1 style="font-size:var(--font-2xl); font-weight:800; margin-bottom:var(--space-sm);">Something went wrong</h1>
                        <p style="color:var(--text-secondary); margin-bottom:var(--space-sm);">This page encountered an error and couldn't load.</p>
                        <pre style="text-align:left; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); border-radius:8px; padding:var(--space-md); font-size:var(--font-xs); color:#f87171; overflow-x:auto; max-width:600px; margin:0 auto var(--space-lg);">${err.message || err}</pre>
                        <div style="display:flex; gap:var(--space-sm); justify-content:center;">
                          <a href="#/dashboard" class="btn btn-primary">🏠 Go Home</a>
                          <button class="btn btn-secondary" onclick="location.reload()">🔄 Reload</button>
                        </div>
                      </div>
                    </div>`;
            }

            // Scroll to top on every navigation
            window.scrollTo(0, 0);
        }

        if (this.onNavigate) {
            this.onNavigate(path);
        }
    }

    navigate(path) {
        window.location.hash = path;
    }

    getCurrentPath() {
        return window.location.hash.slice(1) || '/dashboard';
    }
}
