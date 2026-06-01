import { Check } from 'lucide-react';
import { cn } from '../../lib/cn';

const STEPS = ['Thiết lập & Quota', 'Soạn Thảo Template', 'Xác Thực Dữ Liệu', 'Trực Quan Gửi'];

interface Props {
  current: number;
  hidden: boolean;
}

export function CampaignStepper({ current, hidden }: Props) {
  if (hidden) return null;
  return (
    <div className="flex items-center justify-center gap-4 mb-10 flex-wrap">
      {STEPS.map((label, i) => {
        const idx = i + 1;
        const isActive = current === idx;
        const isCompleted = current > idx;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold border transition-all duration-200',
                isActive && 'bg-midnight-ink text-white border-midnight-ink',
                isCompleted && 'bg-midnight-ink text-white border-midnight-ink',
                !isActive && !isCompleted && 'bg-white text-graphite border-fog',
              )}
            >
              {isCompleted ? <Check size={14} /> : idx}
            </div>
            <span
              className={cn(
                'text-sm font-medium text-graphite',
                isActive && 'text-midnight-ink font-semibold',
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="w-10 h-px bg-fog max-sm:hidden" />}
          </div>
        );
      })}
    </div>
  );
}
