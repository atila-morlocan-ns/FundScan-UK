// ═══════════════════════════════════════════════════════
// FundScan UK — Pitch Deck Upload Page
// Upload a pitch deck for AI-powered profile extraction
// Includes data privacy controls for CFO workflow
// ═══════════════════════════════════════════════════════

import { SECTORS, STAGES } from '../data/funding-sources.js';
import { getProfile, saveProfile, getApiKey, saveApiKey, clearAllData, getDataInventory } from '../store.js';
import { analyzePitchDeck } from '../ai/deck-analyzer.js';

let analysisResult = null;

function getKey() {
    // Priority: Vite env var → localStorage
    return import.meta.env.VITE_GEMINI_API_KEY || getApiKey() || '';
}

function renderConfidenceBadge(level) {
    const colors = { high: '#10b981', medium: '#f59e0b', low: '#ef4444' };
    const icons = { high: '✅', medium: '⚠️', low: '❓' };
    return `<span style="font-size:var(--font-xs); color:${colors[level] || '#64748b'};">${icons[level] || '—'} ${level || 'unknown'}</span>`;
}

function renderDataInventory() {
    const inv = getDataInventory();
    return `
    <div class="card" style="margin-top:var(--space-2xl); border-color:rgba(239,68,68,0.2);">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:var(--space-md); margin-bottom:var(--space-lg);">
        <div>
          <h2 style="font-size:var(--font-lg); font-weight:700; margin-bottom:4px;">🔒 Data Privacy Controls</h2>
          <p style="font-size:var(--font-sm); color:var(--text-muted);">All data is stored locally in your browser. Nothing is sent to any server except the Gemini API for analysis.</p>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:var(--space-md); margin-bottom:var(--space-lg);">
        <div style="background:rgba(255,255,255,0.03); border-radius:8px; padding:var(--space-md);">
          <div style="font-size:var(--font-xs); color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">Company Profile</div>
          <div style="font-weight:700;">${inv.hasProfile ? '📋 ' + inv.profileName : '—'}</div>
          <div style="font-size:var(--font-xs); color:var(--text-muted);">${inv.profileSource === 'pitch-deck' ? '📄 From pitch deck' : inv.profileSource === 'default' ? '⚙️ Default (N&S)' : '✏️ Manual'}</div>
        </div>
        <div style="background:rgba(255,255,255,0.03); border-radius:8px; padding:var(--space-md);">
          <div style="font-size:var(--font-xs); color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">Evidence Vault</div>
          <div style="font-weight:700;">${inv.evidenceCount} items</div>
        </div>
        <div style="background:rgba(255,255,255,0.03); border-radius:8px; padding:var(--space-md);">
          <div style="font-size:var(--font-xs); color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">Funding Stack</div>
          <div style="font-weight:700;">${inv.stackCount} funds tracked</div>
        </div>
        <div style="background:rgba(255,255,255,0.03); border-radius:8px; padding:var(--space-md);">
          <div style="font-size:var(--font-xs); color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">API Key</div>
          <div style="font-weight:700;">${inv.hasApiKey ? '🔑 Stored' : '—'}</div>
        </div>
      </div>

      <div style="display:flex; gap:var(--space-sm); flex-wrap:wrap;">
        <button class="btn btn-secondary" style="font-size:var(--font-xs); border-color:rgba(239,68,68,0.3); color:var(--accent-danger);" id="clear-profile-btn">
          🗑️ Clear Profile Only
        </button>
        <button class="btn btn-secondary" style="font-size:var(--font-xs); border-color:rgba(239,68,68,0.3); color:var(--accent-danger);" id="clear-evidence-btn">
          🗑️ Clear Evidence & Stack
        </button>
        <button class="btn" style="font-size:var(--font-xs); background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.3);" id="clear-all-btn">
          ⚠️ Purge ALL Company Data
        </button>
      </div>
      <p style="font-size:var(--font-xs); color:var(--text-muted); margin-top:var(--space-sm);">
        Purge permanently deletes all stored data including profile, evidence vault, funding stack, and analysis results. This cannot be undone.
      </p>
    </div>`;
}

export function renderUpload() {
    const existingProfile = getProfile();
    const hasApiKey = !!getKey();

    return `
    <div class="container" style="max-width:900px;">
      <div style="margin-bottom:var(--space-xl);">
        <h1 style="font-size:var(--font-3xl); font-weight:800; letter-spacing:-0.02em;">📄 Pitch Deck Analyzer</h1>
        <p style="color:var(--text-secondary); font-size:var(--font-sm); margin-top:4px;">
          Upload a pitch deck to instantly extract a company profile and match against UK funding opportunities
        </p>
      </div>

      ${!hasApiKey ? `
      <!-- API Key Setup (only if not in .env) -->
      <div class="card" style="margin-bottom:var(--space-lg); border-color:rgba(245,158,11,0.3);">
        <div style="display:flex; align-items:center; gap:var(--space-sm); margin-bottom:var(--space-md);">
          <span style="font-size:1.3rem;">🔑</span>
          <h2 style="font-size:var(--font-md); font-weight:700;">Gemini API Key Required</h2>
        </div>
        <p style="font-size:var(--font-sm); color:var(--text-secondary); margin-bottom:var(--space-md);">
          Enter your Gemini API key to enable AI analysis. Get a free key from
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio ↗</a>.
          Your key is stored locally and never leaves your browser (except to call Google's API).
        </p>
        <div style="display:flex; gap:var(--space-sm);">
          <input type="password" class="form-input" id="api-key-input"
            placeholder="AIzaSy..." style="flex:1; font-family:monospace;">
          <button class="btn btn-primary" id="save-key-btn">Save Key</button>
        </div>
      </div>` : ''}

      <!-- Upload Zone -->
      <div class="card upload-card" style="margin-bottom:var(--space-lg);">
        <div class="upload-zone" id="upload-zone">
          <div class="upload-zone-content" id="upload-zone-content">
            <div class="upload-icon">📄</div>
            <div class="upload-title">Drop your pitch deck here</div>
            <div class="upload-subtitle">or click to browse · PDF only · Max 20MB</div>
            <input type="file" id="file-input" accept=".pdf,application/pdf" style="display:none;">
            <button class="btn btn-primary" style="margin-top:var(--space-md);" id="browse-btn">
              📁 Choose File
            </button>
          </div>

          <!-- Progress States (hidden by default) -->
          <div class="upload-progress" id="upload-progress" style="display:none;">
            <div class="progress-spinner" id="progress-spinner"></div>
            <div class="progress-text" id="progress-text">Reading file...</div>
            <div class="progress-subtext" id="progress-subtext">This takes 5-10 seconds</div>
          </div>
        </div>

        ${existingProfile && existingProfile.companyName ? `
        <div style="margin-top:var(--space-md); padding-top:var(--space-md); border-top:1px solid var(--border-glass); display:flex; align-items:center; justify-content:space-between;">
          <div style="font-size:var(--font-xs); color:var(--text-muted);">
            Current profile: <strong style="color:var(--text-primary);">${existingProfile.companyName}</strong>
            ${existingProfile._analysis?.source === 'pitch-deck'
            ? ' <span style="color:var(--accent-primary-light);">📄 From deck</span>'
            : ''}
          </div>
          <span style="font-size:var(--font-xs); color:var(--text-muted);">Uploading a new deck will replace the current profile</span>
        </div>` : ''}
      </div>

      <!-- Extraction Results (hidden initially) -->
      <div id="results-section" style="display:none;">
        <div class="card" style="margin-bottom:var(--space-lg); border-color:rgba(16,185,129,0.3);">
          <div style="display:flex; align-items:center; gap:var(--space-sm); margin-bottom:var(--space-lg);">
            <span style="font-size:1.5rem;">✅</span>
            <div>
              <h2 style="font-size:var(--font-lg); font-weight:700;">Profile Extracted</h2>
              <p style="font-size:var(--font-xs); color:var(--text-muted);">Review and edit before saving. All fields are editable.</p>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Company Name</label>
            <div style="display:flex; align-items:center; gap:var(--space-sm);">
              <input type="text" class="form-input" id="ext-name" style="flex:1;">
              <span id="conf-name"></span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-textarea" id="ext-desc" rows="3"></textarea>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-md);">
            <div class="form-group">
              <label class="form-label">Team Size</label>
              <select class="form-select" id="ext-team">
                <option value="1">Solo Founder</option>
                <option value="2-5">2–5 people</option>
                <option value="6-10">6–10 people</option>
                <option value="11-25">11–25 people</option>
                <option value="26-50">26–50 people</option>
                <option value="50+">50+ people</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Funding Needed</label>
              <div style="display:flex; align-items:center; gap:var(--space-sm);">
                <select class="form-select" id="ext-funding" style="flex:1;">
                  <option value="">Unknown</option>
                  <option value="10000">Under £25K</option>
                  <option value="50000">£25K – £100K</option>
                  <option value="250000">£100K – £500K</option>
                  <option value="1000000">£500K – £2M</option>
                  <option value="5000000">£2M – £10M</option>
                  <option value="15000000">£10M+</option>
                </select>
                <span id="conf-funding"></span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Sectors <span id="conf-sectors"></span></label>
            <div class="chip-group" id="ext-sectors">
              ${SECTORS.map(s => `
                <button type="button" class="chip" data-sector="${s.id}">
                  ${s.icon} ${s.name}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Stages <span id="conf-stages"></span></label>
            <div class="chip-group" id="ext-stages">
              ${STAGES.map(s => `
                <button type="button" class="chip" data-stage="${s.id}">
                  ${s.icon} ${s.name}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- AI Insights -->
          <div id="ai-insights" style="margin-top:var(--space-lg); display:none;">
            <div style="font-weight:700; font-size:var(--font-sm); margin-bottom:var(--space-sm);">💡 AI Insights from Deck</div>
            <div id="insights-content" style="font-size:var(--font-sm); color:var(--text-secondary);"></div>
          </div>

          <!-- Actions -->
          <div style="display:flex; gap:var(--space-md); margin-top:var(--space-xl); justify-content:flex-end;">
            <button class="btn btn-secondary" id="discard-btn">🗑️ Discard</button>
            <button class="btn btn-primary btn-lg" id="save-profile-btn">🚀 Save & Find Funding</button>
          </div>
        </div>
      </div>

      <!-- Data Privacy Controls -->
      ${renderDataInventory()}
    </div>
  `;
}

export function afterRenderUpload() {
    const fileInput = document.getElementById('file-input');
    const uploadZone = document.getElementById('upload-zone');
    const browseBtn = document.getElementById('browse-btn');

    // ── API Key ──
    const saveKeyBtn = document.getElementById('save-key-btn');
    if (saveKeyBtn) {
        saveKeyBtn.addEventListener('click', () => {
            const key = document.getElementById('api-key-input').value.trim();
            if (key) {
                saveApiKey(key);
                location.reload();
            }
        });
    }

    // ── File Browse ──
    if (browseBtn) {
        browseBtn.addEventListener('click', () => fileInput.click());
    }

    // ── Drag & Drop ──
    if (uploadZone) {
        ['dragenter', 'dragover'].forEach(evt => {
            uploadZone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadZone.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(evt => {
            uploadZone.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadZone.classList.remove('drag-over');
            });
        });

        uploadZone.addEventListener('drop', (e) => {
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        });
    }

    // ── File Input ──
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleFile(file);
        });
    }

    // ── Chip toggles ──
    document.querySelectorAll('#ext-sectors .chip').forEach(chip => {
        chip.addEventListener('click', () => chip.classList.toggle('selected'));
    });
    document.querySelectorAll('#ext-stages .chip').forEach(chip => {
        chip.addEventListener('click', () => chip.classList.toggle('selected'));
    });

    // ── Save Profile ──
    const saveBtn = document.getElementById('save-profile-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const sectors = Array.from(document.querySelectorAll('#ext-sectors .chip.selected'))
                .map(c => c.dataset.sector);
            const stages = Array.from(document.querySelectorAll('#ext-stages .chip.selected'))
                .map(c => c.dataset.stage);

            const fundingVal = document.getElementById('ext-funding').value;
            const analysis = analysisResult?._analysis || {};

            const profile = {
                companyName: document.getElementById('ext-name').value.trim(),
                companyDesc: document.getElementById('ext-desc').value.trim(),
                teamSize: document.getElementById('ext-team').value,
                fundingNeeded: fundingVal ? parseInt(fundingVal) : null,
                sectors,
                stages,
                // Carry over eligibility fields from AI analysis
                trl: analysis.trl || null,
                companyAge: analysis.companyAge || null,
                ukRegistered: analysis.ukBased !== false,
                hasNHSPartner: false,
                hasAcademicPartner: false,
                regulatoryStatus: analysis.regulatoryStatus || 'none',
                _analysis: { source: 'pitch-deck', analyzedAt: new Date().toISOString() },
            };

            saveProfile(profile);
            window.location.hash = '#/scanner';
        });
    }

    // ── Discard ──
    const discardBtn = document.getElementById('discard-btn');
    if (discardBtn) {
        discardBtn.addEventListener('click', () => {
            analysisResult = null;
            document.getElementById('results-section').style.display = 'none';
            document.getElementById('upload-zone-content').style.display = '';
            document.getElementById('upload-progress').style.display = 'none';
        });
    }

    // ── Privacy Controls ──
    const clearProfileBtn = document.getElementById('clear-profile-btn');
    if (clearProfileBtn) {
        clearProfileBtn.addEventListener('click', () => {
            if (confirm('Delete the current company profile? This cannot be undone.')) {
                clearAllData('profile');
                location.reload();
            }
        });
    }

    const clearEvidenceBtn = document.getElementById('clear-evidence-btn');
    if (clearEvidenceBtn) {
        clearEvidenceBtn.addEventListener('click', () => {
            if (confirm('Delete all evidence vault and funding stack data? This cannot be undone.')) {
                clearAllData('evidence');
                clearAllData('stack');
                location.reload();
            }
        });
    }

    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (confirm('⚠️ PURGE ALL DATA?\n\nThis will permanently delete:\n• Company profile\n• Evidence vault\n• Funding stack\n• Analysis results\n• API key\n\nThis cannot be undone.')) {
                clearAllData('all');
                location.reload();
            }
        });
    }
}

// ── Handle file upload and analysis ──

async function handleFile(file) {
    const contentEl = document.getElementById('upload-zone-content');
    const progressEl = document.getElementById('upload-progress');
    const progressText = document.getElementById('progress-text');
    const progressSubtext = document.getElementById('progress-subtext');
    const resultsSection = document.getElementById('results-section');

    // Validate
    if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file.');
        return;
    }

    // Show progress
    contentEl.style.display = 'none';
    progressEl.style.display = 'flex';

    const apiKey = getKey();
    if (!apiKey) {
        alert('Please enter your Gemini API key first.');
        contentEl.style.display = '';
        progressEl.style.display = 'none';
        return;
    }

    try {
        const result = await analyzePitchDeck(file, apiKey, (phase) => {
            switch (phase) {
                case 'reading':
                    progressText.textContent = '📖 Reading pitch deck...';
                    progressSubtext.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`;
                    break;
                case 'analyzing':
                    progressText.textContent = '🤖 AI analyzing your deck...';
                    progressSubtext.textContent = 'Extracting company profile, sectors, and funding needs';
                    break;
                case 'validating':
                    progressText.textContent = '✅ Validating extracted data...';
                    progressSubtext.textContent = 'Almost there';
                    break;
                case 'complete':
                    progressText.textContent = '🎉 Analysis complete!';
                    progressSubtext.textContent = '';
                    break;
            }
        });

        analysisResult = result;

        // Populate results
        populateResults(result);
        resultsSection.style.display = '';

        // Keep progress showing success briefly, then hide
        setTimeout(() => {
            progressEl.style.display = 'none';
        }, 1500);

    } catch (err) {
        progressText.textContent = '❌ Analysis failed';
        progressSubtext.textContent = err.message;
        setTimeout(() => {
            contentEl.style.display = '';
            progressEl.style.display = 'none';
        }, 3000);
    }
}

function populateResults(result) {
    document.getElementById('ext-name').value = result.companyName || '';
    document.getElementById('ext-desc').value = result.companyDesc || '';
    document.getElementById('ext-team').value = result.teamSize || '2-5';

    // Map funding to closest select value
    const fundingMap = [10000, 50000, 250000, 1000000, 5000000, 15000000];
    if (result.fundingNeeded) {
        const closest = fundingMap.reduce((prev, curr) =>
            Math.abs(curr - result.fundingNeeded) < Math.abs(prev - result.fundingNeeded) ? curr : prev
        );
        document.getElementById('ext-funding').value = closest;
    }

    // Set sector chips
    document.querySelectorAll('#ext-sectors .chip').forEach(chip => {
        chip.classList.toggle('selected', (result.sectors || []).includes(chip.dataset.sector));
    });

    // Set stage chips
    document.querySelectorAll('#ext-stages .chip').forEach(chip => {
        chip.classList.toggle('selected', (result.stages || []).includes(chip.dataset.stage));
    });

    // Confidence badges
    const conf = result._analysis?.confidence || {};
    const confName = document.getElementById('conf-name');
    const confFunding = document.getElementById('conf-funding');
    const confSectors = document.getElementById('conf-sectors');
    const confStages = document.getElementById('conf-stages');
    if (confName) confName.innerHTML = renderConfidenceBadge(conf.companyName);
    if (confFunding) confFunding.innerHTML = renderConfidenceBadge(conf.fundingNeeded);
    if (confSectors) confSectors.innerHTML = renderConfidenceBadge(conf.sectors);
    if (confStages) confStages.innerHTML = renderConfidenceBadge(conf.stages);

    // AI Insights
    const insightsEl = document.getElementById('ai-insights');
    const insightsContent = document.getElementById('insights-content');
    const analysis = result._analysis || {};

    if (analysis.keyDifferentiators?.length > 0 || analysis.targetMarket) {
        insightsEl.style.display = '';
        let html = '';

        if (analysis.targetMarket) {
            html += `<div style="margin-bottom:var(--space-sm);">
                <strong>Target Market:</strong> ${analysis.targetMarket}
            </div>`;
        }

        if (analysis.trl) {
            html += `<div style="margin-bottom:var(--space-sm);">
                <strong>Technology Readiness:</strong> TRL ${analysis.trl}/9
            </div>`;
        }

        if (analysis.ukBased !== null) {
            html += `<div style="margin-bottom:var(--space-sm);">
                <strong>UK Based:</strong> ${analysis.ukBased ? '✅ Yes' : '❌ No'}
            </div>`;
        }

        if (analysis.keyDifferentiators?.length > 0) {
            html += `<div style="margin-top:var(--space-sm);">
                <strong>Key Differentiators:</strong>
                <ul style="margin:4px 0 0 var(--space-lg);">
                    ${analysis.keyDifferentiators.map(d => `<li style="font-size:var(--font-xs); margin-bottom:2px;">${d}</li>`).join('')}
                </ul>
            </div>`;
        }

        insightsContent.innerHTML = html;
    }
}
