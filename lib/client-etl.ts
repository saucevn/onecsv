/**
 * Client-side ETL engine
 * Parse + transform hoàn toàn trong browser — không giới hạn dòng,
 * không gọi server, không timeout.
 *
 * Kích hoạt bằng cách import và dùng thay cho /api/upload
 */
import * as XLSX from "xlsx";
import { mapShopee }  from "@/lib/mappers/shopee";
import { mapTiktok }  from "@/lib/mappers/tiktok";
import { mapPosCake } from "@/lib/mappers/pos-cake";
import type { UnifiedRow } from "@/lib/types";

type Source = "shopee" | "tiktok" | "pos_cake";

const MAPPERS = {
  shopee:   mapShopee,
  tiktok:   mapTiktok,
  pos_cake: mapPosCake,
};

export type ClientETLResult = {
  rows:    number;
  errors:  string[];
  preview: UnifiedRow[];
};

export async function processFileClientSide(
  file: File,
  source: Source,
  opts: { dateFrom?: string; dateTo?: string } = {}
): Promise<ClientETLResult> {
  // Đọc file trong browser
  const buffer   = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheet    = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows  = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  if (!rawRows.length) {
    return { rows: 0, errors: ["File không có dữ liệu"], preview: [] };
  }

  const unified = MAPPERS[source](rawRows, opts);
  const errors  = validate(unified, source);

  return { rows: unified.length, errors, preview: unified };
}

function validate(rows: UnifiedRow[], source: string): string[] {
  const errors: string[] = [];
  const missingId = rows.filter((r) => !r.order_id).length;
  if (missingId > 0) errors.push(`${missingId} dòng không có mã đơn hàng`);
  if (source !== "pos_cake") {
    const badDates = rows.filter((r) => !r.order_date).length;
    if (badDates > 0) errors.push(`${badDates} dòng không parse được ngày`);
  }
  const negNet = rows.filter((r) => r.net_revenue < 0).length;
  if (negNet > 0) errors.push(`${negNet} dòng net_revenue âm`);
  return errors;
}
