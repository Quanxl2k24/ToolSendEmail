import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  highlight?: boolean;
  children: ReactNode;
}

export function Card({ highlight, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-fog rounded-2xl p-7',
        highlight && 'border-midnight-ink',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn('text-lg font-semibold text-midnight-ink mb-5 flex items-center gap-2', className)} {...rest}>
      {children}
    </h2>
  );
}

export function CardDesc({ className, children, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-graphite mb-5', className)} {...rest}>
      {children}
    </p>
  );
}
