/**
 * Client-side ETL engine — v2
 * Parse + transform hoàn toàn trong browser, không gọi server.
 */
import * as XLSX from "xlsx";
import { mapShopee }  from "@/lib/mappers/shopee";
import { mapTiktok }  from "@/lib/mappers/tiktok";
import { mapPosCake } from "@/lib/mappers/pos-cake";
import type { CanonicalRow } from "@/lib/types/canonical";

type Source = "shopee" | "tiktok" | "pos_cake";
type Opts   = { dateFrom?: string; dateTo?: string };

const MAPPERS: Record<Source, (rows: Record<string, unknown>[], opts: Opts) => CanonicalRow[]> = {
  shopee:   mapShopee,
  tiktok:   mapTiktok,
  pos_cake: mapPosCake,
};

export type ClientETLResult = {
  rows:    number;
  errors:  string[];
  preview: CanonicalRow[];
};

export async function processFileClientSide(
  file:   File,
  source: Source,
  opts:   Opts = {}
): Promise<ClientETLResult> {
  const buffer   = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheet    = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows  = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw:    false,
  });

  if (!rawRows.length) {
    return { rows: 0, errors: ["File không có dữ liệu"], preview: [] };
  }

  const unified = MAPPERS[source](rawRows, opts);
  const errors  = validate(unified, source);

  return { rows: unified.length, errors, preview: unified };
}

function validate(rows: CanonicalRow[], source: string): string[] {
  const errors: string[] = [];
  if (!rows.length) return errors;

  // ── order_id: không được trống ────────────────────────────────
  const missingOrderId = rows.filter((r) => !r.order_id).length;
  if (missingOrderId > 0) errors.push(`${missingOrderId} dòng thiếu 'order_id'`);

  // ── ordered_at: chỉ check Shopee + TikTok (POS dùng date range) ──
  if (source !== "pos_cake") {
    const badDate = rows.filter((r) => !r.ordered_at).length;
    if (badDate > 0) errors.push(`${badDate} dòng không parse được 'ordered_at'`);
  }

  // ── buyer_username: không được trống ──────────────────────────
  const missingBuyer = rows.filter((r) => !r.buyer_username).length;
  if (missingBuyer > 0) errors.push(`${missingBuyer} dòng thiếu 'buyer_username'`);

  // ── product_name: không được trống ───────────────────────────
  const missingProduct = rows.filter((r) => !r.product_name).length;
  if (missingProduct > 0) errors.push(`${missingProduct} dòng thiếu 'product_name'`);

  // ── quantity: không được = 0 ──────────────────────────────────
  const zeroQty = rows.filter((r) => !r.quantity || r.quantity === 0).length;
  if (zeroQty > 0) errors.push(`${zeroQty} dòng có quantity = 0`);

  // ── gross_revenue: chỉ check dòng FIRST của mỗi order (tránh báo lỗi dòng con = 0) ──
  // Lấy các order_id xuất hiện lần đầu
  const firstOrderRows = new Set<string>();
  const firstRows: CanonicalRow[] = [];
  for (const r of rows) {
    if (r.order_id && !firstOrderRows.has(r.order_id)) {
      firstOrderRows.add(r.order_id);
      firstRows.push(r);
    }
  }
  const zeroGross = firstRows.filter((r) => !r.gross_revenue || r.gross_revenue === 0).length;
  if (zeroGross > 0) errors.push(`${zeroGross} đơn hàng có gross_revenue = 0`);

  const zeroBuyer = firstRows.filter((r) => !r.buyer_paid_total || r.buyer_paid_total === 0).length;
  if (zeroBuyer > 0) errors.push(`${zeroBuyer} đơn hàng có buyer_paid_total = 0`);

  // ── net_revenue âm ────────────────────────────────────────────
  const negRev = rows.filter((r) => r.net_revenue < 0).length;
  if (negRev > 0) errors.push(`${negRev} dòng có net_revenue âm`);

  // ── status unknown ────────────────────────────────────────────
  const unknown = rows.filter((r) => r.status === "unknown").length;
  if (unknown > 0) errors.push(`${unknown} dòng có status không nhận diện được`);

  return errors;
}
