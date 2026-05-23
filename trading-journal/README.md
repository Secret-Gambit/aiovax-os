# XAUUSD Trading Journal

A Progressive Web App (PWA) for tracking XAUUSD (Gold) trades with risk management, weekly goals, and challenge engine features.

![Trading Journal](https://img.shields.io/badge/XAUUSD-Trading%20Journal-gold)
![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-blue)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

## Features

### Core Trading Features
- **Quick Trade Logging** - Log trades fast with entry, exit, lot size, and outcome
- **Trade History** - View, edit, and delete past trades with filtering
- **Image Upload** - Attach charts/screenshots to trades
- **Trade Notes** - Add detailed notes for each trade

### Risk Management
- **Weekly R:R Goals** - Set weekly risk-to-reward targets (e.g., 1:10)
- **R Tracking** - Automatically calculate accumulated R for the week
- **Discipline Alerts** - Get warnings when approaching or exceeding weekly limits
- **Progress Visualization** - See weekly progress with color-coded indicators

### Challenge Engine
- **Custom Challenges** - Create challenges with starting balance, target, and timeframe
- **Daily Targets** - Automatically calculates daily profit targets
- **Lot Size Calculator** - Recommends lot sizes based on risk parameters
- **Adaptive Recalculation** - Adjusts plan when targets are missed
- **Progress Tracking** - Visual progress bar and day-by-day tracking

### PWA Features
- **Offline Access** - Use the app without internet connection
- **Install on Home Screen** - Works like a native mobile app
- **Data Persistence** - All data stored locally in browser
- **Mobile Optimized** - Designed for phone screens

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide Icons** - Icon library
- **localStorage** - Data persistence

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

### Logging a Trade
1. Tap the **+** button on the home screen
2. Enter trade details:
   - Entry price, Exit price
   - Lot size (e.g., 0.01, 0.1, 1.0)
   - Date and time
   - Optional: Add screenshot, notes
3. Save the trade

### Setting Weekly Goals
1. Go to **Goals** tab
2. Set your weekly R:R target (e.g., 10R for the week)
3. Track progress in real-time as you log trades

### Using the Challenge Engine
1. Go to **Challenge** tab
2. Tap "Start New Challenge"
3. Enter your parameters:
   - Starting balance (e.g., $100)
   - Target balance (e.g., $100,000)
   - Risk:Reward ratio (e.g., 1:4)
   - Max days (e.g., 30)
   - Average stop loss in pips (e.g., 60)
4. Follow the daily plan with recommended lot sizes
5. Log your daily results
6. The engine adapts if you miss targets

### Understanding Lot Size Calculation

The app calculates lot sizes based on:
- **XAUUSD pip value:** $10 per pip for 1.0 standard lot
- **Risk per trade:** Target profit ÷ R:R ratio
- **Stop loss pips:** Your average SL distance
- **Safety cap:** Max 5% account risk per trade
- **Rounding:** Rounds UP to nearest 0.01 (micro lot)

**Formula:**
```
Lot Size = Risk Amount ÷ (Stop Loss Pips × $10)
```

## File Structure

```
trading-journal/
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── sw.js             # Service worker (offline support)
│   └── gold-icon.svg     # App icon
├── src/
│   ├── components/       # React components
│   │   ├── HomeDashboard.tsx
│   │   ├── QuickLogger.tsx
│   │   ├── History.tsx
│   │   ├── WeeklyGoals.tsx
│   │   ├── ChallengeSetup.tsx
│   │   └── ChallengeDashboard.tsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useTrades.ts
│   │   ├── useWeeklyGoals.ts
│   │   └── useChallenge.ts
│   ├── types/           # TypeScript types
│   │   ├── trade.ts
│   │   ├── weeklyGoal.ts
│   │   └── challenge.ts
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
└── README.md
```

## Data Storage

All data is stored in **localStorage** in your browser:
- `trades` - Your trade history
- `weekly-goals` - Weekly R:R goals and progress
- `current-challenge` - Active challenge data

**Note:** Clear browser data will erase your trades. Export/backup feature coming soon!

## Browser Support

- Chrome/Edge (recommended)
- Safari (iOS)
- Firefox
- Samsung Internet

## Roadmap

- [x] Trade logging with images
- [x] Weekly R:R goals
- [x] Challenge engine with lot size calculator
- [x] PWA offline support
- [ ] Data export/import (JSON/CSV)
- [ ] Trade statistics and analytics
- [ ] Multiple challenge presets
- [ ] Dark/light theme toggle
- [ ] Push notifications for daily targets

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

**Happy Trading!** 📈💰
