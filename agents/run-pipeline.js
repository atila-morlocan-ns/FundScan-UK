// ═══════════════════════════════════════════════════════
// FundScan UK — Pipeline Runner
// Orchestrates: Researcher → Scraper → DB Manager
// ═══════════════════════════════════════════════════════

import 'dotenv/config';
import { runResearcher } from './researcher.js';
import { runScraper } from './scraper.js';
import { runDBManager } from './db-manager.js';
import { log } from './utils.js';

async function runPipeline() {
    const startTime = Date.now();

    log('╔═══════════════════════════════════════════════╗', 'info');
    log('║  FundScan UK — Grant Research Pipeline        ║', 'info');
    log('║  Researcher → Scraper → Database Manager      ║', 'info');
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
        log('\n\n📍 STEP 1/3 — RESEARCHER\n', 'info');
        const research = await runResearcher();

        if (research.relevant.length === 0) {
            log('No relevant URLs found. Pipeline stopping early.', 'warn');
            return;
        }

        // Step 2: Scrape
        log('\n\n📍 STEP 2/3 — SCRAPER\n', 'info');
        const scraped = await runScraper(maxUrls);

        if (scraped.grants.length === 0) {
            log('No grants extracted. Pipeline stopping early.', 'warn');
            return;
        }

        // Step 3: Database
        log('\n\n📍 STEP 3/3 — DATABASE MANAGER\n', 'info');
        await runDBManager();

        // Summary
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        log('\n╔═══════════════════════════════════════════════╗', 'info');
        log('║  ✅ PIPELINE COMPLETE                         ║', 'success');
        log(`║  Time: ${elapsed}s                              `, 'info');
        log(`║  URLs researched: ${research.relevant.length}     `, 'info');
        log(`║  Grants extracted: ${scraped.grants.length}       `, 'info');
        log('╚═══════════════════════════════════════════════╝', 'info');

    } catch (err) {
        log(`\n❌ Pipeline failed: ${err.message}`, 'error');
        console.error(err);
        process.exit(1);
    }
}

runPipeline();
