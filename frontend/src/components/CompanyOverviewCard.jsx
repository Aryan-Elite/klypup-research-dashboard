'use client'
import StockPriceChart from './StockPriceChart'
import { TrendingUp, TrendingDown } from 'lucide-react'

function fmt(num, decimals = 2) {
  if (num == null) return '—'
  return Number(num).toFixed(decimals)
}

function fmtMarketCap(val) {
  if (!val) return '—'
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`
  return `$${val}`
}

function fmtVolume(val) {
  if (!val) return '—'
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`
  if (val >= 1e3) return `${(val / 1e3).toFixed(0)}K`
  return `${val}`
}

export default function CompanyOverviewCard({ metric, historicalData }) {
  const isUp = (metric.changePercent ?? 0) >= 0
  const prices = historicalData?.prices ?? []

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-base font-semibold text-zinc-100">
            {metric.companyName || metric.symbol}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {metric.symbol} · {metric.source}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-zinc-100">${fmt(metric.price)}</p>
          <p className={`text-sm font-medium flex items-center justify-end gap-1 ${isUp ? 'text-green-500' : 'text-red-400'}`}>
            {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {isUp ? '+' : ''}{fmt(metric.changePercent)}%
            <span className="text-zinc-500 font-normal">
              ({isUp ? '+' : ''}${fmt(metric.change)})
            </span>
          </p>
        </div>
      </div>

      {/* Chart */}
      {prices.length > 0 && (
        <div className="my-4 -mx-1">
          <StockPriceChart prices={prices} />
        </div>
      )}

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-x-3 gap-y-4 pt-3 border-t border-zinc-800">
        {[
          { label: 'Market Cap', value: fmtMarketCap(metric.marketCap) },
          { label: 'P/E Ratio', value: fmt(metric.peRatio) },
          { label: 'EPS', value: metric.eps != null ? `$${fmt(metric.eps)}` : '—' },
          { label: 'Volume', value: fmtVolume(metric.volume) },
          { label: '52W Range', value: metric.range52Week || '—' },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</p>
            <p className="text-sm font-medium text-zinc-200 mt-0.5">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
