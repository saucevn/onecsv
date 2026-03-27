import type { UnifiedRow } from "@/lib/types";
import { cleanMoney, str } from "@/lib/etl-utils";

type MapperOpts = {
  dateFrom?: string;  // "yyyy-mm-dd"
  dateTo?:   string;  // "yyyy-mm-dd"
};

/**
 * POS Cake (Pancake) → Unified Schema
 *
 * Cấu trúc: 1 đơn hàng = NHIỀU dòng sản phẩm
 * Chỉ dòng đầu nhóm có: Mã đơn hàng, Khách hàng, SĐT, thanh toán...
 * Dòng con (Mã đơn hàng = "") → forward-fill từ dòng đầu nhóm
 *
 * Ngày: POS Cake không export ngày → user chọn khoảng ngày khi upload.
 * Logic gán ngày: chia đều từ dateFrom → dateTo theo thứ tự STT đơn hàng.
 * Nếu user không chọn → dùng ngày hôm nay.
 */
export function mapPosCake(
  rows: Record<string, unknown>[],
  opts: MapperOpts = {}
): UnifiedRow[] {

  // ── Bước 1: Xác định danh sách order_id theo thứ tự xuất hiện ────────
  const orderIds: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const id = str(row["Mã đơn hàng"]);
    if (id && !seen.has(id)) { orderIds.push(id); seen.add(id); }
  }

  // ── Bước 2: Tạo map order_id → order_date ────────────────────────────
  const dateFrom = opts.dateFrom ? new Date(opts.dateFrom) : new Date();
  const dateTo   = opts.dateTo   ? new Date(opts.dateTo)   : new Date(dateFrom);

  // Đặt giờ: from = 08:00, to = 22:00 để trông tự nhiên hơn
  dateFrom.setHours(8,  0, 0, 0);
  dateTo.setHours(22, 0, 0, 0);

  const totalMs   = dateTo.getTime() - dateFrom.getTime();
  const orderCount = orderIds.length;

  const dateMap = new Map<string, string>();
  orderIds.forEach((id, idx) => {
    // Chia đều timestamp trong khoảng thời gian
    const fraction = orderCount <= 1 ? 0 : idx / (orderCount - 1);
    const ts = new Date(dateFrom.getTime() + fraction * totalMs);
    // Format: "yyyy-mm-ddTHH:MM:SS"
    dateMap.set(id, ts.toISOString().slice(0, 19));
  });

  // ── Bước 3: Forward-fill context từ dòng đầu nhóm ────────────────────
  type OrderCtx = {
    order_id:       string;
    customer_name:  string;
    customer_phone: string;
    status:         string;
    payment_method: string;
    net_revenue:    number;
  };

  let ctx: OrderCtx = {
    order_id: "", customer_name: "", customer_phone: "",
    status: "", payment_method: "", net_revenue: 0,
  };

  const filledRows: Array<{ row: Record<string, unknown>; ctx: OrderCtx; isFirst: boolean }> = [];

  for (const row of rows) {
    const rawId = str(row["Mã đơn hàng"]);
    const isFirst = rawId !== "";

    if (isFirst) {
      const cod      = cleanMoney(row["COD"]);
      const transfer = cleanMoney(row["Chuyển khoản"]);
      const prepaid  = cleanMoney(row["Trả trước"]);
      const card     = cleanMoney(row["Quẹt thẻ"]);

      const methods: string[] = [];
      if (cod > 0)      methods.push("COD");
      if (transfer > 0) methods.push("Chuyển khoản");
      if (prepaid > 0)  methods.push("Trả trước");
      if (card > 0)     methods.push("Quẹt thẻ");

      ctx = {
        order_id:       rawId,
        customer_name:  str(row["Khách hàng"]),
        customer_phone: str(row["Số điện thoại"]),
        status:         str(row["Trạng thái"]),
        payment_method: methods.join(" + ") || str(row["Nguồn đơn"]),
        net_revenue:    cod + transfer + prepaid + card,
      };
    }

    filledRows.push({ row, ctx: { ...ctx }, isFirst });
  }

  // ── Bước 4: Map → UnifiedRow ──────────────────────────────────────────
  return filledRows.map(({ row, ctx, isFirst }) => {
    const qty       = parseFloat(str(row["Số lượng"])) || 0;
    const unitPrice = cleanMoney(row["Đơn giá"]);
    const discount  = cleanMoney(row["Giảm giá"]);
    const surcharge = cleanMoney(row["Phụ thu"]);
    const lineGross = parseFloat((unitPrice * qty - discount + surcharge).toFixed(0));

    const sku = str(row["Mã mẫu mã"]) || str(row["Mã sản phẩm"]);

    return {
      order_id:       ctx.order_id,
      order_date:     dateMap.get(ctx.order_id) ?? "",
      channel:        "POS Cake",
      sku,
      product_name:   str(row["Sản phẩm"]),
      quantity:       qty,
      unit_price:     unitPrice,
      gross_revenue:  lineGross,
      platform_fee:   0,
      // net_revenue chỉ set ở dòng đầu nhóm → tránh double-count khi SUM
      net_revenue:    isFirst ? ctx.net_revenue : 0,
      currency:       "VND",
      customer_name:  ctx.customer_name,
      customer_phone: ctx.customer_phone,
      status:         ctx.status,
      payment_method: ctx.payment_method,
    };
  });
}
