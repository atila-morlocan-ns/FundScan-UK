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

### 🤖 Grant Research Agent Pipeline (`agents/`)
- **Researcher Agent** — Scrapes 9 UK grant portals (IFS, UKRI, SBRI, NIHR, gov.uk) + Gemini LLM research
- **Scraper Agent** — Cheerio HTML parsing → Gemini AI structured data extraction
- **Database Manager** — Schema validation, Levenshtein deduplication, merge with changelog, JS export
- **Pipeline Runner** — Orchestrates all 3 agents in sequence

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
│   ├── scraper.js               # Cheerio + Gemini data extraction
│   ├── db-manager.js            # Validation, dedup, merge, export
│   ├── run-pipeline.js          # Pipeline orchestrator
│   ├── utils.js                 # Shared: fetch, validate, similarity
│   └── data/                    # Pipeline output files
│       └── research-results.json
├── src/                         # 🎨 Frontend app
│   ├── main.js                  # App shell, router, navigation
│   ├── router.js                # Hash-based SPA router
│   ├── store.js                 # Profile persistence (localStorage)
│   ├── match-engine.js          # Match scoring algorithm
│   ├── components.js            # Shared UI components
│   ├── data/
│   │   └── funding-sources.js   # 33 curated funding sources
│   ├── pages/
│   │   ├── dashboard.js         # Hero, stats, top matches
│   │   ├── scanner.js           # Search, filter, sort
│   │   ├── detail.js            # Full opportunity breakdown
│   │   ├── profile.js           # Startup profile editor
│   │   └── alerts.js            # Deadlines & new opportunities
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
- [x] Core app with 5 pages (Dashboard, Scanner, Detail, Profile, Alerts)
- [x] 33 curated funding sources with match scoring
- [x] N&S MedTech profile pre-populated
- [x] 3-agent grant research pipeline (Researcher → Scraper → DB Manager)
- [x] GitHub deployment

### 🔜 Planned
- [ ] **Expert Assessor** — 6-step guided wizard to extract startup details and generate readiness report
- [ ] **Favourites & Shortlist** — Save funds, add notes, filter by shortlisted
- [ ] **Application Tracker** — Kanban pipeline: Researching → Preparing → Submitted → Outcome
- [ ] **Eligibility Auto-Check** — Machine-readable eligibility with ✅/⚠️/❌ badges
- [ ] **Funding Calendar** — Visual timeline of open/close dates
- [ ] **Application Strength Scorer** — Per-fund readiness tied to expert assessor data

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
