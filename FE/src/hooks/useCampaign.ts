import { useState, useCallback } from 'react';

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .wrapper { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { text-align: center; padding: 30px 0; background: #f8f8f8; }
    .header h1 { margin: 0; font-size: 24px; color: #222; }
    .content { padding: 30px 0; }
    .cta { display: inline-block; padding: 12px 28px; background: #141414; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #999; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>Xin chào {{Họ Tên}}!</h1></div>
    <div class="content">
      <p>Cảm ơn bạn đã quan tâm đến dịch vụ của chúng tôi.</p>
      <p style="text-align:center;margin:30px 0"><a class="cta" href="#">Khám Phá Ngay</a></p>
      <p>Trân trọng,<br>{{Sender}}</p>
    </div>
    <div class="footer">
      <p>{{Tên Công Ty}}</p>
      <p>Email này được gửi tự động, vui lòng không trả lời.</p>
    </div>
  </div>
</body>
</html>`;

export function useCampaign() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('Chiến dịch Email mới');
  const [subject, setSubject] = useState('Chào {{Họ Tên}}, ưu đãi dành riêng cho bạn!');
  const [preheader, setPreheader] = useState('Xem ưu đãi đặc biệt từ chúng tôi');
  const [senderName, setSenderName] = useState('Email Marketing');
  const [htmlBody, setHtmlBody] = useState(DEFAULT_HTML);
  const [customCSS, setCustomCSS] = useState('');

  const goNext = useCallback(() => setStep(s => Math.min(s + 1, 4)), []);
  const goBack = useCallback(() => setStep(s => Math.max(s - 1, 1)), []);
  const goTo = useCallback((s: number) => setStep(s), []);

  const reset = useCallback(() => {
    setStep(1);
    setName('Chiến dịch Email mới');
    setSubject('Chào {{Họ Tên}}, ưu đãi dành riêng cho bạn!');
    setPreheader('Xem ưu đãi đặc biệt từ chúng tôi');
    setSenderName('Email Marketing');
    setHtmlBody(DEFAULT_HTML);
    setCustomCSS('');
  }, []);

  return {
    step, setStep, goNext, goBack, goTo,
    name, setName,
    subject, setSubject,
    preheader, setPreheader,
    senderName, setSenderName,
    htmlBody, setHtmlBody,
    customCSS, setCustomCSS,
    reset,
  } as const;
}
