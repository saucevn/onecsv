# 🌶 Ladospice ETL

Web app chuẩn hóa dữ liệu đơn hàng từ **Shopee**, **TikTok Shop** và **POS Cake** về một unified schema duy nhất — sẵn sàng cho Looker Studio.

## Kiến trúc

```
ladospice/
├── app/                    # Next.js 14 (App Router)
│   ├── layout.tsx
│   ├── page.tsx            # Trang chủ
│   └── etl/
│       └── page.tsx        # Trang ETL chính
├── components/
│   ├── UploadCard.tsx      # Card upload mỗi nền tảng
│   ├── PreviewTable.tsx    # Bảng preview unified data
│   └── SqlOutput.tsx       # Hiển thị SQL output
└── backend/                # FastAPI + Pandas
    ├── main.py             # API endpoints
    ├── mappers/
    │   ├── shopee.py       # Shopee → Unified
    │   ├── tiktok.py       # TikTok Shop → Unified
    │   └── pos_cake.py     # POS Cake → Unified
    └── utils/
        ├── validator.py    # Data quality checks
        └── sql_generator.py# CREATE TABLE + INSERT SQL
```

## Unified Schema

| Cột | Kiểu | Mô tả |
|---|---|---|
| `order_id` | TEXT | Mã đơn hàng gốc |
| `order_date` | TIMESTAMP | Ngày đặt hàng (chuẩn hóa) |
| `channel` | TEXT | Shopee / TikTok Shop / POS Cake |
| `sku` | TEXT | Mã sản phẩm |
| `product_name` | TEXT | Tên sản phẩm |
| `quantity` | BIGINT | Số lượng |
| `unit_price` | NUMERIC | Đơn giá |
| `gross_revenue` | NUMERIC | Doanh thu gộp |
| `platform_fee` | NUMERIC | Phí sàn (VNĐ) |
| `net_revenue` | NUMERIC | Doanh thu thuần |
| `currency` | TEXT | VND |
| `customer_name` | TEXT | Tên khách |
| `customer_phone` | TEXT | SĐT khách |
| `status` | TEXT | Trạng thái đơn |
| `payment_method` | TEXT | Phương thức thanh toán |

## Cài đặt & Chạy local

### Frontend (Next.js)

```bash
# Trong thư mục gốc
npm install
cp .env.local.example .env.local
npm run dev
# → http://localhost:3000
```

### Backend (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000
# → Docs: http://localhost:8000/docs
```

## Deploy

### Frontend → Vercel
1. Push repo lên GitHub
2. Vào [vercel.com](https://vercel.com) → Import repo
3. Thêm env var: `NEXT_PUBLIC_API_URL=https://your-api.railway.app`

### Backend → Railway
1. Vào [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Chọn thư mục `backend/` làm root
3. Railway tự đọc `railway.toml` và deploy

## Tuỳ chỉnh mapping cột

Mỗi nền tảng có thể export cột với tên hơi khác nhau tùy phiên bản.
Chỉnh sửa dict `SHOPEE_COL_MAP` / `TIKTOK_COL_MAP` / `CAKE_COL_MAP`
trong `backend/mappers/*.py` để khớp với file thực tế của bạn.
