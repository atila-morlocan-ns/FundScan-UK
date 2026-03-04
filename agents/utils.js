// ═══════════════════════════════════════════════════════
// FundScan UK — Agent Utilities
// Shared helpers: fetch, rate limit, slugify, validate
// ═══════════════════════════════════════════════════════

import { RATE_LIMIT_MS, MAX_RETRIES, FETCH_TIMEOUT_MS, SCHEMA, VALID_SECTORS, VALID_STAGES, VALID_TYPES, VALID_STATUSES } from './config.js';

let lastRequestTime = 0;

// Rate-limited fetch with retry
export async function fetchWithRetry(url, options = {}) {
    // Rate limiting
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < RATE_LIMIT_MS) {
        await sleep(RATE_LIMIT_MS - elapsed);
    }
    lastRequestTime = Date.now();

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
                    ...(options.headers || {}),
                },
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response;
        } catch (err) {
            log(`  ⚠ Attempt ${attempt}/${MAX_RETRIES} failed for ${url}: ${err.message}`, 'warn');
            if (attempt === MAX_RETRIES) throw err;
            await sleep(RATE_LIMIT_MS * attempt); // backoff
        }
    }
}

// Sleep
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate slug ID from name
export function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60);
}

// Validate a grant entry against schema
export function validateGrant(grant) {
    const errors = [];

    // Required fields
    for (const field of SCHEMA.required) {
        if (!grant[field]) {
            errors.push(`Missing required field: ${field}`);
        }
    }

    // Type validation
    if (grant.type && !VALID_TYPES.includes(grant.type)) {
        errors.push(`Invalid type: ${grant.type}. Must be one of: ${VALID_TYPES.join(', ')}`);
    }

    if (grant.status && !VALID_STATUSES.includes(grant.status)) {
        errors.push(`Invalid status: ${grant.status}. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    // Sectors validation
    if (grant.sectors && Array.isArray(grant.sectors)) {
        const invalid = grant.sectors.filter(s => !VALID_SECTORS.includes(s));
        if (invalid.length > 0) {
            errors.push(`Invalid sectors: ${invalid.join(', ')}`);
        }
    }

    // Stages validation
    if (grant.stages && Array.isArray(grant.stages)) {
        const invalid = grant.stages.filter(s => !VALID_STAGES.includes(s));
        if (invalid.length > 0) {
            errors.push(`Invalid stages: ${invalid.join(', ')}`);
        }
    }

    // Amount validation
    if (grant.amountMin !== undefined && grant.amountMax !== undefined) {
        if (typeof grant.amountMin !== 'number' || typeof grant.amountMax !== 'number') {
            errors.push('amountMin and amountMax must be numbers');
        }
        if (grant.amountMin > grant.amountMax && grant.amountMax !== 0) {
            errors.push('amountMin cannot exceed amountMax');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

// Levenshtein distance for deduplication
export function levenshtein(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
        Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
    }
    return matrix[a.length][b.length];
}

// Similarity score (0-1) based on Levenshtein
export function nameSimilarity(a, b) {
    const dist = levenshtein(a, b);
    const maxLen = Math.max(a.length, b.length);
    return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

// Logging helper
export function log(msg, level = 'info') {
    const time = new Date().toLocaleTimeString('en-GB');
    const icons = { info: '📋', warn: '⚠️', error: '❌', success: '✅', search: '🔍', scrape: '🕷️', db: '🗄️' };
    console.log(`${icons[level] || '📋'} [${time}] ${msg}`);
}

// Extract text from HTML (basic — for pre-Cheerio)
export function htmlToText(html) {
    return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 8000); // limit for Gemini context
}

// Read JSON file safely
export async function readJSON(filePath) {
    const { readFile } = await import('fs/promises');
    try {
        const data = await readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return null;
    }
}

// Write JSON file
export async function writeJSON(filePath, data) {
    const { writeFile, mkdir } = await import('fs/promises');
    const { dirname } = await import('path');
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
