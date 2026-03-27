"use client";
import { useState } from "react";
import UploadCard from "@/components/UploadCard";
import PreviewTable from "@/components/PreviewTable";
import SqlOutput from "@/components/SqlOutput";
import type { UploadResult } from "@/types/etl";
import type { UnifiedRow } from "@/lib/types";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function ETLPage() {
  const [results, setResults]     = useState<UploadResult[]>([]);
  const [loading, setLoading]     = useState<string | null>(null);
  const [sqlOutput, setSqlOutput] = useState("");
  const [exporting, setExporting] = useState(false);

  // Date range áp dụng cho toàn bộ file xuất ra
  const [dateFrom, setDateFrom] = useState(firstOfMonth());
  const [dateTo,   setDateTo]   = useState(today());

  const allRecords: UnifiedRow[] = results.flatMap((r) => r.preview as UnifiedRow[]);
  const allErrors  = results.flatMap((r) => r.errors.map((e) => `[${r.source}] ${e}`));

  async function handleUpload(source: string, file: File) {
    setLoading(source);
    const form = new FormData();
    form.append("file", file);
    form.append("source", source);
    // Truyền date range cho POS Cake (để gán timestamp)
    form.append("date_from", dateFrom);
    form.append("date_to",   dateTo);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? res.statusText);
      }
      const data = await res.json();
      setResults((prev) => [
        ...prev.filter((r) => r.source !== source),
        { source, filename: file.name, rows: data.rows, errors: data.errors, preview: data.preview },
      ]);
    } catch (e: unknown) {
      alert("Lỗi: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(null);
    }
  }

  async function handleExportCSV() {
    setExporting(true);
    try {
      // Lọc theo date range trước khi export
      const filtered = filterByDate(allRecords, dateFrom, dateTo);
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: filtered, format: "csv" }),
      });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `onecsv_${dateFrom}_${dateTo}.csv`;
      a.click();
    } finally {
      setExporting(false);
    }
  }

  async function handleExportSQL() {
    setExporting(true);
    try {
      const filtered = filterByDate(allRecords, dateFrom, dateTo);
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: filtered, format: "sql" }),
      });
      const { sql } = await res.json();
      setSqlOutput(sql);
    } finally {
      setExporting(false);
    }
  }

  // Lọc records theo khoảng ngày (bỏ qua POS Cake vì không có ngày gốc)
  function filterByDate(records: UnifiedRow[], from: string, to: string): UnifiedRow[] {
    const f = new Date(from + "T00:00:00");
    const t = new Date(to   + "T23:59:59");
    return records.filter((r) => {
      if (!r.order_date) return true; // POS Cake không có ngày → giữ lại
      const d = new Date(r.order_date);
      return d >= f && d <= t;
    });
  }

  const filteredCount = filterByDate(allRecords, dateFrom, dateTo).length;
  const isFiltered    = filteredCount < allRecords.length;

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

      {/* Step 1: Upload */}
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
              loading={loading === src.id}
              onUpload={handleUpload}
            />
          ))}
        </div>
      </div>

      {/* Warnings */}
      {allErrors.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-1">
          <p className="text-xs font-semibold text-yellow-700 mb-2">⚠ Cảnh báo dữ liệu</p>
          {allErrors.map((e, i) => <p key={i} className="text-xs text-yellow-800">{e}</p>)}
        </div>
      )}

      {/* Step 2: Export */}
      {allRecords.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Bước 2 — Chọn khoảng thời gian &amp; Xuất file
          </p>
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">

            {/* Date range — áp dụng chung 3 kênh */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Khoảng thời gian báo cáo</p>
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Từ ngày</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Đến ngày</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  />
                </div>

                {/* Kết quả filter */}
                <div className="flex items-center gap-2 text-sm">
                  {isFiltered ? (
                    <span className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-2 rounded-lg font-medium">
                      {filteredCount.toLocaleString()} / {allRecords.length.toLocaleString()} dòng trong khoảng này
                    </span>
                  ) : (
                    <span className="bg-gray-50 text-gray-500 border border-gray-200 px-3 py-2 rounded-lg">
                      {allRecords.length.toLocaleString()} dòng tổng
                    </span>
                  )}
                </div>
              </div>

              {/* Breakdown theo kênh */}
              <div className="flex gap-2 mt-3">
                {results.map((r) => {
                  const channelFiltered = filterByDate(r.preview as UnifiedRow[], dateFrom, dateTo).length;
                  return (
                    <span key={r.source} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">
                      {r.source === "shopee" ? "📦" : r.source === "tiktok" ? "🎵" : "🧾"}
                      {" "}{channelFiltered.toLocaleString()} dòng
                    </span>
                  );
                })}
                {results.some((r) => r.source === "pos_cake") && (
                  <span className="text-xs text-gray-400 italic py-1">
                    * POS Cake: ngày được gán theo khoảng đã chọn
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Export buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleExportCSV} disabled={exporting || filteredCount === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Tải 1 file CSV
                {isFiltered && <span className="opacity-70 text-xs">({filteredCount.toLocaleString()})</span>}
              </button>
              <button
                onClick={handleExportSQL} disabled={exporting || filteredCount === 0}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-gray-400 disabled:opacity-50 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Xuất SQL
              </button>
            </div>
          </div>
        </div>
      )}

      {allRecords.length > 0 && <PreviewTable records={filterByDate(allRecords, dateFrom, dateTo)} />}
      {sqlOutput && <SqlOutput sql={sqlOutput} onClose={() => setSqlOutput("")} />}
    </div>
  );
}
