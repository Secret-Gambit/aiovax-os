import { useState, useEffect, useCallback } from 'react'
import type { TradeTemplate } from '../types/trade'

const TEMPLATES_KEY = 'xauusd-templates'

export const useTemplates = () => {
  const [templates, setTemplates] = useState<TradeTemplate[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load templates from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(TEMPLATES_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setTemplates(parsed)
      } catch (e) {
        console.error('Failed to parse templates:', e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save templates to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
    }
  }, [templates, isLoaded])

  const addTemplate = useCallback((template: Omit<TradeTemplate, 'id'>) => {
    const newTemplate: TradeTemplate = {
      ...template,
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
    setTemplates(prev => [newTemplate, ...prev])
    return newTemplate
  }, [])

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id))
  }, [])

  const updateTemplate = useCallback((id: string, updates: Partial<Omit<TradeTemplate, 'id'>>) => {
    setTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ))
  }, [])

  return {
    templates,
    isLoaded,
    addTemplate,
    deleteTemplate,
    updateTemplate,
  }
}
