import { useState, useEffect } from 'react'
import { 
  Palette, 
  Database, 
  Info, 
  Trash2, 
  Download,
  ChevronRight,
  Check,
  User
} from 'lucide-react'
import { themeColors, type ThemeColor } from '../hooks/useTheme'

interface MobileSettingsProps {
  onResetAllData: () => void
}

export function MobileSettings({ onResetAllData }: MobileSettingsProps) {
  const [activeSection, setActiveSection] = useState<'general' | 'data' | 'about'>('general')
  const [currentTheme, setCurrentTheme] = useState<ThemeColor>('gold')
  const [traderName, setTraderName] = useState('')

  // Load saved preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('trading-journal-theme') as ThemeColor
    const savedName = localStorage.getItem('trading-journal-trader-name')
    if (savedTheme && themeColors[savedTheme]) {
      setCurrentTheme(savedTheme)
    }
    if (savedName) {
      setTraderName(savedName)
    }
  }, [])

  const handleThemeChange = (theme: ThemeColor) => {
    setCurrentTheme(theme)
    const colors = themeColors[theme]
    const root = document.documentElement
    root.style.setProperty('--gold-primary', colors.primary)
    root.style.setProperty('--gold-secondary', colors.secondary)
    root.style.setProperty('--gold-glow', colors.glow)
    root.style.setProperty('--gold-soft', colors.soft)
    localStorage.setItem('trading-journal-theme', theme)
    // Dispatch event for same-tab communication
    window.dispatchEvent(new Event('theme-changed'))
  }

  const handleExportData = () => {
    const data = {
      trades: JSON.parse(localStorage.getItem('trading-journal-trades') || '[]'),
      weeklyGoals: JSON.parse(localStorage.getItem('trading-journal-weekly-goals') || '[]'),
      challenge: JSON.parse(localStorage.getItem('trading-journal-challenge') || 'null'),
      templates: JSON.parse(localStorage.getItem('trading-journal-templates') || '[]'),
      theme: localStorage.getItem('trading-journal-theme'),
      traderName: localStorage.getItem('trading-journal-trader-name'),
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aiovax-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleResetData = () => {
    if (confirm('Are you sure? This will delete ALL your data permanently.')) {
      onResetAllData()
    }
  }

  const handleUpdateName = (name: string) => {
    setTraderName(name)
    localStorage.setItem('trading-journal-trader-name', name)
  }

  return (
    <div className="flex flex-col h-full px-5 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-[var(--gold-soft)] flex items-center justify-center">
          <User className="w-6 h-6 text-[var(--gold-primary)]" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-[var(--text-primary)]">
            {traderName || 'Trader'}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">AIOVAX Settings</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex rounded-xl overflow-hidden bg-[var(--bg-tertiary)] mb-4">
        {[
          { id: 'general', label: 'General', icon: Palette },
          { id: 'data', label: 'Data', icon: Database },
          { id: 'about', label: 'About', icon: Info },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id as any)}
            className={`flex-1 py-3 text-xs font-medium tap-target transition-all flex items-center justify-center gap-1 ${
              activeSection === item.id ? 'gold-accent' : ''
            }`}
            style={{ color: activeSection === item.id ? undefined : 'var(--text-muted)' }}
          >
            <item.icon size={14} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4">
        {activeSection === 'general' && (
          <div className="space-y-4">
            {/* Trader Name */}
            <div className="phone-card rounded-xl p-4">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Trader Name
              </label>
              <input
                type="text"
                value={traderName}
                onChange={(e) => handleUpdateName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-soft)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-primary)]"
              />
            </div>

            {/* Theme Selector */}
            <div className="phone-card rounded-xl p-4">
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">Accent Color</h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                Choose your preferred theme color
              </p>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(themeColors) as ThemeColor[]).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => handleThemeChange(theme)}
                    className={`p-2 rounded-xl border-2 transition-all ${
                      currentTheme === theme 
                        ? 'border-[var(--gold-primary)] bg-[var(--gold-soft)]' 
                        : 'border-transparent bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    <div 
                      className="w-6 h-6 rounded-lg mx-auto mb-1"
                      style={{ 
                        background: `linear-gradient(135deg, ${themeColors[theme].primary}, ${themeColors[theme].secondary})` 
                      }}
                    />
                    <span className="text-[10px] capitalize text-[var(--text-secondary)]">{theme}</span>
                    {currentTheme === theme && (
                      <Check className="w-3 h-3 mx-auto mt-0.5 text-[var(--gold-primary)]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'data' && (
          <div className="space-y-3">
            <div className="phone-card rounded-xl p-4">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Data Management</h3>
              
              {/* Export */}
              <button
                onClick={handleExportData}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--bg-tertiary)] mb-3 tap-target"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--profit-soft)] flex items-center justify-center">
                    <Download className="w-5 h-5 text-[var(--profit)]" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-[var(--text-primary)]">Export Data</p>
                    <p className="text-xs text-[var(--text-muted)]">Download backup JSON</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
              </button>

              {/* Reset */}
              <button
                onClick={handleResetData}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--loss-soft)] tap-target"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--loss)]/20 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-[var(--loss)]" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-[var(--loss)]">Reset All Data</p>
                    <p className="text-xs text-[var(--text-muted)]">Permanently delete everything</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--loss)]" />
              </button>
            </div>
          </div>
        )}

        {activeSection === 'about' && (
          <div className="space-y-4">
            <div className="phone-card rounded-xl p-6 text-center">
              <div 
                className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${themeColors[currentTheme].primary}, ${themeColors[currentTheme].secondary})` 
                }}
              >
                <span className="text-3xl font-bold text-black">A</span>
              </div>
              <h3 className="font-bold text-xl text-[var(--text-primary)] mb-1">AIOVAX</h3>
              <p className="text-sm text-[var(--text-muted)] mb-4">Professional Trading Journal</p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-tertiary)]">
                <span className="w-2 h-2 rounded-full bg-[var(--profit)]"></span>
                <span className="text-xs text-[var(--text-muted)]">v1.0.0</span>
              </div>
            </div>

            <div className="phone-card rounded-xl p-4">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">Features</h3>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]"></span>
                  Voice-to-text trade notes
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]"></span>
                  Chart screenshot upload
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]"></span>
                  Pro analytics dashboard
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]"></span>
                  Weekly R goals
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]"></span>
                  Prop firm challenge simulator
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
