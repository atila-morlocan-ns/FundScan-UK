// ═══════════════════════════════════════════════════════
// FundScan UK — Database Manager Agent
// Validates, deduplicates, merges, and exports grants
// ═══════════════════════════════════════════════════════

import 'dotenv/config';
import { nameSimilarity, validateGrant, slugify, log, readJSON, writeJSON } from './utils.js';
import { VALID_SECTORS, VALID_STAGES, VALID_TYPES } from './config.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, 'data');
const SCRAPED_FILE = join(DATA_DIR, 'scraped-grants.json');
const DB_FILE = join(DATA_DIR, 'grants.json');
const CHANGELOG_FILE = join(DATA_DIR, 'changelog.json');
const EXPORT_FILE = join(__dirname, '..', 'src', 'data', 'funding-sources-generated.js');

const SIMILARITY_THRESHOLD = 0.75; // 75% name match = same grant

// Check if a new grant matches an existing one
function findDuplicate(newGrant, existingGrants) {
    for (const existing of existingGrants) {
        // Check URL match
        if (newGrant.applicationUrl && existing.applicationUrl &&
            newGrant.applicationUrl === existing.applicationUrl) {
            return existing;
        }

        // Check name similarity
        const similarity = nameSimilarity(newGrant.name, existing.name);
        if (similarity >= SIMILARITY_THRESHOLD) {
            return existing;
        }

        // Check ID match
        if (newGrant.id && existing.id && newGrant.id === existing.id) {
            return existing;
        }
    }

    return null;
}

// Merge updated fields from new into existing
function mergeGrant(existing, update) {
    const changes = [];

    // Fields that can be updated
    const updatableFields = ['status', 'openDate', 'closeDate', 'lastUpdated', 'amountMin', 'amountMax', 'successRate', 'description'];

    for (const field of updatableFields) {
        if (update[field] !== undefined && update[field] !== existing[field]) {
            changes.push({
                field,
                oldValue: existing[field],
                newValue: update[field],
            });
            existing[field] = update[field];
        }
    }

    // Merge arrays (add new items)
    for (const arrField of ['eligibility', 'tips', 'sectors', 'stages']) {
        if (update[arrField] && Array.isArray(update[arrField])) {
            const existing_arr = existing[arrField] || [];
            const newItems = update[arrField].filter(item => !existing_arr.includes(item));
            if (newItems.length > 0) {
                existing[arrField] = [...existing_arr, ...newItems];
                changes.push({
                    field: arrField,
                    added: newItems,
                });
            }
        }
    }

    // Update provenance on merge
    if (update._provenance) {
        const existingProv = existing._provenance || {};
        existing._provenance = {
            sourceUrl: update._provenance.sourceUrl || existingProv.sourceUrl,
            firstDiscovered: existingProv.firstDiscovered || update._provenance.firstDiscovered,
            lastVerified: update._provenance.lastVerified || new Date().toISOString(),
            verificationCount: (existingProv.verificationCount || 0) + 1,
            extractionMethod: update._provenance.extractionMethod || existingProv.extractionMethod,
            contentHash: update._provenance.contentHash || existingProv.contentHash,
            confidence: update._provenance.confidence || existingProv.confidence,
        };
    }

    // Update confidence
    if (update._confidence) {
        existing._confidence = update._confidence;
    }

    // Update timestamp
    if (changes.length > 0) {
        existing.lastUpdated = new Date().toISOString().split('T')[0];
    }

    return changes;
}

// Clean and normalize a grant entry
function normalizeGrant(grant) {
    // Ensure ID
    if (!grant.id) {
        grant.id = slugify(grant.name);
    }

    // Filter invalid sectors/stages
    if (grant.sectors) {
        grant.sectors = grant.sectors.filter(s => VALID_SECTORS.includes(s));
        if (grant.sectors.length === 0) grant.sectors = ['general'];
    }
    if (grant.stages) {
        grant.stages = grant.stages.filter(s => VALID_STAGES.includes(s));
        if (grant.stages.length === 0) grant.stages = ['mvp'];
    }

    // Validate type
    if (!VALID_TYPES.includes(grant.type)) {
        grant.type = 'grant'; // default
    }

    // Clean amounts
    grant.amountMin = parseInt(grant.amountMin) || 0;
    grant.amountMax = parseInt(grant.amountMax) || 0;

    // Ensure arrays
    grant.eligibility = grant.eligibility || [];
    grant.tips = grant.tips || [];

    // Preserve provenance and confidence for export
    const clean = { ...grant };
    delete clean._scrapedAt;
    delete clean._status;

    // Keep _provenance and _confidence — they're needed for freshness tracking
    // but rename to clean format for frontend
    if (clean._provenance) {
        clean.provenance = {
            sourceUrl: clean._provenance.sourceUrl,
            lastVerified: clean._provenance.lastVerified,
            verificationCount: clean._provenance.verificationCount,
            contentHash: clean._provenance.contentHash,
        };
        delete clean._provenance;
    }
    if (clean._confidence) {
        clean.confidence = {
            overall: clean._confidence.overall,
            fields: Object.fromEntries(
                Object.entries(clean._confidence.fields || {}).map(([k, v]) => [k, v.level])
            ),
        };
        delete clean._confidence;
    }
    delete clean._sourceUrl;

    return clean;
}

// Generate JS module file for the frontend
function generateExportCode(grants) {
    // Sort by name for consistency
    const sorted = [...grants].sort((a, b) => a.name.localeCompare(b.name));

    const items = sorted.map(g => {
        const clean = normalizeGrant({ ...g });
        return `    ${JSON.stringify(clean, null, 8).replace(/\n/g, '\n    ')}`;
    }).join(',\n');

    return `// ═══════════════════════════════════════════════════════
// FundScan UK — Auto-Generated Funding Sources
// Generated by Database Manager Agent on ${new Date().toISOString()}
// DO NOT EDIT MANUALLY — run: npm run agents:update-db
// ═══════════════════════════════════════════════════════

export const generatedFundingSources = [
${items}
];

export const generatedMeta = {
    generatedAt: '${new Date().toISOString()}',
    totalSources: ${sorted.length},
};
`;
}

// Main database manager function
export async function runDBManager() {
    log('═══════════════════════════════════════════════', 'info');
    log('🗄️  DATABASE MANAGER — Processing grant data', 'db');
    log('═══════════════════════════════════════════════', 'info');

    // Load scraped data
    const scraped = await readJSON(SCRAPED_FILE);
    if (!scraped || !scraped.grants || scraped.grants.length === 0) {
        log('No scraped grants found. Run scraper first: npm run agents:scrape', 'error');
        return;
    }

    // Load existing database
    let database = await readJSON(DB_FILE);
    if (!database) {
        database = { grants: [], meta: {} };
        log('No existing database — creating new one', 'info');
    }

    const existingGrants = database.grants || [];
    const changelog = [];

    let added = 0;
    let updated = 0;
    let skipped = 0;
    let invalid = 0;

    // Process each scraped grant
    for (const newGrant of scraped.grants) {
        // Validate
        const validation = validateGrant(newGrant);
        if (!validation.valid) {
            log(`  ⚠ Invalid grant "${newGrant.name}": ${validation.errors.join('; ')}`, 'warn');
            invalid++;
            continue;
        }

        // Check for duplicates
        const existing = findDuplicate(newGrant, existingGrants);

        if (existing) {
            // Merge updates
            const changes = mergeGrant(existing, newGrant);
            if (changes.length > 0) {
                updated++;
                changelog.push({
                    action: 'updated',
                    name: existing.name,
                    changes,
                    timestamp: new Date().toISOString(),
                });
                log(`  📝 Updated: ${existing.name} (${changes.length} field${changes.length > 1 ? 's' : ''})`, 'db');
            } else {
                skipped++;
                log(`  ⏭ No changes: ${existing.name}`, 'info');
            }
        } else {
            // New grant — add to database
            const normalized = normalizeGrant(newGrant);
            existingGrants.push(normalized);
            added++;
            changelog.push({
                action: 'added',
                name: normalized.name,
                provider: normalized.provider,
                timestamp: new Date().toISOString(),
            });
            log(`  ✅ Added: ${normalized.name} (${normalized.provider})`, 'success');
        }
    }

    // Save updated database
    database.grants = existingGrants;
    database.meta = {
        lastUpdated: new Date().toISOString(),
        totalGrants: existingGrants.length,
        lastRun: {
            added,
            updated,
            skipped,
            invalid,
        },
    };

    await writeJSON(DB_FILE, database);

    // Save changelog
    const existingChangelog = await readJSON(CHANGELOG_FILE) || [];
    existingChangelog.push(...changelog);
    await writeJSON(CHANGELOG_FILE, existingChangelog);

    // Generate JS export
    const exportCode = generateExportCode(existingGrants);
    const { writeFile } = await import('fs/promises');
    await writeFile(EXPORT_FILE, exportCode, 'utf-8');

    log(`\n═══════════════════════════════════════════════`, 'info');
    log(`✅ Database update complete!`, 'success');
    log(`   Added:    ${added}`, 'info');
    log(`   Updated:  ${updated}`, 'info');
    log(`   Skipped:  ${skipped}`, 'info');
    log(`   Invalid:  ${invalid}`, 'info');
    log(`   Total DB: ${existingGrants.length} grants`, 'info');
    log(`   DB file:  ${DB_FILE}`, 'info');
    log(`   Export:   ${EXPORT_FILE}`, 'info');
    log(`═══════════════════════════════════════════════`, 'info');

    return database;
}

// Run if called directly
const isMain = process.argv[1] && (
    process.argv[1].endsWith('db-manager.js') ||
    process.argv[1].includes('db-manager')
);

if (isMain) {
    runDBManager().catch(err => {
        log(`Fatal error: ${err.message}`, 'error');
        process.exit(1);
    });
}
