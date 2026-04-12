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
    // Location
    location: 'Epsom',
    region: 'surrey',
    // Eligibility fields
    companyAge: 1,
    ukRegistered: true,
    trl: 5,
    regulatoryBody: 'mhra', // none | fca | mhra | ofgem | ofcom | hse | ico | caa | ea | ce-ukca | other
    // Partnership status
    hasAcademicPartner: false,
    hasClinicalPartner: false,
    hasIndustryPartner: false,
    hasGovPartner: false,
    // Legacy compat (mapped from new fields)
    hasNHSPartner: false,
    regulatoryStatus: 'pre-submission',
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

// ─── Shortlist / Favourites ──────────────────────────
const SHORTLIST_KEY = 'fundscan_shortlist';

export function getShortlist() {
    try {
        const raw = localStorage.getItem(SHORTLIST_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function _saveShortlist(list) {
    localStorage.setItem(SHORTLIST_KEY, JSON.stringify(list));
}

export function isShortlisted(fundId) {
    return getShortlist().some(s => s.fundId === fundId);
}

export function addToShortlist(fundId, note = '') {
    const list = getShortlist();
    if (!list.find(s => s.fundId === fundId)) {
        list.push({ fundId, note, addedAt: new Date().toISOString() });
        _saveShortlist(list);
    }
    return list;
}

export function removeFromShortlist(fundId) {
    const list = getShortlist().filter(s => s.fundId !== fundId);
    _saveShortlist(list);
    return list;
}

export function updateShortlistNote(fundId, note) {
    const list = getShortlist().map(s =>
        s.fundId === fundId ? { ...s, note } : s
    );
    _saveShortlist(list);
    return list;
}

// ─── Application Tracker ─────────────────────────────
const TRACKER_KEY = 'fundscan_tracker';
export const TRACKER_STAGES = [
    { id: 'researching', label: '🔍 Researching', color: '#818cf8' },
    { id: 'preparing',   label: '✏️ Preparing',   color: '#f59e0b' },
    { id: 'submitted',   label: '📤 Submitted',   color: '#06b6d4' },
    { id: 'outcome',     label: '🏆 Outcome',     color: '#10b981' },
];

export function getTrackerItems() {
    try {
        const raw = localStorage.getItem(TRACKER_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function _saveTracker(items) {
    localStorage.setItem(TRACKER_KEY, JSON.stringify(items));
}

export function addTrackerItem(fundId, stage = 'researching') {
    const items = getTrackerItems();
    if (!items.find(t => t.fundId === fundId)) {
        items.push({
            fundId,
            stage,
            outcome: null, // 'won' | 'lost' | 'withdrawn' — only when stage=outcome
            notes: '',
            addedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        _saveTracker(items);
    }
    return items;
}

export function updateTrackerStage(fundId, stage) {
    const items = getTrackerItems().map(t =>
        t.fundId === fundId
            ? { ...t, stage, outcome: stage === 'outcome' ? (t.outcome || 'won') : null, updatedAt: new Date().toISOString() }
            : t
    );
    _saveTracker(items);
    return items;
}

export function updateTrackerOutcome(fundId, outcome) {
    const items = getTrackerItems().map(t =>
        t.fundId === fundId ? { ...t, outcome, updatedAt: new Date().toISOString() } : t
    );
    _saveTracker(items);
    return items;
}

export function updateTrackerNotes(fundId, notes) {
    const items = getTrackerItems().map(t =>
        t.fundId === fundId ? { ...t, notes, updatedAt: new Date().toISOString() } : t
    );
    _saveTracker(items);
    return items;
}

export function removeTrackerItem(fundId) {
    const items = getTrackerItems().filter(t => t.fundId !== fundId);
    _saveTracker(items);
    return items;
}

export function getTrackerItem(fundId) {
    return getTrackerItems().find(t => t.fundId === fundId) || null;
}

// ─── Data Inventory (for privacy dashboard) ──────────
export function getDataInventory() {
    const profile = getProfile();
    const evidence = getEvidence();
    const stack = getStack();
    const shortlist = getShortlist();
    const tracker = getTrackerItems();

    return {
        hasProfile: !!(profile && profile.companyName),
        profileName: profile?.companyName || '',
        profileSource: profile?._analysis?.source || (profile === DEFAULT_PROFILE ? 'default' : 'manual'),
        evidenceCount: Object.keys(evidence).length,
        stackCount: stack.length,
        shortlistCount: shortlist.length,
        trackerCount: tracker.length,
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
        case 'shortlist':
            localStorage.removeItem(SHORTLIST_KEY);
            break;
        case 'tracker':
            localStorage.removeItem(TRACKER_KEY);
            break;
        case 'all':
            localStorage.removeItem(PROFILE_KEY);
            localStorage.removeItem(EVIDENCE_KEY);
            localStorage.removeItem(STACK_KEY);
            localStorage.removeItem(API_KEY_KEY);
            localStorage.removeItem(SHORTLIST_KEY);
            localStorage.removeItem(TRACKER_KEY);
            localStorage.removeItem(LAST_VISIT_KEY);
            localStorage.removeItem(SCAN_KEY);
            break;
    }
}

