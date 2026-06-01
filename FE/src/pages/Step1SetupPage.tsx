import { QuotaDonut } from '../components/quota/QuotaDonut';
import { FileUploadZone } from '../components/upload/FileUploadZone';
import { QUOTA } from '../constants';

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
}

export function Step1SetupPage(props: Props) {
  return (
    <div className="grid grid-cols-2 gap-8 items-start max-lg:grid-cols-1">
      <QuotaDonut dailyLimit={QUOTA.DAILY_LIMIT} sentToday={480} rateLimit={QUOTA.RATE_LIMIT} />
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
