import type { UnifiedRow } from "@/lib/types";

const TABLE = "unified_orders";

/** Tạo SQL DDL + INSERT hoàn toàn client-side — không giới hạn dòng */
export function generateSQL(records: UnifiedRow[]): string {
  if (!records.length) return "-- Không có dữ liệu";

  // DDL
  const ddl = `-- ============================================================
-- One CSV — Unified Orders
-- Generated: ${new Date().toISOString().slice(0, 19).replace("T", " ")}
-- Rows: ${records.length.toLocaleString()}
-- ============================================================

CREATE TABLE IF NOT EXISTS ${TABLE} (
  order_id       TEXT,
  order_date     TIMESTAMP,
  channel        TEXT,
  sku            TEXT,
  product_name   TEXT,
  quantity       INTEGER,
  unit_price     NUMERIC(18,2),
  gross_revenue  NUMERIC(18,2),
  platform_fee   NUMERIC(18,2),
  net_revenue    NUMERIC(18,2),
  currency       TEXT,
  customer_name  TEXT,
  customer_phone TEXT,
  status         TEXT,
  payment_method TEXT
);\n\n`;

  // INSERT theo batch 500 dòng để dễ chạy
  const BATCH = 500;
  const cols  = "order_id, order_date, channel, sku, product_name, quantity, unit_price, gross_revenue, platform_fee, net_revenue, currency, customer_name, customer_phone, status, payment_method";

  const escapeVal = (v: unknown): string => {
    if (v === null || v === undefined || v === "") return "NULL";
    if (typeof v === "number") return isNaN(v) ? "NULL" : String(v);
    return `'${String(v).replace(/'/g, "''")}'`;
  };

  const batches: string[] = [];
  for (let i = 0; i < records.length; i += BATCH) {
    const chunk = records.slice(i, i + BATCH);
    const values = chunk.map((r) => `  (${[
      escapeVal(r.order_id),
      escapeVal(r.order_date),
      escapeVal(r.channel),
      escapeVal(r.sku),
      escapeVal(r.product_name),
      escapeVal(r.quantity),
      escapeVal(r.unit_price),
      escapeVal(r.gross_revenue),
      escapeVal(r.platform_fee),
      escapeVal(r.net_revenue),
      escapeVal(r.currency),
      escapeVal(r.customer_name),
      escapeVal(r.customer_phone),
      escapeVal(r.status),
      escapeVal(r.payment_method),
    ].join(", ")})`);
    batches.push(`INSERT INTO ${TABLE} (${cols})\nVALUES\n${values.join(",\n")};`);
  }

  return ddl + batches.join("\n\n");
}

/** Tải SQL xuống dưới dạng file .sql */
export function downloadSQL(records: UnifiedRow[], filename: string) {
  const sql  = generateSQL(records);
  const blob = new Blob([sql], { type: "text/plain;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
