# FundScan UK ⚡

A premium web app that helps UK startups discover, track, and apply for funding opportunities matched to their sector and innovation stage.

## Features

- **25+ Real Funding Sources** — Innovate UK, UKRI, HMRC, British Business Bank, and more
- **Smart Match Scoring** — Personalised % match based on your sector, stage, and funding needs
- **Funding Scanner** — Search + filter by sector, stage, type, status, sorted by relevance
- **Deadline Alerts** — Closing-soon warnings (7/30/60 day thresholds)
- **Application Tips** — Real tips and success rates for each funding source
- **Weekly Scanning** — Simulated weekly scan for new opportunities
- **Profile Persistence** — Saves to localStorage, persists across sessions

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **Vite** — Lightning-fast build tool
- **Vanilla JS** — No framework dependencies, pure ES modules
- **CSS** — Custom dark glassmorphism design system

## Sharing / Deployment

Build the production bundle and deploy the `dist` folder to any static hosting:

- **[Netlify](https://netlify.com)** — Drag & drop the `dist` folder
- **[Vercel](https://vercel.com)** — Connect this GitHub repo
- **[GitHub Pages](https://pages.github.com)** — Push `dist` to gh-pages branch

## Funding Sources Included

| Provider | Examples |
|----------|----------|
| Innovate UK | Smart Grants, Innovation Loans, Creative Catalyst |
| UKRI | Technology Missions Fund, Biomedical Catalyst |
| HMRC | SEIS, EIS, R&D Tax Credits |
| British Business Bank | Start Up Loans |
| Sector-specific | DRIVE35, Cyber ASAP, Space Agency Fund, Defra Farming |

## License

MIT
