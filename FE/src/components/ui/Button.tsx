import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'muted';
  children: ReactNode;
}

const variants: Record<string, string> = {
  primary: 'bg-midnight-ink text-white border border-midnight-ink hover:shadow-[rgba(64,64,64,0.16)_0px_0px_0px_1px_inset] disabled:bg-silver disabled:border-silver disabled:cursor-not-allowed',
  secondary: 'bg-transparent text-midnight-ink border border-midnight-ink hover:bg-mist',
  ghost: 'bg-transparent text-graphite hover:text-midnight-ink hover:bg-mist border border-transparent',
  muted: 'bg-transparent text-ash border border-ash hover:text-graphite hover:border-graphite',
};

export function Button({ variant = 'primary', className, children, ...rest }: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-[600] cursor-pointer transition-all duration-200 outline-none shrink-0 whitespace-nowrap',
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
