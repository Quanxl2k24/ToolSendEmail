import { Settings } from 'lucide-react';
import { Card, CardTitle, CardDesc } from '../ui';

const CENTER = 80;
const RADIUS = 70;
const CIRCUMFERENCE = 440;

interface Props {
  dailyLimit: number;
  sentToday: number;
  rateLimit: number;
}

export function QuotaDonut({ dailyLimit, sentToday, rateLimit }: Props) {
  const ratio = dailyLimit > 0 ? Math.min(sentToday / dailyLimit, 1) : 0;
  const offset = CIRCUMFERENCE * (1 - ratio);
  const isOverQuota = sentToday > dailyLimit;

  const strokeColorClass = isOverQuota ? 'stroke-amber-500' : 'stroke-midnight-ink';
  const textColorClass = isOverQuota ? 'text-amber-600' : 'text-midnight-ink';

  return (
    <Card>
      <CardTitle><Settings size={20} /> SMTP Daily Quota</CardTitle>
      <CardDesc>Hạn ngạch và tốc độ gửi mail trong ngày.</CardDesc>
      <div className="flex items-center justify-around gap-5 flex-wrap my-5">
        <div className="relative w-[160px] h-[160px] shrink-0">
          <svg viewBox="0 0 160 160" className="w-[160px] h-[160px]">
            <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" className="stroke-mist" strokeWidth="12" />
            {ratio > 0 && (
              <circle
                cx={CENTER} cy={CENTER} r={RADIUS} fill="none"
                className={strokeColorClass} strokeWidth="12"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
                style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-[28px] font-[652] ${textColorClass}`}>
                {isOverQuota ? '⚠' : `${Math.floor(ratio * 100)}%`}
              </div>
              <div className="text-[11px] text-graphite mt-0.5 uppercase font-semibold">Đã dùng</div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 flex-1 min-w-[200px]">
          <div className="flex justify-between pb-2 border-b border-mist text-sm">
            <span className="text-graphite">Giới hạn 24h:</span>
            <span className="font-semibold text-midnight-ink">{dailyLimit} email</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-mist text-sm">
            <span className="text-graphite">Đã gửi hôm nay:</span>
            <span className="font-semibold text-midnight-ink">{sentToday} email</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-mist text-sm">
            <span className="text-graphite">Có thể gửi thêm:</span>
            <span className={`font-semibold ${isOverQuota ? 'text-amber-600' : 'text-midnight-ink'}`}>
              {Math.max(0, dailyLimit - sentToday)} email
            </span>
          </div>
          <div className="flex justify-between pb-2 border-b border-mist text-sm">
            <span className="text-graphite">Tốc độ gửi:</span>
            <span className="font-semibold text-midnight-ink">{rateLimit} mail/sec</span>
          </div>
          {isOverQuota && (
            <div className="mt-1 text-xs text-amber-600 font-medium">
              Đã vượt hạn mức trong ngày. Email vẫn được gửi nhưng có thể bị chậm.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
