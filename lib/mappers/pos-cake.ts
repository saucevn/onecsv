/**
 * POS Cake (Pancake) → CanonicalRow mapper — v2
 *
 * Cấu trúc: 1 đơn hàng = NHIỀU dòng sản phẩm
 *   - Dòng đầu nhóm (Mã đơn hàng ≠ ""): đầy đủ thông tin
 *   - Dòng con (Mã đơn hàng = ""):       chỉ có SKU, Số lượng, Đơn giá
 *
 * Financial mapping (schema v4):
 *   gross_revenue    ← "COD"                  — forward-fill toàn bộ dòng
 *   buyer_paid_total ← "Doanh thu đơn hàng"   — forward-fill toàn bộ dòng
 *   net_revenue      ← gross_revenue           — forward-fill toàn bộ dòng
 *   unit_sale_price  ← "Doanh số" nếu có; else Đơn giá × Số lượng
 *   discount_amount  ← "Giảm giá" (dòng đầu); dòng con = 0
 *   platform_fee     ← 0
 */

import type { CanonicalRow } from "@/lib/types/canonical";
import { emptyRow } from "@/lib/types/canonical";
import { str, num, cleanMoney, parseDatePOS } from "@/lib/etl-utils";

type Opts = { dateFrom?: string; dateTo?: string };

type OrderContext = {
  order_id:         string;
  order_id_full:    string;
  ordered_at:       string;
  buyer_username:   string;
  recipient_name:   string;
  recipient_phone:  string;
  province:         string;
  district:         string;
  ward:             string;
  shipping_address: string;
  tracking_number:  string;
  payment_method:   string;
  gross_revenue:    number;  // COD
  buyer_paid_total: number;  // Doanh thu đơn hàng
  order_discount:   number;
};

function emptyCtx(): OrderContext {
  return {
    order_id: "", order_id_full: "", ordered_at: "",
    buyer_username: "", recipient_name: "", recipient_phone: "",
    province: "", district: "", ward: "", shipping_address: "",
    tracking_number: "", payment_method: "",
    gross_revenue: 0, buyer_paid_total: 0, order_discount: 0,
  };
}

function buildDateMap(
  orderIds: string[],
  dateFrom?: string,
  dateTo?:   string
): Map<string, string> {
  const map = new Map<string, string>();
  if (!orderIds.length) return map;
  const from    = dateFrom ? new Date(dateFrom + "T08:00:00") : new Date();
  const to      = dateTo   ? new Date(dateTo   + "T22:00:00") : new Date(from);
  const totalMs = to.getTime() - from.getTime();
  const count   = orderIds.length;
  const pad     = (n: number) => String(n).padStart(2, "0");
  orderIds.forEach((id, idx) => {
    const frac = count <= 1 ? 0 : idx / (count - 1);
    const ts   = new Date(from.getTime() + frac * totalMs);
    map.set(id,
      `${ts.getFullYear()}-${pad(ts.getMonth()+1)}-${pad(ts.getDate())} ` +
      `${pad(ts.getHours())}:${pad(ts.getMinutes())}:00`
    );
  });
  return map;
}

export function mapPosCake(
  rows: Record<string, unknown>[],
  opts: Opts = {}
): CanonicalRow[] {

  // Pass 1: thu thập unique order_ids
  const orderIds: string[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const id = str(r["Mã đơn hàng"]);
    if (id && !seen.has(id)) { orderIds.push(id); seen.add(id); }
  }

  const fallbackDates = buildDateMap(orderIds, opts.dateFrom, opts.dateTo);

  // Pass 2: forward-fill + transform
  let ctx = emptyCtx();
  const result: CanonicalRow[] = [];

  for (const r of rows) {
    const rawId   = str(r["Mã đơn hàng"]);
    const isFirst = rawId !== "";

    if (isFirst) {
      const parsedDate =
        parseDatePOS(r["Thời điểm tạo đơn"]) ||
        parseDatePOS(r["Ngày tạo đơn"])       ||
        fallbackDates.get(rawId)              ||
        "";

      const methods: string[] = [];
      const cod      = cleanMoney(r["COD"]);
      const transfer = cleanMoney(r["Chuyển khoản"]);
      const prepaid  = cleanMoney(r["Trả trước"]);
      const card     = cleanMoney(r["Quẹt thẻ"]);
      if (cod > 0)      methods.push("COD");
      if (transfer > 0) methods.push("Chuyển khoản");
      if (prepaid > 0)  methods.push("Trả trước");
      if (card > 0)     methods.push("Quẹt thẻ");

      ctx = {
        order_id:         rawId,
        order_id_full:    str(r["Mã đơn hàng đầy đủ"]),
        ordered_at:       parsedDate,
        buyer_username:   str(r["Khách hàng"]),
        recipient_name:   str(r["Người nhận"]),
        recipient_phone:  str(r["Số điện thoại"]),
        province:         str(r["Tỉnh/Thành phố"]) || str(r["Mã tỉnh"]),
        district:         str(r["Quận/Huyện"]),
        ward:             str(r["Phường/Xã"]),
        shipping_address: str(r["Địa chỉ"]),
        tracking_number:  str(r["Mã vận đơn"]),
        payment_method:   methods.join(" + ") || str(r["Phương thức thanh toán"]),
        // gross_revenue = COD (schema v4)
        gross_revenue:    cod > 0 ? cod : cleanMoney(r["Doanh thu đơn hàng"]),
        // buyer_paid_total = Doanh thu đơn hàng (schema v4)
        buyer_paid_total: cleanMoney(r["Doanh thu đơn hàng"]),
        order_discount:   cleanMoney(r["Giảm giá"]),
      };
    }

    // ── Map dòng hiện tại ─────────────────────────────────────────
    const row = emptyRow();

    row.order_id         = ctx.order_id;
    row.order_id_full    = ctx.order_id_full;
    row.platform         = "pos_cake";
    row.status           = "completed";
    row.status_raw       = "";
    row.ordered_at       = ctx.ordered_at;
    row.buyer_username   = ctx.buyer_username;
    row.recipient_name   = ctx.recipient_name;
    row.recipient_phone  = ctx.recipient_phone;
    row.province         = ctx.province;
    row.district         = ctx.district;
    row.ward             = ctx.ward;
    row.shipping_address = ctx.shipping_address;
    row.tracking_number  = ctx.tracking_number;
    row.payment_method   = ctx.payment_method;

    // gross_revenue = COD — forward-fill tất cả dòng
    row.gross_revenue    = ctx.gross_revenue;
    // buyer_paid_total = Doanh thu đơn hàng — forward-fill tất cả dòng
    row.buyer_paid_total = ctx.buyer_paid_total;
    row.net_revenue      = ctx.gross_revenue; // = gross_revenue cho POS
    row.platform_fee     = 0;

    // ── Item fields ───────────────────────────────────────────────
    row.product_name        = str(r["Sản phẩm"]);
    row.sku                 = str(r["Mã mẫu mã"]) || str(r["Mã sản phẩm"]);
    row.quantity            = num(r["Số lượng"]);
    row.unit_original_price = cleanMoney(r["Đơn giá"]);

    // unit_sale_price = Doanh số nếu có; else Đơn giá × Số lượng
    const doanh_so = cleanMoney(r["Doanh số"]);
    row.unit_sale_price = doanh_so > 0
      ? doanh_so
      : row.unit_original_price * row.quantity;

    // discount_amount: dòng đầu = order discount; dòng con = 0
    row.discount_amount = isFirst ? ctx.order_discount : 0;

    result.push(row);
  }

  return result;
}
