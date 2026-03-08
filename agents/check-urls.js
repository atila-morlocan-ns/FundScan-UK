// ═══════════════════════════════════════════════════════
// FundScan UK — URL Health Checker
// Validates ALL applicationUrls in funding-sources.js
// Run before deploy: npm run check:urls
// ═══════════════════════════════════════════════════════

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, 'data');
const REPORT_FILE = join(DATA_DIR, 'url-health-report.json');

const FETCH_TIMEOUT = 12000;
const RATE_LIMIT_MS = 1000;

// Sleep helper
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Parse funding sources from the JS module
async function loadFundingSources() {
    const filePath = join(__dirname, '..', 'src', 'data', 'funding-sources.js');
    const code = await readFile(filePath, 'utf-8');

    // Extract the array from the module using a regex approach
    // Find each { id: '...', ... applicationUrl: '...' } block
    const grants = [];
    const idMatches = code.matchAll(/id:\s*'([^']+)'/g);
    const nameMatches = code.matchAll(/name:\s*'([^']+)'/g);
    const urlMatches = code.matchAll(/applicationUrl:\s*'([^']+)'/g);

    const ids = [...idMatches].map(m => m[1]);
    const names = [...nameMatches].map(m => m[1]);
    const urls = [...urlMatches].map(m => m[1]);

    for (let i = 0; i < ids.length; i++) {
        grants.push({
            id: ids[i],
            name: names[i] || `Unknown (${ids[i]})`,
            applicationUrl: urls[i] || null,
        });
    }

    return grants;
}

// Check a single URL
async function checkUrl(url) {
    const result = {
        url,
        status: 0,
        ok: false,
        redirected: false,
        finalUrl: url,
        error: null,
        responseTime: 0,
    };

    const start = Date.now();
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml',
            },
        });

        clearTimeout(timeout);
        result.status = response.status;
        result.ok = response.ok;
        result.redirected = response.redirected;
        result.finalUrl = response.url;
        result.responseTime = Date.now() - start;

        // Check for soft 404s (page loads but shows error content)
        if (response.ok) {
            const text = await response.text();
            const lower = text.toLowerCase();

            // Detect common "page not found" patterns even on 200 status pages
            const soft404Patterns = [
                'page not found',
                'page doesn\'t exist',
                'page does not exist',
                'no longer available',
                'has been removed',
                'has been moved',
                'this page has moved',
                'error 404',
                '404 not found',
                'we can\'t find',
                'we couldn\'t find',
            ];

            const isSoft404 = soft404Patterns.some(p => lower.includes(p));
            if (isSoft404) {
                result.ok = false;
                result.error = 'Soft 404 — page returns 200 but content says "page not found"';
            }
        }

    } catch (err) {
        result.responseTime = Date.now() - start;
        result.error = err.name === 'AbortError' ? 'Timeout' : err.message;
    }

    return result;
}

// Main health check
async function runHealthCheck() {
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║  🏥 URL Health Checker — FundScan UK          ║');
    console.log('║  Validates all applicationUrls before deploy  ║');
    console.log('╚═══════════════════════════════════════════════╝');
    console.log('');

    const grants = await loadFundingSources();
    console.log(`Found ${grants.length} funding sources to check\n`);

    const results = {
        healthy: [],
        broken: [],
        warnings: [],
    };

    for (let i = 0; i < grants.length; i++) {
        const grant = grants[i];
        const url = grant.applicationUrl;

        if (!url) {
            results.warnings.push({ ...grant, issue: 'No applicationUrl' });
            console.log(`[${i + 1}/${grants.length}] ⚠️  ${grant.name} — No URL`);
            continue;
        }

        console.log(`[${i + 1}/${grants.length}] Checking: ${grant.name}`);
        const check = await checkUrl(url);

        if (check.ok) {
            results.healthy.push({
                id: grant.id,
                name: grant.name,
                url: check.url,
                status: check.status,
                responseTime: check.responseTime,
            });
            console.log(`  ✅ OK (${check.status}, ${check.responseTime}ms)`);
        } else {
            results.broken.push({
                id: grant.id,
                name: grant.name,
                url: check.url,
                status: check.status,
                error: check.error,
                finalUrl: check.finalUrl,
            });
            const reason = check.error || `HTTP ${check.status}`;
            console.log(`  ❌ BROKEN — ${reason}`);
        }

        if (check.redirected && check.finalUrl !== url) {
            results.warnings.push({
                id: grant.id,
                name: grant.name,
                issue: `Redirects: ${url} → ${check.finalUrl}`,
                suggestedUrl: check.finalUrl,
            });
            console.log(`  ⚠️  Redirects to: ${check.finalUrl}`);
        }

        await sleep(RATE_LIMIT_MS);
    }

    // Report
    const report = {
        runAt: new Date().toISOString(),
        summary: {
            total: grants.length,
            healthy: results.healthy.length,
            broken: results.broken.length,
            warnings: results.warnings.length,
        },
        ...results,
    };

    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(REPORT_FILE, JSON.stringify(report, null, 2));

    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log(`║  Total:    ${grants.length} funding sources`);
    console.log(`║  ✅ OK:     ${results.healthy.length}`);
    console.log(`║  ❌ Broken: ${results.broken.length}`);
    console.log(`║  ⚠️  Warns:  ${results.warnings.length}`);
    console.log('╚═══════════════════════════════════════════════╝');

    if (results.broken.length > 0) {
        console.log('\n❌ BROKEN URLs that need fixing:');
        for (const b of results.broken) {
            console.log(`  • ${b.name}`);
            console.log(`    URL: ${b.url}`);
            console.log(`    Error: ${b.error || `HTTP ${b.status}`}`);
            console.log('');
        }
    }

    if (results.warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:');
        for (const w of results.warnings) {
            console.log(`  • ${w.name}: ${w.issue}`);
            if (w.suggestedUrl) console.log(`    Suggested: ${w.suggestedUrl}`);
        }
    }

    console.log(`\nReport saved: ${REPORT_FILE}`);

    // Exit with error if broken links found (useful for CI/CD)
    if (results.broken.length > 0) {
        process.exit(1);
    }
}

runHealthCheck().catch(err => {
    console.error(`Fatal: ${err.message}`);
    process.exit(1);
});
