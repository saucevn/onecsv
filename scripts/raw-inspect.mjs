/**
 * Emergency column inspector — chạy không cần npm install
 * xlsx là zip file, tìm header row trong sharedStrings.xml
 * 
 * Chạy: node scripts/raw-inspect.mjs
 */
import { readFileSync, existsSync } from "fs";
import { createUnzip } from "zlib";
import { pipeline } from "stream/promises";
import { createReadStream, writeFileSync } from "fs";

// xlsx = zip. Dùng unzip để extract sheet1.xml và sharedStrings.xml
import { execSync } from "child_process";

const FILES = [
  { label: "POS Cake",    path: "/Users/dev/Claude/Business/poscake_orders_sample.xlsx" },
  { label: "Shopee",      path: "/Users/dev/Claude/Business/shopee_orders_sample.xlsx"  },
  { label: "TikTok Shop", path: "/Users/dev/Claude/Business/tiktok_orders_sample.xlsx"  },
];

for (const { label, path } of FILES) {
  if (!existsSync(path)) { console.log(`❌ ${label}: Not found`); continue; }

  console.log(`\n${"═".repeat(60)}\n📄 ${label}\n${"═".repeat(60)}`);

  try {
    // List files in zip
    const listing = execSync(`unzip -l "${path}" 2>/dev/null`).toString();
    const xlSheets = listing.split("\n")
      .filter(l => l.includes("xl/worksheets/") && l.includes(".xml"))
      .map(l => l.trim().split(/\s+/).pop());
    console.log("Sheets found:", xlSheets);

    // Extract sharedStrings (contains cell text values)
    const strings = execSync(`unzip -p "${path}" xl/sharedStrings.xml 2>/dev/null`).toString();
    const matches = [...strings.matchAll(/<t[^>]*>([^<]+)<\/t>/g)].map(m => m[1]);
    console.log("First 30 string values (includes headers):");
    console.log(matches.slice(0, 30).map((s,i) => `  [${i}] "${s}"`).join("\n"));

  } catch(e) {
    console.log("Error:", e.message);
  }
}
