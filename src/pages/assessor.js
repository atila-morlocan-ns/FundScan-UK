// ═══════════════════════════════════════════════════════
// FundScan UK — Expert Assessor
// 6-step guided wizard to assess funding readiness
// Generates per-funder readiness report
// ═══════════════════════════════════════════════════════

import { fundingSources, formatAmount } from '../data/funding-sources.js';
import { getProfile, saveProfile } from '../store.js';
import { calculateMatchScore, getEffectiveStatus } from '../match-engine.js';
import { evaluateEligibility } from '../data/eligibility-rules.js';
import { FUNDER_INTELLIGENCE } from '../data/grant-strategy.js';

const STEPS = [
    { id: 'basics',     label: 'Company Basics',      icon: '🏢' },
    { id: 'tech',       label: 'Technology',           icon: '🔬' },
    { id: 'market',     label: 'Market & Traction',    icon: '📈' },
    { id: 'evidence',   label: 'Evidence & Assets',    icon: '📂' },
    { id: 'funding',    label: 'Funding Target',       icon: '🎯' },
    { id: 'report',     label: 'Readiness Report',     icon: '📊' },
];

// Assessment state
let assessmentData = {};
let currentStep = 0;

function initAssessment() {
    const profile = getProfile();
    assessmentData = {
        // Step 1: Basics
        companyName: profile.companyName || '',
        companyDesc: profile.companyDesc || '',
        teamSize: profile.teamSize || '',
        ukRegistered: profile.ukRegistered !== false,
        companyAge: profile.companyAge || '',

        // Step 2: Technology
        trl: profile.trl || '',
        ipStatus: 'provisional',       // none | provisional | granted | trade-secret
        regulatoryStatus: profile.regulatoryStatus || 'none',
        dataSecurity: 'planning',       // none | planning | certified (ISO/Cyber Essentials)

        // Step 3: Market & Traction
        marketSize: '',                 // e.g. '4.6B'
        marketEvidence: false,          // has market research / data
        customers: 'none',             // none | pilot | paying | scaling
        revenue: 'pre-revenue',        // pre-revenue | <100k | 100k-500k | 500k+
        nhsPartner: profile.hasNHSPartner || false,
        academicPartner: profile.hasAcademicPartner || false,
        otherPartners: '',

        // Step 4: Evidence & Assets
        hasPitchDeck: false,
        hasBusinessPlan: false,
        hasFinancials: false,
        hasClinicalData: false,
        hasIPDocumentation: false,
        hasLettersOfSupport: false,
        hasPrototype: false,
        hasTeamCVs: false,

        // Step 5: Funding Target
        sectors: profile.sectors || [],
        stages: profile.stages || [],
        fundingNeeded: profile.fundingNeeded || '',
        fundingTimeline: '6-12months',  // immediate | 3-6months | 6-12months | 12months+
        fundingType: 'grant',           // grant | loan | equity | mixed
    };
    currentStep = 0;
}

export function renderAssessor() {
    initAssessment();
    return generateWizardHTML();
}

function generateWizardHTML() {
    return `
    <div class="container" style="max-width:900px;">
      <div style="margin-bottom:var(--space-xl);">
        <h1 style="font-size:var(--font-3xl); font-weight:800; letter-spacing:-0.02em;">
          🎓 Expert Assessor
        </h1>
        <p style="color:var(--text-secondary); font-size:var(--font-sm); margin-top:4px;">
          6-step funding readiness assessment — get a personalised report for each funder
        </p>
      </div>

      <!-- Step Progress -->
      <div class="assessor-progress">
        ${STEPS.map((step, i) => `
          <div class="assessor-step ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}" data-step="${i}">
            <div class="assessor-step-icon">${i < currentStep ? '✓' : step.icon}</div>
            <div class="assessor-step-label">${step.label}</div>
          </div>
          ${i < STEPS.length - 1 ? '<div class="assessor-step-line"></div>' : ''}
        `).join('')}
      </div>

      <!-- Step Content -->
      <div class="card" style="padding:var(--space-xl);" id="assessor-content">
        ${renderStepContent(currentStep)}
      </div>

      <!-- Navigation -->
      <div class="assessor-nav" id="assessor-nav">
        ${currentStep > 0 && currentStep < 5 ? `<button class="btn btn-secondary" id="assessor-prev">← Back</button>` : '<div></div>'}
        ${currentStep < 4 ? `<button class="btn btn-primary" id="assessor-next">Next →</button>` : ''}
        ${currentStep === 4 ? `<button class="btn btn-success" id="assessor-generate" style="padding:10px 32px;">📊 Generate Report</button>` : ''}
        ${currentStep === 5 ? `
          <button class="btn btn-secondary" id="assessor-restart">🔄 Start Over</button>
          <button class="btn btn-primary" id="assessor-save">💾 Save to Profile</button>
        ` : ''}
      </div>
    </div>
  `;
}

function renderStepContent(step) {
    switch (step) {
        case 0: return renderBasicsStep();
        case 1: return renderTechStep();
        case 2: return renderMarketStep();
        case 3: return renderEvidenceStep();
        case 4: return renderFundingStep();
        case 5: return renderReportStep();
        default: return '';
    }
}

// ── Step 1: Company Basics ──
function renderBasicsStep() {
    return `
    <h2 style="font-size:var(--font-xl); font-weight:700; margin-bottom:var(--space-lg);">🏢 Company Basics</h2>
    <p style="color:var(--text-secondary); font-size:var(--font-sm); margin-bottom:var(--space-lg);">
      Tell us about your company. These fields are pre-filled from your profile.
    </p>

    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Company Name</label>
        <input type="text" class="form-input" id="a-companyName" value="${assessmentData.companyName}" placeholder="Your company name">
      </div>

      <div class="form-group">
        <label class="form-label">Team Size</label>
        <select class="form-select" id="a-teamSize">
          <option value="">Select...</option>
          ${['1', '2-5', '6-10', '11-25', '26-50', '50+'].map(s =>
            `<option value="${s}" ${assessmentData.teamSize === s ? 'selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Company Age (years)</label>
        <input type="number" class="form-input" id="a-companyAge" value="${assessmentData.companyAge}" min="0" max="50" placeholder="e.g. 2">
      </div>

      <div class="form-group">
        <label class="form-label">UK Registered?</label>
        <select class="form-select" id="a-ukRegistered">
          <option value="true" ${assessmentData.ukRegistered ? 'selected' : ''}>Yes — UK registered company</option>
          <option value="false" ${!assessmentData.ukRegistered ? 'selected' : ''}>No</option>
        </select>
      </div>
    </div>

    <div class="form-group" style="margin-top:var(--space-md);">
      <label class="form-label">Company Description</label>
      <textarea class="form-input" id="a-companyDesc" rows="3" placeholder="Brief description of what your company does...">${assessmentData.companyDesc}</textarea>
    </div>
  `;
}

// ── Step 2: Technology ──
function renderTechStep() {
    const trlDescriptions = {
        1: 'Basic principles observed',
        2: 'Technology concept formulated',
        3: 'Proof of concept',
        4: 'Lab validation',
        5: 'Validated in relevant environment',
        6: 'Demonstrated in relevant environment',
        7: 'System prototype in operational environment',
        8: 'System complete and qualified',
        9: 'Proven in operational environment',
    };

    return `
    <h2 style="font-size:var(--font-xl); font-weight:700; margin-bottom:var(--space-lg);">🔬 Technology Readiness</h2>
    <p style="color:var(--text-secondary); font-size:var(--font-sm); margin-bottom:var(--space-lg);">
      Funders assess your technology maturity. TRL level heavily influences which grants fit.
    </p>

    <div class="form-grid">
      <div class="form-group" style="grid-column: 1 / -1;">
        <label class="form-label">Technology Readiness Level (TRL)</label>
        <select class="form-select" id="a-trl">
          <option value="">Select your TRL...</option>
          ${Object.entries(trlDescriptions).map(([level, desc]) =>
            `<option value="${level}" ${String(assessmentData.trl) === level ? 'selected' : ''}>TRL ${level} — ${desc}</option>`
          ).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">IP Status</label>
        <select class="form-select" id="a-ipStatus">
          <option value="none" ${assessmentData.ipStatus === 'none' ? 'selected' : ''}>No IP protection</option>
          <option value="provisional" ${assessmentData.ipStatus === 'provisional' ? 'selected' : ''}>Provisional patent / application filed</option>
          <option value="granted" ${assessmentData.ipStatus === 'granted' ? 'selected' : ''}>Patent granted</option>
          <option value="trade-secret" ${assessmentData.ipStatus === 'trade-secret' ? 'selected' : ''}>Trade secret / know-how</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Regulatory Status</label>
        <select class="form-select" id="a-regulatoryStatus">
          <option value="none" ${assessmentData.regulatoryStatus === 'none' ? 'selected' : ''}>Not applicable / Not started</option>
          <option value="pre-submission" ${assessmentData.regulatoryStatus === 'pre-submission' ? 'selected' : ''}>Pre-submission (planning)</option>
          <option value="submitted" ${assessmentData.regulatoryStatus === 'submitted' ? 'selected' : ''}>Regulatory submission made</option>
          <option value="approved" ${assessmentData.regulatoryStatus === 'approved' ? 'selected' : ''}>Approved / CE / UKCA marked</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Data Security</label>
        <select class="form-select" id="a-dataSecurity">
          <option value="none" ${assessmentData.dataSecurity === 'none' ? 'selected' : ''}>No certification</option>
          <option value="planning" ${assessmentData.dataSecurity === 'planning' ? 'selected' : ''}>Working towards certification</option>
          <option value="certified" ${assessmentData.dataSecurity === 'certified' ? 'selected' : ''}>Cyber Essentials / ISO 27001</option>
        </select>
      </div>
    </div>
  `;
}

// ── Step 3: Market & Traction ──
function renderMarketStep() {
    return `
    <h2 style="font-size:var(--font-xl); font-weight:700; margin-bottom:var(--space-lg);">📈 Market & Traction</h2>
    <p style="color:var(--text-secondary); font-size:var(--font-sm); margin-bottom:var(--space-lg);">
      Funders want evidence that you understand your market and have traction.
    </p>

    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">UK Market Size (£)</label>
        <input type="text" class="form-input" id="a-marketSize" value="${assessmentData.marketSize}" placeholder="e.g. £4.6B">
      </div>

      <div class="form-group">
        <label class="form-label">Customer Status</label>
        <select class="form-select" id="a-customers">
          <option value="none" ${assessmentData.customers === 'none' ? 'selected' : ''}>No customers yet</option>
          <option value="pilot" ${assessmentData.customers === 'pilot' ? 'selected' : ''}>Pilot / trial users</option>
          <option value="paying" ${assessmentData.customers === 'paying' ? 'selected' : ''}>Paying customers</option>
          <option value="scaling" ${assessmentData.customers === 'scaling' ? 'selected' : ''}>Scaling — 10+ customers</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Revenue</label>
        <select class="form-select" id="a-revenue">
          <option value="pre-revenue" ${assessmentData.revenue === 'pre-revenue' ? 'selected' : ''}>Pre-revenue</option>
          <option value="<100k" ${assessmentData.revenue === '<100k' ? 'selected' : ''}>Under £100K</option>
          <option value="100k-500k" ${assessmentData.revenue === '100k-500k' ? 'selected' : ''}>£100K — £500K</option>
          <option value="500k+" ${assessmentData.revenue === '500k+' ? 'selected' : ''}>£500K+</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Market Research</label>
        <select class="form-select" id="a-marketEvidence">
          <option value="false" ${!assessmentData.marketEvidence ? 'selected' : ''}>No formal market research</option>
          <option value="true" ${assessmentData.marketEvidence ? 'selected' : ''}>Have market data / reports</option>
        </select>
      </div>
    </div>

    <h3 style="font-size:var(--font-md); font-weight:700; margin:var(--space-lg) 0 var(--space-md);">Partnerships</h3>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">NHS Partner?</label>
        <select class="form-select" id="a-nhsPartner">
          <option value="false" ${!assessmentData.nhsPartner ? 'selected' : ''}>No NHS partnership</option>
          <option value="true" ${assessmentData.nhsPartner ? 'selected' : ''}>Yes — NHS trust or clinical partner</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Academic Partner?</label>
        <select class="form-select" id="a-academicPartner">
          <option value="false" ${!assessmentData.academicPartner ? 'selected' : ''}>No academic partner</option>
          <option value="true" ${assessmentData.academicPartner ? 'selected' : ''}>Yes — university / research institution</option>
        </select>
      </div>
    </div>
  `;
}

// ── Step 4: Evidence & Assets ──
function renderEvidenceStep() {
    const items = [
        { id: 'hasPitchDeck', label: 'Pitch Deck', desc: 'Investor-ready presentation' },
        { id: 'hasBusinessPlan', label: 'Business Plan', desc: 'Financial model & strategy' },
        { id: 'hasFinancials', label: 'Financial Accounts', desc: 'Filed accounts or management accounts' },
        { id: 'hasClinicalData', label: 'Clinical Evidence', desc: 'Trial results, case studies, publications' },
        { id: 'hasIPDocumentation', label: 'IP Documentation', desc: 'Patent filings, freedom-to-operate' },
        { id: 'hasLettersOfSupport', label: 'Letters of Support', desc: 'NHS trusts, partners, customers' },
        { id: 'hasPrototype', label: 'Working Prototype', desc: 'Demo-able product or MVP' },
        { id: 'hasTeamCVs', label: 'Team CVs', desc: 'Key personnel biographies' },
    ];

    return `
    <h2 style="font-size:var(--font-xl); font-weight:700; margin-bottom:var(--space-lg);">📂 Evidence & Assets</h2>
    <p style="color:var(--text-secondary); font-size:var(--font-sm); margin-bottom:var(--space-lg);">
      Check off the materials you already have. Most funders require several of these.
    </p>

    <div class="evidence-checklist">
      ${items.map(item => `
        <label class="evidence-check-item" for="a-${item.id}">
          <input type="checkbox" id="a-${item.id}" ${assessmentData[item.id] ? 'checked' : ''}>
          <div>
            <span style="font-weight:600; font-size:var(--font-sm);">${item.label}</span>
            <span style="color:var(--text-muted); font-size:var(--font-xs); display:block; margin-top:2px;">${item.desc}</span>
          </div>
        </label>
      `).join('')}
    </div>

    <div style="margin-top:var(--space-lg); padding:var(--space-md); background:rgba(99,102,241,0.06); border:1px solid rgba(99,102,241,0.15); border-radius:8px;">
      <span style="font-size:var(--font-sm); color:var(--accent-primary-light);">
        💡 <strong>Tip:</strong> The more evidence you have ready, the faster your application turnaround. Most IUK and SBRI applications require a pitch deck, financials, and team CVs at minimum.
      </span>
    </div>
  `;
}

// ── Step 5: Funding Target ──
function renderFundingStep() {
    const sectorOptions = [
        { id: 'healthtech', label: 'HealthTech' },
        { id: 'ai', label: 'AI & Machine Learning' },
        { id: 'lifescience', label: 'Life Sciences' },
        { id: 'biotech', label: 'BioTech' },
        { id: 'fintech', label: 'FinTech' },
        { id: 'cleantech', label: 'CleanTech' },
        { id: 'deeptech', label: 'DeepTech' },
        { id: 'edtech', label: 'EdTech' },
        { id: 'creative', label: 'Creative Industries' },
    ];

    return `
    <h2 style="font-size:var(--font-xl); font-weight:700; margin-bottom:var(--space-lg);">🎯 Funding Target</h2>
    <p style="color:var(--text-secondary); font-size:var(--font-sm); margin-bottom:var(--space-lg);">
      Define what you're looking for to help us match you with the right opportunities.
    </p>

    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Funding Amount Needed (£)</label>
        <input type="number" class="form-input" id="a-fundingNeeded" value="${assessmentData.fundingNeeded}" placeholder="e.g. 250000">
      </div>

      <div class="form-group">
        <label class="form-label">Timeline</label>
        <select class="form-select" id="a-fundingTimeline">
          <option value="immediate" ${assessmentData.fundingTimeline === 'immediate' ? 'selected' : ''}>ASAP — ready to apply now</option>
          <option value="3-6months" ${assessmentData.fundingTimeline === '3-6months' ? 'selected' : ''}>3-6 months</option>
          <option value="6-12months" ${assessmentData.fundingTimeline === '6-12months' ? 'selected' : ''}>6-12 months</option>
          <option value="12months+" ${assessmentData.fundingTimeline === '12months+' ? 'selected' : ''}>12+ months</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Preferred Funding Type</label>
        <select class="form-select" id="a-fundingType">
          <option value="grant" ${assessmentData.fundingType === 'grant' ? 'selected' : ''}>Grant (non-dilutive)</option>
          <option value="loan" ${assessmentData.fundingType === 'loan' ? 'selected' : ''}>Innovation Loan</option>
          <option value="equity" ${assessmentData.fundingType === 'equity' ? 'selected' : ''}>Equity / Tax Scheme</option>
          <option value="mixed" ${assessmentData.fundingType === 'mixed' ? 'selected' : ''}>Open to all types</option>
        </select>
      </div>
    </div>

    <div class="form-group" style="margin-top:var(--space-md);">
      <label class="form-label">Sectors (select all that apply)</label>
      <div style="display:flex; flex-wrap:wrap; gap:var(--space-sm); margin-top:var(--space-sm);">
        ${sectorOptions.map(s => `
          <label class="sector-chip ${assessmentData.sectors.includes(s.id) ? 'active' : ''}" for="a-sector-${s.id}">
            <input type="checkbox" id="a-sector-${s.id}" value="${s.id}" ${assessmentData.sectors.includes(s.id) ? 'checked' : ''} style="display:none;">
            ${s.label}
          </label>
        `).join('')}
      </div>
    </div>
  `;
}

// ── Step 6: Report ──
function renderReportStep() {
    const assessment = generateAssessment();

    return `
    <h2 style="font-size:var(--font-xl); font-weight:700; margin-bottom:var(--space-sm);">📊 Funding Readiness Report</h2>
    <p style="color:var(--text-secondary); font-size:var(--font-sm); margin-bottom:var(--space-lg);">
      AI assessment of <strong>${assessmentData.companyName || 'your company'}</strong> based on your responses.
    </p>

    <!-- Overall Score -->
    <div class="report-overall">
      <div class="report-score-ring">
        <svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="8" />
          <circle cx="60" cy="60" r="52" fill="none" stroke="${assessment.overallScore >= 70 ? '#10b981' : assessment.overallScore >= 50 ? '#f59e0b' : '#ef4444'}"
            stroke-width="8" stroke-linecap="round" stroke-dasharray="${2 * Math.PI * 52}" stroke-dashoffset="${2 * Math.PI * 52 * (1 - assessment.overallScore / 100)}"
            transform="rotate(-90 60 60)" />
        </svg>
        <span class="report-score-text" style="color:${assessment.overallScore >= 70 ? '#10b981' : assessment.overallScore >= 50 ? '#f59e0b' : '#ef4444'};">${assessment.overallScore}%</span>
      </div>
      <div>
        <div style="font-size:var(--font-xl); font-weight:800;">${assessment.overallLabel}</div>
        <div style="color:var(--text-secondary); font-size:var(--font-sm); margin-top:4px;">${assessment.overallSummary}</div>
      </div>
    </div>

    <!-- Dimension Scores -->
    <h3 style="font-size:var(--font-md); font-weight:700; margin:var(--space-xl) 0 var(--space-md);">Readiness Dimensions</h3>
    <div class="report-dimensions">
      ${assessment.dimensions.map(d => `
        <div class="report-dimension">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-size:var(--font-sm); font-weight:600;">${d.icon} ${d.name}</span>
            <span style="font-size:var(--font-sm); font-weight:700; color:${d.score >= 70 ? '#10b981' : d.score >= 40 ? '#f59e0b' : '#ef4444'};">${d.score}%</span>
          </div>
          <div class="report-bar"><div class="report-bar-fill" style="width:${d.score}%; background:${d.score >= 70 ? '#10b981' : d.score >= 40 ? '#f59e0b' : '#ef4444'};"></div></div>
          <div style="font-size:var(--font-xs); color:var(--text-muted); margin-top:4px;">${d.detail}</div>
        </div>
      `).join('')}
    </div>

    <!-- Top Funder Matches -->
    <h3 style="font-size:var(--font-md); font-weight:700; margin:var(--space-xl) 0 var(--space-md);">Top Funding Matches</h3>
    <div style="display:flex; flex-direction:column; gap:var(--space-sm);">
      ${assessment.topFunds.map(f => `
        <div class="report-fund-row" onclick="window.location.hash='/detail/${f.id}'">
          <div style="flex:1; min-width:0;">
            <div style="font-size:var(--font-sm); font-weight:700;">${f.name}</div>
            <div style="font-size:var(--font-xs); color:var(--text-muted);">${f.provider} · ${f.amount}</div>
          </div>
          <div style="display:flex; align-items:center; gap:var(--space-sm);">
            <span class="eligibility-badge" style="${f.eligible ? 'background:rgba(16,185,129,0.12); color:#34d399;' : 'background:rgba(245,158,11,0.12); color:#fbbf24;'} padding:2px 8px; border-radius:9999px; font-size:0.65rem; font-weight:600;">
              ${f.eligible ? '✅ Eligible' : '⚠️ Check Fit'}
            </span>
            <span style="font-size:var(--font-sm); font-weight:700; color:${f.score >= 80 ? '#10b981' : f.score >= 60 ? '#f59e0b' : 'var(--text-muted)'};">${f.score}%</span>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Recommendations -->
    <h3 style="font-size:var(--font-md); font-weight:700; margin:var(--space-xl) 0 var(--space-md);">📋 Recommendations</h3>
    <div style="display:flex; flex-direction:column; gap:var(--space-sm);">
      ${assessment.recommendations.map(r => `
        <div style="padding:var(--space-sm) var(--space-md); background:rgba(${r.type === 'success' ? '16,185,129' : r.type === 'warning' ? '245,158,11' : '99,102,241'},0.06); border:1px solid rgba(${r.type === 'success' ? '16,185,129' : r.type === 'warning' ? '245,158,11' : '99,102,241'},0.15); border-radius:8px;">
          <span style="font-size:var(--font-sm); color:var(--text-secondary);">
            ${r.type === 'success' ? '✅' : r.type === 'warning' ? '⚠️' : '💡'} ${r.text}
          </span>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Assessment Engine ──
function generateAssessment() {
    const d = assessmentData;
    const profile = buildProfileFromAssessment();

    // Dimension scoring
    const dimensions = [];

    // 1. Technology Readiness
    let techScore = 0;
    if (d.trl) techScore += Math.min(Number(d.trl) * 10, 50);
    if (d.ipStatus === 'granted') techScore += 25;
    else if (d.ipStatus === 'provisional') techScore += 15;
    else if (d.ipStatus === 'trade-secret') techScore += 10;
    if (d.regulatoryStatus === 'approved') techScore += 20;
    else if (d.regulatoryStatus === 'submitted') techScore += 15;
    else if (d.regulatoryStatus === 'pre-submission') techScore += 8;
    if (d.dataSecurity === 'certified') techScore += 5;
    else if (d.dataSecurity === 'planning') techScore += 2;
    techScore = Math.min(techScore, 100);
    dimensions.push({ icon: '🔬', name: 'Technology', score: techScore, detail: `TRL ${d.trl || '?'} · IP: ${d.ipStatus} · Regulatory: ${d.regulatoryStatus}` });

    // 2. Market & Traction
    let marketScore = 0;
    if (d.marketSize) marketScore += 20;
    if (d.marketEvidence) marketScore += 15;
    if (d.customers === 'scaling') marketScore += 35;
    else if (d.customers === 'paying') marketScore += 25;
    else if (d.customers === 'pilot') marketScore += 15;
    if (d.revenue === '500k+') marketScore += 25;
    else if (d.revenue === '100k-500k') marketScore += 20;
    else if (d.revenue === '<100k') marketScore += 10;
    if (d.nhsPartner) marketScore += 5;
    marketScore = Math.min(marketScore, 100);
    dimensions.push({ icon: '📈', name: 'Market & Traction', score: marketScore, detail: `Customers: ${d.customers} · Revenue: ${d.revenue} · NHS partner: ${d.nhsPartner ? 'Yes' : 'No'}` });

    // 3. Evidence Readiness
    const evidenceFields = ['hasPitchDeck', 'hasBusinessPlan', 'hasFinancials', 'hasClinicalData', 'hasIPDocumentation', 'hasLettersOfSupport', 'hasPrototype', 'hasTeamCVs'];
    const evidenceCount = evidenceFields.filter(f => d[f]).length;
    const evidenceScore = Math.round((evidenceCount / evidenceFields.length) * 100);
    dimensions.push({ icon: '📂', name: 'Evidence & Assets', score: evidenceScore, detail: `${evidenceCount}/${evidenceFields.length} assets ready` });

    // 4. Team & Company
    let teamScore = 0;
    if (d.companyName) teamScore += 15;
    if (d.companyDesc && d.companyDesc.length > 30) teamScore += 15;
    if (d.ukRegistered) teamScore += 25;
    const teamNum = d.teamSize ? parseInt(d.teamSize.split('-')[1] || d.teamSize) || 1 : 0;
    if (teamNum >= 5) teamScore += 20;
    else if (teamNum >= 2) teamScore += 15;
    else if (teamNum >= 1) teamScore += 10;
    if (d.hasTeamCVs) teamScore += 15;
    if (d.academicPartner) teamScore += 10;
    teamScore = Math.min(teamScore, 100);
    dimensions.push({ icon: '👥', name: 'Team & Company', score: teamScore, detail: `Team: ${d.teamSize || '?'} · UK: ${d.ukRegistered ? 'Yes' : 'No'} · Age: ${d.companyAge || '?'}y` });

    // 5. Funding Fit
    let fundingScore = 60;
    if (d.fundingNeeded) fundingScore += 15;
    if (d.sectors.length > 0) fundingScore += 15;
    if (d.fundingTimeline === 'immediate') fundingScore += 10;
    else if (d.fundingTimeline === '3-6months') fundingScore += 5;
    fundingScore = Math.min(fundingScore, 100);
    dimensions.push({ icon: '🎯', name: 'Funding Fit', score: fundingScore, detail: `Seeking £${d.fundingNeeded ? Number(d.fundingNeeded).toLocaleString() : '?'} · Type: ${d.fundingType} · Timeline: ${d.fundingTimeline}` });

    // Overall
    const overallScore = Math.round(dimensions.reduce((sum, dim) => sum + dim.score, 0) / dimensions.length);
    let overallLabel, overallSummary;
    if (overallScore >= 75) {
        overallLabel = 'Strong — Ready to Apply';
        overallSummary = 'Your startup is well-positioned for multiple UK funding programmes. Focus on your strongest matches and start applications.';
    } else if (overallScore >= 55) {
        overallLabel = 'Good — Almost Ready';
        overallSummary = 'You have a solid foundation. Address the gaps below and you\'ll significantly improve your success rate.';
    } else if (overallScore >= 35) {
        overallLabel = 'Developing — Build Foundations';
        overallSummary = 'Several areas need attention before applying. Focus on building evidence and partnerships first.';
    } else {
        overallLabel = 'Early Stage — Prepare First';
        overallSummary = 'You\'re in the early stages. Build your technology, market evidence, and team before targeting competitive grants.';
    }

    // Top fund matches
    const openFunds = fundingSources.filter(f => getEffectiveStatus(f) !== 'closed');
    const topFunds = openFunds
        .map(f => {
            const score = calculateMatchScore(f, profile);
            const elig = evaluateEligibility(f.id, profile);
            return {
                id: f.id,
                name: f.name,
                provider: f.provider,
                amount: formatAmount(f.amountMin, f.amountMax),
                score,
                eligible: elig.status === 'eligible',
            };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

    // Recommendations
    const recommendations = [];
    if (!d.ukRegistered) recommendations.push({ type: 'warning', text: 'UK registration is required for almost all UK public funding. Register your company first.' });
    if (!d.trl || Number(d.trl) < 3) recommendations.push({ type: 'info', text: 'Most grants require TRL 3+. Consider UKRI or Biomedical Catalyst for early-stage R&D.' });
    if (d.ipStatus === 'none') recommendations.push({ type: 'warning', text: 'Having no IP protection is a red flag for funders. Consider a provisional patent application.' });
    if (!d.nhsPartner && d.sectors.includes('healthtech')) recommendations.push({ type: 'info', text: 'An NHS clinical partner opens access to SBRI, NIHR, and NHS AI Lab funding. Work on building this.' });
    if (!d.academicPartner) recommendations.push({ type: 'info', text: 'Academic partnerships unlock UKRI and KTP grants. Approach your local university.' });
    if (evidenceCount < 4) recommendations.push({ type: 'warning', text: `Only ${evidenceCount}/8 evidence assets ready. Build your pitch deck, financials, and team CVs before applying.` });
    if (d.customers === 'none') recommendations.push({ type: 'info', text: 'Even a single pilot customer dramatically strengthens your application. Prioritise finding one.' });
    if (evidenceCount >= 6 && techScore >= 60) recommendations.push({ type: 'success', text: 'Strong evidence base. You\'re in a good position to submit applications — start with your highest-scoring matches.' });
    if (d.nhsPartner && d.regulatoryStatus !== 'none') recommendations.push({ type: 'success', text: 'NHS partnership + regulatory pathway is a strong combination for SBRI and NIHR.' });

    return { overallScore, overallLabel, overallSummary, dimensions, topFunds, recommendations };
}

function buildProfileFromAssessment() {
    return {
        companyName: assessmentData.companyName,
        companyDesc: assessmentData.companyDesc,
        teamSize: assessmentData.teamSize,
        fundingNeeded: assessmentData.fundingNeeded ? Number(assessmentData.fundingNeeded) : 0,
        sectors: assessmentData.sectors,
        stages: assessmentData.stages,
        companyAge: assessmentData.companyAge ? Number(assessmentData.companyAge) : undefined,
        ukRegistered: assessmentData.ukRegistered,
        trl: assessmentData.trl ? Number(assessmentData.trl) : undefined,
        hasNHSPartner: assessmentData.nhsPartner,
        hasAcademicPartner: assessmentData.academicPartner,
        regulatoryStatus: assessmentData.regulatoryStatus,
    };
}

// ── Collect step data ──
function collectStepData(step) {
    const get = (id) => document.getElementById(id);
    const val = (id) => get(id)?.value ?? '';
    const checked = (id) => get(id)?.checked ?? false;

    switch (step) {
        case 0:
            assessmentData.companyName = val('a-companyName');
            assessmentData.companyDesc = val('a-companyDesc');
            assessmentData.teamSize = val('a-teamSize');
            assessmentData.companyAge = val('a-companyAge');
            assessmentData.ukRegistered = val('a-ukRegistered') === 'true';
            break;
        case 1:
            assessmentData.trl = val('a-trl');
            assessmentData.ipStatus = val('a-ipStatus');
            assessmentData.regulatoryStatus = val('a-regulatoryStatus');
            assessmentData.dataSecurity = val('a-dataSecurity');
            break;
        case 2:
            assessmentData.marketSize = val('a-marketSize');
            assessmentData.customers = val('a-customers');
            assessmentData.revenue = val('a-revenue');
            assessmentData.marketEvidence = val('a-marketEvidence') === 'true';
            assessmentData.nhsPartner = val('a-nhsPartner') === 'true';
            assessmentData.academicPartner = val('a-academicPartner') === 'true';
            break;
        case 3:
            assessmentData.hasPitchDeck = checked('a-hasPitchDeck');
            assessmentData.hasBusinessPlan = checked('a-hasBusinessPlan');
            assessmentData.hasFinancials = checked('a-hasFinancials');
            assessmentData.hasClinicalData = checked('a-hasClinicalData');
            assessmentData.hasIPDocumentation = checked('a-hasIPDocumentation');
            assessmentData.hasLettersOfSupport = checked('a-hasLettersOfSupport');
            assessmentData.hasPrototype = checked('a-hasPrototype');
            assessmentData.hasTeamCVs = checked('a-hasTeamCVs');
            break;
        case 4:
            assessmentData.fundingNeeded = val('a-fundingNeeded');
            assessmentData.fundingTimeline = val('a-fundingTimeline');
            assessmentData.fundingType = val('a-fundingType');
            // Collect sectors
            const sectorIds = ['healthtech', 'ai', 'lifescience', 'biotech', 'fintech', 'cleantech', 'deeptech', 'edtech', 'creative'];
            assessmentData.sectors = sectorIds.filter(s => checked(`a-sector-${s}`));
            break;
    }
}

// ── Navigation ──
function navigateStep(direction) {
    collectStepData(currentStep);
    currentStep += direction;
    refreshUI();
}

function refreshUI() {
    const container = document.getElementById('page-container');
    if (container) {
        container.innerHTML = generateWizardHTML();
        bindEvents();
    }
}

function bindEvents() {
    document.getElementById('assessor-prev')?.addEventListener('click', () => navigateStep(-1));
    document.getElementById('assessor-next')?.addEventListener('click', () => navigateStep(1));
    document.getElementById('assessor-generate')?.addEventListener('click', () => {
        collectStepData(4);
        currentStep = 5;
        refreshUI();
    });
    document.getElementById('assessor-restart')?.addEventListener('click', () => {
        initAssessment();
        refreshUI();
    });
    document.getElementById('assessor-save')?.addEventListener('click', () => {
        const profile = buildProfileFromAssessment();
        saveProfile(profile);
        const btn = document.getElementById('assessor-save');
        if (btn) {
            btn.textContent = '✅ Saved!';
            btn.disabled = true;
            setTimeout(() => { btn.textContent = '💾 Save to Profile'; btn.disabled = false; }, 2000);
        }
    });

    // Sector chip toggles
    document.querySelectorAll('.sector-chip input').forEach(input => {
        input.addEventListener('change', () => {
            input.closest('.sector-chip').classList.toggle('active', input.checked);
        });
    });
}

export function afterRenderAssessor() {
    bindEvents();
}
