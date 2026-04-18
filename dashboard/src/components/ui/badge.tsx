import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'muted'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        variant === 'default' && 'bg-primary text-primary-foreground',
        variant === 'outline' && 'border border-border text-foreground',
        variant === 'muted'   && 'bg-muted text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}
