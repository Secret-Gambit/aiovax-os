import { useState, useEffect } from 'react'
import { Download, X, Smartphone, Monitor } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setIsInstalled(true)
      return
    }

    // Listen for beforeinstallprompt event (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show prompt after a short delay
      setTimeout(() => setIsVisible(true), 2000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS, show prompt if not installed (iOS doesn't support beforeinstallprompt)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    if (isIOS) {
      setTimeout(() => setIsVisible(true), 3000)
    }

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsVisible(false)
      setDeferredPrompt(null)
      localStorage.setItem('app-installed', 'true')
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    
    setDeferredPrompt(null)
    setIsVisible(false)
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  // Don't show if already installed or prompt not available
  if (isInstalled || !isVisible) return null

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-soft)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative p-6 text-center border-b border-[var(--border-soft)]">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center tap-target"
            title="Close"
          >
            <X size={16} className="text-[var(--text-muted)]" />
          </button>
          
          <div 
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--gold-primary), var(--gold-secondary))' }}
          >
            <span className="text-3xl font-bold text-black">A</span>
          </div>
          
          <h3 className="font-bold text-xl text-[var(--text-primary)] mb-2">
            Install AIOVAX
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Add to your {isIOS ? 'home screen' : 'device'} for quick access
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isIOS ? (
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-secondary)] text-center">
                Tap the share button below, then select<br/>
                <span className="font-semibold text-[var(--gold-primary)]">"Add to Home Screen"</span>
              </p>
              <div className="flex justify-center">
                <div className="px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-soft)]">
                  <div className="flex items-center gap-2">
                    <Smartphone size={20} className="text-[var(--gold-primary)]" />
                    <span className="text-sm text-[var(--text-muted)]">Share → Add to Home Screen</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-secondary)] text-center">
                Install as an app for the best experience:
              </p>
              <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]"></span>
                  Launch from home screen
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]"></span>
                  Full-screen experience
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]"></span>
                  Works offline
                </li>
              </ul>
            </div>
          )}

          {/* Install Button */}
          {!isIOS && (
            <button
              onClick={handleInstall}
              className="w-full py-3 rounded-xl gold-accent font-semibold tap-target flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Install App
            </button>
          )}

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            className="w-full py-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-muted)] font-medium tap-target"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  )
}
