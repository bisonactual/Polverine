import { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Skeleton } from './ui/skeleton'
import { cn } from '@/lib/utils'

interface Props {
  title:   string
  value:   number | null
  unit:    string
  icon:    LucideIcon
  loading: boolean
  color?:  string
  sub?:    string
}

export function MetricCard({ title, value, unit, icon: Icon, loading, color = 'text-primary', sub }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon size={14} className={color} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading || value === null ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <p className={cn('text-3xl font-bold tracking-tight', color)}>
              {value.toFixed(1)}
              <span className="text-base font-normal text-muted-foreground ml-1">{unit}</span>
            </p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}
