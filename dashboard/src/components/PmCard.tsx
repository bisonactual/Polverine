import { Wind } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Skeleton } from './ui/skeleton'
import { getPm25Band } from '@/lib/aqi'
import { cn } from '@/lib/utils'

interface PmRow { label: string; value: number | null; highlight?: boolean }

interface Props {
  pm1:   number | null
  pm2_5: number | null
  pm10:  number | null
  loading: boolean
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100)
  const band = getPm25Band(value)
  return (
    <div className="h-1.5 rounded-full bg-muted overflow-hidden w-full">
      <div
        className={cn('h-full rounded-full transition-all duration-500', band.color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function PmCard({ pm1, pm2_5, pm10, loading }: Props) {
  const rows: PmRow[] = [
    { label: 'PM1',   value: pm1,   highlight: false },
    { label: 'PM2.5', value: pm2_5, highlight: true  },
    { label: 'PM10',  value: pm10,  highlight: false },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wind size={14} className="text-sky-500" />
          Particulate Matter
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[0,1,2].map(i => <Skeleton key={i} className="h-6 w-full" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map(({ label, value, highlight }) => (
              <div key={label}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className={cn('text-sm', highlight ? 'font-semibold' : 'text-muted-foreground')}>
                    {label}
                  </span>
                  <span className={cn('text-sm font-mono', highlight ? 'font-bold text-foreground' : 'text-muted-foreground')}>
                    {value !== null ? `${value.toFixed(1)} µg/m³` : '—'}
                  </span>
                </div>
                {value !== null && <Bar value={value} max={label === 'PM10' ? 150 : 75} />}
              </div>
            ))}
            {pm2_5 !== null && (
              <p className={cn('text-xs mt-2 font-medium', getPm25Band(pm2_5).color.replace('bg-', 'text-'))}>
                PM2.5: {getPm25Band(pm2_5).label}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
