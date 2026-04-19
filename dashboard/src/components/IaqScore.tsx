import { getIaqBand, IAQ_ACCURACY_LABEL } from '@/lib/aqi'
import { cn } from '@/lib/utils'
import { Skeleton } from './ui/skeleton'

interface Props {
  iaq: number | null
  accuracy: number
  loading: boolean
}

export function IaqScore({ iaq, accuracy, loading }: Props) {
  if (loading || iaq === null) {
    return <Skeleton className="h-56 w-full rounded-2xl" />
  }

  const band = getIaqBand(iaq)
  const pct = Math.min((iaq / 500) * 100, 100)

  return (
    <div className={cn('rounded-2xl p-6 text-white flex flex-col gap-3', band.color)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest opacity-80">Air Quality</p>
          <p className="text-7xl font-black leading-none mt-1">{Math.round(iaq)}</p>
        </div>
        <div className="text-right max-w-[220px]">
          <p className="text-2xl font-bold">{band.label}</p>
          <p className="text-sm opacity-80 mt-1 leading-snug">{band.description}</p>
        </div>
      </div>

      <div className="mt-2">
        <div className="h-2 rounded-full bg-white/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-white/90 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs opacity-70 mt-1">
          <span>0</span><span>100</span><span>200</span><span>300</span><span>500+</span>
        </div>
      </div>

      <p className="text-xs opacity-80">
        Sensor confidence: {IAQ_ACCURACY_LABEL[accuracy] ?? 'Unknown'}
      </p>
    </div>
  )
}
