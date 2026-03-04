// ═══════════════════════════════════════════════════════
// FundScan UK — Match Scoring Engine
// Scores funding sources based on user profile
// ═══════════════════════════════════════════════════════

export function calculateMatchScore(funding, profile) {
    if (!profile || !profile.sectors || !profile.stages) {
        return 0;
    }

    let score = 0;
    let maxScore = 0;

    // Sector match (40% weight)
    maxScore += 40;
    if (profile.sectors && profile.sectors.length > 0) {
        const sectorOverlap = profile.sectors.filter(s => funding.sectors.includes(s));
        if (sectorOverlap.length > 0) {
            score += 40 * (sectorOverlap.length / Math.max(profile.sectors.length, 1));
        }
        // General / cross-sector always gets partial credit
        if (funding.sectors.includes('general') && sectorOverlap.length === 0) {
            score += 15;
        }
    }

    // Stage match (30% weight)
    maxScore += 30;
    if (profile.stages && profile.stages.length > 0) {
        const stageOverlap = profile.stages.filter(s => funding.stages.includes(s));
        if (stageOverlap.length > 0) {
            score += 30 * (stageOverlap.length / Math.max(profile.stages.length, 1));
        }
    }

    // Status bonus (15% weight) — open > upcoming > closed
    maxScore += 15;
    if (funding.status === 'open') {
        score += 15;
    } else if (funding.status === 'upcoming') {
        score += 8;
    }

    // Amount relevance (15% weight)
    maxScore += 15;
    if (profile.fundingNeeded) {
        const needed = profile.fundingNeeded;
        if (funding.amountMax === 0 && funding.amountMin === 0) {
            score += 7; // varies — partial credit
        } else if (needed >= funding.amountMin && needed <= funding.amountMax) {
            score += 15; // perfect fit
        } else if (needed < funding.amountMin && needed >= funding.amountMin * 0.5) {
            score += 10; // close
        } else if (needed > funding.amountMax && needed <= funding.amountMax * 2) {
            score += 8; // close above
        }
    } else {
        score += 7; // no preference — partial credit
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
