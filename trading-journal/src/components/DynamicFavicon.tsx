import { useEffect, useCallback } from 'react'
import { themeColors, type ThemeColor } from '../hooks/useTheme'

export function DynamicFavicon() {
  const updateFavicon = useCallback((theme: ThemeColor) => {
    const colors = themeColors[theme]
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="12" fill="url(#grad)"/>
        <text x="32" y="46" text-anchor="middle" font-size="36" font-weight="bold" fill="#000">A</text>
      </svg>
    `
    
    // Remove existing favicons
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]')
    existingFavicons.forEach(f => f.remove())
    
    // Create new favicon
    const link = document.createElement('link')
    link.type = 'image/svg+xml'
    link.rel = 'icon'
    link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`
    
    // Also add apple-touch-icon
    const appleLink = document.createElement('link')
    appleLink.rel = 'apple-touch-icon'
    appleLink.href = `data:image/svg+xml,${encodeURIComponent(svg)}`
    
    document.head.appendChild(link)
    document.head.appendChild(appleLink)
    
    // Update theme-color meta tag
    let themeMeta = document.querySelector('meta[name="theme-color"]')
    if (!themeMeta) {
      themeMeta = document.createElement('meta')
      themeMeta.setAttribute('name', 'theme-color')
      document.head.appendChild(themeMeta)
    }
    themeMeta.setAttribute('content', colors.primary)
  }, [])

  useEffect(() => {
    // Load saved theme
    const savedTheme = localStorage.getItem('trading-journal-theme') as ThemeColor
    if (savedTheme && themeColors[savedTheme]) {
      updateFavicon(savedTheme)
    } else {
      updateFavicon('gold')
    }

    // Listen for theme changes
    const handleThemeChange = () => {
      const theme = localStorage.getItem('trading-journal-theme') as ThemeColor
      if (theme && themeColors[theme]) {
        updateFavicon(theme)
      }
    }

    window.addEventListener('theme-changed', handleThemeChange)
    window.addEventListener('storage', (e) => {
      if (e.key === 'trading-journal-theme') {
        handleThemeChange()
      }
    })

    return () => {
      window.removeEventListener('theme-changed', handleThemeChange)
    }
  }, [updateFavicon])

  return null
}
