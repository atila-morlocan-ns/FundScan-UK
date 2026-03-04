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
            this.container.innerHTML = '';
            this.container.innerHTML = '<div class="page">' + route.render(params) + '</div>';

            if (route.afterRender) {
                route.afterRender(params);
            }
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
