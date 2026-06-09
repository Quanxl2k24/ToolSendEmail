import { FileSpreadsheet, FileText, CheckCircle, Info } from 'lucide-react';

interface Props {
  fileName: string;
  fileUploaded: boolean;
  googleSheetLink: string;
  recipientCount: number;
  campaignName: string;
  subject: string;
  campaignType: 'ONE_SHOT' | 'SCHEDULED';
  startTime?: string;
  endTime?: string;
}

export function Step3ValidationPage(props: Props) {
  if (!props.fileUploaded) {
    return (
      <div className="bg-white border border-fog rounded-2xl p-6 text-center">
        <h2 className="text-lg font-[600] text-midnight-ink flex items-center justify-center gap-2 mb-4">
          <Info size={22} />
          Chưa có dữ liệu
        </h2>
        <p className="text-sm text-graphite">Vui lòng tải lên file dữ liệu hoặc kết nối Google Sheet ở bước 1.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-fog rounded-2xl p-6">
      <h2 className="text-lg font-[600] text-midnight-ink flex items-center gap-2 mb-1">
        <CheckCircle size={22} />
        Xác nhận & Tổng quan Chiến dịch
      </h2>
      <p className="text-sm text-graphite mb-8">
        Kiểm tra lại thông tin trước khi kích hoạt gửi.
      </p>

      <div className="grid gap-4 max-w-[600px] w-full">
        <div className="flex items-center gap-4 p-5 border border-fog rounded-xl bg-mist min-w-0">
          <FileText size={24} className="text-midnight-ink shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm">Tệp dữ liệu</div>
            <div className="text-sm text-graphite truncate" title={props.fileName}>{props.fileName || '—'}</div>
          </div>
        </div>

        {props.googleSheetLink && (
          <div className="flex items-center gap-4 p-5 border border-fog rounded-xl bg-mist min-w-0">
            <FileSpreadsheet size={24} className="text-midnight-ink shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm">Google Sheet</div>
              <div className="text-sm text-graphite truncate" title={props.googleSheetLink}>
                {props.googleSheetLink}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 p-5 border border-fog rounded-xl bg-mist min-w-0">
          <Info size={24} className="text-midnight-ink shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm">Số lượng liên hệ ước tính</div>
            <div className="text-sm text-graphite truncate">
              {props.recipientCount > 0 ? `${props.recipientCount.toLocaleString()} liên hệ` : 'Chờ hệ thống xử lý...'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 border border-fog rounded-xl bg-mist min-w-0">
          <FileText size={24} className="text-midnight-ink shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm">Chiến dịch</div>
            <div className="text-sm text-graphite truncate" title={props.campaignName}>{props.campaignName}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 border border-fog rounded-xl bg-mist min-w-0">
          <FileText size={24} className="text-midnight-ink shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm">Tiêu đề email</div>
            <div className="text-sm text-graphite truncate" title={props.subject}>{props.subject}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 border border-fog rounded-xl bg-mist min-w-0">
          <Info size={24} className="text-midnight-ink shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm">Loại chiến dịch</div>
            <div className="text-sm text-graphite truncate">
              {props.campaignType === 'SCHEDULED' ? (
                <>Dài ngày — Quét sheet mỗi 5 phút</>
              ) : (
                <>Gửi một lần — Gửi hết rồi dừng</>
              )}
            </div>
          </div>
        </div>

        {props.campaignType === 'SCHEDULED' && (
          <>
            <div className="flex items-center gap-4 p-5 border border-fog rounded-xl bg-mist min-w-0">
              <Info size={24} className="text-midnight-ink shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm">Thời gian bắt đầu</div>
                <div className="text-sm text-graphite truncate">
                  {props.startTime ? new Date(props.startTime).toLocaleString('vi-VN') : '—'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 border border-fog rounded-xl bg-mist min-w-0">
              <Info size={24} className="text-midnight-ink shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm">Thời gian kết thúc</div>
                <div className="text-sm text-graphite truncate">
                  {props.endTime ? new Date(props.endTime).toLocaleString('vi-VN') : '—'}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
