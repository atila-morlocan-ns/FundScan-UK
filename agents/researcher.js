// ═══════════════════════════════════════════════════════
// FundScan UK — Researcher Agent
// Discovers UK funding opportunities via:
//   1. Direct scraping of known grant portals
//   2. Gemini LLM research for emerging opportunities
// ═══════════════════════════════════════════════════════

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';
import { GEMINI_MODEL, TARGET_SITES } from './config.js';
import { fetchWithRetry, sleep, log, writeJSON, readJSON } from './utils.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, 'data');
const OUTPUT_FILE = join(DATA_DIR, 'research-results.json');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

// ─── STRATEGY 1: Direct Portal Scraping ─────────────────

const PORTAL_SOURCES = [
    {
        name: 'Innovate UK IFS',
        url: 'https://apply-for-innovation-funding.service.gov.uk/competition/search',
        type: 'listing',
    },
    {
        name: 'UKRI Opportunities',
        url: 'https://www.ukri.org/opportunity/',
        type: 'listing',
    },
    {
        name: 'SBRI Healthcare',
        url: 'https://sbrihealthcare.co.uk/competitions/',
        type: 'listing',
    },
    {
        name: 'NIHR Funding',
        url: 'https://www.nihr.ac.uk/researchers/funding-opportunities/',
        type: 'listing',
    },
    {
        name: 'Gov.uk Innovation Funding',
        url: 'https://www.gov.uk/business-finance-support',
        type: 'listing',
    },
    {
        name: 'Techstars London',
        url: 'https://www.techstars.com/accelerators/london',
        type: 'single',
    },
    {
        name: 'Start Up Loans',
        url: 'https://www.startuploans.co.uk/',
        type: 'single',
    },
    {
        name: 'KTN UK',
        url: 'https://ktn-uk.org/opportunities/',
        type: 'listing',
    },
    {
        name: 'NHS AI Lab',
        url: 'https://transform.england.nhs.uk/ai-lab/',
        type: 'single',
    },
];

// ─── NOISE FILTER: Remove irrelevant URLs ───────────────
// These patterns match navigation pages, career funding, and 
// hyper-local grants that waste verifier/scraper time
const NOISE_PATTERNS = [
    /\/apply-for-funding\/?$/,                // Generic "how to apply" landing pages
    /\/before-you-apply/,                     // Guidance pages
    /\/how-we-make-decisions/,                // Process pages
    /\/improving-your-funding-experience/,    // Meta pages
    /\/develop-your-application/,             // Guidance pages
    /\/meeting-ukri-terms/,                   // Terms pages
    /\/getting-your-funding/,                 // Post-award pages
    /\/what-we-have-funded/,                  // Historical pages
    /\/who-we-fund/,                          // Info pages
    /\/responsibilities-after-funding/,       // Post-award
    /career|predoctoral|postdoctoral|professorships/i, // Academic career funding
    /election-study|northern-ireland/i,       // Non-relevant UKRI grants
    /mansfield|scarborough|greenwich|bexley|elmbridge|adur|worthing|bedfordshire|enfield|waltham/i, // Hyper-local council grants
    /aerospace|zero-emission-flight|quantum-technologies|semiconductor/i, // Off-sector
    /login|sign-in|ReturnUrl/i,               // Login portals
    /archive|webarchive/i,                    // Archived pages
    /case-studies|faqs|guidance-for-applicants/i, // Support pages
    /global-health|international-funding/i,   // Not UK-specific grants
    /filter_order/,                           // Sort/filter URLs (not actual grants)
];

function isNoiseUrl(url, title = '') {
    const combined = url + ' ' + title.toLowerCase();
    return NOISE_PATTERNS.some(p => p.test(combined));
}

// Scrape a listing page for individual opportunity links
async function scrapePortalLinks(source) {
    try {
        log(`  Fetching: ${source.name} (${source.url})`, 'search');
        const response = await fetchWithRetry(source.url);
        const html = await response.text();
        const $ = cheerio.load(html);

        const links = [];

        if (source.type === 'single') {
            // Single page = the URL itself is the opportunity
            links.push({
                url: source.url,
                title: source.name,
                source: source.name,
            });
        } else {
            // Extract links from listing pages
            $('a[href]').each((_, el) => {
                const href = $(el).attr('href');
                const text = $(el).text().trim();

                if (!href || !text || text.length <= 10 || text.length >= 200) return;

                // Resolve relative URLs
                let fullUrl = href;
                if (href.startsWith('/')) {
                    const urlObj = new URL(source.url);
                    fullUrl = `${urlObj.origin}${href}`;
                } else if (!href.startsWith('http')) {
                    return; // skip non-http relative links
                }

                // Filter for likely grant/opportunity links
                const isRelevant =
                    href.includes('competition') ||
                    href.includes('opportunity') ||
                    href.includes('funding') ||
                    href.includes('programme') ||
                    href.includes('grant') ||
                    href.includes('apply') ||
                    href.includes('accelerat') ||
                    text.toLowerCase().includes('fund') ||
                    text.toLowerCase().includes('grant') ||
                    text.toLowerCase().includes('competition');

                if (isRelevant && !href.includes('#') && !href.includes('mailto:')) {
                    // Apply noise filter
                    if (isNoiseUrl(fullUrl, text)) return;
                    
                    links.push({
                        url: fullUrl,
                        title: text.slice(0, 150),
                        source: source.name,
                    });
                }
            });
        }

        log(`  ✅ Found ${links.length} links from ${source.name}`, 'success');
        return links;
    } catch (err) {
        log(`  ⚠ Failed to scrape ${source.name}: ${err.message}`, 'warn');
        return [];
    }
}

// ─── STRATEGY 2: Gemini LLM Research ────────────────────

async function geminiResearch() {
    log('\n🤖 Asking Gemini for current UK funding opportunities...', 'search');

    const prompt = `You are a UK startup funding research expert. You are researching funding for a UK MedTech startup that uses computer vision and Vision Language Models for fall detection and medical event monitoring in elderly care.

List current and upcoming UK government/public funding opportunities in 2026, especially for:
- MedTech / HealthTech / AI in health
- Fall prevention, patient safety, elderly care technology
- Computer vision, AI, machine learning in care settings
- Remote monitoring, assisted living, social care AI
- General UK innovation grants open to health AI startups

For EACH opportunity, provide:
1. Name of the programme
2. Provider (e.g., Innovate UK, UKRI, NHS England)
3. A direct URL to the programme page or application
4. Short description (1 sentence)
5. Approximate amount range
6. Status: open, upcoming, or closed

Prioritise funds that specifically mention: fall prevention, patient safety, AI in social care, remote monitoring, elderly care technology, MHRA-regulated devices.

Also include:
- Innovate UK competitions (IFS portal)
- UKRI research council grants
- SBRI Healthcare
- NIHR funding
- NHS AI Lab programmes
- British Business Bank schemes
- Catapult programmes (especially Medicines Discovery)
- AHSN accelerators
- Tax schemes (SEIS, EIS, R&D Tax Credits)
- CareCity and AAL Programme

Return as a JSON array of objects with fields: name, provider, url, description, amountMin, amountMax, status.
Return ONLY the JSON array, no markdown.`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Extract JSON
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            log('  ⚠ Gemini did not return valid JSON', 'warn');
            return [];
        }

        const opportunities = JSON.parse(jsonMatch[0]);

        const links = opportunities
            .filter(o => o.url && o.name)
            .map(o => ({
                url: o.url,
                title: o.name,
                source: 'Gemini Research',
                provider: o.provider,
                description: o.description,
                amountMin: o.amountMin,
                amountMax: o.amountMax,
                status: o.status,
            }));

        log(`  ✅ Gemini identified ${links.length} opportunities`, 'success');
        return links;
    } catch (err) {
        log(`  ⚠ Gemini research failed: ${err.message}`, 'warn');
        return [];
    }
}

// ─── DEDUPLICATION ──────────────────────────────────────

function deduplicateLinks(links) {
    const seen = new Map();

    for (const link of links) {
        // Normalize URL for dedup
        const normalizedUrl = link.url
            .replace(/\/$/, '')
            .replace(/^https?:\/\/www\./, 'https://')
            .toLowerCase();

        if (!seen.has(normalizedUrl)) {
            seen.set(normalizedUrl, link);
        } else {
            // Merge: prefer the one with more info
            const existing = seen.get(normalizedUrl);
            if (link.description && !existing.description) {
                seen.set(normalizedUrl, { ...existing, ...link });
            }
        }
    }

    return Array.from(seen.values());
}

// ─── MAIN ───────────────────────────────────────────────

export async function runResearcher() {
    log('═══════════════════════════════════════════════', 'info');
    log('🔍 RESEARCHER AGENT — Discovering UK grants', 'search');
    log('═══════════════════════════════════════════════', 'info');

    const allLinks = [];

    // Strategy 1: Direct portal scraping
    log('\n📡 STRATEGY 1: Direct Portal Scraping', 'search');
    log('─────────────────────────────────────', 'info');

    for (const source of PORTAL_SOURCES) {
        const links = await scrapePortalLinks(source);
        allLinks.push(...links);
        await sleep(2000); // rate limit
    }

    // Strategy 2: Gemini research
    log('\n🤖 STRATEGY 2: Gemini LLM Research', 'search');
    log('──────────────────────────────────', 'info');

    if (process.env.GEMINI_API_KEY) {
        const geminiLinks = await geminiResearch();
        allLinks.push(...geminiLinks);
    } else {
        log('  ⚠ No GEMINI_API_KEY — skipping LLM research', 'warn');
    }

    // Deduplicate
    const unique = deduplicateLinks(allLinks);

    // Classify
    const relevant = unique.filter(link =>
        TARGET_SITES.some(site => link.url.includes(site)) ||
        link.source === 'Gemini Research'
    );
    const other = unique.filter(link => !relevant.includes(link));

    // Results
    const output = {
        meta: {
            runAt: new Date().toISOString(),
            portalsScraped: PORTAL_SOURCES.length,
            geminiUsed: !!process.env.GEMINI_API_KEY,
            totalLinksFound: unique.length,
            relevantLinks: relevant.length,
            otherLinks: other.length,
        },
        relevant,
        other,
    };

    await writeJSON(OUTPUT_FILE, output);

    log(`\n═══════════════════════════════════════════════`, 'info');
    log(`✅ Research complete!`, 'success');
    log(`   Portals scraped: ${PORTAL_SOURCES.length}`, 'info');
    log(`   Total found:     ${unique.length}`, 'info');
    log(`   Relevant:        ${relevant.length}`, 'info');
    log(`   Other:           ${other.length}`, 'info');
    log(`   Saved to:        ${OUTPUT_FILE}`, 'info');
    log(`═══════════════════════════════════════════════`, 'info');

    return output;
}

// Run if called directly
const isMain = process.argv[1] && (
    process.argv[1].endsWith('researcher.js') ||
    process.argv[1].includes('researcher')
);

if (isMain) {
    runResearcher().catch(err => {
        log(`Fatal error: ${err.message}`, 'error');
        process.exit(1);
    });
}
