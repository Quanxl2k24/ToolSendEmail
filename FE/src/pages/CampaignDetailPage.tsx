import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, AlertCircle, Mail, Inbox, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { Card, CardTitle, Button, TableContainer, Table, Th, Tr, Td } from '../components/ui';
import { getCampaign, getMailLogs, syncCampaignToSheet, updateUserToken } from '../api/campaigns';
import { refreshTokenSilently } from '../api/auth';
import { getToken } from '../api/client';
import type { CampaignDetail, MailLog, MailLogStatus } from '../types';

import { cn } from '../lib/cn';

interface Props {
  campaignId: string;
  onBack: () => void;
}

const statusLabel: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  PROCESSING: 'Đang gửi',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
  FAILED: 'Thất bại',
};

const logStatusStyle: Record<MailLogStatus, string> = {
  QUEUED: 'text-graphite font-[440]',
  SENT: 'font-[600] text-midnight-ink',
  DELIVERED: 'font-[600] text-midnight-ink',
  BOUNCED: 'font-[652] text-midnight-ink',
  OPENED: 'font-[600] text-midnight-ink',
  FAILED: 'font-[652] text-midnight-ink',
  CANCELLED: 'text-silver font-[440]',
};

const statusBadge: Record<string, string> = {
  PENDING: 'bg-mist text-graphite border-fog',
  PROCESSING: 'bg-midnight-ink text-white border-midnight-ink',
  COMPLETED: 'bg-white text-midnight-ink border-fog',
  CANCELLED: 'bg-white text-silver border-silver',
  FAILED: 'bg-mist text-midnight-ink border-fog',
};

function formatDate(d: string | null): string {
  if (!d) return '—';
  // simple visual date formatting
  return new Date(d).toLocaleDateString('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

export function CampaignDetailPage({ campaignId, onBack }: Props) {
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [logs, setLogs] = useState<MailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getCampaign(campaignId),
      getMailLogs(campaignId),
    ])
      .then(([campaignRes, logsRes]) => {
        if (cancelled) return;
        setCampaign(campaignRes.data);
        setLogs(logsRes.data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Không thể tải chi tiết chiến dịch.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [campaignId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-graphite">
        <Loader2 size={24} className="animate-spin mr-3" /> Đang tải...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-midnight-ink">
        <AlertCircle size={32} className="mb-3" />
        <p className="font-[600]">Lỗi</p>
        <p className="text-sm mt-1">{error}</p>
        <Button variant="ghost" className="mt-5" onClick={onBack}>Quay lại</Button>
      </div>
    );
  }

  const handleSyncSheet = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      await refreshTokenSilently();
      const freshToken = getToken();
      if (freshToken) {
        updateUserToken(freshToken).catch(() => {});
      }
      const result = await syncCampaignToSheet(campaignId);
      setSyncResult(`Đã đồng bộ ${result.updated} trạng thái lên Google Sheet.`);
    } catch {
      setSyncResult('Đồng bộ thất bại. Vui lòng thử lại.');
    } finally {
      setSyncing(false);
    }
  };

  if (!campaign) return null;

  return (
    <div className="max-w-[900px] mx-auto">
      <button
        className="flex items-center gap-2 text-xs font-[440] text-graphite hover:text-midnight-ink mb-6 transition-colors cursor-pointer bg-transparent border-none"
        onClick={onBack}
      >
        <ArrowLeft size={16} /> Quay lại Dashboard
      </button>

      <Card className="!p-8 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <CardTitle className="!mb-1 text-lg">
              <Mail size={20} /> {campaign.name}
            </CardTitle>
            <p className="text-xs text-graphite">{campaign.subject}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-semibold px-3 py-1 rounded-full border shrink-0 ${statusBadge[campaign.status] ?? 'bg-mist text-graphite border-fog'}`}>
              {statusLabel[campaign.status] ?? campaign.status}
            </span>
          </div>
        </div>

        {campaign.googleSheetUrl && (
          <div className="flex items-center justify-between bg-mist rounded-xl px-4 py-3 mb-6">
            <div className="flex items-center gap-2 text-xs text-graphite">
              <FileSpreadsheet size={16} />
              <span>Google Sheet: {campaign.sheetName}</span>
            </div>
            <Button
              variant="ghost"
              className="!text-xs !py-1"
              onClick={handleSyncSheet}
              disabled={syncing}
            >
              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Đang đồng bộ...' : 'Đồng bộ trạng thái'}
            </Button>
          </div>
        )}
        {syncResult && (
          <p className="text-xs text-center mb-4 text-midnight-ink font-[440]">{syncResult}</p>
        )}

        <div className="grid grid-cols-4 gap-6 mt-8 max-md:grid-cols-2 divide-x divide-fog border-t border-b border-fog py-8">
          {[
            { label: 'Tổng email', value: campaign.totalEmails },
            { label: 'Đã gửi', value: campaign.sentCount },
            { label: 'Thất bại', value: campaign.failedCount },
            { label: 'Ngày tạo', value: formatDate(campaign.createdAt) },
          ].map(({ label, value }, i) => (
            <div key={label} className={cn("text-center pr-2", i > 0 && "pl-6 max-md:pl-0 max-md:border-l-0")}>
              <div className="text-[28px] font-[652] tracking-tight leading-none text-midnight-ink truncate">{value}</div>
              <div className="text-[10px] font-[440] uppercase tracking-wider text-graphite mt-3">{label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!p-8">
        <CardTitle><Inbox size={20} /> Nhật ký gửi email ({logs.length})</CardTitle>

        {logs.length === 0 ? (
          <p className="text-sm text-graphite">Chưa có bản ghi nào.</p>
        ) : (
          <TableContainer className="!max-h-[500px]">
            <Table>
              <thead>
                <Tr>
                  <Th>Email</Th>
                  <Th>Tên</Th>
                  <Th>Trạng thái</Th>
                  <Th>Lỗi</Th>
                  <Th>Giờ gửi</Th>
                </Tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <Tr key={log.id}>
                    <Td className="font-medium">{log.recipientEmail}</Td>
                    <Td className="text-graphite">{log.recipientName ?? '—'}</Td>
                    <Td className={logStatusStyle[log.status]}>{log.status}</Td>
                    <Td className="text-midnight-ink max-w-[200px] truncate">{log.errorMessage ?? '—'}</Td>
                    <Td className="text-graphite text-xs">{formatDate(log.sentAt)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </div>
  );
}
