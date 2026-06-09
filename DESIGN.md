Dưới đây là toàn bộ nội dung file `design.md` đã được viết lại bằng tiếng Việt, giữ nguyên vẹn triết lý thiết kế phi sắc độ (achromatic) của Mobbin nhưng được chuyển đổi hoàn toàn cấu trúc để phục vụ cho một giao diện **Dashboard quản lý chiến dịch**.

---

# Mobbin — Hướng dẫn Phong cách (Phiên bản Dashboard Quản lý)

> Bảng thông số đơn sắc — nơi độ đậm của kiểu chữ đảm nhận vai trò của màu sắc.

**Theme:** light

Hệ thống chạy trên sự tiết chế phi sắc độ tuyệt đối — không có bất kỳ màu sắc rực rỡ nào trong toàn bộ bảng màu, ép buộc sự phân cấp thông qua độ đậm, kích thước và sắc độ xám. Bố cục không gian trắng được điểm xuyết bởi mực đen (#141414) ở các tiêu đề lớn và xám ấm (#707070, #adadad) cho văn bản phụ. Các nút bấm và mục tương tác sử dụng hình viên thuốc (pill) bo tròn 9999px, trong khi các thẻ thống kê và bảng dữ liệu nằm gọn trong các hình chữ nhật bo góc 16-24px.

Thay vì hiển thị ảnh chụp màn hình ứng dụng, nội dung cốt lõi ở đây là **Dữ liệu và Quản lý Chiến dịch**. Một thanh Sidebar có thể thu phóng đóng vai trò điều hướng chính, biến Dashboard thành một không gian làm việc tĩnh lặng, không gây xao nhãng.

## Tokens — Màu sắc

| Tên | Giá trị | Token | Vai trò |
| --- | --- | --- | --- |
| Midnight Ink | `#141414` | `--color-midnight-ink` | Văn bản chính, tiêu đề, nút CTA được tô đầy, trạng thái active trong Sidebar, viền icon — "ngựa thồ" duy nhất của hệ thống |
| Pure Canvas | `#ffffff` | `--color-pure-canvas` | Nền trang, bề mặt thẻ (card), bảng dữ liệu, chữ trên nền tối |
| Graphite | `#707070` | `--color-graphite` | Văn bản nội dung (body copy), tiêu đề cột dữ liệu, chữ mô tả |
| Ash | `#adadad` | `--color-ash` | Văn bản cấp 3, viền nút bị vô hiệu hóa, icon placeholder |
| Fog | `#ededed` | `--color-fog` | Đường chia, viền mỏng, viền của thẻ và bảng dữ liệu |
| Mist | `#f2f2f2` | `--color-mist` | Nền Sidebar, trường nhập liệu, trạng thái hover của các hàng trong bảng |
| Silver | `#c2c2c2` | `--color-silver` | Skeleton loaders, các vùng UI không hoạt động |
| Slate Shadow | `#e0e0e0` | `--color-slate-shadow` | Viền bóng đổ chìm của nút (rgba(64,64,64,0.16) 0px 0px 0px 1px) |

## Tokens — Phông chữ

### saans — Mọi thành phần văn bản trên trang.

Các trọng lượng lẻ (440, 456, 652) là điểm nhấn đặc trưng — chúng chiếm khối lượng thị giác nằm giữa Regular và Semibold. Tiêu đề hiển thị (Display) ở 80px/56px chạy trọng lượng 600–652 với lineHeight 1.00–1.13 và letter-spacing âm (-0.011em). Body text chạy 14–16px ở trọng lượng 400 với tracking +0.013–0.017em để đảm bảo khả năng đọc.

* **Phông thay thế:** Inter Variable hoặc Geist
* **Trọng lượng:** 400, 440, 456, 600, 652
* **Kích thước:** 12px, 14px, 16px, 20px, 32px, 56px, 80px
* **Chiều cao dòng (Line height):** 1.00–1.50
* **Tính năng OpenType:** `"calt" 0, "dlig", "ss07"`

### Type Scale (Thang đo kiểu chữ)

| Vai trò | Kích thước | Chiều cao dòng | Khoảng cách chữ | Token |
| --- | --- | --- | --- | --- |
| caption | 12px | 16 | 0.2px | `--text-caption` |
| body-sm | 14px | 20 | — | `--text-body-sm` |
| body | 16px | 22 | 0.21px | `--text-body` |
| subheading | 20px | 28 | 0.28px | `--text-subheading` |
| heading | 32px | 42 | — | `--text-heading` |
| heading-lg | 56px | 63 | -0.39px | `--text-heading-lg` |
| display | 80px | 80 | -0.88px | `--text-display` |

## Tokens — Khoảng cách & Hình khối

**Đơn vị cơ sở:** 8px
**Mật độ:** Thoải mái (comfortable)

### Bo góc (Border Radius)

| Thành phần | Giá trị |
| --- | --- |
| inputs, tags, nút | 9999px |
| thẻ (cards), bảng (tables) | 16-24px |
| modals | 24px |

### Bóng đổ (Shadows)

| Tên | Giá trị | Token |
| --- | --- | --- |
| subtle | `rgba(64, 64, 64, 0.16) 0px 0px 0px 1px inset` | `--shadow-subtle` |
| xl | `rgba(0, 0, 0, 0.04) 0px 8px 40px 0px` | `--shadow-xl` |
| *(Lưu ý: Shadow xl chỉ dùng cho Dropdown menu. Các thẻ và bảng tuyệt đối không dùng shadow).* |  |  |

## Các Thành phần (Components)

### 1. Thanh Sidebar (Có thể thu gọn / mở rộng)

**Vai trò:** Điều hướng chính của không gian làm việc.

* **Trạng thái Mở rộng (Expanded):** Chiều rộng 240px. Hiển thị Logo (trên cùng), danh sách menu kèm text và icon, nút thu gọn ở góc dưới cùng (icon mũi tên). Nền `#f2f2f2` (Mist) hoặc `#ffffff` với viền phải 1px solid `#ededed`.
* **Trạng thái Thu gọn (Collapsed):** Chiều rộng 64px. Chỉ hiển thị Icon, căn giữa. Text được ẩn đi (có thể hiển thị tooltip khi hover).
* **Mục Menu "Danh sách các chiến dịch":** Nếu đang chọn (Active) -> Nền `#141414`, chữ và icon `#ffffff`, bo tròn 9999px, padding 8px 16px. Nếu không chọn -> Nền trong suốt, chữ `#141414`.
* **Mục Menu "Chiến dịch mới":** Tương tự mục trên. Có thể dùng icon dấu `+` để nhấn mạnh.

### 2. Header Top Bar

**Vai trò:** Thanh công cụ phía trên cùng vùng nội dung chính.
Chiều cao 64px-80px. Nền trắng `#ffffff`, padding 0 32px. Bên trái là Tiêu đề trang (saans 20px trọng lượng 600 `#141414`). Bên phải là ô Tìm kiếm (Search Input bo tròn 9999px, nền `#f2f2f2`) và Avatar người dùng. Không có đường viền dưới (border-bottom) nếu nội dung bên dưới có margin rộng.

### 3. Bảng Dữ liệu (Data Table)

**Vai trò:** Hiển thị danh sách chiến dịch chi tiết.

* **Khung ngoài:** Nền trắng `#ffffff`, viền 1px solid `#ededed`, bo góc 16px. Không có box-shadow.
* **Tiêu đề cột:** saans 12px trọng lượng 400 `#adadad`, in hoa (uppercase). Padding 16px 24px. Đường chia dưới 1px solid `#ededed`.
* **Hàng dữ liệu:** saans 14px trọng lượng 440 `#141414`. Trạng thái chiến dịch (ví dụ: Đang chạy, Tạm dừng) sử dụng các thẻ Tag bo tròn 9999px (viền `#141414`, chữ `#141414` hoặc chữ `#707070` viền `#adadad`). Khi hover vào hàng: nền đổi thành `#f2f2f2`.

### 4. Thẻ Thống kê (Stat Card)

**Vai trò:** Hiển thị các chỉ số (KPIs) ở đầu trang.
Nền `#ffffff`, viền 1px solid `#ededed`, bo góc 16px, padding 24px. Số liệu hiển thị siêu lớn ở 40-56px trọng lượng 652 `#141414`. Nhãn mô tả bên dưới ở 14px trọng lượng 440 `#707070`.

### 5. Primary Filled Button (Nút CTA Chính)

**Vai trò:** Các hành động chính (Lưu, Xác nhận tạo chiến dịch).
Nền `#141414`, chữ `#ffffff`, bo góc 9999px, padding 0px 16px, phông saans trọng lượng 600 ở 14px. Inset shadow ring `rgba(64,64,64,0.16) 0px 0px 0px 1px` khi hover.

## Nguyên tắc (Do's and Don'ts)

### Nên làm (Do)

* Giữ thanh Sidebar gọn gàng với hình dạng viên thuốc (9999px radius) cho trạng thái được chọn (active tab) của "Danh sách các chiến dịch".
* Phân biệt độ cao/tách biệt không gian bằng đường viền (`border 1px solid #ededed`) thay vì dùng bóng đổ (box-shadow).
* Sử dụng các trọng lượng chữ lẻ: 440 cho nhãn UI/nội dung bảng, 456 cho mô tả, 652 cho các con số thống kê khổng lồ.
* Đảm bảo trạng thái thu gọn của Sidebar (64px) vẫn giữ nguyên logic màu sắc cho các icon đang active.

### Không nên làm (Don't)

* Tuyệt đối KHÔNG sử dụng màu sắc rực rỡ để báo hiệu trạng thái (Status). Đừng dùng chấm xanh lá cho chiến dịch "Đang chạy" hay màu đỏ cho "Dừng". Thay vào đó, hãy dùng các từ ngữ rõ ràng hoặc các biểu tượng sắc độ xám (outlined icons) với viền đen/xám nhạt.
* Không dùng box-shadow trên bảng dữ liệu hoặc thẻ thống kê.
* Không sử dụng các giá trị bo góc lơ lửng. Input và Button phải là 9999px. Container lớn phải là 16-24px.
* Không để các cột trong bảng dữ liệu quá sát nhau, duy trì khoảng cách tối thiểu 24px giữa các ô nội dung.

## Cấu trúc Bố cục Layout (Dashboard)

* **Trái (Sidebar):** Rộng 240px (hoặc 64px khi thu gọn), cao 100vh, cố định (sticky). Chứa Menu điều hướng với hai nút thiết yếu "Danh sách các chiến dịch" và "Chiến dịch mới".
* **Phải (Main Content):** Chiếm phần chiều rộng còn lại, cuộn độc lập (scrollable). Nền xuyên suốt là `#ffffff`.
* **Vertical Rhythm (Nhịp độ dọc):** Header (cao 80px) -> Gap 32px -> Khối Thẻ Thống Kê (Grid 3-4 cột) -> Gap 40px -> Khối Bảng Dữ liệu Chiến dịch. Căn lề padding hai bên vùng nội dung chính là 32px-40px.

## Quick Start: CSS / Tailwind v4 Custom Properties

```css
:root {
  /* Colors */
  --color-midnight-ink: #141414;
  --color-pure-canvas: #ffffff;
  --color-graphite: #707070;
  --color-ash: #adadad;
  --color-fog: #ededed;
  --color-mist: #f2f2f2;
  --color-silver: #c2c2c2;
  --color-slate-shadow: #e0e0e0;

  /* Typography */
  --font-saans: 'saans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Typography — Weights */
  --font-weight-regular: 400;
  --font-weight-w440: 440;
  --font-weight-w456: 456;
  --font-weight-semibold: 600;
  --font-weight-w652: 652;

  /* Spacing */
  --spacing-8: 8px;
  --spacing-16: 16px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  
  /* Dashboard Specific Layout */
  --sidebar-width-expanded: 240px;
  --sidebar-width-collapsed: 64px;

  /* Border Radius */
  --radius-cards: 16px;
  --radius-modals: 24px;
  --radius-full: 9999px; /* For buttons, tags, inputs, active sidebar items */

  /* Shadows */
  --shadow-subtle: rgba(64, 64, 64, 0.16) 0px 0px 0px 1px inset;
  --shadow-dropdown: rgba(0, 0, 0, 0.04) 0px 8px 40px 0px;
}

