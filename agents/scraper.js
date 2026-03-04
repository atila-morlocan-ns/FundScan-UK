// ═══════════════════════════════════════════════════════
// FundScan UK — Scraper Agent
// Visits URLs, extracts content, uses Gemini to structure
// grant data into our schema
// ═══════════════════════════════════════════════════════

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';
import { GEMINI_MODEL, VALID_SECTORS, VALID_STAGES, VALID_TYPES } from './config.js';
import { fetchWithRetry, sleep, slugify, validateGrant, log, readJSON, writeJSON, htmlToText } from './utils.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, 'data');
const VERIFIED_FILE = join(DATA_DIR, 'verified-urls.json');   // Primary: from verifier
const FALLBACK_FILE = join(DATA_DIR, 'research-results.json'); // Fallback: raw research
const OUTPUT_FILE = join(DATA_DIR, 'scraped-grants.json');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

// Extract key content from HTML using Cheerio
function extractPageContent(html, url) {
    const $ = cheerio.load(html);

    // Remove noise
    $('script, style, nav, footer, header, .cookie-banner, .breadcrumb, aside').remove();

    // Try to get main content
    let content = '';

    // Priority selectors for gov.uk and grant sites
    const selectors = [
        'main', 'article', '.content', '#content',
        '.govuk-main-wrapper', '.publication-content',
        '.opportunity-content', '.competition-details',
        '.entry-content', '.page-content', '[role="main"]',
    ];

    for (const sel of selectors) {
        const el = $(sel);
        if (el.length > 0) {
            content = el.text();
            break;
        }
    }

    // Fallback to body
    if (!content || content.length < 100) {
        content = $('body').text();
    }

    // Get page title
    const title = $('title').text().trim() || $('h1').first().text().trim();

    // Get meta description
    const metaDesc = $('meta[name="description"]').attr('content') || '';

    // Clean up
    content = content.replace(/\s+/g, ' ').trim().slice(0, 6000);

    return { title, metaDesc, content, url, rawHtml: html };
}

// ─── IMPROVEMENT 2: Regex Pre-Extraction ──────────────
// Extract facts directly from HTML BEFORE Gemini — used for cross-referencing
function regexExtract(pageData) {
    const text = pageData.content;
    const result = {
        amounts: [],
        dates: [],
        statusHints: [],
        hasDeadline: false,
    };

    // Extract all currency amounts (£XX,XXX or £XXK or £XXM)
    const amountMatches = text.match(/£[\d,]+(?:\.\d+)?\s*(?:k|m|million|thousand|billion)?/gi) || [];
    result.amounts = amountMatches.map(a => {
        let cleaned = a.replace(/[£,\s]/g, '').toLowerCase();
        let value = parseFloat(cleaned);
        if (cleaned.includes('m') || cleaned.includes('million')) value *= 1000000;
        else if (cleaned.includes('k') || cleaned.includes('thousand')) value *= 1000;
        else if (cleaned.includes('b') || cleaned.includes('billion')) value *= 1000000000;
        return { raw: a.trim(), value: Math.round(value) };
    }).filter(a => a.value > 0 && a.value < 100000000); // filter noise

    // Extract dates
    const datePatterns = [
        /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
        /(\d{4})-(\d{2})-(\d{2})/g,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
    ];
    for (const pattern of datePatterns) {
        const matches = text.matchAll(pattern);
        for (const m of matches) {
            result.dates.push(m[0]);
        }
    }

    // Status hints
    if (/\b(?:now open|currently open|accepting applications|apply now)\b/i.test(text)) {
        result.statusHints.push('open');
    }
    if (/\b(?:closed|no longer accepting|competition closed|has closed)\b/i.test(text)) {
        result.statusHints.push('closed');
    }
    if (/\b(?:opens?\s+(?:on|in|soon)|coming soon|upcoming|future)\b/i.test(text)) {
        result.statusHints.push('upcoming');
    }
    if (/\b(?:deadline|closes?|closing date)\b/i.test(text)) {
        result.hasDeadline = true;
    }

    return result;
}

// Cross-reference Gemini output against regex extraction
function crossReference(geminiData, regexData) {
    const confidence = {
        overall: 0,
        fields: {},
    };

    let totalScore = 0;
    let fieldCount = 0;

    // ── Name confidence ──
    // Name always comes from Gemini, we trust it if content matches
    confidence.fields.name = { level: 'medium', source: 'gemini' };
    totalScore += 60;
    fieldCount++;

    // ── Amount confidence ──
    if (geminiData.amountMin > 0 || geminiData.amountMax > 0) {
        const geminiMin = geminiData.amountMin;
        const geminiMax = geminiData.amountMax;
        const regexAmounts = regexData.amounts.map(a => a.value);

        if (regexAmounts.length > 0) {
            // Check if Gemini amounts are close to any regex-found amount
            const minMatch = regexAmounts.some(a => Math.abs(a - geminiMin) / Math.max(a, geminiMin) < 0.2);
            const maxMatch = regexAmounts.some(a => Math.abs(a - geminiMax) / Math.max(a, geminiMax) < 0.2);

            if (minMatch || maxMatch) {
                confidence.fields.amount = { level: 'high', source: 'both', regexValues: regexAmounts.slice(0, 5) };
                totalScore += 95;
            } else {
                // Gemini amount doesn't match any regex amount — CONFLICT
                confidence.fields.amount = {
                    level: 'low', source: 'conflict',
                    geminiValues: { min: geminiMin, max: geminiMax },
                    regexValues: regexAmounts.slice(0, 5),
                    warning: `Gemini: £${geminiMin}-£${geminiMax}, HTML contains: ${regexData.amounts.slice(0, 3).map(a => a.raw).join(', ')}`,
                };
                totalScore += 25;
            }
        } else {
            // No amounts found in HTML — Gemini might be right or hallucinating
            confidence.fields.amount = { level: 'medium', source: 'gemini', warning: 'No amounts found in raw HTML to verify' };
            totalScore += 50;
        }
    } else {
        confidence.fields.amount = { level: 'medium', source: 'gemini', note: 'Varies/unknown' };
        totalScore += 60;
    }
    fieldCount++;

    // ── Dates confidence ──
    if (geminiData.closeDate || geminiData.openDate) {
        if (regexData.dates.length > 0) {
            // Check if Gemini dates appear in regex-found dates
            const geminiDates = [geminiData.openDate, geminiData.closeDate].filter(Boolean);
            const dateMatch = geminiDates.some(gd => {
                return regexData.dates.some(rd => {
                    // Fuzzy date match: same month and year
                    try {
                        const g = new Date(gd);
                        const r = new Date(rd);
                        return g.getMonth() === r.getMonth() && g.getFullYear() === r.getFullYear();
                    } catch { return false; }
                });
            });

            if (dateMatch) {
                confidence.fields.dates = { level: 'high', source: 'both' };
                totalScore += 95;
            } else {
                confidence.fields.dates = {
                    level: 'low', source: 'conflict',
                    geminiDates: { open: geminiData.openDate, close: geminiData.closeDate },
                    htmlDates: regexData.dates.slice(0, 5),
                    warning: 'Gemini dates don\'t match dates found in HTML',
                };
                totalScore += 20;
            }
        } else if (!regexData.hasDeadline) {
            // No dates in HTML and no deadline keywords — likely hallucinated
            confidence.fields.dates = {
                level: 'low', source: 'gemini',
                warning: 'No dates or deadline keywords found in HTML — dates may be fabricated',
            };
            totalScore += 15;
        } else {
            // Deadline keyword found but no parseable date
            confidence.fields.dates = { level: 'medium', source: 'gemini', note: 'Deadline mentioned but date not extracted from HTML' };
            totalScore += 50;
        }
    } else {
        confidence.fields.dates = { level: 'medium', source: 'gemini', note: 'No dates provided' };
        totalScore += 50;
    }
    fieldCount++;

    // ── Status confidence ──
    if (regexData.statusHints.length > 0) {
        if (regexData.statusHints.includes(geminiData.status)) {
            confidence.fields.status = { level: 'high', source: 'both' };
            totalScore += 95;
        } else {
            confidence.fields.status = {
                level: 'low', source: 'conflict',
                geminiStatus: geminiData.status,
                htmlHints: regexData.statusHints,
                warning: `Gemini says "${geminiData.status}" but HTML suggests "${regexData.statusHints.join('/')}"`,
            };
            totalScore += 25;
        }
    } else {
        confidence.fields.status = { level: 'medium', source: 'gemini' };
        totalScore += 50;
    }
    fieldCount++;

    // ── Overall confidence ──
    confidence.overall = Math.round(totalScore / fieldCount);

    return confidence;
}

// Use Gemini to extract structured grant data
async function extractWithGemini(pageData) {
    const prompt = `You are a UK funding opportunity data extractor. Analyse this web page content and extract structured grant/funding information.

PAGE URL: ${pageData.url}
PAGE TITLE: ${pageData.title}
META DESCRIPTION: ${pageData.metaDesc}

PAGE CONTENT:
${pageData.content}

---

Extract the following fields into a JSON object. BE PRECISE AND ACCURATE — I will cross-reference your answers against the raw HTML. Do NOT invent dates or amounts. If you are uncertain, use null.

{
  "name": "Official name of the funding programme",
  "provider": "Organisation providing the funding (e.g. Innovate UK, UKRI, NHS England)",
  "type": "One of: grant, loan, equity, tax, competition, accelerator",
  "description": "2-3 sentence description of what this funding is for",
  "amountMin": minimum amount in GBP as integer (0 if varies/unknown),
  "amountMax": maximum amount in GBP as integer (0 if varies/unknown),
  "sectors": [array of relevant sectors from: ${VALID_SECTORS.join(', ')}],
  "stages": [array of applicable stages from: ${VALID_STAGES.join(', ')}],
  "eligibility": ["array of eligibility requirements as strings"],
  "applicationUrl": "URL to apply or find more details",
  "status": "One of: open, upcoming, closed (based on dates found on the page)",
  "openDate": "YYYY-MM-DD format ONLY if explicitly stated on the page, otherwise null",
  "closeDate": "YYYY-MM-DD format ONLY if explicitly stated on the page, otherwise null",
  "lastUpdated": "${new Date().toISOString().split('T')[0]}",
  "successRate": "Approximate success rate if mentioned, or 'Unknown'",
  "tips": ["array of application tips based on stated criteria"]
}

RULES:
- Only extract if this page genuinely describes a UK funding/grant opportunity
- If the page doesn't describe a specific funding programme, return {"skip": true, "reason": "..."}
- CRITICAL: Only use dates that are EXPLICITLY STATED on the page. Do NOT estimate or fabricate dates.
- CRITICAL: Only use amounts that are EXPLICITLY STATED on the page. Do NOT guess amounts.
- sectors and stages must ONLY use values from the provided lists
- amountMin/amountMax must be integers in GBP (no symbols)
- Be conservative with status: only "open" if clearly accepting applications now

Return ONLY valid JSON, no markdown or explanation.`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in Gemini response');
        }

        const data = JSON.parse(jsonMatch[0]);

        // Check for skip signal
        if (data.skip) {
            return { skipped: true, reason: data.reason };
        }

        // Generate ID
        data.id = slugify(data.name);

        // Ensure arrays are arrays
        if (!Array.isArray(data.sectors)) data.sectors = [data.sectors].filter(Boolean);
        if (!Array.isArray(data.stages)) data.stages = [data.stages].filter(Boolean);
        if (!Array.isArray(data.eligibility)) data.eligibility = [data.eligibility].filter(Boolean);
        if (!Array.isArray(data.tips)) data.tips = [data.tips].filter(Boolean);

        // Ensure amounts are numbers
        data.amountMin = parseInt(data.amountMin) || 0;
        data.amountMax = parseInt(data.amountMax) || 0;

        // Source tracking
        data._sourceUrl = pageData.url;
        data._scrapedAt = new Date().toISOString();

        return data;
    } catch (err) {
        log(`  Gemini extraction error: ${err.message}`, 'error');
        return { skipped: true, reason: `Extraction failed: ${err.message}` };
    }
}

// Generate content hash for freshness tracking
async function hashContent(content) {
    // Simple hash for change detection (not crypto-secure, just for comparison)
    let hash = 0;
    const str = content.slice(0, 2000); // hash first 2KB
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return `hash:${Math.abs(hash).toString(16)}`;
}

// Scrape a single URL with dual-extraction
async function scrapeUrl(url) {
    try {
        log(`  Fetching: ${url.slice(0, 80)}...`, 'scrape');
        const response = await fetchWithRetry(url);
        const html = await response.text();

        // Extract content with Cheerio
        const pageData = extractPageContent(html, url);

        if (pageData.content.length < 50) {
            log(`  ⚠ Page content too short, skipping`, 'warn');
            return null;
        }

        // ── PASS 1: Regex extraction (ground truth from HTML) ──
        log(`  📐 Pass 1: Regex extraction from HTML...`, 'info');
        const regexFacts = regexExtract(pageData);
        log(`    Found: ${regexFacts.amounts.length} amounts, ${regexFacts.dates.length} dates, ${regexFacts.statusHints.length} status hints`, 'info');

        // ── PASS 2: Gemini extraction ──
        log(`  🤖 Pass 2: Gemini extraction...`, 'info');
        const grant = await extractWithGemini(pageData);

        if (grant.skipped) {
            log(`  ⏭ Skipped: ${grant.reason}`, 'warn');
            return null;
        }

        // ── CROSS-REFERENCE: Compare Pass 1 vs Pass 2 ──
        log(`  🔀 Cross-referencing regex vs Gemini...`, 'info');
        const confidence = crossReference(grant, regexFacts);

        // Attach confidence metadata
        grant._confidence = confidence;

        // ── PROVENANCE: Track data source ──
        grant._provenance = {
            sourceUrl: url,
            firstDiscovered: new Date().toISOString(),
            lastVerified: new Date().toISOString(),
            verificationCount: 1,
            extractionMethod: GEMINI_MODEL,
            contentHash: await hashContent(pageData.content),
            confidence: confidence,
        };

        // Log confidence result
        const overallLevel = confidence.overall >= 75 ? '✅ HIGH' : confidence.overall >= 50 ? '⚠️ MEDIUM' : '🔴 LOW';
        log(`  ${overallLevel} confidence (${confidence.overall}%)`, confidence.overall >= 50 ? 'success' : 'warn');

        // Log any conflicts
        for (const [field, data] of Object.entries(confidence.fields)) {
            if (data.level === 'low' && data.warning) {
                log(`    ⚠ ${field}: ${data.warning}`, 'warn');
            }
        }

        // Validate
        const validation = validateGrant(grant);
        if (!validation.valid) {
            log(`  ⚠ Validation warnings: ${validation.errors.join('; ')}`, 'warn');
        }

        log(`  ✅ Extracted: ${grant.name} (${grant.provider})`, 'success');
        return grant;
    } catch (err) {
        log(`  ❌ Failed to scrape ${url}: ${err.message}`, 'error');
        return null;
    }
}


// Main scraper function
export async function runScraper(maxUrls = 20) {
    log('═══════════════════════════════════════════════', 'info');
    log('🕷️  SCRAPER AGENT — Extracting grant data (with confidence scoring)', 'scrape');
    log('═══════════════════════════════════════════════', 'info');

    // Load verified URLs first, fall back to raw research
    let research = await readJSON(VERIFIED_FILE);
    let inputSource = 'verified-urls.json';
    if (!research || !research.relevant || research.relevant.length === 0) {
        log('No verified URLs found, falling back to raw research results...', 'warn');
        research = await readJSON(FALLBACK_FILE);
        inputSource = 'research-results.json';
    }
    if (!research || !research.relevant || research.relevant.length === 0) {
        log('No research results found. Run researcher first: npm run agents:research', 'error');
        return { grants: [], errors: [] };
    }
    log(`Input: ${inputSource} (${research.relevant.length} URLs)`, 'info');

    const urls = research.relevant.slice(0, maxUrls);
    log(`Processing ${urls.length} relevant URLs (max ${maxUrls})`, 'info');

    const grants = [];
    const errors = [];
    const skipped = [];

    for (let i = 0; i < urls.length; i++) {
        const item = urls[i];
        log(`\n[${i + 1}/${urls.length}] Processing URL...`, 'scrape');

        const grant = await scrapeUrl(item.url);

        if (grant) {
            grants.push(grant);
        } else {
            skipped.push(item.url);
        }

        // Rate limit between Gemini calls
        await sleep(2000);
    }

    // Save results
    const output = {
        meta: {
            runAt: new Date().toISOString(),
            urlsProcessed: urls.length,
            grantsExtracted: grants.length,
            skipped: skipped.length,
        },
        grants,
        skipped,
    };

    await writeJSON(OUTPUT_FILE, output);

    log(`\n═══════════════════════════════════════════════`, 'info');
    log(`✅ Scraping complete!`, 'success');
    log(`   URLs processed:  ${urls.length}`, 'info');
    log(`   Grants extracted: ${grants.length}`, 'info');
    log(`   Skipped:         ${skipped.length}`, 'info');
    log(`   Saved to:        ${OUTPUT_FILE}`, 'info');
    log(`═══════════════════════════════════════════════`, 'info');

    return output;
}

// Run if called directly
const isMain = process.argv[1] && (
    process.argv[1].endsWith('scraper.js') ||
    process.argv[1].includes('scraper')
);

if (isMain) {
    const maxUrls = parseInt(process.argv[2]) || 20;
    runScraper(maxUrls).catch(err => {
        log(`Fatal error: ${err.message}`, 'error');
        process.exit(1);
    });
}
