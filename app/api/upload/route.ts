import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { mapShopee }  from "@/lib/mappers/shopee";
import { mapTiktok }  from "@/lib/mappers/tiktok";
import { mapPosCake } from "@/lib/mappers/pos-cake";
import type { UnifiedRow } from "@/lib/types";

type MapperFn = (
  rows: Record<string, unknown>[],
  opts?: { dateFrom?: string; dateTo?: string }
) => UnifiedRow[];

const MAPPERS: Record<string, MapperFn> = {
  shopee:   mapShopee,
  tiktok:   mapTiktok,
  pos_cake: mapPosCake,
};

export async function POST(req: NextRequest) {
  try {
    const form     = await req.formData();
    const file     = form.get("file") as File | null;
    const source   = form.get("source") as string | null;
    const dateFrom = form.get("date_from") as string | null;
    const dateTo   = form.get("date_to")   as string | null;

    if (!file || !source) {
      return NextResponse.json({ error: "Thiếu file hoặc source" }, { status: 400 });
    }
    if (!MAPPERS[source]) {
      return NextResponse.json({ error: `Source không hợp lệ: ${source}` }, { status: 400 });
    }

    const buffer   = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows  = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });

    if (rawRows.length === 0) {
      return NextResponse.json({ error: "File không có dữ liệu" }, { status: 422 });
    }

    const opts = {
      dateFrom: dateFrom ?? undefined,
      dateTo:   dateTo   ?? undefined,
    };

    const unified = MAPPERS[source](rawRows, opts);
    const errors  = validate(unified, source);

    return NextResponse.json({
      rows:    unified.length,
      errors,
      preview: unified,
    });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
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
