"use client";
import { useState } from "react";
import UploadCard from "@/components/UploadCard";
import PreviewTable from "@/components/PreviewTable";
import SqlOutput from "@/components/SqlOutput";
import type { UploadResult } from "@/types/etl";
import type { UnifiedRow } from "@/lib/types";

export default function ETLPage() {
  const [results, setResults]     = useState<UploadResult[]>([]);
  const [loading, setLoading]     = useState<string | null>(null);
  const [sqlOutput, setSqlOutput] = useState("");
  const [exporting, setExporting] = useState(false);

  const allRecords: UnifiedRow[] = results.flatMap((r) => r.preview as UnifiedRow[]);
  const allErrors  = results.flatMap((r) => r.errors.map((e) => `[${r.source}] ${e}`));

  async function handleUpload(
    source: string,
    file: File,
    extra: Record<string, string> = {}
  ) {
    setLoading(source);
    const form = new FormData();
    form.append("file", file);
    form.append("source", source);
    // Truyền thêm metadata (date_from, date_to cho POS Cake)
    for (const [k, v] of Object.entries(extra)) form.append(k, v);

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
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: allRecords, format: "csv" }),
      });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = "unified_orders.csv"; a.click();
    } finally {
      setExporting(false);
    }
  }

  async function handleExportSQL() {
    setExporting(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: allRecords, format: "sql" }),
      });
      const { sql } = await res.json();
      setSqlOutput(sql);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ETL — Chuẩn hóa dữ liệu</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Upload file từ mỗi nền tảng. Hệ thống tự động map, làm sạch và gộp về unified schema.
        </p>
      </div>

      {/* Upload cards */}
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

      {/* Warnings */}
      {allErrors.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-1">
          <p className="text-xs font-semibold text-yellow-700 mb-2">⚠ Cảnh báo dữ liệu</p>
          {allErrors.map((e, i) => <p key={i} className="text-xs text-yellow-800">{e}</p>)}
        </div>
      )}

      {/* Stats + Export */}
      {allRecords.length > 0 && (
        <div className="flex flex-wrap items-center gap-6 bg-white border border-gray-200 rounded-xl p-4 text-sm">
          <div>
            <span className="text-2xl font-bold text-gray-900">{allRecords.length}</span>
            <span className="text-gray-400 ml-1">dòng tổng</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-gray-900">{results.length}</span>
            <span className="text-gray-400 ml-1">nguồn đã upload</span>
          </div>
          <div className="ml-auto flex gap-3">
            <button
              onClick={handleExportCSV} disabled={exporting}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition"
            >
              ⬇ Tải CSV
            </button>
            <button
              onClick={handleExportSQL} disabled={exporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {"<>"} Xuất SQL
            </button>
          </div>
        </div>
      )}

      {allRecords.length > 0 && <PreviewTable records={allRecords} />}
      {sqlOutput && <SqlOutput sql={sqlOutput} onClose={() => setSqlOutput("")} />}
    </div>
  );
}
