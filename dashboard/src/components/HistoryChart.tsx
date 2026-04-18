import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import type { Reading } from '@/types'
import { formatTime, formatDateTime } from '@/lib/utils'
import { getIaqBand } from '@/lib/aqi'
import { Skeleton } from './ui/skeleton'

interface BaseProps {
  data:    Reading[]
  loading: boolean
}

function ChartWrapper({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  if (loading) return <Skeleton className="h-64 w-full" />
  return <div className="h-64">{children}</div>
}

function tooltipStyle() {
  return {
    contentStyle: {
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  }
}

export function IaqHistoryChart({ data, loading }: BaseProps) {
  const latest = data[data.length - 1]
  const color = latest ? getIaqBand(latest.iaq).hex : '#10b981'

  return (
    <ChartWrapper loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="iaqGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="ts" tickFormatter={formatTime} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 500]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip labelFormatter={formatDateTime} formatter={(v: number) => [Math.round(v), 'IAQ']} {...tooltipStyle()} />
          <Area type="monotone" dataKey="iaq" stroke={color} strokeWidth={2} fill="url(#iaqGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

export function TempHumidityChart({ data, loading }: BaseProps) {
  return (
    <ChartWrapper loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="ts" tickFormatter={formatTime} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip labelFormatter={formatDateTime} {...tooltipStyle()} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="temperature" name="Temp (°C)"   stroke="#f97316" strokeWidth={2} fill="url(#tempGrad)" dot={false} />
          <Area type="monotone" dataKey="humidity"    name="Humidity (%)" stroke="#3b82f6" strokeWidth={2} fill="url(#humGrad)"  dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

export function PmHistoryChart({ data, loading }: BaseProps) {
  return (
    <ChartWrapper loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="pm25Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="pm10Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="pm1Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="ts" tickFormatter={formatTime} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit=" µg" />
          <Tooltip labelFormatter={formatDateTime} formatter={(v: number) => [`${v.toFixed(1)} µg/m³`]} {...tooltipStyle()} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="pm1"   name="PM1"   stroke="#f59e0b" strokeWidth={1.5} fill="url(#pm1Grad)"  dot={false} />
          <Area type="monotone" dataKey="pm2_5" name="PM2.5" stroke="#ef4444" strokeWidth={2}   fill="url(#pm25Grad)" dot={false} />
          <Area type="monotone" dataKey="pm10"  name="PM10"  stroke="#a855f7" strokeWidth={1.5} fill="url(#pm10Grad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}
