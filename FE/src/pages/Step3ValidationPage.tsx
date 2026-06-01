import { FileSpreadsheet, FileText, CheckCircle, Info } from 'lucide-react';
import { Card, CardTitle } from '../components/ui';

interface Props {
  fileName: string;
  fileUploaded: boolean;
  googleSheetLink: string;
  recipientCount: number;
  campaignName: string;
  subject: string;
}

export function Step3ValidationPage(props: Props) {
  if (!props.fileUploaded) {
    return (
      <Card className="!p-8 text-center">
        <CardTitle>
          <Info size={22} />
          Chưa có dữ liệu
        </CardTitle>
        <p className="text-sm text-graphite mt-4">Vui lòng tải lên file dữ liệu hoặc kết nối Google Sheet ở bước 1.</p>
      </Card>
    );
  }

  return (
    <Card className="!p-8">
      <CardTitle>
        <CheckCircle size={22} />
        Xác nhận & Tổng quan Chiến dịch
      </CardTitle>
      <p className="text-sm text-graphite mb-8">
        Kiểm tra lại thông tin trước khi kích hoạt gửi. Dữ liệu sẽ được xác thực tự động khi gửi.
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
      </div>
    </Card>
  );
}
