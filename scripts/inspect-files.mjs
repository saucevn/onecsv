/**
 * Chạy: node scripts/inspect-files.mjs
 * In ra tên cột + dòng đầu của cả 3 file mẫu
 */
import { readFileSync, existsSync } from "fs";
import { read, utils } from "xlsx";

const FILES = [
  { label: "POS Cake",    path: "/Users/dev/Claude/Business/poscake_orders_sample.xlsx",  source: "pos_cake" },
  { label: "Shopee",      path: "/Users/dev/Claude/Business/shopee_orders_sample.xlsx",   source: "shopee"   },
  { label: "TikTok Shop", path: "/Users/dev/Claude/Business/tiktok_orders_sample.xlsx",   source: "tiktok"   },
];

for (const { label, path, source } of FILES) {
  if (!existsSync(path)) { console.log(`❌ Not found: ${path}`); continue; }

  const buf  = readFileSync(path);
  const wb   = read(buf, { type: "buffer", cellDates: true });

  console.log(`\n${"═".repeat(72)}`);
  console.log(`📄  ${label}  |  Sheets: [${wb.SheetNames.join(", ")}]`);
  console.log("═".repeat(72));

  for (const sheetName of wb.SheetNames) {
    const ws   = wb.Sheets[sheetName];
    const rows = utils.sheet_to_json(ws, { defval: "", raw: false });
    if (!rows.length) { console.log(`  Sheet "${sheetName}": empty`); continue; }

    console.log(`\n  Sheet: "${sheetName}"  (${rows.length} rows)`);
    console.log("  COLUMNS:");
    Object.keys(rows[0]).forEach(col => console.log(`    "${col}"`));
    console.log("\n  FIRST ROW:");
    Object.entries(rows[0]).forEach(([k, v]) => {
      const preview = String(v).slice(0, 60);
      console.log(`    "${k}": ${JSON.stringify(preview)}`);
    });
  }
}
