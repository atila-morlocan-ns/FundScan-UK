// ═══════════════════════════════════════════════════════
// FundScan UK — Eligibility Rules Engine
// Machine-readable eligibility for each funding source
// Evaluated against user profile for ✅/⚠️/❌ badges
// ═══════════════════════════════════════════════════════

/**
 * Rule format:
 *   required: true  → must pass or ❌ Ineligible
 *   required: false → preferred, partial credit if missing
 *   
 * Check types:
 *   companySize:      'sme' | 'micro' | 'any'
 *   ukRegistered:     true/false
 *   trl:              { min, max }
 *   collaboration:    true/false
 *   nhsPartner:       true/false
 *   academicPartner:  true/false
 *   sector:           { required: [...], preferred: [...] }
 *   maxCompanyAge:    number (years)
 *   regulatoryPathway: true/false
 */

export const ELIGIBILITY_RULES = {
    // ── Innovate UK ──
    'smart-grants-pilot': {
        companySize: { value: 'sme', required: true },
        ukRegistered: { value: true, required: true },
        trl: { min: 3, max: 7, required: false },
        collaboration: { value: false, required: false, preferred: true },
        sector: { required: [], preferred: ['ai', 'healthtech', 'cleantech', 'deeptech'] },
    },
    'technology-missions-fund': {
        companySize: { value: 'any', required: false },
        ukRegistered: { value: true, required: true },
        trl: { min: 4, max: 8, required: false },
        collaboration: { value: true, required: false, preferred: true },
        sector: { required: ['ai', 'deeptech', 'biotech', 'lifescience'], preferred: [] },
    },
    'biomedical-catalyst': {
        companySize: { value: 'sme', required: true },
        ukRegistered: { value: true, required: true },
        trl: { min: 2, max: 6, required: true },
        academicPartner: { value: false, required: false, preferred: true },
        sector: { required: ['healthtech', 'lifescience', 'biotech'], preferred: ['ai'] },
    },
    'innovation-loans': {
        companySize: { value: 'sme', required: true },
        ukRegistered: { value: true, required: true },
        trl: { min: 5, max: 9, required: false },
        maxCompanyAge: { value: null, required: false },
        sector: { required: [], preferred: [] },
    },
    'creative-catalyst': {
        companySize: { value: 'sme', required: true },
        ukRegistered: { value: true, required: true },
        sector: { required: ['creative'], preferred: [] },
    },
    'innovate-uk-ktp': {
        companySize: { value: 'any', required: false },
        ukRegistered: { value: true, required: true },
        academicPartner: { value: true, required: true },
        sector: { required: [], preferred: [] },
    },

    // ── SBRI / NHS ──
    'sbri-healthcare': {
        companySize: { value: 'sme', required: false },
        ukRegistered: { value: true, required: true },
        trl: { min: 3, max: 7, required: false },
        nhsPartner: { value: false, required: false, preferred: true },
        regulatoryPathway: { value: true, required: false, preferred: true },
        sector: { required: ['healthtech'], preferred: ['ai', 'lifescience'] },
    },
    'nihr-ai-award': {
        companySize: { value: 'any', required: false },
        ukRegistered: { value: true, required: true },
        trl: { min: 4, max: 7, required: true },
        nhsPartner: { value: true, required: true },
        regulatoryPathway: { value: true, required: true },
        sector: { required: ['ai', 'healthtech'], preferred: ['lifescience'] },
    },
    'nhs-ai-lab': {
        companySize: { value: 'sme', required: false },
        ukRegistered: { value: true, required: true },
        nhsPartner: { value: false, required: false, preferred: true },
        regulatoryPathway: { value: true, required: false, preferred: true },
        sector: { required: ['ai', 'healthtech'], preferred: ['lifescience'] },
    },

    // ── Tax Schemes ──
    'seis': {
        companySize: { value: 'micro', required: true },
        ukRegistered: { value: true, required: true },
        maxCompanyAge: { value: 3, required: true },
        sector: { required: [], preferred: [] },
    },
    'eis': {
        companySize: { value: 'sme', required: true },
        ukRegistered: { value: true, required: true },
        maxCompanyAge: { value: 7, required: true },
        sector: { required: [], preferred: [] },
    },
    'rd-tax-credits': {
        companySize: { value: 'sme', required: true },
        ukRegistered: { value: true, required: true },
        sector: { required: [], preferred: [] },
    },

    // ── MedTech Specific ──
    'healthy-ageing': {
        ukRegistered: { value: true, required: true },
        trl: { min: 3, max: 8, required: false },
        sector: { required: ['healthtech'], preferred: ['ai', 'lifescience'] },
    },
    'aal-programme': {
        ukRegistered: { value: true, required: true },
        collaboration: { value: true, required: true },
        sector: { required: ['healthtech', 'ai'], preferred: ['lifescience'] },
    },
    'ahsn-medtech': {
        ukRegistered: { value: true, required: true },
        trl: { min: 4, max: 8, required: false },
        nhsPartner: { value: false, required: false, preferred: true },
        sector: { required: ['healthtech'], preferred: ['ai', 'biotech', 'lifescience'] },
    },
    'care-city-accelerator': {
        ukRegistered: { value: true, required: true },
        sector: { required: ['healthtech'], preferred: ['ai', 'lifescience'] },
    },
    'medicines-discovery-catapult': {
        ukRegistered: { value: true, required: true },
        sector: { required: ['healthtech', 'ai'], preferred: ['biotech', 'lifescience'] },
    },

    // ── Other ──
    'start-up-loans': {
        ukRegistered: { value: true, required: true },
        companySize: { value: 'sme', required: true },
        sector: { required: [], preferred: [] },
    },
    'techstars-london': {
        trl: { min: 3, max: 7, required: false },
        sector: { required: [], preferred: ['ai', 'healthtech', 'fintech'] },
    },
};

/**
 * Evaluate a funding source's eligibility against a user profile
 * Returns: { status: 'eligible'|'partial'|'ineligible', score: 0-100, checks: [...] }
 */
export function evaluateEligibility(fundId, profile) {
    const rules = ELIGIBILITY_RULES[fundId];

    // No rules = assume eligible (generic fund)
    if (!rules) {
        return { status: 'eligible', score: 80, checks: [], badge: '✅' };
    }

    const checks = [];
    let totalWeight = 0;
    let earnedWeight = 0;
    let hasBlocker = false;

    // ── UK Registered ──
    if (rules.ukRegistered) {
        const pass = profile.ukRegistered !== false; // default true
        const weight = rules.ukRegistered.required ? 20 : 5;
        totalWeight += weight;
        if (pass) earnedWeight += weight;
        else if (rules.ukRegistered.required) hasBlocker = true;
        checks.push({ field: 'UK Registered', pass, required: rules.ukRegistered.required });
    }

    // ── Company Size ──
    if (rules.companySize) {
        const teamNum = parseTeamSize(profile.teamSize);
        let pass = true;
        if (rules.companySize.value === 'micro' && teamNum > 10) pass = false;
        if (rules.companySize.value === 'sme' && teamNum > 250) pass = false;
        const weight = rules.companySize.required ? 15 : 5;
        totalWeight += weight;
        if (pass) earnedWeight += weight;
        else if (rules.companySize.required) hasBlocker = true;
        checks.push({ field: 'Company Size', pass, required: rules.companySize.required, detail: `${rules.companySize.value.toUpperCase()} required` });
    }

    // ── TRL ──
    if (rules.trl && profile.trl) {
        const pass = profile.trl >= rules.trl.min && profile.trl <= rules.trl.max;
        const weight = rules.trl.required ? 15 : 8;
        totalWeight += weight;
        if (pass) earnedWeight += weight;
        else if (rules.trl.required) hasBlocker = true;
        checks.push({ field: 'TRL Level', pass, required: rules.trl?.required, detail: `TRL ${rules.trl.min}-${rules.trl.max} required, you're TRL ${profile.trl}` });
    } else if (rules.trl) {
        // No TRL in profile — partial credit
        const weight = rules.trl.required ? 15 : 8;
        totalWeight += weight;
        earnedWeight += weight * 0.5;
        checks.push({ field: 'TRL Level', pass: null, required: rules.trl?.required, detail: `Set your TRL in Profile for better matching` });
    }

    // ── Company Age ──
    if (rules.maxCompanyAge && rules.maxCompanyAge.value) {
        if (profile.companyAge) {
            const pass = profile.companyAge <= rules.maxCompanyAge.value;
            const weight = rules.maxCompanyAge.required ? 15 : 5;
            totalWeight += weight;
            if (pass) earnedWeight += weight;
            else if (rules.maxCompanyAge.required) hasBlocker = true;
            checks.push({ field: 'Company Age', pass, required: rules.maxCompanyAge.required, detail: `Max ${rules.maxCompanyAge.value} years, yours is ${profile.companyAge}` });
        } else {
            totalWeight += 5;
            earnedWeight += 2.5;
            checks.push({ field: 'Company Age', pass: null, required: rules.maxCompanyAge.required, detail: 'Set company age in Profile' });
        }
    }

    // ── NHS Partner ──
    if (rules.nhsPartner) {
        const pass = !!profile.hasNHSPartner;
        const weight = rules.nhsPartner.required ? 15 : (rules.nhsPartner.preferred ? 8 : 3);
        totalWeight += weight;
        if (pass) earnedWeight += weight;
        else if (rules.nhsPartner.required) hasBlocker = true;
        else if (rules.nhsPartner.preferred) earnedWeight += weight * 0.3; // partial for preferred
        checks.push({ field: 'NHS Partner', pass, required: rules.nhsPartner.required, preferred: rules.nhsPartner.preferred });
    }

    // ── Academic Partner ──
    if (rules.academicPartner) {
        const pass = !!profile.hasAcademicPartner;
        const weight = rules.academicPartner.required ? 15 : (rules.academicPartner.preferred ? 8 : 3);
        totalWeight += weight;
        if (pass) earnedWeight += weight;
        else if (rules.academicPartner.required) hasBlocker = true;
        checks.push({ field: 'Academic Partner', pass, required: rules.academicPartner.required });
    }

    // ── Collaboration ──
    if (rules.collaboration) {
        const weight = rules.collaboration.required ? 15 : 5;
        totalWeight += weight;
        // Can't check this from profile — give partial
        earnedWeight += rules.collaboration.required ? weight * 0.5 : weight * 0.7;
        if (rules.collaboration.required) {
            checks.push({ field: 'Collaboration Required', pass: null, required: true, detail: 'This fund requires a consortium' });
        }
    }

    // ── Regulatory Pathway ──
    if (rules.regulatoryPathway) {
        const hasPathway = profile.regulatoryStatus && profile.regulatoryStatus !== 'none';
        const weight = rules.regulatoryPathway.required ? 10 : 5;
        totalWeight += weight;
        if (hasPathway) earnedWeight += weight;
        else if (rules.regulatoryPathway.preferred) earnedWeight += weight * 0.3;
        checks.push({ field: 'Regulatory Pathway', pass: hasPathway || null, required: rules.regulatoryPathway.required, preferred: rules.regulatoryPathway.preferred });
    }

    // ── Sector Match ──
    if (rules.sector && rules.sector.required && rules.sector.required.length > 0) {
        const profileSectors = profile.sectors || [];
        const hasRequired = rules.sector.required.some(s => profileSectors.includes(s));
        const weight = 15;
        totalWeight += weight;
        if (hasRequired) earnedWeight += weight;
        else hasBlocker = true;
        checks.push({ field: 'Sector', pass: hasRequired, required: true, detail: `Requires: ${rules.sector.required.join(', ')}` });
    }

    // Calculate score
    const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 80;

    let status, badge;
    if (hasBlocker) {
        status = 'ineligible';
        badge = '❌';
    } else if (score >= 70) {
        status = 'eligible';
        badge = '✅';
    } else {
        status = 'partial';
        badge = '⚠️';
    }

    return { status, score, checks, badge };
}

function parseTeamSize(teamSize) {
    if (!teamSize) return 5;
    if (teamSize === '1') return 1;
    if (teamSize === '50+') return 100;
    const parts = teamSize.split('-');
    return parseInt(parts[1] || parts[0]) || 5;
}
