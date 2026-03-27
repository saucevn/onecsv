# Changelog

All notable changes to One CSV will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.0.0] — 2026-03-27

### 🎉 First public release

**One CSV** — Đồng nhất dữ liệu bán hàng đa kênh về 1 file CSV duy nhất.

### Added
- 📦 **Shopee mapper** — Parse báo cáo Seller Center, tự động map `SKU phân loại hàng`, tính phí sàn từ Phí cố định + Phí Dịch Vụ + Phí thanh toán
- 🎵 **TikTok Shop mapper** — Parse báo cáo Seller Hub, filter bỏ row header description, lấy `Created Time` làm ngày đơn
- 🧾 **POS Cake mapper** — Parse đơn hàng Pancake POS, forward-fill `order_id` cho các dòng sản phẩm con trong cùng 1 đơn
- 📅 **Date range filter** — Lọc Shopee/TikTok theo ngày thực tế, gán timestamp phân bổ đều cho POS Cake
- ⬇️ **Export CSV** — UTF-8 BOM, tên file tự động theo khoảng ngày `onecsv_YYYY-MM-DD_YYYY-MM-DD.csv`
- `</>` **Export SQL** — Tạo `CREATE TABLE` + `INSERT INTO` cho PostgreSQL / MySQL
- 👁 **Preview table** — Xem trước 50 dòng unified schema ngay trong trình duyệt
- 🏗 **Unified Schema** — 15 cột chuẩn hóa: `order_id`, `order_date`, `channel`, `sku`, `product_name`, `quantity`, `unit_price`, `gross_revenue`, `platform_fee`, `net_revenue`, `currency`, `customer_name`, `customer_phone`, `status`, `payment_method`

### Tech
- Next.js 15 (App Router) + TypeScript
- SheetJS (xlsx) cho parse CSV/Excel server-side
- Tailwind CSS
- Deploy trên Vercel — không cần backend riêng

---

## Upcoming — v1.1.0

- [ ] Google Sheets API integration
- [ ] BigQuery connector cho Looker Studio
- [ ] Lazada / Tiki mapper
- [ ] Column auto-mapping (tự nhận diện tên cột)
