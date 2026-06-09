import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Mail,
  Inbox,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "../components/ui";
import {
  getCampaign,
  getMailLogs,
  syncCampaignToSheet,
} from "../api/campaigns";
import { refreshJwt } from "../api/auth";
import type { CampaignDetail, MailLog, MailLogStatus } from "../types";
import { cn } from "../lib/cn";

interface Props {
  campaignId: string;
  onBack: () => void;
}

const statusLabel: Record<string, string> = {
  PENDING: "Chờ xử lý",
  PROCESSING: "Đang gửi",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
  FAILED: "Thất bại",
};

const logStatusStyle: Record<MailLogStatus, string> = {
  QUEUED: "text-graphite font-[440]",
  SENT: "font-[600] text-midnight-ink",
  DELIVERED: "font-[600] text-midnight-ink",
  BOUNCED: "font-[652] text-midnight-ink",
  OPENED: "font-[600] text-midnight-ink",
  FAILED: "font-[652] text-midnight-ink",
  CANCELLED: "text-silver font-[440]",
};

const statusBadge: Record<string, string> = {
  PENDING: "bg-transparent text-graphite border-graphite",
  PROCESSING: "bg-midnight-ink text-white border-midnight-ink",
  COMPLETED: "bg-transparent text-midnight-ink border-midnight-ink",
  CANCELLED: "bg-transparent text-ash border-ash",
  FAILED: "bg-transparent text-midnight-ink border-midnight-ink",
};

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
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
    Promise.all([getCampaign(campaignId), getMailLogs(campaignId)])
      .then(([campaignRes, logsRes]) => {
        if (cancelled) return;
        setCampaign(campaignRes.data);
        setLogs(logsRes.data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải chi tiết chiến dịch.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
        <Button variant="ghost" className="mt-5" onClick={onBack}>
          Quay lại
        </Button>
      </div>
    );
  }

  const handleSyncSheet = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      await refreshJwt();
      const result = await syncCampaignToSheet(campaignId);
      setSyncResult(
        `Đã đồng bộ ${result.updated} trạng thái lên Google Sheet.`,
      );
    } catch {
      setSyncResult("Đồng bộ thất bại. Vui lòng thử lại.");
    } finally {
      setSyncing(false);
    }
  };

  if (!campaign) return null;

  return (
    <div className="max-w-[1200px] mx-auto">
      <button
        className="flex items-center gap-2 text-xs font-[440] text-graphite hover:text-midnight-ink mb-6 transition-colors cursor-pointer bg-transparent border-none"
        onClick={onBack}
      >
        <ArrowLeft size={16} /> Quay lại Dashboard
      </button>

      <div className="bg-white border border-fog rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-[600] text-midnight-ink flex items-center gap-2 mb-1">
              <Mail size={20} /> {campaign.name}
            </h2>
            <p className="text-xs text-graphite">{campaign.subject}</p>
          </div>
          <span
            className={cn(
              "text-[11px] font-[440] px-3 py-1 rounded-full border shrink-0",
              statusBadge[campaign.status] ??
                "bg-transparent text-graphite border-fog",
            )}
          >
            {statusLabel[campaign.status] ?? campaign.status}
          </span>
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
              <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Đang đồng bộ..." : "Đồng bộ trạng thái"}
            </Button>
          </div>
        )}
        {syncResult && (
          <p className="text-xs text-center mb-4 text-midnight-ink font-[440]">
            {syncResult}
          </p>
        )}

        <div className="grid grid-cols-3 gap-6 mt-8 max-md:grid-cols-2">
          {[
            { label: "Loại", value: campaign.type === 'SCHEDULED' ? 'Dài ngày' : 'Gửi một lần' },
            { label: "Đã gửi", value: campaign.sentCount },
            { label: "Thất bại", value: campaign.failedCount },
            { label: "Ngày tạo", value: formatDate(campaign.createdAt) },
            ...(campaign.type === 'SCHEDULED' && campaign.startTime
              ? [{ label: "Bắt đầu", value: formatDate(campaign.startTime) }]
              : []),
            ...(campaign.type === 'SCHEDULED' && campaign.endTime
              ? [{ label: "Kết thúc", value: formatDate(campaign.endTime) }]
              : []),
            ...(campaign.type === 'SCHEDULED' && campaign.lastScannedAt
              ? [{ label: "Quét lần cuối", value: formatDate(campaign.lastScannedAt) }]
              : []),
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-white border border-fog rounded-2xl p-5"
            >
              <div className="text-[28px] font-[652] tracking-tight leading-none text-midnight-ink truncate">
                {value}
              </div>
              <div className="text-[12px] font-[440] text-graphite mt-2">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-fog rounded-2xl p-6">
        <h2 className="text-sm font-[600] text-midnight-ink flex items-center gap-2 mb-5">
          <Inbox size={18} /> Nhật ký gửi email ({logs.length})
        </h2>

        {logs.length === 0 ? (
          <p className="text-sm text-graphite">Chưa có bản ghi nào.</p>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-fog">
                  <th className="px-6 py-4 font-[400] text-[12px] uppercase tracking-wider text-ash sticky top-0 z-2 bg-white">
                    Email
                  </th>
                  <th className="px-6 py-4 font-[400] text-[12px] uppercase tracking-wider text-ash sticky top-0 z-2 bg-white">
                    Tên
                  </th>
                  <th className="px-6 py-4 font-[400] text-[12px] uppercase tracking-wider text-ash sticky top-0 z-2 bg-white">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 font-[400] text-[12px] uppercase tracking-wider text-ash sticky top-0 z-2 bg-white">
                    Lỗi
                  </th>
                  <th className="px-6 py-4 font-[400] text-[12px] uppercase tracking-wider text-ash sticky top-0 z-2 bg-white">
                    Giờ gửi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fog">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-mist transition-colors">
                    <td className="px-6 py-4 text-sm font-[440] text-midnight-ink">
                      {log.recipientEmail}
                    </td>
                    <td className="px-6 py-4 text-sm text-graphite font-[440]">
                      {log.recipientName ?? "—"}
                    </td>
                    <td
                      className={cn(
                        "px-6 py-4 text-sm",
                        logStatusStyle[log.status],
                      )}
                    >
                      {log.status}
                    </td>
                    <td className="px-6 py-4 text-sm text-midnight-ink font-[440] max-w-[200px] truncate">
                      {log.errorMessage ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-graphite font-[440]">
                      {formatDate(log.sentAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
