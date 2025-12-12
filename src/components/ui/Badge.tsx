import { cn } from '@/utils/cn'

type Variant = 'default' | 'success' | 'warning' | 'destructive' | 'draft'

export default function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: Variant }) {
  const base = 'inline-flex items-center rounded-md px-2 py-1 text-xs'
  const map: Record<Variant, string> = {
    default: 'bg-border text-foreground',
    success: 'bg-green-600/60 text-white',
    warning: 'bg-amber-500/60 text-white',
    destructive: 'bg-red-600/60 text-white',
    draft: 'bg-slate-500/60 text-white',
  }
  return <span className={cn(base, map[variant])}>{children}</span>
}

