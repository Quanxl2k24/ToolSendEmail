# Hướng Dẫn Thiết Lập Và Chạy Dự Án

## 1. Cài Đặt Môi Trường

Đảm bảo máy tính của bạn đã được cài đặt sẵn các thành phần sau:

- **Node.js**
- **PostgreSQL**
- **Redis**
- **Trình duyệt web** (Chrome, Firefox, Edge, v.v.)

## 2. Tạo Database

Mở terminal và chạy lệnh sau để tạo cơ sở dữ liệu:

```bash
psql -U postgres -c "CREATE DATABASE mydb;"

```

## 3. Google Cloud Platform — Lấy OAuth Keys

1. Truy cập [GCP Console](https://console.cloud.google.com/) và điều hướng đến **APIs & Services** > **Credentials**.
2. Tạo **OAuth 2.0 Web Client**.
3. Tại phần **Authorized redirect URIs**, thêm đường dẫn sau:

```text
http://localhost:3000/api/auth/google/callback

```

4. Trong màn hình cấu hình **OAuth consent**, đảm bảo bạn đã bật các **Scopes** sau:

- `openid`, `email`, `profile`
- `https://www.googleapis.com/auth/spreadsheets`

5. Bật Google Sheets API: Vào **APIs & Services** > **Library** > Tìm từ khóa **"Google Sheets API"** > Nhấn **Enable**.
6. Copy **Client ID** và **Client Secret** rồi thêm vào các file `.env` tương ứng:

- **BE/.env**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **FE/.env**: `VITE_GOOGLE_CLIENT_ID`

## 4. Gmail — Lấy App Password (Dịch vụ gửi mail)

1. Truy cập trang [Bảo mật tài khoản Google](https://myaccount.google.com/security).
2. Bật **2-Step Verification** (Xác minh 2 bước) nếu tài khoản chưa kích hoạt.
3. Vào phần **App passwords** → Tạo ứng dụng với tên "Mail" → Copy mật khẩu gồm 16 ký tự được hệ thống cấp.
4. Điền các thông tin vào file **BE/.env**:

```env
SMTP_USER=your_email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # (App Password vừa copy)
SMTP_FROM="your_email@gmail.com"

```

> **Mẹo:** Nếu bạn chỉ muốn test mà không muốn dùng tài khoản email thật để gửi, hãy đổi cấu hình thành `SMTP_MODE=sandbox`. Hệ thống sẽ chuyển sang dùng **Ethereal.email** (bạn có thể xem mail trực tiếp trên trình duyệt).

## 5. Tạo JWT Secret & Token Encryption Key

Tuyệt đối không sử dụng key mẫu cho môi trường production. Để tạo một chuỗi ngẫu nhiên bảo mật, hãy chạy lệnh sau trong terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

```

Copy kết quả (chuỗi hex dài 64 ký tự) và điền vào các biến sau trong file `.env`:

- `JWT_SECRET`
- `TOKEN_ENCRYPTION_KEY`

## 6. Các Bước Chạy Dự Án

**Chạy Backend:** (Mở Terminal 1)

```bash
cd BE
npm install
npx prisma generate
npx prisma migrate dev
npm run dev  # Server BE sẽ chạy ở port 3000

```

**Chạy Frontend:** (Mở Terminal 2)

```bash
cd FE
npm install
npm run dev  # Server FE sẽ chạy ở port 5173

```

---

## Tóm Tắt Các Keys/Services Cần Tự Lấy

| Tên Key / Thông tin        | Nơi cấu hình          |
| -------------------------- | --------------------- |
| `GOOGLE_CLIENT_ID`         | `BE/.env` & `FE/.env` |
| `GOOGLE_CLIENT_SECRET`     | `BE/.env`             |
| `SMTP_PASS` (App Password) | `BE/.env`             |
| `JWT_SECRET`               | `BE/.env`             |
| `TOKEN_ENCRYPTION_KEY`     | `BE/.env`             |

> **Lưu ý quan trọng:** Hiện tại file `.env` đang chứa sẵn các keys của tài khoản (đã hardcode để chạy thử). Nếu bạn muốn sử dụng dịch vụ bằng tài khoản của riêng mình, bắt buộc phải thay thế toàn bộ các giá trị trên trong file `.env` bằng thông tin bạn vừa tạo.
