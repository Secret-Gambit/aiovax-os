import { useState, useEffect, useCallback } from 'react'

export type ThemeColor = 
  | 'gold' 
  | 'pink' 
  | 'purple' 
  | 'blue' 
  | 'green' 
  | 'coral'
  | 'orange'
  | 'teal'
  | 'red'
  | 'silver'

interface ThemeConfig {
  primary: string
  secondary: string
  glow: string
  soft: string
}

const themeColors: Record<ThemeColor, ThemeConfig> = {
  gold: {
    primary: '#c9a227',
    secondary: '#b8941d',
    glow: 'rgba(201, 162, 39, 0.4)',
    soft: 'rgba(201, 162, 39, 0.1)',
  },
  pink: {
    primary: '#ec4899',
    secondary: '#db2777',
    glow: 'rgba(236, 72, 153, 0.4)',
    soft: 'rgba(236, 72, 153, 0.1)',
  },
  purple: {
    primary: '#a855f7',
    secondary: '#9333ea',
    glow: 'rgba(168, 85, 247, 0.4)',
    soft: 'rgba(168, 85, 247, 0.1)',
  },
  blue: {
    primary: '#3b82f6',
    secondary: '#2563eb',
    glow: 'rgba(59, 130, 246, 0.4)',
    soft: 'rgba(59, 130, 246, 0.1)',
  },
  green: {
    primary: '#10b981',
    secondary: '#059669',
    glow: 'rgba(16, 185, 129, 0.4)',
    soft: 'rgba(16, 185, 129, 0.1)',
  },
  coral: {
    primary: '#f97316',
    secondary: '#ea580c',
    glow: 'rgba(249, 115, 22, 0.4)',
    soft: 'rgba(249, 115, 22, 0.1)',
  },
  orange: {
    primary: '#f59e0b',
    secondary: '#d97706',
    glow: 'rgba(245, 158, 11, 0.4)',
    soft: 'rgba(245, 158, 11, 0.1)',
  },
  teal: {
    primary: '#14b8a6',
    secondary: '#0d9488',
    glow: 'rgba(20, 184, 166, 0.4)',
    soft: 'rgba(20, 184, 166, 0.1)',
  },
  red: {
    primary: '#dc2626',
    secondary: '#b91c1c',
    glow: 'rgba(220, 38, 38, 0.4)',
    soft: 'rgba(220, 38, 38, 0.1)',
  },
  silver: {
    primary: '#9ca3af',
    secondary: '#6b7280',
    glow: 'rgba(156, 163, 175, 0.4)',
    soft: 'rgba(156, 163, 175, 0.1)',
  },
}

const STORAGE_KEY = 'trading-journal-theme'

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeColor>('gold')

  // Load theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeColor
    if (saved && themeColors[saved]) {
      setThemeState(saved)
      applyTheme(saved)
    }
  }, [])

  // Apply theme colors to CSS variables
  const applyTheme = useCallback((themeColor: ThemeColor) => {
    const colors = themeColors[themeColor]
    const root = document.documentElement
    
    root.style.setProperty('--gold-primary', colors.primary)
    root.style.setProperty('--gold-secondary', colors.secondary)
    root.style.setProperty('--gold-glow', colors.glow)
    root.style.setProperty('--gold-soft', colors.soft)
  }, [])

  // Set theme and save to localStorage
  const setTheme = useCallback((newTheme: ThemeColor) => {
    setThemeState(newTheme)
    applyTheme(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
  }, [applyTheme])

  return {
    theme,
    setTheme,
    themeColors,
    availableThemes: Object.keys(themeColors) as ThemeColor[],
  }
}

export { themeColors }
export type { ThemeConfig }
