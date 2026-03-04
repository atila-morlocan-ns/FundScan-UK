// ═══════════════════════════════════════════════════════
// FundScan UK — Pipeline Runner
// Orchestrates: Researcher → Verifier → Scraper → DB Manager
// Anti-hallucination pipeline with URL verification
// and dual-extract confidence scoring
// ═══════════════════════════════════════════════════════

import 'dotenv/config';
import { runResearcher } from './researcher.js';
import { runVerifier } from './verifier.js';
import { runScraper } from './scraper.js';
import { runDBManager } from './db-manager.js';
import { log } from './utils.js';

async function runPipeline() {
    const startTime = Date.now();

    log('╔═══════════════════════════════════════════════╗', 'info');
    log('║  FundScan UK — Grant Research Pipeline v2     ║', 'info');
    log('║  Researcher → Verifier → Scraper → DB Manager║', 'info');
    log('║  Anti-hallucination: URL checks + confidence  ║', 'info');
    log('╚═══════════════════════════════════════════════╝', 'info');

    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
        log('❌ GEMINI_API_KEY not set. Create a .env file with your key.', 'error');
        log('   Get one free: https://aistudio.google.com/apikey', 'info');
        process.exit(1);
    }

    const maxUrls = parseInt(process.argv[2]) || 15;

    try {
        // Step 1: Research
        log('\n\n📍 STEP 1/4 — RESEARCHER\n', 'info');
        const research = await runResearcher();

        if (research.relevant.length === 0) {
            log('No relevant URLs found. Pipeline stopping early.', 'warn');
            return;
        }

        // Step 2: Verify (NEW — eliminates fabricated URLs)
        log('\n\n📍 STEP 2/4 — URL VERIFIER (Anti-Hallucination)\n', 'info');
        const verified = await runVerifier();

        if (!verified || verified.relevant.length === 0) {
            log('No URLs passed verification. Pipeline stopping early.', 'warn');
            return;
        }

        // Step 3: Scrape (with dual-extract confidence scoring)
        log('\n\n📍 STEP 3/4 — SCRAPER (Dual-Extract + Confidence)\n', 'info');
        const scraped = await runScraper(maxUrls);

        if (scraped.grants.length === 0) {
            log('No grants extracted. Pipeline stopping early.', 'warn');
            return;
        }

        // Step 4: Database (with provenance tracking)
        log('\n\n📍 STEP 4/4 — DATABASE MANAGER (Provenance Tracking)\n', 'info');
        await runDBManager();

        // Summary
        const elapsed = Math.round((Date.now() - startTime) / 1000);

        // Calculate confidence stats
        const highConf = scraped.grants.filter(g => g._confidence && g._confidence.overall >= 75).length;
        const medConf = scraped.grants.filter(g => g._confidence && g._confidence.overall >= 50 && g._confidence.overall < 75).length;
        const lowConf = scraped.grants.filter(g => g._confidence && g._confidence.overall < 50).length;

        log('\n╔═══════════════════════════════════════════════╗', 'info');
        log('║  ✅ PIPELINE COMPLETE (v2 — Anti-Hallucination)║', 'success');
        log(`║  Time: ${elapsed}s                              `, 'info');
        log(`║  URLs researched:  ${research.relevant.length}     `, 'info');
        log(`║  URLs verified:    ${verified.relevant.length}/${research.relevant.length} (${verified.meta.passRate} pass rate)`, 'info');
        log(`║  URLs eliminated:  ${verified.dead.length} dead, ${verified.suspect.length} suspect`, 'info');
        log(`║  Grants extracted: ${scraped.grants.length}       `, 'info');
        log(`║  Confidence: ✅${highConf} HIGH, ⚠️${medConf} MED, 🔴${lowConf} LOW`, 'info');
        log('╚═══════════════════════════════════════════════╝', 'info');

    } catch (err) {
        log(`\n❌ Pipeline failed: ${err.message}`, 'error');
        console.error(err);
        process.exit(1);
    }
}

runPipeline();
