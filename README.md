# FundScan UK ⚡

**AI-powered UK startup funding scanner** — discover, score, and track grants, loans, and innovation programmes matched to your startup. Upload any pitch deck and let Gemini AI extract your profile, match against 33+ funding sources, and check eligibility automatically.

Built for **[Nightingale & Sentinel](https://github.com/atila-morlocan-ns)** — MedTech startup using computer vision and VLMs to address unwitnessed medical events in elderly care (£4.6B UK market).

---

## ✨ Features

### Frontend App
- **33 Real Funding Sources** — Innovate UK, UKRI, HMRC, NHS England, SBRI, NIHR, and more
- **8 MedTech-Specific Funds** — SBRI Healthcare, NIHR AI Award, Healthy Ageing, NHS AI Lab, AAL, AHSN, CareCity
- **Smart Match Scoring v2** — 7-dimension algorithm: eligibility (25%), sector (20%), keywords (20%), stage (15%), status (10%), amount (5%), use-case intelligence (5%)
- **✅ Eligibility Engine** — Machine-readable rules for 20+ funds. Every card shows ✅ Eligible / ⚠️ Check Fit / ❌ Ineligible with detailed check breakdown
- **📄 Pitch Deck Analyzer** — Upload any PDF pitch deck → Gemini AI extracts company profile (name, sector, stage, team, funding needed, TRL) → auto-match against all funding sources
- **🔒 Data Privacy Controls** — Granular purge: clear profile only, clear evidence/stack, or purge ALL company data. Designed for CFO research sessions
- **🔄 Staleness Detection** — Auto-flags aging data (30-90 days) and stale data (90+ days). Auto-corrects expired deadline statuses
- **Funding Scanner** — Search + filter by sector, stage, type, status (including "✅ Eligible Only") with sort by match/deadline/amount
- **Deadline Alerts** — Closing-soon warnings at 30/60 day thresholds
- **Application Tips** — Real tips and success rates for each funding source
- **Detail Pages** — Full breakdown with **📋 Eligibility Check panel** (per-check pass/fail with Required/Preferred tags), staleness badge, disabled Apply when closed, related opportunities with badges, and sidebar key facts
- **⭐ Shortlist & Favourites** — Star-toggle on any funding card to save it. Shortlist page with stats, inline notes, and "Start Tracking" flow
- **📊 Application Tracker** — Kanban pipeline board: 🔍 Researching → ✏️ Preparing → 📤 Submitted → 🏆 Outcome. Per-card notes, move buttons, outcome tagging (Won/Lost/Withdrawn), stats bar. **Clear All** button + auto-reset on new company
- **🎓 Expert Assessor** — 6-step guided wizard: Company Basics → Technology → Market & Traction → Evidence & Assets → Funding Target → Readiness Report. Generates per-dimension scores, top funder matches, and actionable recommendations. Saves results to profile
- **📅 Funding Calendar** — Visual timeline of closing/opening dates grouped by month. Stats bar, Closing/Opening toggle, Eligible-only and Shortlisted filters, urgency badges (red ≤14d, amber ≤30d), clickable to detail pages
- **📍 Location & Region** — Company location (city/town) and UK region selection in profile. AI extracts location from pitch decks. Dynamic nav label and regional page adapt to selected region
- **🔔 Toast Notifications** — Slide-in feedback for every action: shortlist toggle, profile save, tracker moves, note saves. Stackable, auto-dismiss, colour-coded (success/info/warning/error)
- **⚡ Dashboard Quick Actions** — One-click cards for Scanner, Assessor, Calendar, and Tracker with live context (fund counts, pipeline status)
- **🛡️ Error Boundary** — Crash-safe router with friendly error screen and recovery buttons. No more white screens on bad data
- **Profile Persistence** — Saves to localStorage, pre-populated with N&S details. Extended with TRL, company age, regulatory status, NHS/academic partner, location, region fields
- **Dark Glassmorphism UI** — Premium design with gradient accents, Inter font, smooth transitions, compact nav for 14 pages

### 🎯 Grant Strategy Tools (NEW)
- **📂 Evidence Vault** — Track 12 evidence types (market data, clinical results, IP, financials, letters of support, etc.) with per-funder readiness bars showing preparation level for IUK, SBRI, NIHR, HMRC, and more
- **🧩 Funding Stack Planner** — Plan concurrent applications across multiple sources. Shows total stack value (£), status pipeline (Target → Preparing → Submitted → Won), and State Aid conflict warnings
- **⏰ Deadline Sprint System** — 8-week reverse countdown for each open fund, with phase-based task lists (Discover → Draft → Evidence → Review → Polish → Submit)
- **🏢 Funder Intelligence** — Hidden scoring rubrics, green/red flags, typical winner profiles, and pro tips for 6 funders (Innovate UK, UKRI, SBRI Healthcare, NIHR, HMRC, British Business Bank)
- **🗺️ Regional Hub Mapper** — Surrey-focused: Enterprise M3 Growth Hub, KSS AHSN (MedTech adoption + falls prevention), Digital Catapult, University of Surrey (KTP partner), and regional investment funds

### 🤖 Grant Research Agent Pipeline (`agents/`)
- **Researcher Agent** — Scrapes 9 UK grant portals (IFS, UKRI, SBRI, NIHR, gov.uk) + Gemini LLM research with N&S-contextualised prompts (fall detection, elderly care, MHRA)
- **🧹 Noise Filter** — 28 regex patterns filtering navigation pages, career funding, hyper-local council grants, login portals, off-sector results, and archived pages before scraping
- **🛡️ URL Verifier** — Liveness verification with HEAD checks, domain whitelist (13 trusted sites), keyword scoring (28 grant keywords), date/amount pattern detection. Eliminates fabricated URLs before scraping
- **Scraper Agent** — Dual-extract: regex pre-extraction from HTML + Gemini AI extraction, with per-field confidence scoring (HIGH/MEDIUM/LOW) and cross-reference conflict detection. Now extracts structured eligibility rules (company size, UK registered, TRL range, collaboration, NHS partner, match funding)
- **Database Manager** — Schema validation, Levenshtein deduplication, provenance tracking (sourceUrl, lastVerified, contentHash, verificationCount), merge with changelog, JS export
- **Pipeline Runner** — Orchestrates all 4 agents in sequence with confidence stats summary

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ installed
- **Gemini API Key** (free) — [Get one here](https://aistudio.google.com/apikey)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/atila-morlocan-ns/FundScan-UK.git
cd FundScan-UK

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Setup

Create a `.env` file in the project root:
```env
GEMINI_API_KEY=your_api_key_here
VITE_GEMINI_API_KEY=your_api_key_here
```

> **Note:** `GEMINI_API_KEY` is used by the Node.js agent pipeline. `VITE_GEMINI_API_KEY` is used by the browser-based pitch deck analyzer (Vite requires the `VITE_` prefix for client-side env vars).

---

## 🤖 Agent Pipeline Commands

```bash
# Run full pipeline (Research → Scrape → Update DB)
npm run agents:run

# Run individual agents
npm run agents:research    # Step 1: Discover grant URLs from portals + Gemini
npm run agents:scrape      # Step 2: Extract structured data from discovered URLs
npm run agents:update-db   # Step 3: Validate, deduplicate, merge into database
```

### How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  🔍 Researcher  │────▶│  🕷️ Scraper     │────▶│  🗄️ DB Manager  │
│                 │     │                 │     │                 │
│ • 9 UK portals  │     │ • Cheerio parse │     │ • Schema check  │
│ • Gemini search │     │ • Gemini AI     │     │ • Levenshtein   │
│ • Dedup URLs    │     │ • JSON output   │     │ • Merge + log   │
│                 │     │                 │     │ • JS export     │
│ Output:         │     │ Output:         │     │ Output:         │
│ research-       │     │ scraped-        │     │ grants.json     │
│ results.json    │     │ grants.json     │     │ changelog.json  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Portals Scraped
| Portal | URL | What It Finds |
|--------|-----|---------------|
| Innovate UK IFS | apply-for-innovation-funding.service.gov.uk | Live competitions |
| UKRI | ukri.org/opportunity | Research council grants |
| SBRI Healthcare | sbrihealthcare.co.uk | NHS innovation competitions |
| NIHR | nihr.ac.uk | Health research funding |
| Gov.uk | gov.uk/business-finance-support | Government schemes |
| NHS AI Lab | transform.england.nhs.uk | AI in health/social care |
| KTN UK | ktn-uk.org | Innovation partnerships |
| Techstars | techstars.com | Accelerator programmes |
| Start Up Loans | startuploans.co.uk | Government-backed loans |

---

## 📁 Project Structure

```
FundScan-UK/
├── agents/                      # 🤖 Grant research pipeline
│   ├── config.js                # Search queries, schemas, rate limits
│   ├── researcher.js            # Portal scraping + Gemini research
│   ├── verifier.js              # 🛡️ URL liveness + keyword scoring
│   ├── scraper.js               # Dual-extract: regex + Gemini + confidence
│   ├── db-manager.js            # Validation, dedup, merge, provenance
│   ├── run-pipeline.js          # 4-step pipeline orchestrator
│   ├── utils.js                 # Shared: fetch, validate, similarity
│   └── data/                    # Pipeline output files
│       └── research-results.json
├── src/                         # 🎨 Frontend app
│   ├── main.js                  # App shell, router, navigation (10 pages)
│   ├── router.js                # Hash-based SPA router
│   ├── store.js                 # Profile + evidence + stack + API key + privacy controls
│   ├── match-engine.js          # Match scoring v2 (7-dimension algorithm)
│   ├── components.js            # Shared UI (match ring, eligibility/staleness badges, funding cards)
│   ├── ai/
│   │   └── deck-analyzer.js     # 📄 Client-side Gemini PDF analysis
│   ├── data/
│   │   ├── funding-sources.js   # 33 curated funding sources
│   │   ├── eligibility-rules.js # ✅ Machine-readable eligibility rules for 20+ funds
│   │   └── grant-strategy.js    # Funder intelligence, evidence types, Surrey hub data
│   ├── pages/
│   │   ├── dashboard.js         # Hero, stats, top matches
│   │   ├── scanner.js           # Search, filter, sort (+ eligible-only filter)
│   │   ├── detail.js            # Full opportunity breakdown
│   │   ├── profile.js           # Startup profile editor (+ eligibility fields)
│   │   ├── alerts.js            # Deadlines & new opportunities
│   │   ├── vault.js             # 📂 Evidence Vault
│   │   ├── stack.js             # 🧩 Funding Stack Planner
│   │   ├── strategy.js          # ⏰ Sprints & Funder Intelligence
│   │   ├── regional.js          # 🗺️ Surrey Regional Hub
│   │   └── upload.js            # 📄 Pitch Deck Analyzer + Privacy Controls
│   └── styles/
│       └── index.css            # Dark glassmorphism design system
├── index.html                   # Entry point with SEO/OG tags
├── vite.config.js               # Vite config (relative base)
├── package.json                 # Scripts & dependencies
├── funding.md                   # UK funding ecosystem research
├── .env                         # API keys (gitignored)
└── .gitignore
```

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Build | Vite 6 | Dev server + production bundling |
| Frontend | Vanilla JS (ES Modules) | Zero-dependency SPA |
| Styling | Custom CSS | Dark glassmorphism design system |
| Agents | Node.js + Cheerio | Web scraping + HTML parsing |
| AI | Gemini 2.5 Flash | Structured data extraction, research, pitch deck analysis |
| Data | JSON + localStorage | Grant database + user profiles |

---

## 📊 Funding Sources (33 Total)

### General Innovation (25)
| Provider | Programme | Type | Amount |
|----------|-----------|------|--------|
| Innovate UK | Smart Grants (New Pilot) | Grant | £25K–£500K |
| Innovate UK | Innovation Loans | Loan | £100K–£2M |
| Innovate UK | Creative Catalyst | Grant | £25K–£250K |
| Innovate UK | Growth Catalyst Early Stage | Grant | £25K–£50K |
| UKRI | Technology Missions Fund | Grant | £100K–£5M |
| Innovate UK / MRC | Biomedical Catalyst | Grant | £50K–£4M |
| Innovate UK | Digital Health Technology Catalyst | Competition | £50K–£1M |
| HMRC | SEIS | Tax Relief | Up to £250K |
| HMRC | EIS | Tax Relief | Up to £12M |
| HMRC | R&D Tax Credits | Tax Relief | Varies |
| British Business Bank | Start Up Loans | Loan | £500–£25K |
| Techstars | London Accelerator | Accelerator | £90K–£120K |
| *+ 13 more* | | | |

### MedTech / Elderly Care (8)
| Provider | Programme | Type | Amount |
|----------|-----------|------|--------|
| NHS England / SBRI | SBRI Healthcare | Competition | £50K–£1M |
| NIHR | AI in Health & Care Award | Grant | £100K–£2M |
| UKRI | Healthy Ageing Challenge Fund | Grant | £50K–£500K |
| EU / Innovate UK | AAL Programme | Grant | £100K–£700K |
| NHSX | NHS AI Lab — Social Care | Grant | £50K–£500K |
| AHSNs | MedTech Accelerator | Accelerator | Up to £75K |
| CareCity / UKRI | CareCity Accelerator | Accelerator | £20K–£50K |
| MDC | Medicines Discovery Catapult | Accelerator | Up to £100K |

---

## 🗺️ Roadmap

### ✅ Completed
- [x] Core app with 10 pages (Dashboard, Scanner, Detail, Profile, Alerts, Vault, Stack, Strategy, Regional, Deck)
- [x] 33 curated funding sources with match scoring v2 (7-dimension algorithm)
- [x] N&S MedTech profile pre-populated (with eligibility fields)
- [x] 4-agent grant research pipeline (Researcher → Verifier → Scraper → DB Manager)
- [x] Evidence Vault with 12 evidence types + per-funder readiness
- [x] Funding Stack Planner with conflict detection
- [x] Deadline Sprint System (8-week countdown)
- [x] Funder Intelligence for 6 funders (scoring rubrics, green/red flags, pro tips)
- [x] Surrey Regional Hub (Enterprise M3, KSS AHSN, Digital Catapult, University of Surrey)
- [x] **Pitch Deck Analyzer** — Upload PDF → Gemini AI profile extraction → auto-match
- [x] **Smart Eligibility Engine** — 20+ funds with machine-readable rules + badges
- [x] **N&S Use-Case Intelligence** — Deep alignment scoring for fall detection, elderly care, patient safety
- [x] **Noise Filtering** — 28 regex patterns removing irrelevant URLs from agent pipeline
- [x] **Staleness Detection** — Auto-flags aging data + auto-corrects expired deadlines
- [x] **Data Privacy Controls** — Granular purge (profile / evidence+stack / all) for CFO research sessions
- [x] GitHub deployment

### 🔜 Planned
- [ ] **CSV Export** — Download Shortlist/Tracker data as CSV
- [ ] **Drag-and-Drop Kanban** — Drag tracker cards between pipeline stages

---

## 🚢 Deployment

Build and deploy the `dist` folder to any static hosting:

```bash
npm run build
```

| Platform | Method |
|----------|--------|
| **Netlify** | Drag & drop `dist` folder |
| **Vercel** | Connect GitHub repo → auto-deploy |
| **GitHub Pages** | Push `dist` to gh-pages branch |

---

## 📝 Changelog

### v2.0.0 — 2026-04-11
**Intelligence Upgrade + Pitch Deck Analyzer**
- 📄 Pitch Deck Analyzer: Upload PDF → Gemini 2.5 Flash extracts company profile → auto-match against all funding sources
- ✅ Smart Eligibility Engine: Machine-readable rules for 20+ funds, ✅/⚠️/❌ badges on every card
- 🎯 N&S Use-Case Intelligence: Deep alignment scoring for fall detection, elderly care, patient safety (+5% bonus for perfect matches)
- 🔄 Staleness Detection: Auto-flags aging/stale data, auto-corrects expired deadlines
- 🧹 Agent Noise Filter: 28 regex patterns removing navigation pages, career funding, hyper-local council grants
- 📋 Extended Profile: TRL, company age, regulatory status, NHS/academic partner checkboxes
- 🔒 Data Privacy Controls: Granular purge (profile / evidence+stack / all) for CFO research sessions
- Match Engine v2: Rebalanced from 5→7 scoring dimensions (eligibility 25%, sector 20%, keywords 20%, stage 15%, status 10%, amount 5%, use-case 5%)
- Gemini model upgraded from 2.0 Flash (deprecated) to 2.5 Flash (stable)
- App expanded from 9 to 10 pages

### v2.1.0 — 2026-04-11
**Production Readiness Polish**
- 📋 Detail Page: Eligibility Check panel with per-check breakdown (✅/❌ + Required/Preferred tags, % fit score)
- 📋 Detail Page: Staleness badge on Last Updated, disabled Apply button when closed, eligibility badge in sidebar
- 📊 Dashboard: New "✅ Eligible Now" stat card (5th stat). Open/Upcoming counts auto-correct for expired deadlines
- 📢 Alerts: All deadline/upcoming filters use effective status — prevents stale funds from showing as active
- 📄 Upload Save: Carries over AI-extracted TRL, company age, UK registered, regulatory status into profile
- 🔧 Nav badge count uses effective status for accurate urgency indicators

### v2.2.0 — 2026-04-11
**Shortlist & Application Tracker**
- ⭐ Shortlist: Star-toggle on all funding cards (Scanner + Detail page). Dedicated shortlist page with stats, inline notes, and remove
- 📊 Application Tracker: 4-column Kanban board (Researching → Preparing → Submitted → Outcome)
- 📊 Tracker cards: fund details, match scores, move buttons, notes, outcome tagging (Won/Lost/Withdrawn)
- 📋 Detail page: Added "Shortlist" and "Track" action buttons in sidebar
- 🔒 Privacy: Shortlist and Tracker data included in purge controls
- App expanded from 10 to 12 pages

### v2.3.0 — 2026-04-11
**Expert Assessor**
- 🎓 6-step wizard: Company Basics, Technology Readiness, Market & Traction, Evidence & Assets, Funding Target, Readiness Report
- 📊 Report: Overall readiness score, 5 dimension bars (Technology, Market, Evidence, Team, Funding Fit)
- 🏆 Top 8 funder matches with eligibility badges and match scores
- 📋 AI-generated actionable recommendations (colour-coded success/warning/info)
- 💾 Save to Profile: carry assessment answers back into the user profile
- 🔄 Start Over button to re-run assessment with different answers
- App expanded to 13 pages

### v2.4.0 — 2026-04-11
**Funding Calendar**
- 📅 Visual timeline grouped by month with fund count badges
- 🔴/🟢 Toggle between Closing Dates and Opening Dates views
- Stats bar: Total Funds, This Month, Next 30 Days, Urgent (≤14d)
- ✅ Eligible only / ⭐ Shortlisted filter checkboxes
- Urgency colour coding: red (≤14d), amber (≤30d), past (faded)
- Each item shows: date badge, status, eligibility, match %, amount, provider
- Click any item to navigate to detail page
- App expanded to 14 pages

### v2.5.0 — 2026-04-11
**Quality & UX Pass**
- 🛡️ Error boundary: try/catch in router, friendly crash screen with Go Home / Reload
- ⭐ Fixed star toggle on Scanner cards (broken event delegation)
- 📌 Scroll-to-top on every page navigation
- 🎨 Fixed detail page Closes-date styling bug (broken class/style attribute)
- 📊 Dashboard Strong Matches stat now counts all funds (was capped at 4)
- ⚡ Favicon added (inline SVG ⚡) — eliminates 404 console error
- 📦 package.json version bumped to match changelog
- 🔔 Toast notification system: slide-in feedback for shortlist, profile save, tracker, notes
- ⚡ Dashboard Quick Actions: 4-card grid linking to Scanner, Assessor, Calendar, Tracker
- 🧭 Compact nav: tighter spacing to fit all 14 links without overflow
- 🧹 Code quality: merged duplicate imports, removed redundant innerHTML clear

### v2.6.0 — 2026-04-12
**Location & Tracker Improvements**
- 📍 Location & Region fields: city/town text input + UK region dropdown (13 regions) in Profile
- 🤖 AI deck analyzer now extracts location and region from pitch decks automatically
- 🗺️ Dynamic nav label: Regional link shows profile’s region name instead of hardcoded “Surrey”
- 🗺️ Regional page: reads profile region, shows “coming soon” fallback for regions without hub data
- 📊 Tracker Clear All: red “🗑️ Clear All” button in header to wipe all tracked items
- ♻️ Auto-reset on new company: uploading a new pitch deck clears old shortlist & tracker data
- 📍 Deck save now persists location and region from AI extraction
- 📦 Version bumped to 2.6.0

### v1.4.0 — 2026-03-04
**Anti-Hallucination Pipeline**
- 🛡️ URL Liveness Verifier: HEAD checks, domain whitelist (13 sites), keyword scoring (28 terms), date/amount detection
- 🎯 Dual-Extract Confidence Scoring: regex pre-extraction vs Gemini cross-reference per field (amount, dates, status)
- 📊 Source Provenance Tracking: sourceUrl, lastVerified, verificationCount, contentHash per grant
- Hardened Gemini prompts: no date estimation, no amount guessing, explicit cross-reference warnings
- Pipeline upgraded from 3 to 4 steps (Researcher → Verifier → Scraper → DB Manager)
- Added `npm run agents:verify` script

### v1.3.0 — 2026-03-04
**Grant Strategy Suite**
- 📂 Evidence Vault: 12 evidence types with per-funder readiness tracking
- 🧩 Funding Stack Planner: multi-source strategy with State Aid conflict detection
- ⏰ Deadline Sprint System: 8-week countdown with phase-based task lists
- 🏢 Funder Intelligence: scoring rubrics, green/red flags for 6 funders
- 🗺️ Surrey Regional Hub: Enterprise M3, KSS AHSN, Digital Catapult, Uni of Surrey, regional investment funds
- New data layer: `grant-strategy.js` with intelligence for Innovate UK, UKRI, SBRI, NIHR, HMRC, BBB
- App expanded from 5 to 9 pages

### v1.2.0 — 2026-03-04
**Grant Research Agent Pipeline**
- Added 3-agent pipeline: Researcher (9 portals + Gemini), Scraper (Cheerio + Gemini), DB Manager
- Pipeline orchestrator with `npm run agents:run`
- 81 relevant URLs discovered in first test run

### v1.1.0 — 2026-03-04
**Nightingale & Sentinel Personalisation**
- Added 8 MedTech/elderly care funding sources (SBRI, NIHR, Healthy Ageing, AAL, NHS AI Lab, AHSN, CareCity, MDC)
- Pre-populated default profile with N&S company details
- Total funding sources: 33

### v1.0.0 — 2026-03-04
**Initial Release**
- 5-page SPA: Dashboard, Scanner, Detail, Profile, Alerts
- 25 curated UK funding sources
- Match scoring engine (sector 40%, stage 30%, status 15%, amount 15%)
- Dark glassmorphism design system
- Profile persistence with localStorage

---

## 👥 Team

**Nightingale & Sentinel** — MedTech startup using computer vision and Vision Language Models (VLMs) to create an AI virtual witness for unwitnessed medical events — falls, seizures, and critical incidents in elderly care. Addressing the £4.6 billion UK market.

---

## 📄 License

MIT
