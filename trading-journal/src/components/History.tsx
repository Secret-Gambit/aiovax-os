import { useState } from 'react'
import type { Trade } from '../types/trade'
import { TrendingUp, TrendingDown, List, Trash2, X, Check, Copy, Edit } from 'lucide-react'

interface HistoryProps {
  allTimeTrades: Trade[]
  deleteTrade: (id: string) => void
  onDuplicateTrade?: (trade: Trade) => void
  onEditTrade?: (trade: Trade) => void
}

export function History({ allTimeTrades, deleteTrade, onDuplicateTrade, onEditTrade }: HistoryProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
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
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-5 space-y-2">
        {sortedTrades.map((trade) => (
          <div
            key={trade.id}
            className="phone-card p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    trade.direction === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}
                >
                  {trade.direction === 'buy' ? (
                    <TrendingUp size={16} style={{ color: 'var(--profit)' }} />
                  ) : (
                    <TrendingDown size={16} style={{ color: 'var(--loss)' }} />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">{trade.setup.join(', ') || 'Trade'}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(trade.timestamp)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-lg font-bold ${
                    trade.result === 'Win' ? 'status-profit' : trade.result === 'Loss' ? 'status-loss' : ''
                  }`}
                >
                  {trade.rMultiple > 0 ? '+' : ''}{trade.rMultiple.toFixed(1)}R
                </span>
                {/* Edit Button */}
                {onEditTrade && (
                  <button
                    onClick={() => onEditTrade(trade)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center tap-target touch-manipulation transition-all hover:bg-white/5"
                    style={{ color: 'var(--text-muted)' }}
                    title="Edit trade"
                  >
                    <Edit size={16} />
                  </button>
                )}
                {/* Duplicate Button */}
                {onDuplicateTrade && (
                  <button
                    onClick={() => onDuplicateTrade(trade)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center tap-target touch-manipulation transition-all hover:bg-white/5"
                    style={{ color: 'var(--text-muted)' }}
                    title="Duplicate trade"
                  >
                    <Copy size={16} />
                  </button>
                )}
                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(trade.id)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center tap-target touch-manipulation transition-all ${
                    deleteConfirm === trade.id ? 'bg-red-500/20' : 'hover:bg-white/5'
                  }`}
                  style={{ color: deleteConfirm === trade.id ? 'var(--loss)' : 'var(--text-muted)' }}
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
    </div>
  )
}
