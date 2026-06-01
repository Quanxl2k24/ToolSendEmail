import { useState, useMemo } from 'react';
import { Card, CardTitle } from '../ui';
import { Smartphone, Monitor, RotateCw } from 'lucide-react';
import { cn } from '../../lib/cn';

function replaceVariables(text: string, senderName: string): string {
  return text
    .replace(/\{\{Họ Tên\}\}/g, 'Nguyễn Văn A')
    .replace(/\{\{SĐT\}\}/g, '0912 345 678')
    .replace(/\{\{Tên Công Ty\}\}/g, 'Công ty ABC')
    .replace(/\{\{Sender\}\}/g, senderName)
    .replace(/\{\{Email\}\}/g, 'nguyenvana@company.com');
}

function buildEmailHTML(htmlBody: string, customCSS: string, subject: string, preheader: string, senderName: string): string {
  const body = replaceVariables(htmlBody, senderName);
  const css = replaceVariables(customCSS, senderName);
  const title = replaceVariables(subject, senderName);
  const preheaderHtml = preheader
    ? `<div style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${replaceVariables(preheader, senderName)}</div>`
    : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title><style>${css}</style><style>body{margin:0;padding:0;background-color:#f2f2f2}.email-container{max-width:600px;margin:0 auto}.email-client-bar{background:#e8e8e8;padding:6px 16px;font-size:11px;font-family:-apple-system,sans-serif;color:#666;display:flex;justify-content:space-between}</style></head><body>${preheaderHtml}<div class="email-client-bar"><span>Gmail</span><span>${title}</span></div><div class="email-container">${body}</div></body></html>`;
}

interface Props {
  senderName: string;
  subject: string;
  preheader: string;
  htmlBody: string;
  customCSS: string;
  userEmail: string;
}

export function GmailPreview({ senderName, subject, preheader, htmlBody, customCSS, userEmail }: Props) {
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop');
  const [iframeKey, setIframeKey] = useState(0);

  const fullHtml = useMemo(
    () => buildEmailHTML(htmlBody, customCSS, subject, preheader, senderName),
    [htmlBody, customCSS, subject, preheader, senderName],
  );

  const previewSubject = replaceVariables(subject, senderName);
  const previewSender = replaceVariables(senderName, senderName);

  return (
    <Card className="!sticky top-[100px]">
      <CardTitle><Monitor size={20} /> Xem Trước Email</CardTitle>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setView('desktop')}
          className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border border-fog cursor-pointer inline-flex items-center gap-1 transition-all duration-150', view === 'desktop' ? 'bg-midnight-ink text-white border-midnight-ink' : 'bg-white text-midnight-ink hover:bg-mist')}
        >
          <Monitor size={14} /> Desktop
        </button>
        <button
          onClick={() => setView('mobile')}
          className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border border-fog cursor-pointer inline-flex items-center gap-1 transition-all duration-150', view === 'mobile' ? 'bg-midnight-ink text-white border-midnight-ink' : 'bg-white text-midnight-ink hover:bg-mist')}
        >
          <Smartphone size={14} /> Mobile
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setIframeKey(k => k + 1)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold border border-fog bg-white text-midnight-ink cursor-pointer inline-flex items-center gap-1 hover:bg-mist"
        >
          <RotateCw size={12} /> Refresh
        </button>
      </div>

      <div className="bg-mist rounded-2xl border border-fog overflow-hidden">
        <div className="bg-white px-5 py-3 border-b border-fog">
          <div className="flex mb-1 text-sm">
            <span className="text-graphite w-20 shrink-0">Người gửi:</span>
            <span className="text-midnight-ink font-medium break-all">{previewSender} &lt;{userEmail}&gt;</span>
          </div>
          <div className="flex mb-1 text-sm">
            <span className="text-graphite w-20 shrink-0">Tiêu đề:</span>
            <span className="text-midnight-ink font-medium">{previewSubject}</span>
          </div>
          {preheader && (
            <div className="flex text-sm">
              <span className="text-graphite w-20 shrink-0">Preheader:</span>
              <span className="text-ash font-normal">{replaceVariables(preheader, senderName)}</span>
            </div>
          )}
        </div>

        <div className={cn('overflow-hidden transition-all duration-300', view === 'mobile' ? 'max-w-[375px] mx-auto border-x border-fog' : 'max-w-full')}>
          {htmlBody.trim() ? (
            <iframe
              key={iframeKey}
              title="Email Preview"
              srcDoc={fullHtml}
              className="w-full border-none block"
              style={{ height: view === 'mobile' ? '700px' : '600px' }}
            />
          ) : (
            <div className="py-16 px-5 text-center text-graphite text-sm">
              <p className="font-semibold mb-2">Chưa có nội dung</p>
              <p>Viết HTML trong tab "HTML" để xem trước email của bạn.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-graphite mt-3 px-3 py-2 bg-mist rounded-lg">
        <RotateCw size={12} />
        Các biến {'{{Họ Tên}}'}, {'{{SĐT}}'}, ... được thay thế bằng dữ liệu mẫu để xem trước.
      </div>
    </Card>
  );
}
