// ═══════════════════════════════════════════════════════
// FundScan UK — URL Liveness Verifier
// Validates URLs before scraping: HEAD checks, domain
// whitelist, keyword scoring. Eliminates fabricated URLs.
// ═══════════════════════════════════════════════════════

import { TARGET_SITES, RATE_LIMIT_MS } from './config.js';
import { fetchWithRetry, sleep, log, readJSON, writeJSON } from './utils.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, 'data');
const INPUT_FILE = join(DATA_DIR, 'research-results.json');
const OUTPUT_FILE = join(DATA_DIR, 'verified-urls.json');

// Grant-related keywords — page must contain several to be relevant
const GRANT_KEYWORDS = [
    'funding', 'grant', 'competition', 'apply', 'eligibility',
    'innovation', 'award', 'deadline', 'submission', 'programme',
    'application', 'budget', 'criteria', 'assessment', 'awarded',
    'invest', 'loan', 'tax relief', 'seis', 'eis', 'r&d',
    'sbri', 'ukri', 'innovate', 'nihr', 'nhs', 'health',
];

// Score thresholds
const MIN_LIVENESS_SCORE = 50;  // URLs below this are dropped

// Normalize URL for comparison
function normalizeUrl(url) {
    try {
        const u = new URL(url);
        // Remove trailing slash, fragment, common tracking params
        let clean = `${u.protocol}//${u.hostname}${u.pathname}`.replace(/\/$/, '');
        return clean.toLowerCase();
    } catch {
        return url.toLowerCase();
    }
}

// Check if URL domain is in our trusted whitelist
function isDomainTrusted(url) {
    try {
        const hostname = new URL(url).hostname;
        return TARGET_SITES.some(site => hostname.includes(site));
    } catch {
        return false;
    }
}

// Count keyword hits in content
function countKeywordHits(text) {
    const lower = text.toLowerCase();
    let hits = 0;
    const matched = [];
    for (const kw of GRANT_KEYWORDS) {
        if (lower.includes(kw)) {
            hits++;
            matched.push(kw);
        }
    }
    return { hits, matched };
}

// Check if content has date patterns (suggests real grant with deadline)
function hasDatePattern(text) {
    const datePatterns = [
        /\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i,
        /\d{4}-\d{2}-\d{2}/,
        /\d{1,2}\/\d{1,2}\/\d{4}/,
        /(?:deadline|closes?|closing|opens?)\s*:?\s*\d/i,
    ];
    return datePatterns.some(p => p.test(text));
}

// Check if content has amount patterns (£XX,XXX)
function hasAmountPattern(text) {
    return /£[\d,.]+\s*(?:k|m|million|thousand|billion)?/i.test(text);
}

// Verify a single URL
async function verifyUrl(urlItem) {
    const { url } = urlItem;
    const result = {
        url,
        originalSource: urlItem.source || 'unknown',
        normalizedUrl: normalizeUrl(url),
        checks: {},
        livenessScore: 0,
        status: 'unknown',
    };

    try {
        // ─── Check 1: HTTP HEAD request ───────────────
        log(`  🔗 Checking: ${url.slice(0, 70)}...`, 'info');

        let response;
        try {
            response = await fetchWithRetry(url, { method: 'HEAD' });
            result.checks.httpStatus = response.status;
            result.checks.httpOk = response.ok;

            // Check for redirects (final URL might differ)
            if (response.redirected) {
                result.checks.redirectedTo = response.url;
                result.normalizedUrl = normalizeUrl(response.url);
            }
        } catch (headErr) {
            // HEAD might be blocked, try GET with small body
            try {
                response = await fetchWithRetry(url);
                result.checks.httpStatus = response.status;
                result.checks.httpOk = true;
                result.checks.fallbackToGet = true;
            } catch (getErr) {
                result.checks.httpStatus = 0;
                result.checks.httpOk = false;
                result.checks.error = getErr.message;
                result.status = 'dead';
                result.livenessScore = 0;
                return result;
            }
        }

        // ─── Check 2: Domain whitelist ────────────────
        const finalUrl = result.checks.redirectedTo || url;
        result.checks.domainTrusted = isDomainTrusted(finalUrl);

        // ─── Check 3: Content keyword analysis ────────
        // Fetch first 3KB of content for keyword checking
        let pageContent = '';
        try {
            const contentResponse = await fetchWithRetry(finalUrl);
            const fullHtml = await contentResponse.text();
            // Strip HTML tags for text analysis
            pageContent = fullHtml
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 4000);
        } catch {
            pageContent = '';
        }

        const { hits, matched } = countKeywordHits(pageContent);
        result.checks.keywordHits = hits;
        result.checks.keywordsMatched = matched;
        result.checks.hasDate = hasDatePattern(pageContent);
        result.checks.hasAmount = hasAmountPattern(pageContent);
        result.checks.contentLength = pageContent.length;

        // ─── Calculate liveness score ─────────────────
        let score = 0;

        // HTTP 200 = +25 points
        if (result.checks.httpOk) score += 25;

        // Domain whitelist match = +25 points
        if (result.checks.domainTrusted) score += 25;

        // Keyword hits: each hit = +4 points (max +28)
        score += Math.min(hits * 4, 28);

        // Has dates = +12 points (suggests real grant with deadline)
        if (result.checks.hasDate) score += 12;

        // Has amounts = +10 points (suggests real funding)
        if (result.checks.hasAmount) score += 10;

        // Penalize very short content (likely error page)
        if (pageContent.length < 200) score -= 15;

        result.livenessScore = Math.max(0, Math.min(100, score));
        result.status = result.livenessScore >= MIN_LIVENESS_SCORE ? 'verified' : 'suspect';

    } catch (err) {
        result.checks.error = err.message;
        result.status = 'error';
        result.livenessScore = 0;
    }

    return result;
}

// Main verifier function
export async function runVerifier() {
    log('═══════════════════════════════════════════════', 'info');
    log('🔗 URL VERIFIER — Checking liveness & relevance', 'info');
    log('═══════════════════════════════════════════════', 'info');

    // Load research results
    const research = await readJSON(INPUT_FILE);
    if (!research || !research.relevant || research.relevant.length === 0) {
        log('No research results found. Run researcher first.', 'error');
        return null;
    }

    const urls = research.relevant;
    log(`Verifying ${urls.length} URLs...`, 'info');

    const verified = [];
    const suspect = [];
    const dead = [];

    for (let i = 0; i < urls.length; i++) {
        const item = urls[i];
        log(`\n[${i + 1}/${urls.length}]`, 'info');

        const result = await verifyUrl(item);

        if (result.status === 'verified') {
            verified.push(result);
            log(`  ✅ VERIFIED (score: ${result.livenessScore}) — ${result.checks.keywordHits} keywords, ${result.checks.hasDate ? 'has dates' : 'no dates'}`, 'success');
        } else if (result.status === 'suspect') {
            suspect.push(result);
            log(`  ⚠️  SUSPECT (score: ${result.livenessScore}) — low keyword match or missing dates`, 'warn');
        } else {
            dead.push(result);
            log(`  ❌ DEAD — ${result.checks.error || 'unreachable'}`, 'error');
        }

        // Rate limit
        await sleep(RATE_LIMIT_MS);
    }

    // Save results
    const output = {
        meta: {
            runAt: new Date().toISOString(),
            totalChecked: urls.length,
            verified: verified.length,
            suspect: suspect.length,
            dead: dead.length,
            passRate: `${Math.round((verified.length / urls.length) * 100)}%`,
            minScore: MIN_LIVENESS_SCORE,
        },
        // Only pass verified URLs forward for scraping
        relevant: verified.map(v => ({
            url: v.checks.redirectedTo || v.url,
            source: v.originalSource,
            livenessScore: v.livenessScore,
            domainTrusted: v.checks.domainTrusted,
            keywordHits: v.checks.keywordHits,
            hasDate: v.checks.hasDate,
            hasAmount: v.checks.hasAmount,
        })),
        suspect: suspect.map(s => ({
            url: s.url,
            livenessScore: s.livenessScore,
            reason: `Score ${s.livenessScore} < ${MIN_LIVENESS_SCORE}. Keywords: ${s.checks.keywordHits}, Date: ${s.checks.hasDate}, Amount: ${s.checks.hasAmount}`,
        })),
        dead: dead.map(d => ({
            url: d.url,
            error: d.checks.error,
        })),
    };

    await writeJSON(OUTPUT_FILE, output);

    log(`\n═══════════════════════════════════════════════`, 'info');
    log(`✅ Verification complete!`, 'success');
    log(`   Total checked:  ${urls.length}`, 'info');
    log(`   ✅ Verified:    ${verified.length} (passed to scraper)`, 'info');
    log(`   ⚠️  Suspect:    ${suspect.length} (quarantined)`, 'info');
    log(`   ❌ Dead/Fake:   ${dead.length} (eliminated)`, 'info');
    log(`   Pass rate:      ${output.meta.passRate}`, 'info');
    log(`   Saved to:       ${OUTPUT_FILE}`, 'info');
    log(`═══════════════════════════════════════════════`, 'info');

    return output;
}

// Run if called directly
const isMain = process.argv[1] && (
    process.argv[1].endsWith('verifier.js') ||
    process.argv[1].includes('verifier')
);

if (isMain) {
    runVerifier().catch(err => {
        log(`Fatal error: ${err.message}`, 'error');
        process.exit(1);
    });
}
