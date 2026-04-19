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
  Good: 'bg-emerald-50 border-emerald-200',
  Moderate: 'bg-yellow-50 border-yellow-200',
  Sensitive: 'bg-orange-50 border-orange-200',
  Unhealthy: 'bg-red-50 border-red-200',
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100)
  const band = getPm25Band(value)
  return (
    <div className="h-2 rounded-full bg-white/60 overflow-hidden w-full">
      <div
        className={cn('h-full rounded-full transition-all duration-500', band.color)}
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
  const tone = band ? PM_CARD_TONES[band.label] ?? 'bg-slate-50 border-slate-200' : 'bg-slate-50 border-slate-200'

  return (
    <Card className={cn('border-2 shadow-sm', tone, obstructed && 'border-red-300 shadow-red-100')}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg uppercase tracking-[0.12em] text-slate-700">
              <Wind size={18} className="text-sky-500" />
              Particulate Matter
            </CardTitle>
            <p className="mt-2 text-sm text-slate-600">
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
              <div key={label} className="rounded-xl border border-white/70 bg-white/65 p-4 backdrop-blur-sm">
                <div className="flex justify-between items-baseline gap-3 mb-3">
                  <span className="text-sm font-semibold text-slate-700">{label}</span>
                  <span className="text-lg font-mono font-bold text-slate-900">
                    {value !== null ? `${value.toFixed(1)} µg/m³` : '—'}
                  </span>
                </div>
                {value !== null && <Bar value={value} max={label === 'PM10' ? 150 : 75} />}
              </div>
            ))}
          </div>
        )}

        {!loading && band && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-white/70 px-4 py-3 text-sm">
            <span className="font-medium text-slate-600">PM2.5 status</span>
            <span className={cn('font-semibold', band.color.replace('bg-', 'text-'))}>{band.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
