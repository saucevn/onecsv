import type { CanonicalRow } from "@/lib/types/canonical";
import { CANONICAL_COLS } from "@/lib/types/canonical";

const TABLE = "unified_orders";

const COL_TYPES: Partial<Record<keyof CanonicalRow, string>> = {
  ordered_at: "TIMESTAMP", paid_at: "TIMESTAMP", shipped_at: "TIMESTAMP",
  in_transit_at: "TIMESTAMP", delivered_at: "TIMESTAMP", cancelled_at: "TIMESTAMP",
  quantity: "INTEGER", return_quantity: "INTEGER",
  buyer_paid_total: "NUMERIC(18,2)", shipping_fee: "NUMERIC(18,2)",
  shipping_fee_original: "NUMERIC(18,2)", unit_original_price: "NUMERIC(18,2)",
  unit_sale_price: "NUMERIC(18,2)", discount_amount: "NUMERIC(18,2)",
  gross_revenue: "NUMERIC(18,2)", platform_fee: "NUMERIC(18,2)",
  net_revenue: "NUMERIC(18,2)",
};

export function generateSQL(records: CanonicalRow[]): string {
  if (!records.length) return "-- Không có dữ liệu";

  const colDefs = CANONICAL_COLS.map(
    (col) => `  ${col} ${COL_TYPES[col] ?? "TEXT"}`
  );

  const ddl = `-- ============================================================
-- One CSV v2 — Unified Orders
-- Generated: ${new Date().toISOString().slice(0, 19).replace("T", " ")}
-- Rows: ${records.length.toLocaleString()} | Columns: ${CANONICAL_COLS.length}
-- ============================================================

CREATE TABLE IF NOT EXISTS ${TABLE} (
${colDefs.join(",\n")}
);\n\n`;

  const esc = (v: unknown): string => {
    if (v === null || v === undefined || v === "") return "NULL";
    if (typeof v === "number") return isNaN(v) ? "NULL" : String(v);
    return `'${String(v).replace(/'/g, "''")}'`;
  };

  const colsStr = CANONICAL_COLS.join(", ");
  const BATCH   = 500;
  const batches: string[] = [];

  for (let i = 0; i < records.length; i += BATCH) {
    const chunk  = records.slice(i, i + BATCH);
    const values = chunk.map(
      (r) => `  (${CANONICAL_COLS.map((col) => esc(r[col])).join(", ")})`
    );
    batches.push(`INSERT INTO ${TABLE} (${colsStr})\nVALUES\n${values.join(",\n")};`);
  }

  return ddl + batches.join("\n\n");
}

export function downloadSQL(records: CanonicalRow[], filename: string) {
  const sql  = generateSQL(records);
  const blob = new Blob([sql], { type: "text/plain;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
