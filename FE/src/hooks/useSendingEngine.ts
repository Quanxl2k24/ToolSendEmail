import { useState, useRef, useCallback, useEffect } from 'react';
import type { LogEntry } from '../types';
import { sendCampaign, cancelCampaign, syncCampaignToSheet, continueCampaign } from '../api/campaigns';
import { connectSocket, disconnectSocket, joinCampaign, onProgressUpdate } from '../api/socket';
import { ApiError, getToken } from '../api/client';
import { refreshTokenSilently } from '../api/auth';
export interface CampaignSendData {
  name: string;
  subject: string;
  htmlBody: string;
  file: File | null;
  googleSheetUrl: string;
  emailColumn?: string;
}

export function useSendingEngine() {
  const [progress, setProgress] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      disconnectSocket();
    };
  }, []);

  const resumeCampaign = useCallback(async (campaignId: string) => {
    setIsSending(true);
    setError(null);
    setProgress(0);
    setCampaignId(campaignId);
    setLogs([
      { id: Date.now(), text: `[${new Date().toLocaleTimeString()} INFO] Tiếp tục chiến dịch #${campaignId.slice(0, 8)}...`, type: 'info' },
    ]);

    try {
      const token = getToken();
      if (!token) throw new Error('Token xác thực không hợp lệ.');

      const result = await continueCampaign(campaignId);

      setTotalCount(prev => prev + result.newQueued);
      setLogs(prev => [...prev,
        { id: Date.now() + 1, text: `[${new Date().toLocaleTimeString()} INFO] Đã tìm thấy ${result.newQueued} email mới, ${result.alreadySent} email đã gửi trước đó.`, type: 'info' },
      ]);

      if (result.newQueued === 0) {
        setIsSending(false);
        return;
      }

      connectSocket(token);
      joinCampaign(campaignId);

      cleanupRef.current = onProgressUpdate((update) => {
        setSuccessCount(update.sent);
        setFailedCount(update.failed);
        if (update.total > 0) setTotalCount(update.total);
        setProgress(update.total > 0 ? Math.floor((update.sent / update.total) * 100) : 0);

        if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(update.status)) {
          setIsSending(false);
          const msg = update.status === 'COMPLETED'
            ? `[CONGRATS] Chiến dịch hoàn tất! ${update.sent} email gửi thành công.`
            : update.status === 'CANCELLED'
              ? `[CANCELLED] Chiến dịch đã bị hủy.`
              : `[FAILED] Chiến dịch thất bại. Đã gửi ${update.sent}/${update.total}.`;
          setLogs(prev => [...prev, { id: Date.now(), text: msg, type: update.status === 'COMPLETED' ? 'success' : 'failed' }]);
          syncToSheet(campaignId);
          cleanupRef.current?.();
          cleanupRef.current = null;
          disconnectSocket();
        }
      });
    } catch (err: unknown) {
      setIsSending(false);
      const msg = err instanceof ApiError ? err.message : 'Không thể tiếp tục chiến dịch.';
      setError(msg);
      setLogs(prev => [...prev, { id: Date.now(), text: `[ERROR] ${msg}`, type: 'failed' }]);
    }
  }, []);

  const startSending = useCallback(async (data: CampaignSendData) => {
    setIsSending(true);
    setError(null);
    setProgress(0);
    setLogs([
      { id: Date.now(), text: `[${new Date().toLocaleTimeString()} INFO] Đang khởi tạo chiến dịch...`, type: 'info' },
    ]);

    try {
      const token = getToken();
      if (!token) throw new Error('Token xác thực không hợp lệ. Vui lòng đăng nhập lại.');

      const result = await sendCampaign({
        name: data.name,
        subject: data.subject,
        htmlBody: data.htmlBody,
        file: data.file ?? undefined,
        googleSheetUrl: data.googleSheetUrl || undefined,
        emailColumn: data.emailColumn || undefined,
      });

      const cId = result.campaignId;
      setCampaignId(cId);
      setTotalCount(result.totalQueued);
      setLogs(prev => [...prev,
        { id: Date.now() + 1, text: `[${new Date().toLocaleTimeString()} INFO] Chiến dịch #${cId.slice(0, 8)} được tạo. Xếp hàng ${result.totalQueued} email, bỏ qua ${result.invalidSkipped} email lỗi.`, type: 'info' },
      ]);

      connectSocket(token);
      joinCampaign(cId);

      cleanupRef.current = onProgressUpdate((update) => {
        setSuccessCount(update.sent);
        setFailedCount(update.failed);
        if (update.total > 0) setTotalCount(update.total);
        setProgress(update.total > 0 ? Math.floor(((update.sent + update.failed) / update.total) * 100) : 0);

        if (update.status === 'COMPLETED' || update.status === 'FAILED') {
          setIsSending(false);
          const msg = update.status === 'COMPLETED'
            ? `[CONGRATS] Chiến dịch hoàn tất! ${update.sent} email gửi thành công.`
            : `[FAILED] Chiến dịch thất bại. Đã gửi ${update.sent}/${update.total}.`;
          setLogs(prev => [...prev, { id: Date.now(), text: msg, type: update.status === 'COMPLETED' ? 'success' : 'failed' }]);

          // Tự động đồng bộ trạng thái lên Google Sheet
          syncToSheet(cId);

          cleanupRef.current?.();
          cleanupRef.current = null;
          disconnectSocket();
        } else if (update.status === 'CANCELLED') {
          setIsSending(false);
          setLogs(prev => [...prev, { id: Date.now(), text: `[CANCELLED] Chiến dịch đã bị hủy.`, type: 'failed' }]);
          syncToSheet(cId);
          cleanupRef.current?.();
          cleanupRef.current = null;
          disconnectSocket();
        }
      });
    } catch (err: unknown) {
      setIsSending(false);
      const msg = err instanceof ApiError ? err.message : 'Không thể kết nối đến máy chủ. Vui lòng thử lại.';
      setError(msg);
      setLogs(prev => [...prev, { id: Date.now(), text: `[ERROR] ${msg}`, type: 'failed' }]);
    }
  }, []);

  const stopSending = useCallback(async () => {
    if (campaignId) {
      try {
        await cancelCampaign(campaignId);
        setLogs(prev => [...prev, { id: Date.now(), text: `[EMERGENCY] CHIẾN DỊCH ĐÃ BỊ DỪNG BỞI NGƯỜI DÙNG.`, type: 'failed' }]);
      } catch {
        setLogs(prev => [...prev, { id: Date.now(), text: `[WARN] Không thể dừng chiến dịch qua API.`, type: 'failed' }]);
      }
    }
    setIsSending(false);
    cleanupRef.current?.();
    cleanupRef.current = null;
    disconnectSocket();
  }, [campaignId]);

  const syncToSheet = useCallback(async (campaignId: string) => {
    try {
      let token = getToken();
      if (!token) return;

      try {
        await syncCampaignToSheet(campaignId);
      } catch {
        // Token hết hạn → refresh silent rồi thử lại
        await refreshTokenSilently();
        token = getToken();
        if (token) await syncCampaignToSheet(campaignId);
      }

      setLogs(prev => [...prev, { id: Date.now(), text: `[${new Date().toLocaleTimeString()} INFO] Đã đồng bộ trạng thái lên Google Sheet.`, type: 'info' }]);
    } catch {
      // Sync không thành công - user có thể sync thủ công sau
    }
  }, []);

  const resetSending = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    disconnectSocket();
    setProgress(0);
    setLogs([]);
    setSuccessCount(0);
    setFailedCount(0);
    setTotalCount(0);
    setCampaignId(null);
    setError(null);
  }, []);

  return {
    progress, isSending, logs, successCount, failedCount, totalCount, error, campaignId,
    startSending, stopSending, resetSending, resumeCampaign,
  } as const;
}
