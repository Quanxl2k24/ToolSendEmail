import { useState, useEffect } from 'react';
import { QuotaDonut } from '../components/quota/QuotaDonut';
import { FileUploadZone } from '../components/upload/FileUploadZone';
import { QUOTA } from '../constants';
import { getQuota } from '../api/campaigns';

interface Props {
  fileUploaded: boolean;
  fileName: string;
  googleSheetLink: string;
  recipientCount: number;
  loading?: boolean;
  error?: string | null;
  emailColumn: string;
  sheetPreview?: { headers: string[]; rows: Record<string, string>[]; total: number } | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGoogleSheetLinkChange: (val: string) => void;
  onConnectGoogleSheet: () => void;
  onEmailColumnChange: (val: string) => void;
  campaignType: 'ONE_SHOT' | 'SCHEDULED';
  onCampaignTypeChange: (val: 'ONE_SHOT' | 'SCHEDULED') => void;
  startTime: string;
  endTime: string;
  onStartTimeChange: (val: string) => void;
  onEndTimeChange: (val: string) => void;
}

export function Step1SetupPage(props: Props) {
  const [sentToday, setSentToday] = useState(0);

  useEffect(() => {
    getQuota()
      .then((res) => setSentToday(res.data.sentToday))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!props.googleSheetLink && props.campaignType === 'SCHEDULED') {
      props.onCampaignTypeChange('ONE_SHOT');
    }
  }, [props.googleSheetLink]);

  const now = new Date();
  const minDateTime = now.toISOString().slice(0, 16);

  return (
    <div className="grid grid-cols-2 gap-8 items-start max-lg:grid-cols-1">
      <div className="flex flex-col gap-8">
        <QuotaDonut dailyLimit={QUOTA.DAILY_LIMIT} sentToday={sentToday} rateLimit={QUOTA.RATE_LIMIT} />

        {/* Campaign Type selector */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Loại chiến dịch</h3>
          <div className="flex gap-3">
            <button
              type="button"
              className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                props.campaignType === 'ONE_SHOT'
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
              }`}
              onClick={() => props.onCampaignTypeChange('ONE_SHOT')}
            >
              <div className="font-semibold">Gửi một lần</div>
              <div className="text-xs mt-1 opacity-70">Đọc sheet 1 lần, gửi hết rồi dừng</div>
            </button>
            <button
              type="button"
              disabled={!props.googleSheetLink}
              className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                !props.googleSheetLink
                  ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                  : props.campaignType === 'SCHEDULED'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
              }`}
              onClick={() => props.onCampaignTypeChange('SCHEDULED')}
              title={!props.googleSheetLink ? 'Cần kết nối Google Sheet trước' : ''}
            >
              <div className="font-semibold">Dài ngày</div>
              <div className="text-xs mt-1 opacity-70">Quét sheet định kỳ 5 phút, gửi mail cho người mới</div>
            </button>
          </div>

          {props.campaignType === 'SCHEDULED' && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Thời gian bắt đầu</label>
                <input
                  type="datetime-local"
                  value={props.startTime}
                  onChange={(e) => props.onStartTimeChange(e.target.value)}
                  min={minDateTime}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Thời gian kết thúc</label>
                <input
                  type="datetime-local"
                  value={props.endTime}
                  onChange={(e) => props.onEndTimeChange(e.target.value)}
                  min={props.startTime || minDateTime}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <FileUploadZone
        fileUploaded={props.fileUploaded}
        fileName={props.fileName}
        googleSheetLink={props.googleSheetLink}
        recipientCount={props.recipientCount}
        loading={props.loading}
        error={props.error}
        emailColumn={props.emailColumn}
        sheetPreview={props.sheetPreview}
        onFileUpload={props.onFileUpload}
        onGoogleSheetLinkChange={props.onGoogleSheetLinkChange}
        onConnectGoogleSheet={props.onConnectGoogleSheet}
        onEmailColumnChange={props.onEmailColumnChange}
      />
    </div>
  );
}
