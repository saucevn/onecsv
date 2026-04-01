"use client";
import { useState } from "react";
import type { CanonicalRow } from "@/lib/types/canonical";
import { CANONICAL_COLS } from "@/lib/types/canonical";

type Props = { records: CanonicalRow[] };

// Định dạng hiển thị theo loại cột
const MONEY_COLS = new Set([
  "buyer_paid_total","shipping_fee","shipping_fee_original",
  "unit_original_price","unit_sale_price","discount_amount",
  "gross_revenue","platform_fee","net_revenue",
]);
const DATE_COLS  = new Set(["ordered_at","paid_at","shipped_at","in_transit_at","delivered_at","cancelled_at"]);

function fmtCell(col: keyof CanonicalRow, val: unknown): string {
  if (val === null || val === undefined || val === "" || val === 0 && DATE_COLS.has(col)) return "—";
  if (MONEY_COLS.has(col) && typeof val === "number" && val !== 0)
    return val.toLocaleString("vi-VN") + " ₫";
  if (DATE_COLS.has(col)) return String(val).slice(0, 16);
  if (typeof val === "number" && val === 0 && !MONEY_COLS.has(col)) return "0";
  if (val === "") return "—";
  return String(val);
}

const PLATFORM_BADGE: Record<string, string> = {
  shopee:   "bg-orange-100 text-orange-700",
  tiktok:   "bg-pink-100 text-pink-700",
  pos_cake: "bg-teal-100 text-teal-700",
};

const STATUS_BADGE: Record<string, string> = {
  completed:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-700",
  in_transit: "bg-blue-100 text-blue-700",
  pending:    "bg-yellow-100 text-yellow-700",
  returned:   "bg-purple-100 text-purple-700",
  unknown:    "bg-gray-100 text-gray-500",
};

// Nhóm cột theo group để hiển thị group header
const GROUPS: { label: string; cols: (keyof CanonicalRow)[] }[] = [
  { label: "🔑 Identity",  cols: ["order_id","order_id_full","platform","status","status_raw","cancel_reason","note"] },
  { label: "📅 Timing",    cols: ["ordered_at","paid_at","shipped_at","in_transit_at","delivered_at","cancelled_at"] },
  { label: "👤 Customer",  cols: ["buyer_username","recipient_name","recipient_phone"] },
  { label: "📍 Address",   cols: ["province","district","ward","shipping_address"] },
  { label: "🚚 Shipping",  cols: ["tracking_number","shipping_carrier","shipping_method","payment_method"] },
  { label: "💰 Financials",cols: ["buyer_paid_total","shipping_fee","shipping_fee_original"] },
  { label: "🛍 Items",     cols: ["product_name","variant_name","sku","quantity","return_quantity","unit_original_price","unit_sale_price","discount_amount","gross_revenue","platform_fee","net_revenue"] },
];

// Visible col groups — cho phép toggle
const GROUP_LABELS = GROUPS.map((g) => g.label);

export default function PreviewTable({ records }: Props) {
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(
    new Set(GROUP_LABELS)
  );
  const shown = Math.min(50, records.length);

  function toggleGroup(label: string) {
    setVisibleGroups((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  const visibleCols = GROUPS.flatMap((g) =>
    visibleGroups.has(g.label) ? g.cols : []
  );

  if (!records.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-gray-700">Preview — Unified Schema v2</span>
        <span className="text-xs text-gray-400 ml-auto">
          {shown} / {records.length.toLocaleString()} dòng · {visibleCols.length} cột
        </span>
      </div>

      {/* Group toggles */}
      <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-1.5">
        {GROUPS.map((g) => (
          <button
            key={g.label}
            onClick={() => toggleGroup(g.label)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition font-medium ${
              visibleGroups.has(g.label)
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-gray-50 border-gray-200 text-gray-400"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {visibleCols.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.slice(0, shown).map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                {visibleCols.map((col) => {
                  const val = row[col];
                  if (col === "platform") return (
                    <td key={col} className="px-3 py-1.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${PLATFORM_BADGE[String(val)] ?? "bg-gray-100 text-gray-600"}`}>
                        {String(val)}
                      </span>
                    </td>
                  );
                  if (col === "status") return (
                    <td key={col} className="px-3 py-1.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[String(val)] ?? STATUS_BADGE.unknown}`}>
                        {String(val)}
                      </span>
                    </td>
                  );
                  return (
                    <td key={col} className={`px-3 py-1.5 whitespace-nowrap text-gray-700 ${MONEY_COLS.has(col) ? "text-right font-mono" : ""}`}>
                      {fmtCell(col, val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
