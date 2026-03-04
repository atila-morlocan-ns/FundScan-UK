// ═══════════════════════════════════════════════════════
// FundScan UK — User Profile Store
// localStorage persistence for startup profile
// ═══════════════════════════════════════════════════════

const PROFILE_KEY = 'fundscan_profile';
const LAST_VISIT_KEY = 'fundscan_last_visit';
const SCAN_KEY = 'fundscan_last_scan';

export function getProfile() {
    try {
        const raw = localStorage.getItem(PROFILE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.warn('Failed to load profile:', e);
    }
    return null;
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
