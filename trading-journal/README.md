# 📈 AIOVAX Trading Journal

[![Live Demo](https://img.shields.io/badge/Live%20Demo-View%20Site-gold?style=for-the-badge)](https://trading-journal-app.netlify.app/)
![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&style=for-the-badge)

**A professional trading journal for XAUUSD (Gold) traders with TradeZella-style dashboard analytics, risk management, and challenge engine.**

[🌐 Live Demo](https://trading-journal-app.netlify.app/) • [📱 Install as App](#as-a-mobile-app-pwa) • [🐛 Report Bug](https://github.com/Secret-Gambit/aiovax-os/issues)

## 📸 Screenshots

> *Coming soon - Add screenshots of desktop dashboard, mobile interface, and trade logging*

## ✨ Features

### 📊 Dashboard Analytics
- **TradeZella-Style Dashboard** - Professional desktop layout with sidebar navigation
- **Performance Metrics** - Win rate, Net R, Profit Factor, Expectancy, Discipline Score
- **Visual Analytics** - R-Multiple histogram, 30-day heatmap, setup performance bars
- **Setup Trends** - Sparkline charts showing win rate trends over last 20 trades
- **Streak Tracking** - Visual streak counter with win/loss indicators
- **Calendar View** - Monthly calendar with daily P&L coloring
- **Session Performance** - Track performance by trading session (Asian, London, New York)

### 📝 Trade Logging
- **Quick Trade Entry** - Log trades in seconds with intuitive mobile interface
- **R-Multiple Calculator** - Automatic R calculation from entry/exit
- **Emotion Intensity Slider** - Track from Calm to Revenge Trading
- **Trade Templates** - Save and reuse common trade setups
- **Voice-to-Text Notes** - Speak your trade notes (mobile)
- **Multiple Chart Screenshots** - Attach up to 6 images per trade with full-screen viewer
- **Entry Time Tracking** - Log exact entry time with timezone support
- **Edit & Duplicate** - Modify existing trades or duplicate for similar setups
- **One-Tap Delete** - Quick trade removal with confirmation

### 🎯 Risk Management
- **Weekly R:R Goals** - Set and track weekly targets
- **Discipline Scoring** - Percentage of calm vs emotional trades
- **Progress Visualization** - Real-time goal tracking
- **Discipline Alerts** - Warnings for overtrading patterns

### 🏆 Challenge Engine
- **Custom Challenges** - Set starting balance, target, timeframe, and R:R ratio
- **Daily Targets** - Automatic daily profit and lot size calculations
- **Lot Size Calculator** - XAUUSD-optimized recommendations based on risk
- **Adaptive Recalculation** - Engine adjusts when targets are missed
- **Progress Tracking** - Visual progress wheels for days passed and profit targets
- **Day-by-Day Tracking** - Log actual results vs targets for each trading day

### 📱 Multi-Platform
- **Desktop Dashboard** - Full analytics view (≥1024px) with TradeZella-style layout
- **Mobile Optimized** - Phone-friendly interface (<1024px) with bottom navigation
- **PWA Offline Support** - Works without internet after first load
- **Install on Home Screen** - Native app experience on iOS and Android
- **Responsive Design** - Seamlessly adapts to any screen size
- **Touch Optimized** - Large tap targets and swipe-friendly interface

## Tech Stack

- **React 18** - UI framework with hooks
- **TypeScript** - Full type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Modern icon library
- **localStorage** - Browser data persistence
- **Custom Visualization Components** - Charts and gauges built with React + SVG

## Installation

### As a Mobile App (PWA)

1. **Visit the deployed app** on your phone's browser
2. **Install it:**
   - **iOS (Safari):** Tap Share → "Add to Home Screen"
   - **Android (Chrome):** Tap ⋮ → "Install app"
3. **Open from home screen** - works offline!

### Local Development

```bash
# Clone the repository
git clone https://github.com/Secret-Gambit/aiovax-os.git

# Navigate to project
cd aiovax-os/trading-journal

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Usage

### Desktop Dashboard (≥1024px)
1. **Dashboard** - Overview with key stats and recent trades
2. **Analytics** - Detailed performance charts and metrics
3. **Log Trade** - Quick trade entry form
4. **History** - Full trade history with filters
5. **Challenge** - Challenge tracking and daily logging
6. **Settings** - Data export/import and app info

### Mobile App (<1024px)
1. Tap **+** to log a new trade
2. Use bottom tabs to navigate (Home, Log, List, Stats, Challenge)
3. Swipe through screens optimized for phone screens

### Key Metrics Explained
- **Win Rate** - Percentage of winning trades
- **Net R** - Total R-multiples accumulated
- **Profit Factor** - Gross Profit ÷ Gross Loss (goal: >1.5)
- **Expectancy** - Expected R per trade = (Win% × Avg Win) - (Loss% × Avg Loss)
- **Discipline Score** - Percentage of trades logged as "Calm"

### Challenge Engine
1. Go to **Challenge** section
2. Enter parameters:
   - Starting balance (e.g., $100)
   - Target balance (e.g., $100,000)
   - R:R ratio (e.g., 1:4)
   - Max days (e.g., 30)
   - Avg stop loss pips (e.g., 60)
3. Follow daily targets with calculated lot sizes
4. Log daily results - engine adapts if targets missed

**Lot Size Formula:**
```
Lot Size = Risk Amount ÷ (Stop Loss Pips × $10 per pip)
```

## File Structure

```
trading-journal/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                 # Service worker
│   ├── _redirects            # Netlify SPA redirect
│   └── gold-icon.svg         # App icon
├── src/
│   ├── components/
│   │   ├── DesktopLayout.tsx     # Desktop dashboard layout
│   │   ├── HomeDashboard.tsx     # Mobile home screen
│   │   ├── QuickLogger.tsx       # Trade entry form
│   │   ├── History.tsx           # Trade history list
│   │   ├── ChallengeSetup.tsx    # Challenge creation
│   │   ├── ChallengeDashboard.tsx # Challenge tracking
│   │   ├── Insights.tsx          # Mobile analytics
│   │   └── visualizations/       # Chart components
│   │       ├── RMHistogram.tsx
│   │       ├── SetupPerformanceBars.tsx
│   │       ├── DailyHeatStrip.tsx
│   │       ├── WinRateGauge.tsx
│   │       ├── DisciplineScoreRing.tsx
│   │       ├── SetupTrendSparkline.tsx
│   │       ├── StreakVisualizer.tsx
│   │       └── ChallengeProgressWheel.tsx
│   ├── hooks/
│   │   ├── useTrades.ts
│   │   ├── useTemplates.ts
│   │   ├── useWeeklyGoals.ts
│   │   └── useChallenge.ts
│   ├── types/
│   │   ├── trade.ts
│   │   └── challenge.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── netlify.toml
└── package.json
```

## 💾 Data Storage & Backup

All data is stored **locally in your browser** - no server required, complete privacy:

| Storage Key | Description |
|-------------|-------------|
| `trades` | Complete trade history with screenshots |
| `weekly-goals` | Weekly R:R targets and progress |
| `current-challenge` | Challenge configuration and daily logs |
| `tradeTemplates` | Saved trade setup templates |
| `settings` | App preferences and timezone settings |

### 🔒 Privacy First
- ✅ No account required
- ✅ No data sent to servers
- ✅ Works completely offline
- ✅ You own your data

### Backup & Restore
1. Go to **Settings → Data Management**
2. Click **Export Backup** to download JSON file
3. Use **Import Backup** to restore from file (merges with existing data)
4. **Clear All Data** to reset everything (with confirmation)

**💡 Tip:** Export backup regularly to prevent data loss if browser storage is cleared.

## 🌐 Browser Support

| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome/Edge | ✅ | ✅ | Recommended - Best performance |
| Safari | ✅ | ✅ | iOS - Full PWA support |
| Firefox | ✅ | ⚠️ | Mobile PWA limited |
| Samsung Internet | ❌ | ✅ | Android - Good PWA support |
| Opera | ✅ | ✅ | Works well |

### ⚠️ Known Limitations
- **Firefox Mobile**: PWA installation limited on some versions
- **Private/Incognito Mode**: LocalStorage may be cleared when session ends
- **iOS Safari**: 50MB storage limit for offline cache

## 🗺️ Roadmap

### ✅ Completed
- [x] Trade logging with multiple images & voice notes
- [x] Weekly R:R goals with progress tracking
- [x] Challenge engine with lot size calculator
- [x] PWA offline support
- [x] Data export/import (JSON)
- [x] Trade statistics and analytics dashboard
- [x] Desktop TradeZella-style layout
- [x] Visualization components (histograms, heatmaps, gauges)
- [x] Profit Factor & Expectancy calculations
- [x] Settings page with data management
- [x] Full-screen image viewer for trade screenshots
- [x] Mobile-optimized trade history with delete functionality

### 🚧 In Progress
- [ ] Multiple challenge presets (100k, 200k, etc.)

### 🔮 Planned
- [ ] Push notifications for daily targets
- [ ] Trade journal PDF export
- [ ] Performance reports by month/quarter
- [ ] Trade replay and analysis
- [ ] Integration with broker APIs
- [ ] Dark/light theme toggle

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Open a Pull Request

## License

MIT License - feel free to use and modify!

## Credits

Built by **Secret Gambit** for the trading community.

---

**Trade Smart. Track Everything.** 📈💰
