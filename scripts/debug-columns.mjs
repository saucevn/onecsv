/**
 * Debug script: in ra tên cột thực tế của từng file mẫu.
 *
 * Chạy từ thư mục gốc của repo:
 *   node scripts/debug-columns.mjs
 */

import { readFileSync, existsSync } from "fs";
import { read, utils } from "xlsx";

const FILES = [
  { label: "POS Cake",    file: "/Users/dev/Claude/Business/poscake_orders_sample.xlsx" },
  { label: "Shopee",      file: "/Users/dev/Claude/Business/shopee_orders_sample.xlsx" },
  { label: "TikTok Shop", file: "/Users/dev/Claude/Business/tiktok_orders_sample.xlsx" },
];

for (const { label, file } of FILES) {
  if (!existsSync(file)) {
    console.log(`[${label}] ❌ Not found: ${file}`);
    continue;
  }

  const buf  = readFileSync(file);
  const wb   = read(buf, { type: "buffer", cellDates: true });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const rows = utils.sheet_to_json(ws, { defval: "", raw: false });

  console.log("\n" + "=".repeat(70));
  console.log(`📄 ${label}  |  sheet: "${wb.SheetNames[0]}"  |  ${rows.length} rows`);
  console.log("=".repeat(70));

  if (!rows.length) { console.log("  (empty)"); continue; }

  const cols = Object.keys(rows[0]);
  console.log("COLUMNS:\n  " + cols.map(c => `"${c}"`).join("\n  "));
  console.log("\nFIRST ROW:");
  for (const [k, v] of Object.entries(rows[0])) {
    console.log(`  "${k}": ${JSON.stringify(v)}`);
  }
}
