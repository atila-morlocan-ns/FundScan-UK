// ═══════════════════════════════════════════════════════
// FundScan UK — Profile Page
// Startup onboarding and preferences
// ═══════════════════════════════════════════════════════

import { SECTORS, STAGES } from '../data/funding-sources.js';
import { getProfile, saveProfile, getProfileCompleteness } from '../store.js';

export function renderProfile() {
    const profile = getProfile() || {};
    const completeness = getProfileCompleteness(profile);

    return `
    <div class="container" style="max-width:800px;">
      <div style="margin-bottom:var(--space-2xl);">
        <h1 style="font-size:var(--font-3xl); font-weight:800; letter-spacing:-0.02em;">Your Startup Profile</h1>
        <p style="color:var(--text-secondary); margin-top:var(--space-sm);">
          Tell us about your business to get personalised funding matches
        </p>
        <div style="margin-top:var(--space-md); max-width:300px;">
          <div style="display:flex; justify-content:space-between; font-size:var(--font-xs); color:var(--text-muted); margin-bottom:4px;">
            <span>Profile completeness</span>
            <span id="completeness-pct">${completeness}%</span>
          </div>
          <div class="completion-bar">
            <div class="completion-fill" id="completeness-fill" style="width:${completeness}%"></div>
          </div>
        </div>
      </div>

      <form id="profile-form">
        <!-- Company Name -->
        <div class="card" style="margin-bottom:var(--space-lg);">
          <h2 style="font-size:var(--font-lg); font-weight:700; margin-bottom:var(--space-lg);">🏢 Company Details</h2>
          <div class="form-group">
            <label class="form-label" for="company-name">Company Name</label>
            <input type="text" class="form-input" id="company-name"
              placeholder="e.g., TechVenture Ltd"
              value="${profile.companyName || ''}">
          </div>
          <div class="form-group">
            <label class="form-label" for="company-desc">What does your company do?</label>
            <textarea class="form-textarea" id="company-desc"
              placeholder="Brief description of your product or service...">${profile.companyDesc || ''}</textarea>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-md);">
            <div class="form-group">
              <label class="form-label" for="team-size">Team Size</label>
              <select class="form-select" id="team-size">
                <option value="">Select...</option>
                <option value="1" ${profile.teamSize === '1' ? 'selected' : ''}>Solo Founder</option>
                <option value="2-5" ${profile.teamSize === '2-5' ? 'selected' : ''}>2–5 people</option>
                <option value="6-10" ${profile.teamSize === '6-10' ? 'selected' : ''}>6–10 people</option>
                <option value="11-25" ${profile.teamSize === '11-25' ? 'selected' : ''}>11–25 people</option>
                <option value="26-50" ${profile.teamSize === '26-50' ? 'selected' : ''}>26–50 people</option>
                <option value="50+" ${profile.teamSize === '50+' ? 'selected' : ''}>50+ people</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="funding-needed">Funding Needed</label>
              <select class="form-select" id="funding-needed">
                <option value="">Select...</option>
                <option value="10000" ${profile.fundingNeeded == 10000 ? 'selected' : ''}>Under £25K</option>
                <option value="50000" ${profile.fundingNeeded == 50000 ? 'selected' : ''}>£25K – £100K</option>
                <option value="250000" ${profile.fundingNeeded == 250000 ? 'selected' : ''}>£100K – £500K</option>
                <option value="1000000" ${profile.fundingNeeded == 1000000 ? 'selected' : ''}>£500K – £2M</option>
                <option value="5000000" ${profile.fundingNeeded == 5000000 ? 'selected' : ''}>£2M – £10M</option>
                <option value="15000000" ${profile.fundingNeeded == 15000000 ? 'selected' : ''}>£10M+</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Sectors -->
        <div class="card" style="margin-bottom:var(--space-lg);">
          <h2 style="font-size:var(--font-lg); font-weight:700; margin-bottom:var(--space-sm);">🎯 Your Sectors</h2>
          <p style="color:var(--text-secondary); font-size:var(--font-sm); margin-bottom:var(--space-lg);">
            Select all sectors that apply to your business
          </p>
          <div class="chip-group" id="sector-chips">
            ${SECTORS.map(s => `
              <button type="button" class="chip ${(profile.sectors || []).includes(s.id) ? 'selected' : ''}"
                data-sector="${s.id}">
                ${s.icon} ${s.name}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Stages -->
        <div class="card" style="margin-bottom:var(--space-lg);">
          <h2 style="font-size:var(--font-lg); font-weight:700; margin-bottom:var(--space-sm);">📍 Innovation Stage</h2>
          <p style="color:var(--text-secondary); font-size:var(--font-sm); margin-bottom:var(--space-lg);">
            Where is your startup on its journey?
          </p>
          <div class="chip-group" id="stage-chips">
            ${STAGES.map(s => `
              <button type="button" class="chip ${(profile.stages || []).includes(s.id) ? 'selected' : ''}"
                data-stage="${s.id}">
                ${s.icon} ${s.name}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Save -->
        <div style="display:flex; gap:var(--space-md); justify-content:flex-end;">
          <button type="button" class="btn btn-secondary" onclick="window.location.hash='/dashboard'">Cancel</button>
          <button type="submit" class="btn btn-primary btn-lg" id="save-btn">💾 Save Profile</button>
        </div>
      </form>

      <!-- Success Toast -->
      <div id="save-toast" style="
        position:fixed; bottom:var(--space-xl); right:var(--space-xl);
        background:var(--accent-success); color:white;
        padding:var(--space-md) var(--space-xl);
        border-radius:var(--radius-lg);
        font-weight:600; font-size:var(--font-sm);
        box-shadow:var(--shadow-lg);
        transform:translateY(100px); opacity:0;
        transition: all var(--transition-base);
        z-index:9999;">
        ✅ Profile saved! Your matches are updated.
      </div>
    </div>
  `;
}

export function afterRenderProfile() {
    // Chip toggles
    document.querySelectorAll('#sector-chips .chip').forEach(chip => {
        chip.addEventListener('click', () => chip.classList.toggle('selected'));
    });

    document.querySelectorAll('#stage-chips .chip').forEach(chip => {
        chip.addEventListener('click', () => chip.classList.toggle('selected'));
    });

    // Form submit
    const form = document.getElementById('profile-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const selectedSectors = Array.from(document.querySelectorAll('#sector-chips .chip.selected'))
                .map(c => c.dataset.sector);
            const selectedStages = Array.from(document.querySelectorAll('#stage-chips .chip.selected'))
                .map(c => c.dataset.stage);

            const profile = {
                companyName: document.getElementById('company-name').value.trim(),
                companyDesc: document.getElementById('company-desc').value.trim(),
                teamSize: document.getElementById('team-size').value,
                fundingNeeded: parseInt(document.getElementById('funding-needed').value) || null,
                sectors: selectedSectors,
                stages: selectedStages,
            };

            saveProfile(profile);

            // Update completeness
            const completeness = getProfileCompleteness(profile);
            const pctEl = document.getElementById('completeness-pct');
            const fillEl = document.getElementById('completeness-fill');
            if (pctEl) pctEl.textContent = `${completeness}%`;
            if (fillEl) fillEl.style.width = `${completeness}%`;

            // Show toast
            const toast = document.getElementById('save-toast');
            if (toast) {
                toast.style.transform = 'translateY(0)';
                toast.style.opacity = '1';
                setTimeout(() => {
                    toast.style.transform = 'translateY(100px)';
                    toast.style.opacity = '0';
                }, 3000);
            }
        });
    }
}
