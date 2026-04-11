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
    sectors: ['healthtech', 'ai', 'lifescience'],
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

// ─── Evidence Vault ───────────────────────────────────
const EVIDENCE_KEY = 'fundscan_evidence';

export function getEvidence() {
    try {
        const raw = localStorage.getItem(EVIDENCE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

export function saveEvidence(evidenceId, data) {
    const all = getEvidence();
    all[evidenceId] = { ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(EVIDENCE_KEY, JSON.stringify(all));
}

export function removeEvidence(evidenceId) {
    const all = getEvidence();
    delete all[evidenceId];
    localStorage.setItem(EVIDENCE_KEY, JSON.stringify(all));
}

// ─── Funding Stack ────────────────────────────────────
const STACK_KEY = 'fundscan_stack';

export function getStack() {
    try {
        const raw = localStorage.getItem(STACK_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

export function saveStack(stack) {
    localStorage.setItem(STACK_KEY, JSON.stringify(stack));
}

export function addToStack(item) {
    const stack = getStack();
    if (!stack.find(s => s.fundId === item.fundId)) {
        stack.push({ ...item, addedAt: new Date().toISOString() });
        saveStack(stack);
    }
    return stack;
}

export function removeFromStack(fundId) {
    const stack = getStack().filter(s => s.fundId !== fundId);
    saveStack(stack);
    return stack;
}

export function updateStackItem(fundId, updates) {
    const stack = getStack().map(s =>
        s.fundId === fundId ? { ...s, ...updates } : s
    );
    saveStack(stack);
    return stack;
}

// ─── API Key Management ──────────────────────────────
const API_KEY_KEY = 'fundscan_api_key';

export function getApiKey() {
    return localStorage.getItem(API_KEY_KEY) || '';
}

export function saveApiKey(key) {
    localStorage.setItem(API_KEY_KEY, key);
}

// ─── Data Inventory (for privacy dashboard) ──────────
export function getDataInventory() {
    const profile = getProfile();
    const evidence = getEvidence();
    const stack = getStack();

    return {
        hasProfile: !!(profile && profile.companyName),
        profileName: profile?.companyName || '',
        profileSource: profile?._analysis?.source || (profile === DEFAULT_PROFILE ? 'default' : 'manual'),
        evidenceCount: Object.keys(evidence).length,
        stackCount: stack.length,
        hasApiKey: !!(localStorage.getItem(API_KEY_KEY) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY)),
    };
}

// ─── Data Privacy — Clear / Purge ────────────────────
export function clearAllData(scope = 'all') {
    switch (scope) {
        case 'profile':
            localStorage.removeItem(PROFILE_KEY);
            break;
        case 'evidence':
            localStorage.removeItem(EVIDENCE_KEY);
            break;
        case 'stack':
            localStorage.removeItem(STACK_KEY);
            break;
        case 'apikey':
            localStorage.removeItem(API_KEY_KEY);
            break;
        case 'all':
            localStorage.removeItem(PROFILE_KEY);
            localStorage.removeItem(EVIDENCE_KEY);
            localStorage.removeItem(STACK_KEY);
            localStorage.removeItem(API_KEY_KEY);
            localStorage.removeItem(LAST_VISIT_KEY);
            localStorage.removeItem(SCAN_KEY);
            break;
    }
}

