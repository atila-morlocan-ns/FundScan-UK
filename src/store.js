// ═══════════════════════════════════════════════════════
// FundScan UK — User Profile Store
// localStorage persistence for startup profile
// ═══════════════════════════════════════════════════════

const PROFILE_KEY = 'fundscan_profile';
const LAST_VISIT_KEY = 'fundscan_last_visit';
const SCAN_KEY = 'fundscan_last_scan';

// Default profile for Nightingale & Sentinel
const DEFAULT_PROFILE = {
    companyName: 'Nightingale & Sentinel',
    companyDesc: 'MedTech startup using computer vision and Vision Language Models (VLMs) to create an AI virtual witness for unwitnessed medical events — falls, seizures, and other critical incidents in elderly care. Addressing the £4.6 billion UK market in elderly falls and unwitnessed events.',
    teamSize: '2-5',
    fundingNeeded: 250000,
    sectors: ['healthtech', 'ai'],
    stages: ['mvp', 'revenue'],
};

export function getProfile() {
    try {
        const raw = localStorage.getItem(PROFILE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.warn('Failed to load profile:', e);
    }
    // Return default profile if none saved
    return DEFAULT_PROFILE;
}

export function saveProfile(profile) {
    try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
        console.warn('Failed to save profile:', e);
    }
}

export function getLastVisit() {
    return localStorage.getItem(LAST_VISIT_KEY);
}

export function setLastVisit() {
    localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
}

export function getLastScan() {
    return localStorage.getItem(SCAN_KEY);
}

export function setLastScan() {
    localStorage.setItem(SCAN_KEY, new Date().toISOString());
}

export function getProfileCompleteness(profile) {
    if (!profile) return 0;
    let filled = 0;
    let total = 5;
    if (profile.companyName) filled++;
    if (profile.sectors && profile.sectors.length > 0) filled++;
    if (profile.stages && profile.stages.length > 0) filled++;
    if (profile.teamSize) filled++;
    if (profile.fundingNeeded) filled++;
    return Math.round((filled / total) * 100);
}
