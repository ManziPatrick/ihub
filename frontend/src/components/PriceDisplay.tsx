import { useCurrency } from '@/hooks/useCurrency';
import { Loader2 } from 'lucide-react';

interface PriceDisplayProps {
  /** Course price in RWF */
  price: number;
  /** Optional discount price in RWF */
  discountPrice?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show as row layout (current + original side by side) instead of stacked */
  row?: boolean;
  /** Custom class */
  className?: string;
}

export function PriceDisplay({
  price,
  discountPrice,
  size = 'md',
  row = false,
  className = '',
}: PriceDisplayProps) {
  const { formatPrice, isLoading } = useCurrency();

  const discounted = discountPrice && discountPrice > 0;

  const sizeClasses = {
    sm: { current: 'text-sm font-bold', original: 'text-[10px]' },
    md: { current: 'text-base font-bold', original: 'text-[10px]' },
    lg: { current: 'text-3xl font-bold', original: 'text-sm' },
  };

  const s = sizeClasses[size];

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading price...</span>
      </div>
    );
  }

  if (price === 0 && !discounted) {
    return <span className={s.current}>Scholarship</span>;
  }

  if (discounted) {
    if (row) {
      return (
        <div className={`flex items-baseline gap-2 ${className}`}>
          <span className={`${s.current} text-accent`}>{formatPrice(discountPrice!)}</span>
          <span className={`${s.original} text-muted-foreground line-through`}>{formatPrice(price)}</span>
        </div>
      );
    }
    return (
      <div className={`flex flex-col ${className}`}>
        <span className={`${s.current} text-accent`}>{formatPrice(discountPrice!)}</span>
        <span className={`${s.original} text-muted-foreground line-through`}>{formatPrice(price)}</span>
      </div>
    );
  }

  return (
    <span className={`${s.current} text-accent ${className}`}>
      {formatPrice(price)}
    </span>
  );
}
