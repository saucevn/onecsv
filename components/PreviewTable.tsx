"use client";
import type { UnifiedRow } from "@/lib/types";

type Props = { records: UnifiedRow[] };

const MONEY_COLS = new Set(["unit_price", "gross_revenue", "platform_fee", "net_revenue"]);

function fmt(col: string, val: unknown): string {
  if (val === null || val === undefined || val === "") return "—";
  if (MONEY_COLS.has(col) && typeof val === "number")
    return val.toLocaleString("vi-VN") + " ₫";
  return String(val);
}

const CHANNEL_COLOR: Record<string, string> = {
  "Shopee":       "bg-orange-100 text-orange-700",
  "TikTok Shop":  "bg-pink-100 text-pink-700",
  "POS Cake":     "bg-teal-100 text-teal-700",
};

const COLS: (keyof UnifiedRow)[] = [
  "order_id", "order_date", "channel", "sku", "product_name",
  "quantity", "unit_price", "gross_revenue", "platform_fee",
  "net_revenue", "currency", "status", "payment_method",
  "customer_name", "customer_phone",
];

export default function PreviewTable({ records }: Props) {
  if (!records.length) return null;
  const shown = Math.min(50, records.length);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Preview — Unified Schema</span>
        <span className="text-xs text-gray-400">Hiển thị {shown} / {records.length} dòng</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {COLS.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.slice(0, shown).map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                {COLS.map((col) => (
                  <td key={col} className="px-3 py-1.5 text-gray-700 whitespace-nowrap">
                    {col === "channel" ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CHANNEL_COLOR[String(row[col])] ?? "bg-gray-100 text-gray-600"}`}>
                        {String(row[col])}
                      </span>
                    ) : fmt(col, row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
