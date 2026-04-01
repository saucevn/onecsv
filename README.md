# One CSV

**Đồng nhất dữ liệu bán hàng đa kênh về 1 file CSV duy nhất**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-OneCSV-blue?style=flat-square)](https://onecsv-lyart.vercel.app)
[![Deploy with Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/saucevn/onecsv)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)

---

## Bài toán

Bạn đang bán hàng trên nhiều kênh và mỗi tuần phải tốn hàng giờ để:

- Export báo cáo riêng lẻ từ **Shopee**, **TikTok Shop**, **POS Cake**
- Copy-paste thủ công vào 1 file Excel tổng hợp
- Căn chỉnh lại format ngày, tiền tệ, tên cột giữa các nền tảng
- Mới bắt đầu được phân tích trên Looker Studio / Google Sheets

**One CSV giải quyết toàn bộ quy trình đó trong dưới 60 giây.**

---

## Demo

🔗 **Live app:** [onecsv-lyart.vercel.app](https://onecsv-lyart.vercel.app)

---

## Tính năng

| Tính năng | Mô tả |
|---|---|
| 📦 **Shopee** | Parse báo cáo Seller Center, tự động lấy SKU thực (`SKU phân loại hàng`), tính phí sàn = Phí cố định + Phí Dịch Vụ + Phí thanh toán |
| 🎵 **TikTok Shop** | Parse báo cáo Seller Hub, bỏ row header description tự động, lấy `Created Time` làm ngày đơn |
| 🧾 **POS Cake** | Parse đơn hàng Pancake POS, forward-fill order_id cho các dòng sản phẩm con, hỗ trợ gán khoảng thời gian |
| 📅 **Lọc theo ngày** | Chọn khoảng thời gian báo cáo — filter Shopee/TikTok theo ngày thực tế, gán ngày phân bổ đều cho POS Cake |
| ⬇️ **Export CSV** | Xuất 1 file CSV chuẩn UTF-8 BOM (mở đẹp trong Excel), tên file tự động theo khoảng ngày |
| `</>` **Export SQL** | Tạo `CREATE TABLE` + `INSERT INTO` sẵn sàng đẩy vào PostgreSQL / MySQL |
| 👁 **Preview trực tiếp** | Xem trước 50 dòng dữ liệu đã chuẩn hóa ngay trong trình duyệt trước khi xuất |

---

## Unified Schema

Tất cả dữ liệu từ 3 nguồn được chuẩn hóa về 1 schema duy nhất:

| Cột | Kiểu | Mô tả |
|---|---|---|
| `order_id` | TEXT | Mã đơn hàng gốc từ nền tảng |
| `order_date` | TIMESTAMP | Ngày tạo đơn (chuẩn hóa ISO) |
| `channel` | TEXT | `Shopee` / `TikTok Shop` / `POS Cake` |
| `sku` | TEXT | Mã sản phẩm / variation SKU |
| `product_name` | TEXT | Tên sản phẩm |
| `quantity` | INTEGER | Số lượng |
| `unit_price` | NUMERIC | Đơn giá gốc |
| `gross_revenue` | NUMERIC | Doanh thu gộp (tiền khách trả) |
| `platform_fee` | NUMERIC | Phí sàn (VNĐ) |
| `net_revenue` | NUMERIC | Doanh thu thuần sau phí |
| `currency` | TEXT | `VND` |
| `customer_name` | TEXT | Tên / username khách hàng |
| `customer_phone` | TEXT | Số điện thoại |
| `status` | TEXT | Trạng thái đơn hàng |
| `payment_method` | TEXT | Phương thức thanh toán |

---

## Tech Stack

- **Frontend + API**: [Next.js 15](https://nextjs.org) (App Router) — deploy trên Vercel
- **ETL Logic**: TypeScript + [SheetJS (xlsx)](https://sheetjs.com) — chạy server-side, không cần backend riêng
- **Styling**: Tailwind CSS

Không có database. Không có backend server. Mọi thứ chạy trong Next.js API Routes.

---

## Chạy local

```bash
# 1. Clone repo
git clone https://github.com/saucevn/onecsv.git
cd onecsv

# 2. Cài dependencies
npm install

# 3. Chạy dev server
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) — upload file và bắt đầu.

---

## Cấu trúc dự án

```
onecsv/
├── app/
│   ├── page.tsx              # Trang chủ
│   ├── etl/page.tsx          # Trang ETL chính
│   └── api/
│       ├── upload/route.ts   # Parse & transform file
│       └── export/route.ts   # Xuất CSV / SQL
├── components/
│   ├── UploadCard.tsx        # Card upload từng kênh
│   ├── PreviewTable.tsx      # Bảng preview dữ liệu
│   └── SqlOutput.tsx         # Hiển thị SQL output
└── lib/
    ├── etl-utils.ts          # Hàm tiện ích: cleanMoney, parseDate
    └── mappers/
        ├── shopee.ts         # Mapper Shopee → Unified
        ├── tiktok.ts         # Mapper TikTok Shop → Unified
        └── pos-cake.ts       # Mapper POS Cake → Unified
```

---

## Mở rộng — Thêm nguồn dữ liệu mới

Tạo file `lib/mappers/ten-nen-tang.ts`:

```typescript
import type { UnifiedRow } from "@/lib/types";
import { cleanMoney, parseDate, str } from "@/lib/etl-utils";

export function mapTenNenTang(
  rows: Record<string, unknown>[],
  _opts = {}
): UnifiedRow[] {
  return rows.map((row) => ({
    order_id:       str(row["Mã đơn"]),
    order_date:     parseDate(row["Ngày tạo"]),
    channel:        "Tên nền tảng",
    sku:            str(row["SKU"]),
    product_name:   str(row["Tên sản phẩm"]),
    quantity:       Number(row["Số lượng"]) || 0,
    unit_price:     cleanMoney(row["Đơn giá"]),
    gross_revenue:  cleanMoney(row["Doanh thu"]),
    platform_fee:   0,
    net_revenue:    cleanMoney(row["Doanh thu"]),
    currency:       "VND",
    customer_name:  str(row["Khách hàng"]),
    customer_phone: str(row["SĐT"]),
    status:         str(row["Trạng thái"]),
    payment_method: str(row["Thanh toán"]),
  }));
}
```

Sau đó đăng ký trong `app/api/upload/route.ts`:

```typescript
import { mapTenNenTang } from "@/lib/mappers/ten-nen-tang";

const MAPPERS = {
  shopee:       mapShopee,
  tiktok:       mapTiktok,
  pos_cake:     mapPosCake,
  ten_nen_tang: mapTenNenTang, // ← thêm vào đây
};
```

---

## Deploy & Publish

### Cách 1 — Deploy lên Vercel (khuyến nghị)

**Bước 1:** Fork repo về GitHub account của bạn

**Bước 2:** Vào [vercel.com](https://vercel.com) → **Add New Project** → Import repo vừa fork

**Bước 3:** Vercel tự detect Next.js, nhấn **Deploy** — xong trong ~1 phút

**Bước 4 (tuỳ chọn):** Gán custom domain tại **Project Settings → Domains**

```
Không cần cấu hình gì thêm.
Không cần environment variables.
Mỗi lần push lên GitHub → Vercel tự deploy lại.
```

Hoặc 1-click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/saucevn/onecsv)

---

### Cách 2 — Tự host (VPS / Docker)

```bash
# Build production
npm run build

# Chạy production server
npm start
# → App chạy tại http://localhost:3000
```

Dùng Nginx reverse proxy để expose ra internet:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### Cách 3 — Publish lần đầu từ local (Vercel CLI)

```bash
# Cài Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy preview (test trước)
vercel

# Deploy production
vercel --prod
```

---

### Checklist trước khi publish

- [ ] Chạy `npm run build` local không có lỗi
- [ ] Test upload cả 3 file mẫu (Shopee / TikTok / POS Cake)
- [ ] Kiểm tra file CSV xuất ra mở đúng trong Excel
- [ ] Đổi link GitHub trong `README.md` và `app/page.tsx` về repo của bạn
- [ ] Thêm custom domain trên Vercel (nếu có)
- [ ] Đặt repo visibility = **Public** trên GitHub để nhận Star ⭐

---

## Roadmap

- [ ] Kết nối trực tiếp Google Sheets API
- [ ] Tích hợp BigQuery connector cho Looker Studio
- [ ] Hỗ trợ thêm nền tảng: Lazada, Tiki, Grab Food
- [ ] Lưu lịch sử upload và so sánh theo tháng
- [ ] Tự động phát hiện tên cột (column auto-mapping)

---

## Contributing

Pull requests are welcome. Để thêm hỗ trợ nền tảng mới, xem hướng dẫn [Mở rộng](#mở-rộng--thêm-nguồn-dữ-liệu-mới) ở trên.

1. Fork repo
2. Tạo branch: `git checkout -b feature/lazada-mapper`
3. Commit: `git commit -m 'feat: add Lazada mapper'`
4. Push: `git push origin feature/lazada-mapper`
5. Mở Pull Request

---

## License

MIT © 2026 [Thích Cay](https://thichcay.vn) — xem file [LICENSE](./LICENSE) để biết thêm chi tiết.

Bạn được tự do sử dụng, sửa đổi và phân phối lại dự án này cho mục đích cá nhân hoặc thương mại, miễn là giữ nguyên copyright notice.
