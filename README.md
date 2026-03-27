# One CSV

**Đồng nhất dữ liệu bán hàng đa kênh về 1 file CSV duy nhất**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/saucevn/onecsv)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-onecsv--app.thichcay.vn-blue)](https://onecsv-app.thichcay.vn)

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

![One CSV Screenshot](https://onecsv-app.thichcay.vn/og.png)

🔗 **Live app:** [onecsv-app.thichcay.vn](https://onecsv-app.thichcay.vn)

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
# Clone repo
git clone https://github.com/saucevn/onecsv.git
cd onecsv

# Cài dependencies
npm install

# Chạy dev server
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
  shopee:        mapShopee,
  tiktok:        mapTiktok,
  pos_cake:      mapPosCake,
  ten_nen_tang:  mapTenNenTang,  // ← thêm vào đây
};
```

---

## Deploy lên Vercel

```bash
# Cài Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Hoặc bấm nút bên dưới:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/saucevn/onecsv)

---

## Roadmap

- [ ] Kết nối trực tiếp Google Sheets API để đẩy data lên Sheets
- [ ] Tích hợp BigQuery connector cho Looker Studio
- [ ] Hỗ trợ thêm nền tảng: Lazada, Tiki, Grab Food
- [ ] Lưu lịch sử upload và so sánh theo tháng
- [ ] Tự động phát hiện tên cột (column auto-mapping)

---

## License

MIT © [Thích Cay](https://thichcay.vn)
