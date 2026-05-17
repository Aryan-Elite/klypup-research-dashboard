'use client'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, defs, linearGradient, stop
} from 'recharts'

function formatPrice(val) {
  return `$${Number(val).toFixed(2)}`
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function StockPriceChart({ prices = [] }) {
  if (!prices.length) return null

  const min = Math.min(...prices.map(p => p.price))
  const max = Math.max(...prices.map(p => p.price))
  const padding = (max - min) * 0.1

  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={prices} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 10, fill: '#71717a' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[min - padding, max + padding]}
          tickFormatter={formatPrice}
          tick={{ fontSize: 10, fill: '#71717a' }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#a1a1aa' }}
          itemStyle={{ color: '#22c55e' }}
          labelFormatter={formatDate}
          formatter={(val) => [formatPrice(val), 'Price']}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke="#22c55e"
          strokeWidth={1.5}
          fill="url(#priceGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#22c55e' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
