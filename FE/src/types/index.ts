export interface User {
  email: string;
  name: string;
  picture?: string;
  accessToken: string;
}

export interface Recipient {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'valid' | 'error';
  errorMessage?: string;
}

export interface LogEntry {
  id: number;
  text: string;
  type: 'success' | 'failed' | 'info';
}

export interface CampaignState {
  step: number;
  name: string;
  subject: string;
  senderName: string;
  htmlBody: string;
}

export interface RecipientFilters {
  onlyErrors: boolean;
  searchQuery: string;
}

export interface SendingState {
  progress: number;
  isSending: boolean;
  logs: LogEntry[];
  successCount: number;
  failedCount: number;
}

// ─── BE API Types ──────────────────────────────────────────────────────────────

export type CampaignStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

export type MailLogStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'BOUNCED' | 'OPENED' | 'FAILED' | 'CANCELLED';

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: CampaignStatus;
  totalEmails: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

export interface CampaignDetail extends Campaign {
  htmlBody: string;
  createdBy: string;
  updatedAt: string;
  googleSheetUrl?: string | null;
  sheetName?: string | null;
  sheetId?: number | null;
}

export interface MailLog {
  id: string;
  campaignId: string;
  recipientEmail: string;
  recipientName: string | null;
  status: MailLogStatus;
  messageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SendCampaignResponse {
  success: boolean;
  campaignId: string;
  totalQueued: number;
  invalidSkipped: number;
}

export interface CampaignDetailResponse {
  success: boolean;
  data: CampaignDetail;
}

export interface CampaignListResponse {
  success: boolean;
  data: Campaign[];
}

export interface MailLogsResponse {
  success: boolean;
  total: number;
  data: MailLog[];
}

export interface ProgressUpdate {
  sent: number;
  failed: number;
  total: number;
  status: CampaignStatus;
}

export interface SheetPreviewResponse {
  success: boolean;
  headers: string[];
  rows: Record<string, string>[];
  total: number;
  sheetName?: string;
  sheetId?: number;
}

export interface QuotaResponse {
  success: boolean;
  data: {
    sentToday: number;
    dailyLimit: number;
    rateLimit: number;
  };
}
