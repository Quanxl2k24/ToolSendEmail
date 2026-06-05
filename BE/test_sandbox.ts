import "dotenv/config";
import nodemailer from "nodemailer";

async function main() {
  console.log("🔧 Tạo Ethereal test account...");
  const testAccount = await nodemailer.createTestAccount();
  console.log("✅ Ethereal account:", testAccount.user);

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });

  const TOTAL = 200;
  let sent = 0;

  for (let i = 1; i <= TOTAL; i++) {
    const info = await transporter.sendMail({
      from: `"Test Sender" <${testAccount.user}>`,
      to: `test${i}@example.com`,
      subject: `Test email #${i} - ToolSendEmail Sandbox`,
      html: `<h1>Email #${i}</h1><p>Đây là email test thứ ${i} trong tổng số ${TOTAL}.</p>`,
    });

    sent++;
    const preview = nodemailer.getTestMessageUrl(info);
    console.log(`[${sent}/${TOTAL}] Sent | Preview: ${preview}`);

    // Delay 300ms giữa các email (tránh spam)
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n✅ Hoàn thành! Đã gửi ${sent} email.`);
  console.log(`🔗 Vào https://ethereal.email/login để xem tất cả`);
  console.log(`   User: ${testAccount.user}`);
  console.log(`   Pass: ${testAccount.pass}`);
}

main().catch(console.error);
