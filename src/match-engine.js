// ═══════════════════════════════════════════════════════
// FundScan UK — Match Scoring Engine
// Scores funding sources based on user profile
// Now includes keyword-based description matching
// ═══════════════════════════════════════════════════════

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

// Extract keywords from a text description
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

// Score keyword relevance between profile description and funding description
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

    for (const { group, keyword } of profileKeywords) {
        // Check if the keyword group is relevant to this funding
        const groupKeywords = KEYWORD_GROUPS[group] || [];
        const hasMatch = groupKeywords.some(kw => fundingText.includes(kw));
        if (hasMatch) matches++;
    }

    return totalGroups > 0 ? matches / totalGroups : 0;
}

export function calculateMatchScore(funding, profile) {
    if (!profile || !profile.sectors || !profile.stages) {
        return 0;
    }

    let score = 0;
    let maxScore = 0;

    // ── Sector match (35% weight) ──────────────────
    maxScore += 35;
    if (profile.sectors && profile.sectors.length > 0) {
        const sectorOverlap = profile.sectors.filter(s => funding.sectors.includes(s));
        if (sectorOverlap.length > 0) {
            score += 35 * (sectorOverlap.length / Math.max(profile.sectors.length, 1));
        }
        // General / cross-sector always gets partial credit
        if (funding.sectors.includes('general') && sectorOverlap.length === 0) {
            score += 12;
        }
    }

    // ── Stage match (25% weight) ───────────────────
    maxScore += 25;
    if (profile.stages && profile.stages.length > 0) {
        const stageOverlap = profile.stages.filter(s => funding.stages.includes(s));
        if (stageOverlap.length > 0) {
            score += 25 * (stageOverlap.length / Math.max(profile.stages.length, 1));
        }
    }

    // ── Keyword match (20% weight — NEW) ──────────
    maxScore += 20;
    if (profile.companyDesc) {
        const profileKeywords = extractKeywords(profile.companyDesc);
        const kwScore = keywordMatchScore(profileKeywords, funding);
        score += 20 * kwScore;
    } else {
        score += 5; // No description — give small partial credit
    }

    // ── Status bonus (10% weight) ─────────────────
    maxScore += 10;
    if (funding.status === 'open') {
        score += 10;
    } else if (funding.status === 'upcoming') {
        score += 6;
    }

    // ── Amount relevance (10% weight) ─────────────
    maxScore += 10;
    if (profile.fundingNeeded) {
        const needed = profile.fundingNeeded;
        if (funding.amountMax === 0 && funding.amountMin === 0) {
            score += 5; // varies — partial credit
        } else if (needed >= funding.amountMin && needed <= funding.amountMax) {
            score += 10; // perfect fit
        } else if (needed < funding.amountMin && needed >= funding.amountMin * 0.5) {
            score += 7; // close
        } else if (needed > funding.amountMax && needed <= funding.amountMax * 2) {
            score += 5; // close above
        }
    } else {
        score += 5; // no preference — partial credit
    }

    return Math.round((score / maxScore) * 100);
}

export function getMatchLevel(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'mid';
    return 'low';
}

export function sortByMatch(fundingList, profile) {
    return fundingList
        .map(f => ({ ...f, matchScore: calculateMatchScore(f, profile) }))
        .sort((a, b) => b.matchScore - a.matchScore);
}

// Export for use in scanner keyword search
export { extractKeywords, KEYWORD_GROUPS };
