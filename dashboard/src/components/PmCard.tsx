import { AlertTriangle, Wind } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Skeleton } from './ui/skeleton'
import { getPm25Band } from '@/lib/aqi'
import { cn } from '@/lib/utils'

interface PmRow { label: string; value: number | null }

interface Props {
  pm1: number | null
  pm2_5: number | null
  pm10: number | null
  obstructed: boolean
  loading: boolean
}

const PM_CARD_TONES: Record<string, string> = {
  '0-10': 'bg-green-500 text-white border-green-600',
  '10-20': 'bg-green-500 text-white border-green-600',
  '20-50': 'bg-yellow-400 text-slate-900 border-yellow-500',
  '50-90': 'bg-orange-500 text-white border-orange-600',
  '91+': 'bg-red-500 text-white border-red-600',
}

function Bar({ value, max, lightCard }: { value: number; max: number; lightCard: boolean }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className={cn('h-2 rounded-full overflow-hidden w-full', lightCard ? 'bg-white/55' : 'bg-white/25')}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', lightCard ? 'bg-slate-900/80' : 'bg-white/90')}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function PmCard({ pm1, pm2_5, pm10, obstructed, loading }: Props) {
  const rows: PmRow[] = [
    { label: 'PM1', value: pm1 },
    { label: 'PM2.5', value: pm2_5 },
    { label: 'PM10', value: pm10 },
  ]
  const band = pm2_5 !== null ? getPm25Band(pm2_5) : null
  const tone = band ? PM_CARD_TONES[band.label] ?? 'bg-slate-100 text-slate-900 border-slate-200' : 'bg-slate-100 text-slate-900 border-slate-200'
  const isLight = band?.label === '20-50'
  const mutedText = isLight ? 'text-slate-700' : 'text-white/80'
  const panelBg = isLight ? 'bg-white/55 border-white/70' : 'bg-white/12 border-white/20'
  const statusBg = isLight ? 'bg-white/55' : 'bg-white/12'

  return (
    <Card className={cn('border-2 shadow-sm', tone, obstructed && 'border-red-700 shadow-red-200')}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg uppercase tracking-[0.12em]">
              <Wind size={18} className={isLight ? 'text-slate-800' : 'text-white'} />
              Particulate Matter
            </CardTitle>
            <p className={cn('mt-2 text-sm', mutedText)}>
              Fine dust is the primary workshop risk, so this card tracks the live particulate profile first.
            </p>
          </div>
          {obstructed && !loading && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700">
              <AlertTriangle size={12} />
              Obstructed
            </span>
          )}
        </div>
        {obstructed && !loading && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Airflow to the particulate sensor looks blocked. Readings may be artificially low until the inlet is clear.
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {rows.map(({ label, value }) => (
              <div key={label} className={cn('rounded-xl border p-4 backdrop-blur-sm', panelBg)}>
                <div className="flex justify-between items-baseline gap-3 mb-3">
                  <span className={cn('text-sm font-semibold', isLight ? 'text-slate-800' : 'text-white')}>
                    {label}
                  </span>
                  <span className={cn('text-lg font-mono font-bold', isLight ? 'text-slate-950' : 'text-white')}>
                    {value !== null ? `${value.toFixed(1)} µg/m³` : '—'}
                  </span>
                </div>
                {value !== null && <Bar value={value} max={label === 'PM10' ? 150 : 90} lightCard={isLight} />}
              </div>
            ))}
          </div>
        )}

        {!loading && band && (
          <div className={cn('mt-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm', statusBg)}>
            <span className={cn('font-medium', isLight ? 'text-slate-700' : 'text-white/85')}>PM2.5 band</span>
            <span className={cn('font-semibold', isLight ? 'text-slate-950' : 'text-white')}>{band.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
