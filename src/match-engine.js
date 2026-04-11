// ═══════════════════════════════════════════════════════
// FundScan UK — Match Scoring Engine v2
// Now with: eligibility scoring, use-case intelligence,
// rebalanced weights, and staleness detection
// ═══════════════════════════════════════════════════════

import { evaluateEligibility } from './data/eligibility-rules.js';
import { daysUntil } from './data/funding-sources.js';

// ─── Keyword dictionaries ─────────────────────────────
// Maps keywords found in company descriptions to relevance signals
const KEYWORD_GROUPS = {
    // Medical & Health
    medical: ['medical', 'medicine', 'clinical', 'patient', 'hospital', 'nhs', 'healthcare', 'health care', 'diagnosis', 'diagnostic'],
    elderly: ['elderly', 'ageing', 'aging', 'older adults', 'older people', 'geriatric', 'care home', 'care homes', 'assisted living', 'independent living', 'later life'],
    falls: ['fall', 'falls', 'fall detection', 'fall prevention', 'slip', 'trip'],
    seizure: ['seizure', 'seizures', 'epilepsy', 'epileptic', 'convulsion'],
    monitoring: ['monitoring', 'remote monitoring', 'telehealth', 'telecare', 'wearable', 'sensor', 'continuous monitoring'],
    safety: ['patient safety', 'safety', 'safeguarding', 'alert', 'alerting', 'emergency'],

    // AI & Technology
    ai: ['artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'computer vision', 'nlp', 'natural language', 'llm', 'vlm', 'vision language', 'generative ai'],
    data: ['data', 'analytics', 'big data', 'data science', 'dataset', 'data platform'],
    software: ['software', 'saas', 'platform', 'app', 'application', 'digital', 'cloud'],
    robotics: ['robot', 'robotics', 'automation', 'autonomous'],
    iot: ['iot', 'internet of things', 'connected device', 'smart home', 'smart device', 'edge computing'],

    // Business
    innovation: ['innovation', 'innovative', 'novel', 'breakthrough', 'disruptive', 'cutting-edge', 'state-of-the-art'],
    commercialisation: ['commercialisation', 'commercialization', 'market', 'go-to-market', 'revenue', 'scalable', 'scale-up'],
    research: ['research', 'r&d', 'feasibility', 'proof of concept', 'pilot', 'prototype', 'trl'],
    social: ['social impact', 'social enterprise', 'social care', 'community', 'public benefit', 'nhs'],

    // Sector-specific
    lifescience: ['life science', 'life sciences', 'biomedical', 'pharmaceutical', 'pharma', 'clinical trial', 'medical device', 'medtech', 'med-tech', 'regulatory approval', 'ce marking', 'fda'],
    cleantech: ['clean energy', 'renewable', 'sustainability', 'carbon', 'net zero', 'green', 'circular economy', 'environment'],
    fintech: ['fintech', 'financial technology', 'banking', 'payments', 'insurtech', 'regtech', 'blockchain', 'cryptocurrency'],
};

// ─── N&S Use-Case Intelligence ────────────────────────
// High-signal phrases that indicate deep alignment with N&S-type startups
// These go BEYOND generic sector matching
const USE_CASE_SIGNALS = {
    // 5% bonus — perfect alignment
    perfect: [
        'fall detection', 'fall prevention', 'unwitnessed',
        'patient monitoring camera', 'computer vision health',
        'elderly monitoring', 'care home monitoring',
        'seizure detection', 'medical event detection',
        'ai witness', 'virtual witness',
    ],
    // 3% bonus — strong alignment
    strong: [
        'patient safety', 'remote monitoring elderly',
        'assisted living technology', 'social care ai',
        'ageing population', 'independent living technology',
        'elderly care technology', 'domiciliary care',
        'ambient assisted living', 'care home technology',
        'falls in elderly', 'falls prevention programme',
    ],
    // 1% bonus — good alignment
    good: [
        'ai diagnostics', 'digital health innovation',
        'medtech startup', 'connected care',
        'telehealth elderly', 'wearable health',
        'clinical ai', 'nhs innovation',
        'health monitoring', 'ai social care',
    ],
};

// ─── Extract keywords from text ───────────────────────
function extractKeywords(text) {
    if (!text) return [];
    const lower = text.toLowerCase();
    const found = [];

    for (const [group, keywords] of Object.entries(KEYWORD_GROUPS)) {
        for (const kw of keywords) {
            if (lower.includes(kw)) {
                found.push({ group, keyword: kw });
                break; // One match per group is enough
            }
        }
    }

    return found;
}

// Score keyword relevance between profile description and funding
function keywordMatchScore(profileKeywords, funding) {
    if (!profileKeywords || profileKeywords.length === 0) return 0;

    const fundingText = [
        funding.name,
        funding.provider,
        funding.description,
        ...(funding.eligibility || []),
        ...(funding.tips || []),
    ].join(' ').toLowerCase();

    let matches = 0;
    let totalGroups = profileKeywords.length;

    for (const { group } of profileKeywords) {
        const groupKeywords = KEYWORD_GROUPS[group] || [];
        const hasMatch = groupKeywords.some(kw => fundingText.includes(kw));
        if (hasMatch) matches++;
    }

    return totalGroups > 0 ? matches / totalGroups : 0;
}

// ─── Use-Case Relevance Score ─────────────────────────
// Checks how deeply a funding source aligns with the user's specific use case
function useCaseScore(funding, profile) {
    const fundingText = [
        funding.name,
        funding.description,
        ...(funding.eligibility || []),
        ...(funding.tips || []),
    ].join(' ').toLowerCase();

    const profileText = (profile.companyDesc || '').toLowerCase();

    let bonus = 0;

    // Check fund text against use-case signals
    for (const phrase of USE_CASE_SIGNALS.perfect) {
        if (fundingText.includes(phrase) && profileText.includes(phrase.split(' ')[0])) {
            bonus = Math.max(bonus, 5);
            break;
        }
        if (fundingText.includes(phrase)) {
            bonus = Math.max(bonus, 3);
        }
    }

    if (bonus < 5) {
        for (const phrase of USE_CASE_SIGNALS.strong) {
            if (fundingText.includes(phrase)) {
                bonus = Math.max(bonus, 2);
                break;
            }
        }
    }

    if (bonus < 2) {
        for (const phrase of USE_CASE_SIGNALS.good) {
            if (fundingText.includes(phrase)) {
                bonus = Math.max(bonus, 1);
                break;
            }
        }
    }

    return bonus;
}

// ─── Staleness Detection ──────────────────────────────
export function getStaleness(fund) {
    const daysSinceUpdate = -daysUntil(fund.lastUpdated);

    if (daysSinceUpdate > 90) return { level: 'stale', label: '⚠️ Data may be outdated', days: daysSinceUpdate, class: 'stale' };
    if (daysSinceUpdate > 30) return { level: 'aging', label: '🔄 Check for updates', days: daysSinceUpdate, class: 'aging' };
    return { level: 'fresh', label: '✅ Recently verified', days: daysSinceUpdate, class: 'fresh' };
}

// Auto-correct status if close date has passed
export function getEffectiveStatus(fund) {
    if (fund.status === 'open' && fund.closeDate) {
        const days = daysUntil(fund.closeDate);
        if (days <= 0) return 'closed';
    }
    if (fund.status === 'upcoming' && fund.openDate) {
        const days = daysUntil(fund.openDate);
        if (days <= 0) return 'open';
    }
    return fund.status;
}

// ═══════════════════════════════════════════════════════
// MAIN SCORING ENGINE v2
// Rebalanced weights:
//   Eligibility  25%  (NEW)
//   Sector       20%  (was 35%)
//   Keywords     20%  (same)
//   Stage        15%  (was 25%)
//   Status       10%  (same)
//   Amount        5%  (was 10%)
//   Use-Case      5%  (NEW)
// ═══════════════════════════════════════════════════════

export function calculateMatchScore(funding, profile) {
    if (!profile || !profile.sectors || !profile.stages) {
        return 0;
    }

    let score = 0;
    const maxScore = 100;

    // ── 1. Eligibility (25 points — NEW) ──────────────
    const eligibility = evaluateEligibility(funding.id, profile);
    if (eligibility.status === 'ineligible') {
        score += 0;
    } else if (eligibility.status === 'eligible') {
        score += 25;
    } else {
        score += Math.round(25 * (eligibility.score / 100));
    }

    // ── 2. Sector match (20 points) ───────────────────
    if (profile.sectors && profile.sectors.length > 0) {
        const sectorOverlap = profile.sectors.filter(s => funding.sectors.includes(s));
        if (sectorOverlap.length > 0) {
            score += Math.round(20 * (sectorOverlap.length / Math.max(profile.sectors.length, 1)));
        }
        // General / cross-sector always gets partial credit
        if (funding.sectors.includes('general') && sectorOverlap.length === 0) {
            score += 7;
        }
    }

    // ── 3. Keyword match (20 points) ──────────────────
    if (profile.companyDesc) {
        const profileKeywords = extractKeywords(profile.companyDesc);
        const kwScore = keywordMatchScore(profileKeywords, funding);
        score += Math.round(20 * kwScore);
    } else {
        score += 4; // No description — small partial credit
    }

    // ── 4. Stage match (15 points) ────────────────────
    if (profile.stages && profile.stages.length > 0) {
        const stageOverlap = profile.stages.filter(s => funding.stages.includes(s));
        if (stageOverlap.length > 0) {
            score += Math.round(15 * (stageOverlap.length / Math.max(profile.stages.length, 1)));
        }
    }

    // ── 5. Status bonus (10 points) ───────────────────
    const effectiveStatus = getEffectiveStatus(funding);
    if (effectiveStatus === 'open') {
        score += 10;
    } else if (effectiveStatus === 'upcoming') {
        score += 6;
    }
    // closed = 0

    // ── 6. Amount relevance (5 points) ────────────────
    if (profile.fundingNeeded) {
        const needed = profile.fundingNeeded;
        if (funding.amountMax === 0 && funding.amountMin === 0) {
            score += 3; // varies — partial credit
        } else if (needed >= funding.amountMin && needed <= funding.amountMax) {
            score += 5; // perfect fit
        } else if (needed < funding.amountMin && needed >= funding.amountMin * 0.5) {
            score += 3; // close below
        } else if (needed > funding.amountMax && needed <= funding.amountMax * 2) {
            score += 2; // close above
        }
    } else {
        score += 3; // no preference — partial credit
    }

    // ── 7. Use-Case Intelligence (5 points — NEW) ─────
    score += useCaseScore(funding, profile);

    return Math.min(Math.round(score), 100);
}

export function getMatchLevel(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'mid';
    return 'low';
}

export function sortByMatch(fundingList, profile) {
    return fundingList
        .map(f => ({
            ...f,
            matchScore: calculateMatchScore(f, profile),
            _eligibility: evaluateEligibility(f.id, profile),
            _staleness: getStaleness(f),
            _effectiveStatus: getEffectiveStatus(f),
        }))
        .sort((a, b) => b.matchScore - a.matchScore);
}

// Export for use in scanner keyword search
export { extractKeywords, KEYWORD_GROUPS };
