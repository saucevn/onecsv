/**
 * Canonical Row — One CSV v2
 * Schema chuẩn hóa từ Shopee, TikTok Shop, POS Cake
 * 36 columns, 7 groups
 * Source of truth: canonical_schema_v2.xlsx
 */
export type CanonicalRow = {
  // ─── 🔑 ORDER IDENTITY ────────────────────────────────────────────
  order_id:        string;   // required
  order_id_full:   string;   // package_id / mã đơn đầy đủ
  platform:        string;   // required — "shopee" | "tiktok" | "pos_cake"
  status:          string;   // required — normalized EN
  status_raw:      string;   // giá trị gốc từ file
  cancel_reason:   string;
  note:            string;

  // ─── 📅 TIMING ────────────────────────────────────────────────────
  ordered_at:      string;   // required — ISO "YYYY-MM-DD HH:MM:SS"
  paid_at:         string;
  shipped_at:      string;
  in_transit_at:   string;
  delivered_at:    string;
  cancelled_at:    string;

  // ─── 👤 CUSTOMER ──────────────────────────────────────────────────
  buyer_username:  string;   // required
  recipient_name:  string;
  recipient_phone: string;

  // ─── 📍 ADDRESS ───────────────────────────────────────────────────
  province:        string;
  district:        string;
  ward:            string;
  shipping_address:string;

  // ─── 🚚 SHIPPING & PAYMENT ────────────────────────────────────────
  tracking_number: string;
  shipping_carrier:string;
  shipping_method: string;
  payment_method:  string;

  // ─── 💰 FINANCIALS — ORDER LEVEL ──────────────────────────────────
  buyer_paid_total:      number;  // required — tổng tiền KH thực trả
  shipping_fee:          number;  // phí ship KH trả
  shipping_fee_original: number;  // phí ship gốc trước giảm

  // ─── 🛍 ORDER ITEMS — 1 row = 1 SKU ──────────────────────────────
  product_name:        string;  // required
  variant_name:        string;
  sku:                 string;
  quantity:            number;  // required
  return_quantity:     number;
  unit_original_price: number;
  unit_sale_price:     number;  // subtotal sau discount
  discount_amount:     number;
  gross_revenue:       number;  // required
  platform_fee:        number;
  net_revenue:         number;  // required
};

export const CANONICAL_COLS: (keyof CanonicalRow)[] = [
  "order_id", "order_id_full", "platform", "status", "status_raw",
  "cancel_reason", "note",
  "ordered_at", "paid_at", "shipped_at", "in_transit_at",
  "delivered_at", "cancelled_at",
  "buyer_username", "recipient_name", "recipient_phone",
  "province", "district", "ward", "shipping_address",
  "tracking_number", "shipping_carrier", "shipping_method", "payment_method",
  "buyer_paid_total", "shipping_fee", "shipping_fee_original",
  "product_name", "variant_name", "sku", "quantity", "return_quantity",
  "unit_original_price", "unit_sale_price", "discount_amount",
  "gross_revenue", "platform_fee", "net_revenue",
];

export const REQUIRED_COLS: (keyof CanonicalRow)[] = [
  "order_id", "platform", "status", "ordered_at",
  "buyer_username", "buyer_paid_total",
  "product_name", "quantity", "gross_revenue", "net_revenue",
];

export function emptyRow(): CanonicalRow {
  return {
    order_id: "", order_id_full: "", platform: "", status: "",
    status_raw: "", cancel_reason: "", note: "",
    ordered_at: "", paid_at: "", shipped_at: "", in_transit_at: "",
    delivered_at: "", cancelled_at: "",
    buyer_username: "", recipient_name: "", recipient_phone: "",
    province: "", district: "", ward: "", shipping_address: "",
    tracking_number: "", shipping_carrier: "", shipping_method: "",
    payment_method: "",
    buyer_paid_total: 0, shipping_fee: 0, shipping_fee_original: 0,
    product_name: "", variant_name: "", sku: "", quantity: 0,
    return_quantity: 0, unit_original_price: 0, unit_sale_price: 0,
    discount_amount: 0, gross_revenue: 0, platform_fee: 0, net_revenue: 0,
  };
}
