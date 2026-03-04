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
const INPUT_FILE = join(DATA_DIR, 'research-results.json');
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

    return { title, metaDesc, content, url };
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

Extract the following fields into a JSON object. BE PRECISE AND ACCURATE:

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
  "status": "One of: open, upcoming, closed (based on dates)",
  "openDate": "YYYY-MM-DD format or estimate",
  "closeDate": "YYYY-MM-DD format or estimate",
  "lastUpdated": "${new Date().toISOString().split('T')[0]}",
  "successRate": "Approximate success rate if mentioned, or 'Unknown'",
  "tips": ["array of application tips based on stated criteria"]
}

RULES:
- Only extract if this page genuinely describes a UK funding/grant opportunity
- If the page doesn't describe a specific funding programme, return {"skip": true, "reason": "..."}
- Use actual dates from the page. If not available, estimate based on context
- sectors and stages must ONLY use values from the provided lists
- amountMin/amountMax must be integers in GBP (no symbols)
- Be conservative with status: only "open" if clearly accepting applications now
- Include "general" in sectors if the fund is cross-sector

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

// Scrape a single URL
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

        // Extract with Gemini
        log(`  🤖 Analysing with Gemini...`, 'info');
        const grant = await extractWithGemini(pageData);

        if (grant.skipped) {
            log(`  ⏭ Skipped: ${grant.reason}`, 'warn');
            return null;
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
    log('🕷️  SCRAPER AGENT — Extracting grant data', 'scrape');
    log('═══════════════════════════════════════════════', 'info');

    // Load research results
    const research = await readJSON(INPUT_FILE);
    if (!research || !research.relevant || research.relevant.length === 0) {
        log('No research results found. Run researcher first: npm run agents:research', 'error');
        return { grants: [], errors: [] };
    }

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
