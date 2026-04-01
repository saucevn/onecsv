/**
 * Shopee → CanonicalRow mapper — v2
 *
 * Cấu trúc: 1 order = nhiều dòng SKU, order-level fields lặp lại trong file.
 *
 * Financial mapping (schema v4) — forward-fill toàn bộ dòng cùng order_id:
 *   gross_revenue    ← "Tổng giá trị ĐH (VND)"                — forward-fill
 *   buyer_paid_total ← "Tổng số tiền người mua thanh toán" S50 — forward-fill
 *   platform_fee     ← Phí cố định + Phí DV + Phí TT          — forward-fill
 *   net_revenue      ← gross_revenue − platform_fee            — forward-fill
 *   shipping_fee     ← "Phí VC người mua trả"                  — forward-fill
 *   unit_sale_price  ← "Giá ưu đãi"                            — per SKU (không fill)
 */

import type { CanonicalRow } from "@/lib/types/canonical";
import { emptyRow } from "@/lib/types/canonical";
import { str, num, cleanMoney, parseDateShopee } from "@/lib/etl-utils";
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
  buyer_paid_total:     number;
  shipping_fee:         number;
  shipping_fee_original:number;
  gross_revenue:        number;
  platform_fee:         number;
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
    buyer_paid_total: 0, shipping_fee: 0, shipping_fee_original: 0,
    gross_revenue: 0, platform_fee: 0, net_revenue: 0,
  };
}

export function mapShopee(
  rows: Record<string, unknown>[],
  _opts: Opts = {}
): CanonicalRow[] {
  const seenOrders = new Set<string>();
  let ctx = emptyCtx();
  const result: CanonicalRow[] = [];

  for (const r of rows) {
    const orderId = str(r["Mã đơn hàng"]);
    const isFirst = !seenOrders.has(orderId);
    if (orderId) seenOrders.add(orderId);

    // Cập nhật context khi gặp order_id mới
    if (isFirst) {
      const gross       = cleanMoney(r["Tổng giá trị đơn hàng (VND)"]);
      const platformFee = cleanMoney(r["Phí cố định"])
                        + cleanMoney(r["Phí Dịch Vụ"])
                        + cleanMoney(r["Phí thanh toán"]);

      ctx = {
        order_id:              orderId,
        order_id_full:         str(r["Mã Kiện Hàng"]),
        ordered_at:            parseDateShopee(r["Ngày đặt hàng"]),
        paid_at:               parseDateShopee(r["Thời gian đơn hàng được thanh toán"]),
        shipped_at:            parseDateShopee(r["Ngày xuất hàng"]),
        in_transit_at:         parseDateShopee(r["Thời gian giao hàng"]),
        delivered_at:          parseDateShopee(r["Ngày giao hàng nội địa"]),
        cancelled_at:          parseDateShopee(r["Ngày hủy thành công"]),
        status_raw:            str(r["Trạng Thái Đơn Hàng"]),
        status:                normalizeStatus(str(r["Trạng Thái Đơn Hàng"]), "shopee"),
        cancel_reason:         str(r["Lý do hủy"]),
        note:                  str(r["Nhận xét từ Người mua"] ?? r["Ghi chú"]),
        buyer_username:        str(r["Người Mua"]),
        recipient_name:        str(r["Tên Người nhận"]),
        recipient_phone:       str(r["Số điện thoại"]),
        province:              str(r["Tỉnh/Thành phố"]),
        district:              str(r["TP / Quận / Huyện"]),
        ward:                  str(r["Quận"]), // ⚠️ S63: tên "Quận" thực ra là Phường/Xã
        shipping_address:      str(r["Địa chỉ nhận hàng"]),
        tracking_number:       str(r["Mã vận đơn"]),
        shipping_carrier:      str(r["Đơn Vị Vận Chuyển"]),
        shipping_method:       str(r["Phương thức giao hàng"]),
        payment_method:        str(r["Phương thức thanh toán"]),
        buyer_paid_total:      cleanMoney(r["Tổng số tiền người mua thanh toán"]), // S50
        shipping_fee:          cleanMoney(r["Phí vận chuyển mà người mua trả"]),
        shipping_fee_original: cleanMoney(r["Phí vận chuyển (dự kiến)"]),
        gross_revenue:         gross,
        platform_fee:          platformFee,
        net_revenue:           Math.round(gross - platformFee),
      };
    }

    // Map dòng hiện tại — dùng ctx cho tất cả order-level fields
    const row = emptyRow();

    row.order_id              = ctx.order_id;
    row.order_id_full         = ctx.order_id_full;
    row.platform              = "shopee";
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
    row.buyer_paid_total      = ctx.buyer_paid_total;
    row.shipping_fee          = ctx.shipping_fee;
    row.shipping_fee_original = ctx.shipping_fee_original;
    row.gross_revenue         = ctx.gross_revenue;
    row.platform_fee          = ctx.platform_fee;
    row.net_revenue           = ctx.net_revenue;

    // Item-level fields — per SKU, không fill
    row.product_name          = str(r["Tên sản phẩm"]);
    row.variant_name          = str(r["Tên phân loại hàng"]);
    row.sku                   = str(r["SKU phân loại hàng"]) || str(r["SKU sản phẩm"]);
    row.quantity              = num(r["Số lượng"]);
    row.return_quantity       = num(r["Số lượng sản phẩm được hoàn trả"]);
    row.unit_original_price   = cleanMoney(r["Giá gốc"]);
    row.unit_sale_price       = cleanMoney(r["Giá ưu đãi"]);
    row.discount_amount       = 0;

    result.push(row);
  }

  return result;
}
