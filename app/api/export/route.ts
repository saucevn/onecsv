import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import type { UnifiedRow } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { records, format } = await req.json() as {
      records: UnifiedRow[];
      format: "csv" | "sql";
    };

    if (!records?.length) {
      return NextResponse.json({ error: "Không có dữ liệu" }, { status: 400 });
    }

    if (format === "csv") {
      // Dùng XLSX để tạo CSV chuẩn UTF-8 BOM (mở đẹp trong Excel)
      const ws = XLSX.utils.json_to_sheet(records);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const bom = "\uFEFF" + csv;   // BOM cho Excel/Looker Studio

      return new NextResponse(bom, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="unified_orders.csv"',
        },
      });
    }

    if (format === "sql") {
      const table = "unified_orders";
      const cols  = Object.keys(records[0]).join(", ");

      const colDefs = Object.entries(records[0]).map(([col, val]) => {
        let type = "TEXT";
        if (typeof val === "number")          type = "NUMERIC(18,2)";
        else if (col === "order_date")        type = "TIMESTAMP";
        else if (col === "quantity")          type = "INTEGER";
        return `  ${col} ${type}`;
      });

      const ddl = `-- Ladospice Unified Orders\nCREATE TABLE IF NOT EXISTS ${table} (\n${colDefs.join(",\n")}\n);\n\n`;

      const valueRows = records.map((row) => {
        const vals = Object.values(row).map((v) => {
          if (v === null || v === undefined || v === "") return "NULL";
          if (typeof v === "number") return String(v);
          return `'${String(v).replace(/'/g, "''")}'`;
        });
        return `(${vals.join(", ")})`;
      });

      const sql = ddl + `INSERT INTO ${table} (${cols})\nVALUES\n${valueRows.join(",\n")};`;
      return NextResponse.json({ sql });
    }

    return NextResponse.json({ error: "format phải là csv hoặc sql" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
