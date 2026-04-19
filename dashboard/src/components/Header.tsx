import { Wind, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Props {
  deviceId:    string
  lastUpdated: number | null
  online:      boolean
  refreshing:  boolean
  onRefresh:   () => void
}

export function Header({ deviceId, lastUpdated, online, refreshing, onRefresh }: Props) {
  return (
    <header className="bg-white border-b border-border sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Wind size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-none">Hackspace Air Quality Monitor</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{deviceId}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            {online
              ? <Wifi size={13} className="text-emerald-500" />
              : <WifiOff size={13} className="text-red-400" />}
            <span>{online ? 'Live' : 'Offline'}</span>
          </div>

          {lastUpdated && (
            <p className="hidden sm:block text-xs text-muted-foreground">
              Updated {formatDateTime(lastUpdated)}
            </p>
          )}

          <button
            onClick={onRefresh}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={cn('text-muted-foreground', refreshing && 'animate-spin')} />
          </button>
        </div>
      </div>
    </header>
  )
}
