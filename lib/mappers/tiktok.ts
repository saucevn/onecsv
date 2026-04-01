/**
 * TikTok Shop → CanonicalRow mapper — v2
 *
 * Cấu trúc: Row 1 = headers, Row 2 = descriptions (bỏ), Row 3+ = data
 * 1 order = nhiều dòng SKU, order-level fields lặp lại trong file.
 *
 * Financial mapping (schema v4) — forward-fill toàn bộ dòng cùng order_id:
 *   gross_revenue    ← "Order Amount"                 — forward-fill
 *   buyer_paid_total ← "SKU Subtotal After Discount"  — per SKU (không fill)
 *   net_revenue      ← gross_revenue                  — forward-fill
 *   unit_sale_price  ← "SKU Subtotal After Discount"  — per SKU (không fill)
 *   discount_amount  ← "SKU Platform Discount"        — per SKU (không fill)
 *   platform_fee     ← 0
 */

import type { CanonicalRow } from "@/lib/types/canonical";
import { emptyRow } from "@/lib/types/canonical";
import { str, num, cleanMoney, parseDateTikTok } from "@/lib/etl-utils";
import { normalizeStatus } from "@/lib/mappers/status-normalizer";

type Opts = { dateFrom?: string; dateTo?: string };

type OrderContext = {
  order_id:             string;
  order_id_full:        string;
  ordered_at:           string;
  paid_at:              string;
  shipped_at:           string;
  in_transit_at:        string;
  delivered_at:         string;
  cancelled_at:         string;
  status:               string;
  status_raw:           string;
  cancel_reason:        string;
  note:                 string;
  buyer_username:       string;
  recipient_name:       string;
  recipient_phone:      string;
  province:             string;
  district:             string;
  ward:                 string;
  shipping_address:     string;
  tracking_number:      string;
  shipping_carrier:     string;
  shipping_method:      string;
  payment_method:       string;
  shipping_fee:         number;
  shipping_fee_original:number;
  gross_revenue:        number;
  net_revenue:          number;
};

function emptyCtx(): OrderContext {
  return {
    order_id: "", order_id_full: "",
    ordered_at: "", paid_at: "", shipped_at: "", in_transit_at: "",
    delivered_at: "", cancelled_at: "",
    status: "", status_raw: "", cancel_reason: "", note: "",
    buyer_username: "", recipient_name: "", recipient_phone: "",
    province: "", district: "", ward: "", shipping_address: "",
    tracking_number: "", shipping_carrier: "", shipping_method: "", payment_method: "",
    shipping_fee: 0, shipping_fee_original: 0,
    gross_revenue: 0, net_revenue: 0,
  };
}

function isDescriptionRow(r: Record<string, unknown>): boolean {
  const id = str(r["Order ID"]).toLowerCase();
  return id === "" || id.includes("platform unique") || id.includes("order id");
}

export function mapTiktok(
  rows: Record<string, unknown>[],
  _opts: Opts = {}
): CanonicalRow[] {
  const seenOrders = new Set<string>();
  let ctx = emptyCtx();
  const result: CanonicalRow[] = [];

  for (const r of rows) {
    if (isDescriptionRow(r)) continue;

    const orderId = str(r["Order ID"]);
    const isFirst = !seenOrders.has(orderId);
    if (orderId) seenOrders.add(orderId);

    // Cập nhật context khi gặp order_id mới
    if (isFirst) {
      const gross = cleanMoney(r["Order Amount"]);

      ctx = {
        order_id:              orderId,
        order_id_full:         str(r["Package ID"]),
        ordered_at:            parseDateTikTok(r["Created Time"]),
        paid_at:               parseDateTikTok(r["Paid Time"]),
        shipped_at:            parseDateTikTok(r["RTS Time"]),
        in_transit_at:         parseDateTikTok(r["Shipped Time"]),
        delivered_at:          parseDateTikTok(r["Delivered Time"]),
        cancelled_at:          parseDateTikTok(r["Cancelled Time"]),
        status_raw:            str(r["Order Status"]),
        status:                normalizeStatus(str(r["Order Status"]), "tiktok"),
        cancel_reason:         str(r["Cancel Reason"]),
        note:                  str(r["Buyer Message"]),
        buyer_username:        str(r["Buyer Username"]),
        recipient_name:        str(r["Recipient"]),
        recipient_phone:       str(r["Phone #"]),
        province:              str(r["Province"]),
        district:              str(r["District"]),
        ward:                  str(r["Commune"]),
        shipping_address:      str(r["Detail Address"]),
        tracking_number:       str(r["Tracking ID"]),
        shipping_carrier:      str(r["Shipping Provider Name"]),
        shipping_method:       str(r["Delivery Option"]),
        payment_method:        str(r["Payment Method"]),
        shipping_fee:          cleanMoney(r["Shipping Fee After Discount"]),
        shipping_fee_original: cleanMoney(r["Original Shipping Fee"]),
        gross_revenue:         gross,
        net_revenue:           gross,
      };
    }

    // Map dòng hiện tại — dùng ctx cho tất cả order-level fields
    const row = emptyRow();

    row.order_id              = ctx.order_id;
    row.order_id_full         = ctx.order_id_full;
    row.platform              = "tiktok";
    row.status                = ctx.status;
    row.status_raw            = ctx.status_raw;
    row.cancel_reason         = ctx.cancel_reason;
    row.note                  = ctx.note;
    row.ordered_at            = ctx.ordered_at;
    row.paid_at               = ctx.paid_at;
    row.shipped_at            = ctx.shipped_at;
    row.in_transit_at         = ctx.in_transit_at;
    row.delivered_at          = ctx.delivered_at;
    row.cancelled_at          = ctx.cancelled_at;
    row.buyer_username        = ctx.buyer_username;
    row.recipient_name        = ctx.recipient_name;
    row.recipient_phone       = ctx.recipient_phone;
    row.province              = ctx.province;
    row.district              = ctx.district;
    row.ward                  = ctx.ward;
    row.shipping_address      = ctx.shipping_address;
    row.tracking_number       = ctx.tracking_number;
    row.shipping_carrier      = ctx.shipping_carrier;
    row.shipping_method       = ctx.shipping_method;
    row.payment_method        = ctx.payment_method;

    // Order financials — forward-fill toàn bộ dòng cùng order_id
    row.shipping_fee          = ctx.shipping_fee;
    row.shipping_fee_original = ctx.shipping_fee_original;
    row.gross_revenue         = ctx.gross_revenue;
    row.platform_fee          = 0;
    row.net_revenue           = ctx.net_revenue;

    // buyer_paid_total = SKU Subtotal After Discount — per SKU (schema v4)
    row.buyer_paid_total      = cleanMoney(r["SKU Subtotal After Discount"]);

    // Item-level fields — per SKU, không fill
    row.product_name          = str(r["Product Name"]);
    row.variant_name          = str(r["Variation"]);
    row.sku                   = str(r["Seller SKU"]);
    row.quantity              = num(r["Quantity"]);
    row.return_quantity       = num(r["Sku Quantity of return"]);
    row.unit_original_price   = cleanMoney(r["SKU Unit Original Price"]);
    row.unit_sale_price       = cleanMoney(r["SKU Subtotal After Discount"]);
    row.discount_amount       = cleanMoney(r["SKU Platform Discount"]);

    result.push(row);
  }

  return result;
}
