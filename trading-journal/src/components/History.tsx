import { useState } from 'react'
import type { Trade } from '../types/trade'
import { TrendingUp, TrendingDown, List, Trash2, X, Check, Copy, Edit, Eye, Clock, Calendar, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'

interface HistoryProps {
  allTimeTrades: Trade[]
  deleteTrade: (id: string) => void
  onDuplicateTrade?: (trade: Trade) => void
  onEditTrade?: (trade: Trade) => void
}

export function History({ allTimeTrades, deleteTrade, onDuplicateTrade, onEditTrade }: HistoryProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null)
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)

  // Helper to get all images for a trade (both legacy single image and new images array)
  const getTradeImages = (trade: Trade): string[] => {
    const images: string[] = []
    if (trade.image) images.push(trade.image)
    if (trade.images) images.push(...trade.images)
    return images
  }
  const sortedTrades = [...allTimeTrades].sort((a, b) => b.timestamp - a.timestamp)

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFullDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteTrade(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
    }
  }

  if (sortedTrades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="phone-card rounded-3xl p-8 text-center">
          <div className="w-20 h-20 rounded-2xl gold-accent flex items-center justify-center mx-auto mb-6">
            <List size={32} />
          </div>
          <h2 className="text-xl font-bold mb-3">No Trades Yet</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Start logging trades to see your history
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-none px-5 py-3">
        <p className="text-xs font-semibold gold-text">TRADE HISTORY</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {sortedTrades.length} total trades
        </p>
      </div>

      {/* Trade List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-5 space-y-3">
        {sortedTrades.map((trade) => (
          <div
            key={trade.id}
            className="phone-card p-3 cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => setViewingTrade(trade)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    trade.direction === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}
                >
                  {trade.direction === 'buy' ? (
                    <TrendingUp size={18} style={{ color: 'var(--profit)' }} />
                  ) : (
                    <TrendingDown size={18} style={{ color: 'var(--loss)' }} />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    <span className="text-[var(--gold-primary)]">{trade.instrument || 'XAUUSD'}</span>
                    <span className="text-[var(--text-muted)] mx-1">•</span>
                    {trade.setup.join(', ') || 'Trade'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(trade.timestamp)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`text-xl font-bold mr-2 ${
                    trade.result === 'Win' ? 'status-profit' : trade.result === 'Loss' ? 'status-loss' : ''
                  }`}
                >
                  {trade.rMultiple > 0 ? '+' : ''}{trade.rMultiple.toFixed(1)}R
                </span>
                {/* Action buttons - stop propagation to prevent opening modal */}
                {onEditTrade && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEditTrade(trade); }}
                    className="w-10 h-10 rounded-lg flex items-center justify-center tap-target touch-manipulation transition-all hover:bg-white/10 active:scale-95 cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}
                    title="Edit"
                    aria-label="Edit trade"
                  >
                    <Edit size={16} />
                  </button>
                )}
                {/* Delete Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(trade.id); }}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center tap-target touch-manipulation transition-all active:scale-95 cursor-pointer ${
                    deleteConfirm === trade.id ? 'bg-red-500/20' : 'hover:bg-white/10'
                  }`}
                  style={{ color: deleteConfirm === trade.id ? 'var(--loss)' : 'var(--text-muted)' }}
                  title={deleteConfirm === trade.id ? 'Confirm delete' : 'Delete trade'}
                  aria-label={deleteConfirm === trade.id ? 'Confirm delete' : 'Delete trade'}
                >
                  {deleteConfirm === trade.id ? <Check size={16} /> : <Trash2 size={16} />}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className="px-2 py-1 rounded text-xs"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              >
                {trade.entryTrigger}
              </span>
              <span
                className="px-2 py-1 rounded text-xs"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              >
                {trade.emotion}
              </span>
              {trade.marketContext && trade.marketContext !== 'Not Sure' && (
                <span
                  className="px-2 py-1 rounded text-xs"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                >
                  {trade.marketContext}
                </span>
              )}
            </div>

            {/* Notes */}
            {trade.notes && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Notes:</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{trade.notes}</p>
              </div>
            )}

            {/* Chart Screenshot */}
            {trade.image && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Chart:</p>
                <img 
                  src={trade.image} 
                  alt="Trade chart" 
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm === trade.id && (
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                <p className="text-xs" style={{ color: 'var(--loss)' }}>Confirm delete?</p>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-3 py-1.5 rounded-lg text-xs tap-target"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                >
                  <X size={14} className="inline mr-1" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Trade Detail Modal */}
      {viewingTrade && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.8)' }}
          onClick={() => setViewingTrade(null)}
        >
          <div 
            className="phone-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 phone-card border-b border-white/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    viewingTrade.direction === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}
                >
                  {viewingTrade.direction === 'buy' ? (
                    <TrendingUp size={20} style={{ color: 'var(--profit)' }} />
                  ) : (
                    <TrendingDown size={20} style={{ color: 'var(--loss)' }} />
                  )}
                </div>
                <div>
                  <p className="font-bold text-lg">
                    <span className="text-[var(--gold-primary)]">{viewingTrade.instrument || 'XAUUSD'}</span>
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {viewingTrade.setup.join(', ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingTrade(null)}
                className="w-11 h-11 rounded-xl flex items-center justify-center tap-target touch-manipulation transition-all hover:bg-white/10 active:scale-95 cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
                title="Close"
                aria-label="Close trade details"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Result & R-Multiple */}
              <div className="flex items-center justify-between">
                <span 
                  className={`px-4 py-2 rounded-xl font-bold text-lg ${
                    viewingTrade.result === 'Win' 
                      ? 'bg-green-500/20 text-green-400' 
                      : viewingTrade.result === 'Loss'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {viewingTrade.result}
                </span>
                <span 
                  className={`text-3xl font-bold ${
                    viewingTrade.result === 'Win' ? 'text-[var(--profit)]' : 'text-[var(--loss)]'
                  }`}
                >
                  {viewingTrade.rMultiple > 0 ? '+' : ''}{viewingTrade.rMultiple.toFixed(2)}R
                </span>
              </div>

              {/* Trade Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--bg-tertiary)] rounded-xl p-3">
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Entry Trigger</p>
                  <p className="font-semibold text-sm">{viewingTrade.entryTrigger}</p>
                </div>
                <div className="bg-[var(--bg-tertiary)] rounded-xl p-3">
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Emotion</p>
                  <p className="font-semibold text-sm">{viewingTrade.emotion}</p>
                </div>
                {viewingTrade.marketContext && viewingTrade.marketContext !== 'Not Sure' && (
                  <div className="bg-[var(--bg-tertiary)] rounded-xl p-3">
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Market Context</p>
                    <p className="font-semibold text-sm">{viewingTrade.marketContext}</p>
                  </div>
                )}
                {viewingTrade.entryTime && (
                  <div className="bg-[var(--bg-tertiary)] rounded-xl p-3">
                    <p className="text-xs mb-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <Clock size={12} />
                      Entry Time
                    </p>
                    <p className="font-semibold text-sm">{viewingTrade.entryTime}</p>
                  </div>
                )}
              </div>

              {/* Date Logged */}
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <Calendar size={14} />
                <span>Logged: {formatFullDate(viewingTrade.timestamp)}</span>
              </div>

              {/* Notes */}
              {viewingTrade.notes && (
                <div className="bg-[var(--bg-tertiary)] rounded-xl p-4">
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Notes</p>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                    {viewingTrade.notes}
                  </p>
                </div>
              )}

              {/* Multiple Chart Screenshots - Clickable to expand */}
              {(() => {
                const images = getTradeImages(viewingTrade)
                if (images.length === 0) return null
                return (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                        Chart Screenshots ({images.length}) - Tap to expand
                      </p>
                    </div>
                    <div className={`grid gap-2 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentImageIndex(idx)
                            setViewingImage(img)
                          }}
                          className="relative w-full p-0 bg-transparent border-0 cursor-pointer group"
                          title={`View screenshot ${idx + 1}`}
                        >
                          <img 
                            src={img} 
                            alt={`Trade chart ${idx + 1}`} 
                            className="w-full rounded-xl hover:opacity-90 transition-opacity"
                            style={{ maxHeight: '200px', objectFit: 'cover' }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                            <ZoomIn size={24} className="text-white" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex gap-3">
                  {onEditTrade && (
                    <button
                      onClick={() => {
                        setViewingTrade(null)
                        onEditTrade(viewingTrade)
                      }}
                      className="flex-1 py-3 rounded-xl font-semibold tap-target transition-all gold-accent"
                    >
                      Edit Trade
                    </button>
                  )}
                  <button
                    onClick={() => setViewingTrade(null)}
                    className="flex-1 py-3 rounded-xl font-semibold tap-target transition-all phone-card"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Close
                  </button>
                </div>
                {/* Delete Button */}
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this trade?')) {
                      deleteTrade(viewingTrade.id)
                      setViewingTrade(null)
                    }
                  }}
                  className="w-full py-3 rounded-xl font-semibold tap-target transition-all flex items-center justify-center gap-2"
                  style={{ background: 'var(--loss-soft)', color: 'var(--loss)' }}
                >
                  <Trash2 size={18} />
                  Delete Trade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Image Viewer Modal */}
      {viewingImage && viewingTrade && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.95)' }}>
          <button
            onClick={() => setViewingImage(null)}
            className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center tap-target z-10"
            style={{ background: 'rgba(255,255,255,0.1)' }}
            aria-label="Close image viewer"
          >
            <X size={24} className="text-white" />
          </button>
          
          {/* Image Counter */}
          {(() => {
            const images = getTradeImages(viewingTrade)
            if (images.length > 1) {
              return (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium text-white" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  {currentImageIndex + 1} / {images.length}
                </div>
              )
            }
            return null
          })()}

          {/* Previous/Next Navigation */}
          {(() => {
            const images = getTradeImages(viewingTrade)
            if (images.length > 1) {
              return (
                <>
                  <button
                    onClick={() => {
                      const newIndex = currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1
                      setCurrentImageIndex(newIndex)
                      setViewingImage(images[newIndex])
                    }}
                    className="absolute left-4 w-12 h-12 rounded-full flex items-center justify-center tap-target"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={24} className="text-white" />
                  </button>
                  <button
                    onClick={() => {
                      const newIndex = currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1
                      setCurrentImageIndex(newIndex)
                      setViewingImage(images[newIndex])
                    }}
                    className="absolute right-4 w-12 h-12 rounded-full flex items-center justify-center tap-target"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                    aria-label="Next image"
                  >
                    <ChevronRight size={24} className="text-white" />
                  </button>
                </>
              )
            }
            return null
          })()}

          {/* Full Size Image */}
          <img
            src={viewingImage}
            alt="Full size trade chart"
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
            onClick={() => setViewingImage(null)}
          />
        </div>
      )}
    </div>
  )
}
