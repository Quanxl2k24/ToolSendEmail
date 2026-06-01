import type { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export function TableContainer({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('border border-fog rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto', className)} {...rest}>
      {children}
    </div>
  );
}

export function Table({ className, children, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <table className={cn('w-full border-collapse text-left text-sm', className)} {...rest}>
      {children}
    </table>
  );
}

export function Th({ className, children, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn('bg-mist px-4 py-3 font-semibold text-midnight-ink sticky top-0 z-2 border-b border-fog', className)} {...rest}>
      {children}
    </th>
  );
}

interface TrProps extends HTMLAttributes<HTMLTableRowElement> {
  status?: 'valid' | 'error';
}

export function Tr({ status, className, children, ...rest }: TrProps) {
  return (
    <tr
      className={cn(
        'border-b border-fog',
        status === 'valid' && 'hover:bg-mist',
        status === 'error' && 'bg-mist font-semibold',
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function Td({ className, children, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3 align-middle', className)} {...rest}>
      {children}
    </td>
  );
}
