import { useState, useCallback } from 'react';
import { GOOGLE_SHEET_PREFIX } from '../constants';
import { previewSheet, previewFile } from '../api/campaigns';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function detectEmailColumn(headers: string[], rows: Record<string, string>[]): string {
  const priority = ['email', 'e-mail', 'thư điện tử', 'mail', 'địa chỉ email'];
  for (const h of headers) {
    const lower = h.trim().toLowerCase();
    if (priority.includes(lower)) return h;
  }
  if (rows.length > 0) {
    for (const h of headers) {
      const sample = rows[0][h] ?? '';
      if (EMAIL_PATTERN.test(sample)) return h;
    }
  }
  return headers[0] ?? '';
}

export function useRecipients() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileUploaded, setFileUploaded] = useState(false);
  const [googleSheetLink, setGoogleSheetLink] = useState('');
  const [recipientCount, setRecipientCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetPreview, setSheetPreview] = useState<{
    headers: string[];
    rows: Record<string, string>[];
    total: number;
  } | null>(null);
  const [emailColumn, setEmailColumn] = useState('');

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setSheetPreview(null);
    setGoogleSheetLink('');
    setUploadedFile(file);
    setFileName(file.name);
    try {
      const result = await previewFile(file);
      setSheetPreview({ headers: result.headers, rows: result.rows, total: result.total });
      setFileUploaded(true);
      setRecipientCount(result.total);
      const detected = detectEmailColumn(result.headers, result.rows);
      setEmailColumn(detected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đọc file.');
      setFileUploaded(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConnectGoogleSheet = useCallback(async (url?: string) => {
    const sheetUrl = url ?? googleSheetLink;
    if (!sheetUrl.startsWith(GOOGLE_SHEET_PREFIX)) {
      setError('Vui lòng nhập link Google Sheet hợp lệ!');
      return;
    }
    setError(null);
    setLoading(true);
    setSheetPreview(null);
    setUploadedFile(null);
    try {
      const result = await previewSheet(sheetUrl);
      setSheetPreview({ headers: result.headers, rows: result.rows, total: result.total });
      setFileName('Google Sheet: ' + googleSheetLink);
      setFileUploaded(true);
      setRecipientCount(result.total);
      const detected = detectEmailColumn(result.headers, result.rows);
      setEmailColumn(detected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải Google Sheet.');
      setFileUploaded(false);
    } finally {
      setLoading(false);
    }
  }, [googleSheetLink]);

  const resetRecipients = useCallback(() => {
    setUploadedFile(null);
    setFileUploaded(false);
    setFileName('');
    setGoogleSheetLink('');
    setRecipientCount(0);
    setLoading(false);
    setError(null);
    setSheetPreview(null);
    setEmailColumn('');
  }, []);

  return {
    uploadedFile, fileName, fileUploaded, googleSheetLink, recipientCount, loading, error,
    sheetPreview, emailColumn,
    setGoogleSheetLink, handleFileUpload, handleConnectGoogleSheet, resetRecipients, setError, setEmailColumn,
  } as const;
}