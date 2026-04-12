# 🚀 FundScan UK — Complete Setup Guide (Windows)

> **Version:** 2.6.0 | **Last Updated:** 12 April 2026  
> This guide takes you from a fresh Windows PC to a fully running FundScan UK platform in under 10 minutes.

---

## Table of Contents

1. [Prerequisites](#-step-1--prerequisites)
2. [Get the Code](#-step-2--get-the-code)
3. [Install Dependencies](#-step-3--install-dependencies)
4. [Configure API Key](#-step-4--configure-your-api-key)
5. [Start the App](#-step-5--start-the-app)
6. [Your First Scan](#-step-6--your-first-scan-walkthrough)
7. [Page-by-Page Guide](#-page-guide)
8. [Testing with a Pitch Deck](#-testing-with-a-pitch-deck)
9. [Troubleshooting](#-troubleshooting)
10. [Advanced: Agent Pipeline](#-advanced-grant-research-agents)

---

## 📋 Step 1 — Prerequisites

You need **two things** installed on your Windows PC:

### 1.1 Install Node.js

1. Go to **https://nodejs.org**
2. Download the **LTS** version (green button) — must be **v18 or higher**
3. Run the installer, accept defaults, click **Next** through all steps
4. ✅ **Check** the box for "Automatically install necessary tools" if prompted

**Verify it worked** — open **PowerShell** or **Command Prompt** and type:

```powershell
node --version
# Should print: v18.x.x or higher (e.g. v22.15.0)

npm --version
# Should print: 10.x.x or higher
```

> 💡 **Don't have PowerShell?** Press `Win + X` → select "Terminal" or "PowerShell"

### 1.2 Install Git

1. Go to **https://git-scm.com/download/win**
2. Download and run the installer
3. Accept all defaults — click **Next** through every step

**Verify it worked:**

```powershell
git --version
# Should print: git version 2.x.x
```

### 1.3 Get a Gemini API Key (Free)

This is needed for the **Pitch Deck Analyzer** (AI-powered). The rest of the app works without it.

1. Go to **https://aistudio.google.com/apikey**
2. Sign in with your Google account
3. Click **"Create API key"**
4. Copy the key — it looks like `AIzaSy...` (39 characters)
5. Save it somewhere safe — you'll need it in Step 4

> 🆓 The free tier gives you **15 requests per minute** — more than enough for testing.

---

## 📥 Step 2 — Get the Code

Open **PowerShell** (or Terminal) and run:

```powershell
# Navigate to where you want the project (e.g. Desktop)
cd $HOME\Desktop

# Clone the repository
git clone https://github.com/atila-morlocan-ns/FundScan-UK.git

# Enter the project folder
cd FundScan-UK
```

You should now see the project folder on your Desktop.

---

## 📦 Step 3 — Install Dependencies

Still in PowerShell, inside the `FundScan-UK` folder:

```powershell
npm install
```

This will:
- Download **Vite** (dev server)
- Download **@google/generative-ai** (Gemini SDK for pitch deck analysis)
- Download **cheerio** + **dotenv** (for the agent pipeline)

It takes about 30-60 seconds. You'll see a `node_modules` folder appear.

**Expected output:**

```
added 12 packages in 5s
```

> ⚠️ You may see some `npm warn` messages — these are safe to ignore.

---

## 🔑 Step 4 — Configure Your API Key

Create a file called `.env` in the project root folder:

### Option A: Using PowerShell (Quick)

```powershell
# Replace YOUR_KEY_HERE with your actual Gemini API key
@"
GEMINI_API_KEY=YOUR_KEY_HERE
VITE_GEMINI_API_KEY=YOUR_KEY_HERE
"@ | Out-File -FilePath .env -Encoding utf8
```

### Option B: Manually with Notepad

1. Open **Notepad**
2. Paste this (replace `YOUR_KEY_HERE` with your real key):

```env
GEMINI_API_KEY=YOUR_KEY_HERE
VITE_GEMINI_API_KEY=YOUR_KEY_HERE
```

3. **File → Save As** → navigate to the `FundScan-UK` folder
4. Filename: `.env` (including the dot!)
5. Save as type: **All Files** (not .txt)

> 📝 **Why two keys?**  
> - `GEMINI_API_KEY` → used by Node.js agent scripts  
> - `VITE_GEMINI_API_KEY` → used by the browser-side Pitch Deck Analyzer (Vite requires the `VITE_` prefix for client-side env vars)

> 🔒 **Security:** The `.env` file is gitignored — it will never be committed to the repo. Your key stays local.

---

## ▶️ Step 5 — Start the App

```powershell
npm run dev
```

**Expected output:**

```
  VITE v6.x.x  ready in 300ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

Your browser should **automatically open** to `http://localhost:3000`.  
If it doesn't, manually open your browser and go to **http://localhost:3000**

🎉 **You should see the FundScan UK dashboard!**

> To stop the server, press `Ctrl + C` in PowerShell.

---

## 🎯 Step 6 — Your First Scan (Walkthrough)

Here's the recommended order to explore the platform for the first time:

### 6.1 Set Up Your Profile

1. Click **⚙️ Profile** in the nav bar
2. Fill in your **Company Name** and **Description**
3. Set your **Team Size** and **Funding Needed**
4. Enter your **Location** (city/town) and select your **Region**
5. Select your **Sectors** (click the chips that match your business)
6. Select your **Innovation Stage**
7. Fill in **Eligibility Details** (TRL, company age, regulatory body, partnerships)
8. Click **💾 Save Profile**

> 💡 The more you fill in, the better your match scores will be.

### 6.2 Scan for Funding

1. Click **🔍 Scanner** in the nav bar
2. You'll see **33 UK funding opportunities** ranked by match score
3. Each card shows: fund name, provider, amount, match %, status badges
4. Use the **filters** at the top to narrow by sector, type, status
5. Click **✅ Eligible Only** to see funds you qualify for
6. Click any card to see the **full detail page**

### 6.3 Shortlist & Track

1. Click the **⭐ star** on any card to add it to your **Shortlist**
2. On the detail page, click **📊 Track** to add to your **Application Tracker**
3. Visit **📊 Tracker** to see your Kanban pipeline board
4. Move items between stages: Researching → Preparing → Submitted → Outcome

### 6.4 Upload a Pitch Deck (Optional — needs API key)

1. Click **📄 Deck** in the nav bar
2. Drag & drop or browse for your **PDF pitch deck**
3. The AI will extract: company name, description, sectors, funding needs, location
4. Review the extracted data, adjust if needed
5. Click **🚀 Save & Find Funding** — this replaces your profile and clears old tracker data

---

## 📖 Page Guide

| Page | Nav | What it does |
|------|-----|-------------|
| **Dashboard** | 🏠 | Overview stats, top matches, quick action cards |
| **Scanner** | 🔍 | All 33 funds with filters, sort, match scores |
| **Alerts** | 📢 | Closing-soon warnings (30/60 day) + coming-soon funds |
| **Vault** | 📂 | Evidence locker — store and tag documents for applications |
| **Stack** | 🧩 | Funding stack planner — plan concurrent applications |
| **Strategy** | ⏰ | Deadline sprint system — 8-week countdown per fund |
| **Regional** | 🗺️ | Local Growth Hub, AHSN, Catapult, universities for your region |
| **Deck** | 📄 | AI pitch deck analyzer + data privacy controls |
| **Shortlist** | ⭐ | Your favourited funds with notes |
| **Tracker** | 📊 | Kanban pipeline: Researching → Preparing → Submitted → Outcome |
| **Assessor** | 🎓 | 6-step funding readiness wizard with scored report |
| **Calendar** | 📅 | Visual timeline of all fund deadlines by month |
| **Profile** | ⚙️ | Company details, sectors, eligibility, location |

---

## 🧪 Testing with a Pitch Deck

To test the full AI workflow:

1. Prepare a **PDF pitch deck** (any startup deck works)
2. Go to **📄 Deck** page
3. Upload the PDF
4. Wait ~15 seconds for Gemini to analyze it
5. Review the extracted profile:
   - Company name, description
   - Sectors and stages (auto-selected)
   - Funding needed (mapped to nearest bracket)
   - Location and region (if mentioned in deck)
   - AI insights: target market, TRL, key differentiators
6. Click **🚀 Save & Find Funding**
7. The app navigates to Scanner with updated matches

> ⚠️ **Note:** Saving a new deck automatically **clears** any existing shortlist and tracker items (they belonged to the previous company).

### Testing Multiple Companies

You can test with different pitch decks back-to-back:
1. Upload Deck A → Save → explore matches
2. Upload Deck B → Save → old data cleared, fresh matches appear
3. Each company gets their own clean slate

---

## ❓ Troubleshooting

### "node is not recognized as a command"
→ Node.js isn't installed. Go back to [Step 1.1](#11-install-nodejs).

### "git is not recognized as a command"
→ Git isn't installed. Go back to [Step 1.2](#12-install-git).

### "npm install" fails with permission errors
→ Run PowerShell as **Administrator**: Right-click PowerShell → "Run as administrator"

### Port 3000 is already in use
→ Another app is using port 3000. Either:
- Close the other app, or
- Edit `vite.config.js` and change `port: 3000` to `port: 3001`

### Pitch Deck upload says "Please enter your Gemini API key"
→ Your `.env` file is missing or the key is wrong. Check:
1. The file is named exactly `.env` (not `.env.txt`)
2. It's in the project root (same folder as `package.json`)
3. The key starts with `AIzaSy...`
4. **Restart the dev server** after creating/changing `.env` (press `Ctrl+C` then `npm run dev`)

### "Analysis failed" when uploading deck
→ Common causes:
- **PDF too large** (max ~20MB)
- **API quota exceeded** — wait 60 seconds and try again
- **Invalid API key** — regenerate at https://aistudio.google.com/apikey

### Page shows blank / white screen
→ The app has an error boundary that should show a recovery screen. If you see a completely blank page:
1. Open browser DevTools (`F12` → Console tab)
2. Check for red error messages
3. Try clearing localStorage: `localStorage.clear()` in the console
4. Refresh the page

### Scanner shows 0 matches
→ Your profile might have very narrow sectors selected. Try:
1. Go to **Profile** → select more sectors
2. Ensure "UK Registered Company" is checked
3. Save and re-visit Scanner

---

## 🔧 Advanced: Grant Research Agents

The `agents/` folder contains a Node.js pipeline that discovers and scrapes live grant data:

```powershell
# Run the full pipeline (Research → Verify → Scrape → Update DB)
npm run agents:run

# Or run individual steps:
npm run agents:research    # Discover grant URLs from UK portals + Gemini
npm run agents:verify      # Verify URLs are live (HEAD checks, domain validation)
npm run agents:scrape      # Extract structured data from verified URLs
npm run agents:update-db   # Validate, deduplicate, merge into funding-sources.js
```

> ⚠️ These agents require a valid `GEMINI_API_KEY` in `.env` and active internet connection.

---

## 📁 Project Structure

```
FundScan-UK/
├── .env                    # Your API keys (create this — gitignored)
├── .gitignore
├── index.html              # App entry point
├── package.json            # Dependencies & scripts
├── vite.config.js          # Dev server config (port 3000)
├── README.md               # Full project documentation
├── SETUP_GUIDE.md          # This file
│
├── src/
│   ├── main.js             # App shell, nav, router setup
│   ├── router.js           # Hash-based SPA router with error boundary
│   ├── store.js            # localStorage persistence (profile, shortlist, tracker)
│   ├── match-engine.js     # Scoring algorithm (sector + stage + eligibility)
│   ├── components.js       # Shared UI components (star toggle, cards)
│   ├── toast.js            # Toast notification system
│   │
│   ├── ai/
│   │   └── deck-analyzer.js    # Gemini pitch deck extraction
│   │
│   ├── data/
│   │   ├── funding-sources.js  # 33 UK funding opportunities (source of truth)
│   │   ├── eligibility-rules.js # Per-fund eligibility rule engine
│   │   └── grant-strategy.js    # Strategy, regional hub, funder intelligence data
│   │
│   ├── pages/
│   │   ├── dashboard.js    # Home dashboard with stats & quick actions
│   │   ├── scanner.js      # Main funding browser with filters
│   │   ├── detail.js       # Individual fund detail page
│   │   ├── profile.js      # Company profile & eligibility form
│   │   ├── upload.js       # Pitch deck upload & privacy controls
│   │   ├── shortlist.js    # Favourited funds
│   │   ├── tracker.js      # Kanban pipeline board
│   │   ├── assessor.js     # 6-step readiness wizard
│   │   ├── calendar.js     # Visual deadline timeline
│   │   ├── alerts.js       # Deadline warnings
│   │   ├── vault.js        # Evidence document locker
│   │   ├── stack.js        # Concurrent application planner
│   │   ├── strategy.js     # Deadline sprint system
│   │   └── regional.js     # Local Growth Hub & university mapper
│   │
│   └── styles/
│       └── index.css       # Full design system (dark glassmorphism)
│
└── agents/                 # Node.js grant research pipeline
    ├── researcher.js
    ├── verifier.js
    ├── scraper.js
    ├── db-manager.js
    └── run-pipeline.js
```

---

## 🔄 Updating to Latest Version

When new updates are released:

```powershell
cd FundScan-UK
git pull origin master
npm install
npm run dev
```

---

## 🔒 Data & Privacy

- **Zero server persistence** — all data is stored in your browser's `localStorage`
- **Nothing is sent anywhere** except pitch deck PDFs → Google Gemini API (only when you upload)
- **Clear all data** anytime: go to **📄 Deck** page → **🔒 Data Privacy Controls** → **⚠️ Purge ALL Company Data**

---

## 💬 Quick Reference

| Action | How |
|--------|-----|
| Start the app | `npm run dev` |
| Stop the app | `Ctrl + C` in terminal |
| Reset all data | Browser console: `localStorage.clear()` then refresh |
| Change port | Edit `vite.config.js` → `port: 3001` |
| Build for prod | `npm run build` (outputs to `dist/`) |
| Run grant agents | `npm run agents:run` |

---

**🎉 You're all set!** Open http://localhost:3000 and start scanning for funding.
