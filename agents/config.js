// ═══════════════════════════════════════════════════════
// FundScan UK — Agent Pipeline Configuration
// Search queries, target sites, schema, and mappings
// ═══════════════════════════════════════════════════════

export const SEARCH_QUERIES = [
    // Innovate UK / IFS
    '"innovate uk" funding competition 2026',
    '"innovate uk" smart grants 2026',
    'innovate uk innovation loans open',
    'innovate uk creative catalyst 2026',
    // UKRI
    'UKRI technology missions fund open',
    'UKRI funding opportunity 2026',
    'UKRI healthy ageing challenge',
    // MedTech / HealthTech specific
    'SBRI healthcare competition 2026',
    'NIHR AI health care award 2026',
    'NHS AI lab social care funding',
    'digital health technology catalyst innovate uk',
    'UK MedTech startup grant elderly care',
    'UK fall detection AI funding',
    'AHSN medtech accelerator programme',
    // Tax & Finance
    'SEIS EIS advance assurance UK 2026',
    'R&D tax credit SME scheme UK',
    'start up loans UK 2026',
    // Sector-specific
    'UK AI startup grant 2026',
    'cleantech energy innovation UK funding',
    'UK space agency innovation fund',
    'cyber security startup UK grant',
    'UK agritech farming innovation programme',
    // General
    'UK government grant innovation startup 2026',
    'UK SME funding competition open now',
    'british business bank startup funding',
];

export const TARGET_SITES = [
    'apply-for-innovation-funding.service.gov.uk',
    'ukri.org',
    'sbrihealthcare.co.uk',
    'nihr.ac.uk',
    'gov.uk',
    'startuploans.co.uk',
    'ktn-uk.org',
    'techstars.com',
    'ahsnnetwork.com',
    'carecity.london',
    'catapult.org.uk',
    'transform.england.nhs.uk',
    'aal-europe.eu',
];

export const VALID_SECTORS = [
    'ai', 'healthtech', 'lifescience', 'cleantech', 'fintech', 'deeptech',
    'creative', 'agritech', 'spacetech', 'biotech',
    'manufacturing', 'edtech', 'cyber', 'mobility', 'general',
];

export const VALID_STAGES = [
    'idea', 'prototype', 'mvp', 'revenue', 'growth', 'scaleup',
];

export const VALID_TYPES = [
    'grant', 'loan', 'equity', 'tax', 'competition', 'accelerator',
];

export const VALID_STATUSES = ['open', 'upcoming', 'closed'];

export const SCHEMA = {
    required: ['id', 'name', 'provider', 'type', 'description', 'sectors', 'stages', 'status'],
    fields: {
        id: 'string',
        name: 'string',
        provider: 'string',
        type: 'string',
        description: 'string',
        amountMin: 'number',
        amountMax: 'number',
        sectors: 'array',
        stages: 'array',
        eligibility: 'array',
        applicationUrl: 'string',
        status: 'string',
        openDate: 'string',
        closeDate: 'string',
        lastUpdated: 'string',
        successRate: 'string',
        tips: 'array',
    },
};

export const GEMINI_MODEL = 'gemini-2.0-flash';

export const RATE_LIMIT_MS = 2000; // ms between requests
export const MAX_RETRIES = 3;
export const FETCH_TIMEOUT_MS = 15000;
