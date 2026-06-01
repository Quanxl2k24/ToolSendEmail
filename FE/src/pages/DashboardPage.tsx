import { useEffect, useState } from "react";
import { Plus, Loader2, AlertCircle, Inbox, Search } from "lucide-react";
import { Card, Button } from "../components/ui";
import { listCampaigns } from "../api/campaigns";
import type { Campaign, CampaignStatus } from "../types";
import { cn } from "../lib/cn";

interface Props {
  onNewCampaign: () => void;
  onViewDetail: (id: string) => void;
}

const statusLabel: Record<CampaignStatus, string> = {
  PENDING: "Chờ xử lý",
  PROCESSING: "Đang gửi",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
  FAILED: "Thất bại",
};

const statusBadge: Record<CampaignStatus, string> = {
  PENDING: "bg-mist text-graphite border-fog",
  PROCESSING: "bg-midnight-ink text-white border-midnight-ink",
  COMPLETED: "bg-white text-midnight-ink border-fog",
  CANCELLED: "bg-white text-silver border-silver",
  FAILED: "bg-mist text-midnight-ink border-fog",
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

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(searchText.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchText.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Upper Title Block */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-[652] tracking-tight text-midnight-ink">
            Dashboard Chiến dịch
          </h1>
          <p className="text-xs text-graphite mt-1">
            Quản lý và theo dõi hiệu suất các chiến dịch email marketing.
          </p>
        </div>
        {/* <Button variant="primary" onClick={onNewCampaign}>
          <Plus size={16} /> Tạo chiến dịch mới
        </Button> */}
      </div>

      {/* Mobbin Section Stat Display */}
      <div className="grid grid-cols-4 gap-6 mb-12 max-md:grid-cols-2 divide-x divide-fog border-b border-fog pb-10">
        {[
          { label: "Tổng chiến dịch", value: total },
          { label: "Đang chạy", value: active },
          { label: "Hoàn tất", value: completed },
          { label: "Thất bại / Hủy", value: failed },
        ].map(({ label, value }, i) => (
          <div
            key={label}
            className={cn(
              "text-center",
              i > 0 && "pl-6 max-md:pl-0 max-md:border-l-0",
            )}
          >
            <div className="text-[56px] font-[652] tracking-[-0.021em] leading-none text-midnight-ink">
              {value}
            </div>
            <div className="text-[11px] font-[440] uppercase tracking-[0.07em] text-graphite mt-3">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "PENDING", label: "Chờ xử lý" },
            { id: "PROCESSING", label: "Đang gửi" },
            { id: "COMPLETED", label: "Hoàn tất" },
            { id: "FAILED", label: "Thất bại" },
            { id: "CANCELLED", label: "Đã hủy" },
          ].map((tab) => {
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

        <div className="relative w-[280px] max-sm:w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-ash pointer-events-none">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Tìm kiếm theo tên, tiêu đề..."
            className="w-full pl-9 pr-4 py-2 bg-mist border border-transparent rounded-full text-xs outline-none transition-all duration-200 focus:bg-white focus:border-midnight-ink text-midnight-ink placeholder-ash"
          />
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <Card className="flex items-center justify-center py-24 text-graphite">
          <Loader2 size={24} className="animate-spin mr-3" /> Đang tải danh
          sách...
        </Card>
      ) : error ? (
        <Card className="flex flex-col items-center justify-center py-20 text-midnight-ink">
          <AlertCircle size={32} className="mb-3 text-midnight-ink" />
          <p className="font-[600] text-sm">Lỗi tải dữ liệu</p>
          <p className="text-xs text-graphite mt-1">{error}</p>
        </Card>
      ) : campaigns.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-mist flex items-center justify-center mb-4 text-graphite">
            <Inbox size={28} className="opacity-80" />
          </div>
          <p className="font-[600] text-sm text-midnight-ink">
            Chưa có chiến dịch nào
          </p>
          <p className="text-xs text-graphite mt-1 max-w-[320px] leading-relaxed">
            Hệ thống trống. Hãy tạo chiến dịch email đầu tiên để bắt đầu gửi
            email tiếp thị qua AWS SES.
          </p>
          <Button variant="primary" className="mt-6" onClick={onNewCampaign}>
            <Plus size={16} /> Tạo chiến dịch mới
          </Button>
        </Card>
      ) : filteredCampaigns.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox size={32} className="mb-3 text-ash" />
          <p className="font-[600] text-sm text-midnight-ink">
            Không có kết quả khớp
          </p>
          <p className="text-xs text-graphite mt-1">
            Thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.
          </p>
        </Card>
      ) : (
        <div className="border border-fog rounded-2xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-fog bg-mist">
                  <th className="px-6 py-4 font-[600] uppercase tracking-wider text-graphite">
                    Chiến dịch
                  </th>
                  <th className="px-6 py-4 font-[600] uppercase tracking-wider text-graphite w-[140px]">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 font-[600] uppercase tracking-wider text-graphite w-[200px]">
                    Tiến trình gửi
                  </th>
                  <th className="px-6 py-4 font-[600] uppercase tracking-wider text-graphite w-[160px]">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-4 font-[600] uppercase tracking-wider text-graphite text-right w-[140px]">
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
                      className="hover:bg-mist transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col pr-4 min-w-0">
                          <span
                            className="font-[456] text-midnight-ink text-sm group-hover:underline cursor-pointer truncate"
                            onClick={() => onViewDetail(c.id)}
                          >
                            {c.name}
                          </span>
                          <span className="text-xs text-graphite mt-0.5 truncate max-w-[280px]">
                            {c.subject}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center text-[10px] font-[600] px-2 py-0.5 rounded-full border ${statusBadge[c.status]}`}
                        >
                          {statusLabel[c.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex justify-between text-[10px] text-graphite mb-1">
                            <span className="font-semibold">
                              {progressPercent}%
                            </span>
                            <span>
                              {c.sentCount + c.failedCount} / {total}
                            </span>
                          </div>
                          <div className="w-full h-1 bg-fog rounded-full overflow-hidden">
                            <div
                              className="h-full bg-midnight-ink transition-all duration-300"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <div className="flex gap-2 mt-1 text-[9px] text-ash font-medium">
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
                            {c.sentCount + c.failedCount > 0 && (
                              <span>
                                Tỉ lệ:{" "}
                                <strong className="text-green-700 font-semibold">
                                  {Math.round(
                                    (c.sentCount /
                                      (c.sentCount + c.failedCount)) *
                                      100,
                                  )}
                                  %
                                </strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-graphite whitespace-nowrap">
                        {date}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onViewDetail(c.id)}
                          className="px-3.5 py-1.5 rounded-full text-[11px] font-[440] border border-midnight-ink bg-transparent text-midnight-ink hover:bg-midnight-ink hover:text-white cursor-pointer transition-all duration-200"
                        >
                          Xem báo cáo
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
