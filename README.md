# FundScan UK ⚡

**AI-powered UK startup funding scanner** — discover, score, and track grants, loans, and innovation programmes matched to your startup.

Built for **[Nightingale & Sentinel](https://github.com/atila-morlocan-ns)** — MedTech startup using computer vision and VLMs to address unwitnessed medical events in elderly care (£4.6B UK market).

---

## ✨ Features

### Frontend App
- **33 Real Funding Sources** — Innovate UK, UKRI, HMRC, NHS England, SBRI, NIHR, and more
- **8 MedTech-Specific Funds** — SBRI Healthcare, NIHR AI Award, Healthy Ageing, NHS AI Lab, AAL, AHSN, CareCity
- **Smart Match Scoring** — Personalised % match based on sector, stage, and funding needs (weighted algorithm)
- **Funding Scanner** — Search + filter by sector, stage, type, status with sort by match/deadline/amount
- **Deadline Alerts** — Closing-soon warnings at 30/60 day thresholds
- **Application Tips** — Real tips and success rates for each funding source
- **Detail Pages** — Full breakdown with eligibility, related opportunities, and sidebar key facts
- **Profile Persistence** — Saves to localStorage, pre-populated with N&S details
- **Dark Glassmorphism UI** — Premium design with gradient accents, Inter font, smooth transitions

### 🎯 Grant Strategy Tools (NEW)
- **📂 Evidence Vault** — Track 12 evidence types (market data, clinical results, IP, financials, letters of support, etc.) with per-funder readiness bars showing preparation level for IUK, SBRI, NIHR, HMRC, and more
- **🧩 Funding Stack Planner** — Plan concurrent applications across multiple sources. Shows total stack value (£), status pipeline (Target → Preparing → Submitted → Won), and State Aid conflict warnings
- **⏰ Deadline Sprint System** — 8-week reverse countdown for each open fund, with phase-based task lists (Discover → Draft → Evidence → Review → Polish → Submit)
- **🏢 Funder Intelligence** — Hidden scoring rubrics, green/red flags, typical winner profiles, and pro tips for 6 funders (Innovate UK, UKRI, SBRI Healthcare, NIHR, HMRC, British Business Bank)
- **🗺️ Regional Hub Mapper** — Surrey-focused: Enterprise M3 Growth Hub, KSS AHSN (MedTech adoption + falls prevention), Digital Catapult, University of Surrey (KTP partner), and regional investment funds

### 🤖 Grant Research Agent Pipeline (`agents/`)
- **Researcher Agent** — Scrapes 9 UK grant portals (IFS, UKRI, SBRI, NIHR, gov.uk) + Gemini LLM research
- **🛡️ URL Verifier** — Liveness verification with HEAD checks, domain whitelist (13 trusted sites), keyword scoring (28 grant keywords), date/amount pattern detection. Eliminates fabricated URLs before scraping
- **Scraper Agent** — Dual-extract: regex pre-extraction from HTML + Gemini AI extraction, with per-field confidence scoring (HIGH/MEDIUM/LOW) and cross-reference conflict detection
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
```

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
│   ├── main.js                  # App shell, router, navigation (9 pages)
│   ├── router.js                # Hash-based SPA router
│   ├── store.js                 # Profile + evidence + stack persistence
│   ├── match-engine.js          # Match scoring algorithm
│   ├── components.js            # Shared UI components
│   ├── data/
│   │   ├── funding-sources.js   # 33 curated funding sources
│   │   └── grant-strategy.js    # Funder intelligence, evidence types, Surrey hub data
│   ├── pages/
│   │   ├── dashboard.js         # Hero, stats, top matches
│   │   ├── scanner.js           # Search, filter, sort
│   │   ├── detail.js            # Full opportunity breakdown
│   │   ├── profile.js           # Startup profile editor
│   │   ├── alerts.js            # Deadlines & new opportunities
│   │   ├── vault.js             # 📂 Evidence Vault
│   │   ├── stack.js             # 🧩 Funding Stack Planner
│   │   ├── strategy.js          # ⏰ Sprints & Funder Intelligence
│   │   └── regional.js          # 🗺️ Surrey Regional Hub
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
| AI | Gemini 2.0 Flash | Structured data extraction + research |
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
- [x] Core app with 9 pages (Dashboard, Scanner, Detail, Profile, Alerts, Vault, Stack, Strategy, Regional)
- [x] 33 curated funding sources with match scoring
- [x] N&S MedTech profile pre-populated
- [x] 3-agent grant research pipeline (Researcher → Scraper → DB Manager)
- [x] Evidence Vault with 12 evidence types + per-funder readiness
- [x] Funding Stack Planner with conflict detection
- [x] Deadline Sprint System (8-week countdown)
- [x] Funder Intelligence for 6 funders (scoring rubrics, green/red flags, pro tips)
- [x] Surrey Regional Hub (Enterprise M3, KSS AHSN, Digital Catapult, University of Surrey)
- [x] GitHub deployment

### 🔜 Planned
- [ ] **Expert Assessor** — 6-step guided wizard to extract startup details and generate readiness report
- [ ] **Favourites & Shortlist** — Save funds, add notes, filter by shortlisted
- [ ] **Application Tracker** — Kanban pipeline: Researching → Preparing → Submitted → Outcome
- [ ] **Eligibility Auto-Check** — Machine-readable eligibility with ✅/⚠️/❌ badges
- [ ] **Funding Calendar** — Visual timeline of open/close dates

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
