import { useRef, useEffect } from 'react';
import { Terminal, Play, AlertOctagon, Check, RefreshCw, XCircle, BarChart3 } from 'lucide-react';
import { Card, CardTitle, Button } from '../ui';
import { cn } from '../../lib/cn';
import type { LogEntry } from '../../types';

interface Props {
  totalCount: number;
  successCount: number;
  failedCount: number;
  progress: number;
  isSending: boolean;
  logs: LogEntry[];
  error: string | null;
  campaignId: string | null;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onViewDetail: (id: string) => void;
}

export function CommandCenter({ totalCount, successCount, failedCount, progress, isSending, logs, error, campaignId, onStart, onStop, onReset, onViewDetail }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const done = campaignId !== null && !isSending;

  return (
    <div className="max-w-[800px] mx-auto pt-5">
      <Card className="!p-8 text-center mb-8">
        <CardTitle className="!justify-center !text-[22px]">
          <Terminal size={24} /> Trung Tâm Điều Khiển Phát Chiến Dịch
        </CardTitle>
        <p className="text-sm text-graphite mb-8">
          {isSending
            ? 'Hệ thống đang gửi email qua AWS SES. Theo dõi tiến trình thời gian thực bên dưới.'
            : done
              ? 'Chiến dịch đã kết thúc. Kiểm tra kết quả bên dưới.'
              : 'Sẵn sàng kích hoạt chiến dịch. AWS SES + BullMQ sẽ xử lý hàng đợi.'}
        </p>

        {error && (
          <div className="flex items-center gap-2 justify-center mb-6 p-4 border border-midnight-ink bg-mist rounded-xl text-midnight-ink font-semibold">
            <XCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6 max-w-[600px] mx-auto mb-8 max-sm:grid-cols-1 divide-x divide-fog border border-fog rounded-2xl py-6 bg-white">
          <div className="text-center">
            <div className="text-[36px] font-[652] tracking-tight leading-none text-midnight-ink">{totalCount > 0 ? totalCount : '--'}</div>
            <div className="text-[10px] font-[440] uppercase tracking-wider text-graphite mt-2">Tổng số email</div>
          </div>
          <div className="text-center">
            <div className="text-[36px] font-[652] tracking-tight leading-none text-midnight-ink">{successCount}</div>
            <div className="text-[10px] font-[440] uppercase tracking-wider text-graphite mt-2">Gửi thành công</div>
          </div>
          <div className="text-center">
            <div className="text-[36px] font-[652] tracking-tight leading-none text-midnight-ink">{failedCount}</div>
            <div className="text-[10px] font-[440] uppercase tracking-wider text-graphite mt-2">Gửi thất bại</div>
          </div>
        </div>

        {totalCount > 0 && (
          <div className="w-full h-6 bg-mist rounded-full overflow-hidden relative border border-fog mb-6">
            <div className="h-full bg-midnight-ink transition-all duration-[400ms] ease-out" style={{ width: `${progress}%` }} />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white mix-blend-difference">
              Tiến độ: {progress}% (Đã xử lý {successCount + failedCount} / {totalCount} email)
            </div>
          </div>
        )}
        {successCount + failedCount > 0 && (
          <div className="text-xs text-graphite mb-6">
            Tỉ lệ thành công: <strong className="text-midnight-ink">{Math.round((successCount / (successCount + failedCount)) * 100)}%</strong>
          </div>
        )}

        <div className="text-left mb-4 flex items-center gap-2 text-midnight-ink font-semibold text-sm">
          <Terminal size={16} />
          <span>Console Logs (Thời gian thực)</span>
        </div>

        <div className="bg-midnight-ink text-white rounded-2xl p-6 font-mono text-xs min-h-[260px] max-h-[360px] overflow-y-auto shadow-lg leading-relaxed mb-8 text-left">
          {logs.length === 0 ? (
            <div className="text-ash">Chờ chiến dịch bắt đầu gửi...</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className={cn('mb-1', log.type === 'success' && 'font-bold', log.type === 'failed' && 'font-bold', log.type === 'info' && 'opacity-80')}>
                {log.text}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex justify-center gap-5 items-center">
          {!isSending && !done ? (
            <Button variant="primary" onClick={onStart} className="!px-10 !py-4 !text-base">
              <Play size={18} fill="white" /> KÍCH HOẠT CHIẾN DỊCH
            </Button>
          ) : isSending ? (
            <Button variant="secondary" onClick={onStop} className="!px-10 !py-4 !text-base border border-midnight-ink">
              <AlertOctagon size={18} /> DỪNG CHIẾN DỊCH
            </Button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-midnight-ink font-bold text-lg justify-center">
                {failedCount > 0 && successCount === 0 ? (
                  <>
                    <XCircle size={24} />
                    <span>CHIẾN DỊCH THẤT BẠI!</span>
                  </>
                ) : failedCount > 0 ? (
                  <>
                    <AlertOctagon size={24} />
                    <span>CHIẾN DỊCH HOÀN TẤT CÓ LỖI!</span>
                  </>
                ) : (
                  <>
                    <Check size={24} strokeWidth={3} />
                    <span>CHIẾN DỊCH ĐÃ HOÀN TẤT!</span>
                  </>
                )}
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="primary" onClick={() => campaignId && onViewDetail(campaignId)} className="!px-6 !py-3">
                  <BarChart3 size={16} /> Xem kết quả chiến dịch
                </Button>
                <Button variant="ghost" onClick={onReset}>
                  <RefreshCw size={14} /> Gửi lại
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
