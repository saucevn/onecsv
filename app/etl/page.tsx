"use client";
import { useState, useCallback } from "react";
import UploadCard from "@/components/UploadCard";
import PreviewTable from "@/components/PreviewTable";
import SqlOutput from "@/components/SqlOutput";
import { processFileClientSide } from "@/lib/client-etl";
import type { UploadResult } from "@/types/etl";
import type { UnifiedRow } from "@/lib/types";

function today() {
  return new Date().toISOString().slice(0, 10);
}
function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Tạo CSV string client-side — instant, không giới hạn */
function recordsToCSV(records: UnifiedRow[]): string {
  if (!records.length) return "";
  const BOM     = "\uFEFF";
  const headers = Object.keys(records[0]);
  const escape  = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return s.includes(",") || s.includes("\n") || s.includes('"')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = records.map((r) =>
    headers.map((h) => escape(r[h as keyof UnifiedRow])).join(",")
  );
  return BOM + [headers.join(","), ...rows].join("\n");
}

function filterByDate(records: UnifiedRow[], from: string, to: string): UnifiedRow[] {
  const f = new Date(from + "T00:00:00");
  const t = new Date(to   + "T23:59:59");
  return records.filter((r) => {
    if (!r.order_date) return true;
    const d = new Date(r.order_date);
    return d >= f && d <= t;
  });
}

type ProcessingState = {
  source:   string;
  step:     "reading" | "parsing" | "transforming" | "done";
  progress: number; // 0–100
};

const STEP_LABEL: Record<ProcessingState["step"], string> = {
  reading:      "Đang đọc file...",
  parsing:      "Đang parse Excel...",
  transforming: "Đang chuẩn hóa...",
  done:         "Hoàn tất",
};

export default function ETLPage() {
  const [results, setResults]       = useState<UploadResult[]>([]);
  const [processing, setProcessing] = useState<ProcessingState | null>(null);
  const [sqlOutput, setSqlOutput]   = useState("");
  const [sqlLoading, setSqlLoading] = useState(false);
  const [dateFrom, setDateFrom]     = useState(firstOfMonth());
  const [dateTo,   setDateTo]       = useState(today());

  const allRecords: UnifiedRow[] = results.flatMap((r) => r.preview as UnifiedRow[]);
  const allErrors  = results.flatMap((r) => r.errors.map((e) => `[${r.source}] ${e}`));
  const filtered   = filterByDate(allRecords, dateFrom, dateTo);
  const isFiltered = filtered.length < allRecords.length;

  const handleUpload = useCallback(async (source: string, file: File) => {
    // Progress animation
    const tick = (step: ProcessingState["step"], progress: number) =>
      setProcessing({ source, step, progress });

    tick("reading", 10);
    await new Promise((r) => setTimeout(r, 50)); // allow UI to repaint

    tick("parsing", 35);
    await new Promise((r) => setTimeout(r, 50));

    try {
      tick("transforming", 70);
      const result = await processFileClientSide(
        file,
        source as "shopee" | "tiktok" | "pos_cake",
        { dateFrom, dateTo }
      );
      tick("done", 100);
      await new Promise((r) => setTimeout(r, 300));

      setResults((prev) => [
        ...prev.filter((r) => r.source !== source),
        { source, filename: file.name, ...result },
      ]);
    } catch (e: unknown) {
      alert("Lỗi xử lý file: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setProcessing(null);
    }
  }, [dateFrom, dateTo]);

  function handleExportCSV() {
    if (!filtered.length) return;
    const csv  = recordsToCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `onecsv_${dateFrom}_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportSQL() {
    if (!filtered.length) return;
    setSqlLoading(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: filtered.slice(0, 5000), format: "sql" }),
        // SQL giới hạn 5K dòng để tránh timeout — đủ cho dev/test
      });
      const { sql } = await res.json();
      setSqlOutput(sql);
    } catch (e: unknown) {
      alert("Lỗi: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSqlLoading(false);
    }
  }

  const isProcessing = processing !== null;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-md">1CSV</span>
          <h1 className="text-2xl font-bold text-gray-900">Gộp dữ liệu bán hàng</h1>
        </div>
        <p className="text-gray-400 text-sm">
          Upload file từ mỗi kênh → hệ thống tự động chuẩn hóa và gộp về 1 file CSV duy nhất.
        </p>
      </div>

      {/* Bước 1 */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Bước 1 — Upload file nguồn
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: "shopee",   label: "Shopee",      icon: "📦", color: "orange" },
            { id: "tiktok",   label: "TikTok Shop", icon: "🎵", color: "pink"   },
            { id: "pos_cake", label: "POS Cake",    icon: "🧾", color: "teal"   },
          ].map((src) => (
            <UploadCard
              key={src.id}
              source={src.id}
              label={src.label}
              icon={src.icon}
              color={src.color}
              result={results.find((r) => r.source === src.id)}
              loading={processing?.source === src.id}
              onUpload={handleUpload}
            />
          ))}
        </div>

        {/* Progress bar */}
        {processing && (
          <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 font-medium">
                {STEP_LABEL[processing.step]}
              </span>
              <span className="text-xs text-gray-400">{processing.progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processing.progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Xử lý hoàn toàn trong browser — không gửi dữ liệu lên server
            </p>
          </div>
        )}
      </div>

      {/* Warnings */}
      {allErrors.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-1">
          <p className="text-xs font-semibold text-yellow-700 mb-2">⚠ Cảnh báo dữ liệu</p>
          {allErrors.map((e, i) => <p key={i} className="text-xs text-yellow-800">{e}</p>)}
        </div>
      )}

      {/* Bước 2 */}
      {allRecords.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Bước 2 — Chọn khoảng thời gian &amp; Xuất file
          </p>
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">

            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Khoảng thời gian báo cáo</p>
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Từ ngày</label>
                  <input
                    type="date" value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Đến ngày</label>
                  <input
                    type="date" value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="text-sm">
                  {isFiltered ? (
                    <span className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-2 rounded-lg font-medium">
                      {filtered.length.toLocaleString()} / {allRecords.length.toLocaleString()} dòng
                    </span>
                  ) : (
                    <span className="bg-gray-50 text-gray-500 border border-gray-200 px-3 py-2 rounded-lg">
                      {allRecords.length.toLocaleString()} dòng tổng
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3 items-center">
                {results.map((r) => {
                  const n = filterByDate(r.preview as UnifiedRow[], dateFrom, dateTo).length;
                  return (
                    <span key={r.source} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">
                      {r.source === "shopee" ? "📦" : r.source === "tiktok" ? "🎵" : "🧾"} {n.toLocaleString()} dòng
                    </span>
                  );
                })}
                {results.some((r) => r.source === "pos_cake") && (
                  <span className="text-xs text-gray-400 italic">
                    * POS Cake: ngày được gán theo khoảng đã chọn
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            <div className="flex gap-3 items-center">
              <button
                onClick={handleExportCSV}
                disabled={filtered.length === 0 || isProcessing}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Tải 1 file CSV
                {isFiltered && <span className="opacity-70 text-xs">({filtered.length.toLocaleString()})</span>}
              </button>

              <button
                onClick={handleExportSQL}
                disabled={sqlLoading || filtered.length === 0 || isProcessing}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-gray-400 disabled:opacity-50 transition"
              >
                {sqlLoading
                  ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                }
                Xuất SQL
              </button>

              {/* Capacity indicator */}
              {allRecords.length > 0 && (
                <span className={`ml-auto text-xs px-3 py-1.5 rounded-lg font-medium ${
                  allRecords.length > 30000 ? "bg-orange-50 text-orange-600 border border-orange-100"
                  : allRecords.length > 10000 ? "bg-yellow-50 text-yellow-600 border border-yellow-100"
                  : "bg-green-50 text-green-600 border border-green-100"
                }`}>
                  {allRecords.length > 30000 ? "⚡ File lớn — xử lý tốt" :
                   allRecords.length > 10000 ? "📊 Dữ liệu nhiều" : "✓ Bình thường"}
                  {" · "}{allRecords.length.toLocaleString()} dòng
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {allRecords.length > 0 && <PreviewTable records={filtered} />}
      {sqlOutput && <SqlOutput sql={sqlOutput} onClose={() => setSqlOutput("")} />}
    </div>
  );
}
