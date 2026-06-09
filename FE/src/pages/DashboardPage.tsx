import { useEffect, useState } from "react";
import { Plus, Loader2, AlertCircle, Inbox, Search } from "lucide-react";
import { Button } from "../components/ui";
import { listCampaigns } from "../api/campaigns";
import type { Campaign, CampaignStatus } from "../types";
import { cn } from "../lib/cn";

interface Props {
  onNewCampaign: () => void;
  onViewDetail: (id: string, status?: CampaignStatus) => void;
}

const statusLabel: Record<CampaignStatus, string> = {
  PENDING: "Chờ xử lý",
  PROCESSING: "Đang gửi",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
  FAILED: "Thất bại",
};

const statusBadge: Record<CampaignStatus, string> = {
  PENDING: "bg-transparent text-graphite border-graphite",
  PROCESSING: "bg-midnight-ink text-white border-midnight-ink",
  COMPLETED: "bg-transparent text-midnight-ink border-midnight-ink",
  CANCELLED: "bg-transparent text-ash border-ash",
  FAILED: "bg-transparent text-midnight-ink border-midnight-ink",
};

type StatusFilter = "ALL" | CampaignStatus;

export function DashboardPage({ onNewCampaign, onViewDetail }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    let cancelled = false;
    listCampaigns()
      .then((res) => {
        if (!cancelled) setCampaigns(res.data);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải danh sách chiến dịch.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = campaigns.length;
  const active = campaigns.filter(
    (c) => c.status === "PROCESSING" || c.status === "PENDING",
  ).length;
  const completed = campaigns.filter((c) => c.status === "COMPLETED").length;
  const failed = campaigns.filter(
    (c) => c.status === "FAILED" || c.status === "CANCELLED",
  ).length;
  const scheduled = campaigns.filter((c) => c.type === "SCHEDULED").length;

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(searchText.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchText.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-5 mb-10 max-md:grid-cols-2">
        {[
          { label: "Tổng chiến dịch", value: total },
          { label: "Đang chạy / Chờ", value: active },
          { label: "Dài ngày", value: scheduled },
          { label: "Hoàn tất", value: completed },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white border border-fog rounded-2xl p-6"
          >
            <div className="text-[40px] font-[652] leading-none text-midnight-ink">
              {value}
            </div>
            <div className="text-[14px] font-[440] text-graphite mt-3">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(
            [
              { id: "ALL", label: "Tất cả" },
              { id: "PENDING", label: "Chờ xử lý" },
              { id: "PROCESSING", label: "Đang gửi" },
              { id: "COMPLETED", label: "Hoàn tất" },
              { id: "FAILED", label: "Thất bại" },
              { id: "CANCELLED", label: "Đã hủy" },
            ] as const
          ).map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as StatusFilter)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-[440] cursor-pointer transition-all duration-200 whitespace-nowrap outline-none border",
                  isActive
                    ? "bg-midnight-ink text-white border-midnight-ink"
                    : "bg-transparent text-midnight-ink border-fog hover:bg-mist",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNewCampaign}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-[600] bg-midnight-ink text-white border border-midnight-ink cursor-pointer transition-all duration-200 hover:shadow-[rgba(64,64,64,0.16)_0px_0px_0px_1px_inset]"
          >
            <Plus size={14} /> Chiến dịch mới
          </button>

          <div className="relative w-[220px]">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-ash pointer-events-none">
              <Search size={14} />
            </span>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full pl-9 pr-4 py-2 bg-mist border border-transparent rounded-full text-xs outline-none transition-all duration-200 focus:bg-white focus:border-midnight-ink text-midnight-ink placeholder-ash"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-graphite bg-white border border-fog rounded-2xl">
          <Loader2 size={24} className="animate-spin mr-3" /> Đang tải danh
          sách...
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-midnight-ink bg-white border border-fog rounded-2xl">
          <AlertCircle size={32} className="mb-3 text-midnight-ink" />
          <p className="font-[600] text-sm">Lỗi tải dữ liệu</p>
          <p className="text-xs text-graphite mt-1">{error}</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-fog rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-mist flex items-center justify-center mb-4 text-graphite">
            <Inbox size={28} className="opacity-80" />
          </div>
          <p className="font-[600] text-sm text-midnight-ink">
            Chưa có chiến dịch nào
          </p>
          <p className="text-xs text-graphite mt-1 max-w-[320px] leading-relaxed">
            Hãy tạo chiến dịch email đầu tiên để bắt đầu gửi email qua AWS SES.
          </p>
          <Button variant="primary" className="mt-6" onClick={onNewCampaign}>
            <Plus size={16} /> Tạo chiến dịch mới
          </Button>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-fog rounded-2xl">
          <Inbox size={32} className="mb-3 text-ash" />
          <p className="font-[600] text-sm text-midnight-ink">
            Không có kết quả khớp
          </p>
          <p className="text-xs text-graphite mt-1">
            Thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-fog rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-fog">
                  <th className="px-6 py-4 font-[400] text-[12px] uppercase tracking-wider text-ash">
                    Chiến dịch
                  </th>
                  <th className="px-6 py-4 font-[400] text-[12px] uppercase tracking-wider text-ash w-[130px]">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 font-[400] text-[12px] uppercase tracking-wider text-ash w-[220px]">
                    Tiến trình
                  </th>
                  <th className="px-6 py-4 font-[400] text-[12px] uppercase tracking-wider text-ash w-[150px]">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-4 font-[400] text-[12px] text-left uppercase tracking-wider text-ash w-[160px]">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fog">
                {filteredCampaigns.map((c) => {
                  const date = new Date(c.createdAt).toLocaleDateString(
                    "vi-VN",
                    {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  );
                  const total = c.totalEmails;
                  const progressPercent =
                    total > 0
                      ? Math.round(
                          ((c.sentCount + c.failedCount) / total) * 100,
                        )
                      : 0;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-mist transition-colors group cursor-pointer"
                      onClick={() => onViewDetail(c.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col pr-4 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-[440] text-sm text-midnight-ink truncate">
                              {c.name}
                            </span>
                            {c.type === 'SCHEDULED' && (
                              <span className="text-[10px] font-[500] px-2 py-0.5 rounded-full bg-mist text-graphite border border-fog shrink-0">
                                Dài ngày
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-graphite mt-0.5 truncate max-w-[280px]">
                            {c.subject}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center text-[11px] font-[440] px-3 py-0.5 rounded-full border",
                            statusBadge[c.status],
                          )}
                        >
                          {statusLabel[c.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-[11px] text-graphite font-[440]">
                            <span>{progressPercent}%</span>
                            <span>
                              {c.sentCount + c.failedCount} / {total}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-fog rounded-full overflow-hidden">
                            <div
                              className="h-full bg-midnight-ink transition-all duration-300 rounded-full"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <div className="flex gap-3 text-[10px] text-ash font-[440]">
                            <span>
                              Thành công:{" "}
                              <strong className="text-graphite font-semibold">
                                {c.sentCount}
                              </strong>
                            </span>
                            <span>
                              Lỗi:{" "}
                              <strong className="text-graphite font-semibold">
                                {c.failedCount}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-graphite font-[440] whitespace-nowrap">
                        {date}
                      </td>
                      <td className="px-6 py-4 text-left">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetail(c.id, c.status);
                          }}
                          className="px-3.5 py-1.5 rounded-full text-[11px] font-[500] border border-midnight-ink bg-transparent text-midnight-ink hover:bg-midnight-ink hover:text-white cursor-pointer transition-all duration-200"
                        >
                          {c.status === "PROCESSING" ? "Xem chi tiết" : "Xem báo cáo"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
