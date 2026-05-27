import { useState, useCallback, useRef } from 'react'
import { TrendingUp, TrendingDown, Check, Mic, MicOff, Save, X, ChevronDown, FileText, Camera, Image as ImageIcon } from 'lucide-react'
import type { Trade, Direction, SetupType, EntryTrigger, MarketContext, Emotion, Result, TradeTemplate } from '../types/trade'
import { SETUP_OPTIONS, ENTRY_TRIGGERS, RESULTS, SNAP_POINTS } from '../types/trade'
import { EmotionIntensitySlider } from './visualizations'

interface QuickLoggerProps {
  onTradeLogged: () => void
  addTrade: (trade: Omit<Trade, 'id' | 'timestamp'>) => Trade
  initialTrade?: Trade | null
  templates?: TradeTemplate[]
  onSaveTemplate?: (template: Omit<TradeTemplate, 'id'>) => void
  onDeleteTemplate?: (id: string) => void
  editTrade?: (id: string, updates: Partial<Omit<Trade, 'id' | 'timestamp'>>) => void
  editingTrade?: Trade | null
}

export function QuickLogger({ 
  onTradeLogged, 
  addTrade, 
  initialTrade,
  templates = [],
  onSaveTemplate,
  onDeleteTemplate,
  editTrade,
  editingTrade
}: QuickLoggerProps) {
  const isEditing = !!editingTrade
  
  const [direction, setDirection] = useState<Direction | null>(editingTrade?.direction || initialTrade?.direction || null)
  const [setup, setSetup] = useState<SetupType[]>(editingTrade?.setup || initialTrade?.setup || [])
  const [entryTrigger, setEntryTrigger] = useState<EntryTrigger | null>(editingTrade?.entryTrigger || initialTrade?.entryTrigger || null)
  const [marketContext, setMarketContext] = useState<MarketContext | null>(editingTrade?.marketContext || initialTrade?.marketContext || null)
  const [entryTime, setEntryTime] = useState<string>(editingTrade?.entryTime || initialTrade?.entryTime || '')
  const [emotion, setEmotion] = useState<Emotion | null>(editingTrade?.emotion || initialTrade?.emotion || null)
  const [emotionIntensity, setEmotionIntensity] = useState(() => {
    const e = editingTrade?.emotion || initialTrade?.emotion
    if (e === 'Calm') return 0
    if (e === 'Confident') return 25
    if (e === 'Impatient') return 50
    if (e === 'Fearful') return 75
    if (e === 'Revenge Trading') return 100
    return 25
  })
  
  // Helper to convert intensity to emotion type
  const getEmotionFromIntensity = (intensity: number): Emotion => {
    if (intensity <= 12) return 'Calm'
    if (intensity <= 37) return 'Confident'
    if (intensity <= 62) return 'Impatient'
    if (intensity <= 87) return 'Fearful'
    return 'Revenge Trading'
  }
  
  const handleEmotionIntensityChange = (intensity: number) => {
    setEmotionIntensity(intensity)
    setEmotion(getEmotionFromIntensity(intensity))
  }
  const [result, setResult] = useState<Result | null>(editingTrade?.result || null)
  const [rMultiple, setRMultiple] = useState<number>(editingTrade?.rMultiple || 0)
  const [notes, setNotes] = useState<string>(editingTrade?.notes || (initialTrade?.setup ? `Copied from: ${initialTrade.setup.join(', ')}` : ''))
  const [image, setImage] = useState<string | null>(editingTrade?.image || null)
  
  // Template state
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')

  // Voice recognition state
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  const toggleSetup = useCallback((s: SetupType) => {
    setSetup(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }, [])

  const canSave = direction && entryTrigger && emotion && result

  const handleSave = () => {
    if (!canSave) return
    
    if (isEditing && editingTrade && editTrade) {
      // Update existing trade
      editTrade(editingTrade.id, {
        direction,
        setup,
        entryTrigger,
        marketContext: marketContext || 'Not Sure',
        emotion,
        result,
        rMultiple: result === 'Loss' ? -Math.abs(rMultiple) : rMultiple,
        notes: notes.trim() || undefined,
        image: image || undefined,
        entryTime: entryTime || undefined,
      })
    } else {
      // Add new trade
      addTrade({
        direction,
        setup,
        entryTrigger,
        marketContext: marketContext || 'Not Sure',
        emotion,
        result,
        rMultiple: result === 'Loss' ? -Math.abs(rMultiple) : rMultiple,
        notes: notes.trim() || undefined,
        image: image || undefined,
        entryTime: entryTime || undefined,
      })
    }
    onTradeLogged()
  }

  const handleReset = () => {
    setDirection(null)
    setSetup([])
    setEntryTrigger(null)
    setMarketContext(null)
    setEntryTime('')
    setEmotion(null)
    setResult(null)
    setRMultiple(0)
    setNotes('')
    setImage(null)
    stopListening()
  }

  // Image compression function
  const compressImage = (base64: string, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.src = base64
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        if (width > maxWidth) {
          height = (maxWidth / width) * height
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large. Max 5MB.')
      return
    }
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      if (base64) {
        const compressed = await compressImage(base64)
        setImage(compressed)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImage(null)
  }

  const applyTemplate = (template: TradeTemplate) => {
    setDirection(template.direction)
    setSetup(template.setup)
    setEntryTrigger(template.entryTrigger)
    setMarketContext(template.marketContext)
    setEmotion(template.emotion)
    setEntryTime(template.entryTime || '')
    setShowTemplates(false)
  }

  const handleSaveTemplate = () => {
    if (!templateName.trim() || !onSaveTemplate) return
    if (!direction || !entryTrigger || !emotion) return
    
    onSaveTemplate({
      name: templateName.trim(),
      direction,
      setup,
      entryTrigger,
      marketContext: marketContext || 'Not Sure',
      emotion,
      entryTime: entryTime || undefined,
    })
    setTemplateName('')
    setShowSaveTemplate(false)
  }

  const progress = [direction, setup.length > 0, entryTrigger, emotion, result].filter(Boolean).length
  const totalSteps = 5

  // Voice recognition functions
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setVoiceError('Voice recognition not supported. Try Chrome or Edge.')
      return
    }

    setVoiceError(null)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = 'en-US'

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = ''
      let interim = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interim += transcript
        }
      }

      if (finalTranscript) {
        setNotes(prev => {
          const newText = prev + (prev ? ' ' : '') + finalTranscript.trim()
          return newText
        })
      }
      setInterimTranscript(interim)
    }

    recognitionRef.current.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        setVoiceError('No speech detected. Try speaking louder.')
      } else if (event.error === 'audio-capture') {
        setVoiceError('Microphone not found. Check audio settings.')
      } else if (event.error === 'not-allowed') {
        setVoiceError('Mic permission denied. Allow access in browser.')
      } else {
        setVoiceError(`Error: ${event.error}`)
      }
      setIsListening(false)
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
      setInterimTranscript('')
    }

    recognitionRef.current.start()
    setIsListening(true)
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
    setInterimTranscript('')
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Templates */}
      <div className="flex-none px-5 py-3 flex items-center justify-between">
        <span className="font-semibold">{isEditing ? 'Edit Trade' : 'New Trade'}</span>
        <div className="flex items-center gap-2">
          {/* Template button */}
          {templates.length > 0 && (
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs tap-target"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            >
              <FileText size={14} />
              Templates
              <ChevronDown size={14} className={showTemplates ? 'rotate-180' : ''} />
            </button>
          )}
          <button onClick={handleReset} className="text-sm tap-target" style={{ color: 'var(--text-muted)' }}>
            Reset
          </button>
        </div>
      </div>

      {/* Template Selector Dropdown */}
      {showTemplates && templates.length > 0 && (
        <div className="flex-none px-5 pb-3">
          <div className="phone-card rounded-xl p-2 space-y-1 max-h-40 overflow-y-auto scrollbar-hide">
            {templates.map(template => (
              <div key={template.id} className="flex items-center gap-2">
                <button
                  onClick={() => applyTemplate(template)}
                  className="flex-1 text-left px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
                >
                  <span className="font-medium">{template.name}</span>
                  <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                    {template.direction} • {template.setup.join(', ')}
                  </span>
                </button>
                {onDeleteTemplate && (
                  <button
                    onClick={() => onDeleteTemplate(template.id)}
                    className="p-2 rounded-lg tap-target"
                    style={{ color: 'var(--text-muted)' }}
                    title="Delete template"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Template Button (when fields filled) */}
      {direction && entryTrigger && emotion && onSaveTemplate && (
        <div className="flex-none px-5 pb-2">
          {!showSaveTemplate ? (
            <button
              onClick={() => setShowSaveTemplate(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs tap-target gold-accent"
            >
              <Save size={14} />
              Save as Template
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name..."
                className="flex-1 px-3 py-2 rounded-lg text-sm bg-transparent border"
                style={{ borderColor: 'var(--border-soft)', color: 'var(--text-primary)' }}
                autoFocus
              />
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                className="px-3 py-2 rounded-lg tap-target gold-accent disabled:opacity-50"
                title="Save template"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => { setShowSaveTemplate(false); setTemplateName('') }}
                className="p-2 rounded-lg tap-target"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                title="Cancel"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="flex-none px-5 pb-2">
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i < progress ? 'var(--gold-primary)' : 'var(--bg-tertiary)' }} />
          ))}
        </div>
      </div>

      {/* Compact scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-2 space-y-3">
        {/* Direction - Compact */}
        <section>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>DIRECTION</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDirection('buy')}
              className={`py-3 rounded-xl font-semibold tap-target touch-manipulation transition-all flex items-center justify-center gap-2 ${
                direction === 'buy' ? 'win-solid scale-[1.02]' : 'phone-card select-inactive'
              }`}
            >
              <TrendingUp size={18} />
              <span>BUY</span>
            </button>
            <button
              onClick={() => setDirection('sell')}
              className={`py-3 rounded-xl font-semibold tap-target touch-manipulation transition-all flex items-center justify-center gap-2 ${
                direction === 'sell' ? 'loss-solid scale-[1.02]' : 'phone-card select-inactive'
              }`}
            >
              <TrendingDown size={18} />
              <span>SELL</span>
            </button>
          </div>
        </section>

        {/* Setup - Compact 2-column */}
        <section>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>SETUP</p>
          <div className="grid grid-cols-2 gap-2">
            {SETUP_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => toggleSetup(s)}
                className={`py-2.5 rounded-xl text-xs font-medium tap-target touch-manipulation transition-all ${
                  setup.includes(s) ? 'select-active' : 'phone-card select-inactive'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Entry Trigger - Wrap layout */}
        <section>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>ENTRY</p>
          <div className="flex flex-wrap gap-2">
            {ENTRY_TRIGGERS.map(t => (
              <button
                key={t}
                onClick={() => setEntryTrigger(t)}
                className={`px-3 py-2 rounded-xl text-xs font-medium tap-target touch-manipulation transition-all ${
                  entryTrigger === t ? 'select-active' : 'phone-card select-inactive'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Entry Time */}
        <section>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>ENTRY TIME (Optional)</p>
          <div className="phone-card rounded-xl p-3 flex items-center gap-3">
            <input
              type="time"
              value={entryTime}
              onChange={(e) => setEntryTime(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--text-primary)' }}
              title="Select entry time"
              aria-label="Trade entry time"
            />
            {entryTime && (
              <button
                onClick={() => setEntryTime('')}
                className="p-1 rounded-full hover:bg-white/10"
                style={{ color: 'var(--text-muted)' }}
                title="Clear time"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </section>

        {/* Emotion - Intensity Slider */}
        <section>
          <EmotionIntensitySlider 
            value={emotionIntensity}
            onChange={handleEmotionIntensityChange}
          />
        </section>

        {/* Result - Compact */}
        <section>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>RESULT</p>
          <div className="grid grid-cols-3 gap-2">
            {RESULTS.map(r => (
              <button
                key={r}
                onClick={() => setResult(r)}
                className={`py-3 rounded-xl font-semibold text-xs tap-target touch-manipulation transition-all ${
                  result === r
                    ? r === 'Win' ? 'win-solid scale-[1.02]' : r === 'Loss' ? 'loss-solid scale-[1.02]' : 'phone-card'
                    : 'phone-card select-inactive'
                }`}
              >
                {r === 'Win' && <TrendingUp size={14} className="inline mr-1" />}
                {r === 'Loss' && <TrendingDown size={14} className="inline mr-1" />}
                {r === 'Breakeven' && <span className="inline mr-1">-</span>}
                {r}
              </button>
            ))}
          </div>
        </section>

        {/* R-Multiple - Compact */}
        <section>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>R-MULTIPLE: {result === 'Loss' ? '-' : '+'}{Math.abs(rMultiple).toFixed(1)}R</p>
          <div className="phone-card p-3 rounded-xl">
            <input
              type="range"
              min="-3"
              max="10"
              step="0.5"
              value={rMultiple}
              onChange={(e) => setRMultiple(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer mb-2"
              style={{ background: 'var(--bg-tertiary)' }}
            />
            <div className="flex flex-wrap gap-1">
              {SNAP_POINTS.map(p => (
                <button
                  key={p}
                  onClick={() => setRMultiple(p)}
                  className={`px-2 py-1 rounded text-xs font-medium tap-target touch-manipulation transition-all ${
                    Math.abs(rMultiple - p) < 0.1 ? 'gold-accent' : 'select-inactive'
                  }`}
                >
                  {p >= 0 ? '+' : ''}{p}R
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Notes - Text + Voice Input */}
        <section>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>NOTES</p>
            <button
              onClick={toggleListening}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium tap-target touch-manipulation transition-all ${
                isListening 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                  : 'phone-card select-inactive'
              }`}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              {isListening ? 'Stop' : 'Speak'}
            </button>
          </div>
          <div className={`phone-card rounded-xl p-3 transition-all ${isListening ? 'ring-2 ring-red-500/30' : ''}`}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add trade details (type or tap Speak to dictate)..."
              className="w-full bg-transparent text-sm resize-none outline-none"
              style={{ color: 'var(--text-primary)', minHeight: '80px' }}
              rows={4}
            />
            
            {/* Voice Error */}
            {voiceError && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-red-400 text-xs">!</span>
                </div>
                <p className="text-xs text-red-400">{voiceError}</p>
              </div>
            )}
            
            {/* Listening State with Waveform */}
            {isListening && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-end gap-0.5 h-5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-1 bg-red-400 rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 100}%`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-red-400 font-medium">Listening...</p>
                </div>
                
                {/* Live Transcript Preview */}
                {interimTranscript && (
                  <p className="text-xs text-[var(--text-muted)] italic">
                    "{interimTranscript}"
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Image Upload - Drag & Drop */}
        <section>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>CHART SCREENSHOT</p>
            {image && (
              <button
                onClick={handleRemoveImage}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
          
          {image ? (
            <div className="phone-card rounded-xl p-3">
              <div className="relative group">
                <img 
                  src={image} 
                  alt="Trade chart" 
                  className="w-full h-48 object-contain rounded-lg bg-black/50"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <button
                    onClick={handleRemoveImage}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium tap-target"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
                Tap image to view, hover for options
              </p>
            </div>
          ) : (
            <label 
              className="phone-card rounded-xl p-6 flex flex-col items-center gap-3 tap-target touch-manipulation cursor-pointer hover:bg-white/5 transition-colors border-2 border-dashed border-[var(--border-soft)] hover:border-[var(--gold-primary)]/50"
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add('border-[var(--gold-primary)]', 'bg-[var(--gold-soft)]')
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('border-[var(--gold-primary)]', 'bg-[var(--gold-soft)]')
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('border-[var(--gold-primary)]', 'bg-[var(--gold-soft)]')
                const file = e.dataTransfer.files?.[0]
                if (file && file.type.startsWith('image/')) {
                  const reader = new FileReader()
                  reader.onload = async (event) => {
                    const base64 = event.target?.result as string
                    if (base64) {
                      const compressed = await compressImage(base64)
                      setImage(compressed)
                    }
                  }
                  reader.readAsDataURL(file)
                }
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                <Camera size={24} className="text-[var(--text-muted)]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  Tap to upload or drag & drop
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Supports: JPG, PNG, WebP (max 5MB)
                </p>
              </div>
            </label>
          )}
        </section>
      </div>

      {/* Save Button - Fixed at bottom */}
      <div className="flex-none px-5 py-3">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`w-full py-4 rounded-2xl font-bold text-base tap-target touch-manipulation transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
            canSave ? 'gold-accent' : 'phone-card select-inactive cursor-not-allowed'
          }`}
        >
          {canSave && <Check size={18} />}
          {canSave ? (isEditing ? 'UPDATE TRADE' : 'SAVE TRADE') : 'Fill Required Fields'}
        </button>
      </div>
    </div>
  )
}
