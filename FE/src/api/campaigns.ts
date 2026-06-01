import { api } from './client';
import type {
  CampaignListResponse,
  CampaignDetailResponse,
  SendCampaignResponse,
  MailLogsResponse,
  SheetPreviewResponse,
} from '../types';

export interface SendCampaignPayload {
  name: string;
  subject: string;
  htmlBody: string;
  file?: File;
  googleSheetUrl?: string;
  emailColumn?: string;
}

export async function sendCampaign(payload: SendCampaignPayload) {
  const fd = new FormData();
  fd.append('name', payload.name);
  fd.append('subject', payload.subject);
  fd.append('htmlBody', payload.htmlBody);

  if (payload.file) {
    fd.append('file', payload.file);
  }

  if (payload.googleSheetUrl) {
    fd.append('googleSheetUrl', payload.googleSheetUrl);
  }

  if (payload.emailColumn) {
    fd.append('emailColumn', payload.emailColumn);
  }

  return api.postForm<SendCampaignResponse>('/campaigns/send', fd);
}

export async function listCampaigns() {
  return api.get<CampaignListResponse>('/campaigns');
}

export async function getCampaign(id: string) {
  return api.get<CampaignDetailResponse>(`/campaigns/${id}`);
}
export async function cancelCampaign(id: string) {
  return api.post<{ success: boolean; campaignId: string; status: string }>(
    `/campaigns/${id}/cancel`,
  );
}

export async function getMailLogs(id: string) {
  return api.get<MailLogsResponse>(`/campaigns/${id}/logs`);
}

export async function previewSheet(googleSheetUrl: string) {
  return api.post<SheetPreviewResponse>('/campaigns/preview-sheet', { googleSheetUrl });
}

export async function previewFile(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  return api.postForm<SheetPreviewResponse>('/campaigns/preview-file', fd);
}

export async function updateUserToken(accessToken: string, refreshToken?: string, expiresIn?: number) {
  return api.post<{ success: boolean }>('/auth/update-token', { accessToken, refreshToken, expiresIn });
}

export async function syncCampaignToSheet(campaignId: string) {
  return api.post<{ success: boolean; updated: number }>(`/campaigns/${campaignId}/sync-sheet`);
}

export async function continueCampaign(campaignId: string) {
  return api.post<{ success: boolean; campaignId: string; newQueued: number; alreadySent: number }>(
    `/campaigns/${campaignId}/continue`,
  );
}
