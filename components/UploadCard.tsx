"use client";
import { useRef, useState } from "react";
import type { UploadResult } from "@/types/etl";

type Extra = Record<string, string>;

type Props = {
  source: string;
  label: string;
  icon: string;
  color: string;
  result?: UploadResult;
  loading: boolean;
  onUpload: (source: string, file: File, extra?: Extra) => void;
};

const colorMap: Record<string, string> = {
  orange: "border-orange-200 bg-orange-50 hover:border-orange-400",
  pink:   "border-pink-200 bg-pink-50 hover:border-pink-400",
  teal:   "border-teal-200 bg-teal-50 hover:border-teal-400",
};

const badgeMap: Record<string, string> = {
  orange: "bg-orange-100 text-orange-700",
  pink:   "bg-pink-100 text-pink-700",
  teal:   "bg-teal-100 text-teal-700",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function UploadCard({
  source, label, icon, color, result, loading, onUpload,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dateFrom, setDateFrom] = useState(today());
  const [dateTo,   setDateTo]   = useState(today());

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Fix TypeScript: explicit Extra type, không dùng ternary với {}
    const extra: Extra | undefined =
      source === "pos_cake"
        ? { date_from: dateFrom, date_to: dateTo }
        : undefined;
    onUpload(source, file, extra);
    e.target.value = "";
  }

  const isPOS = source === "pos_cake";

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-5 transition-all ${colorMap[color] ?? colorMap.orange} ${isPOS ? "cursor-default" : "cursor-pointer"}`}
      onClick={isPOS ? undefined : () => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleChange}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeMap[color]}`}>
          {label}
        </span>
      </div>

      {/* Date picker — chỉ POS Cake */}
      {isPOS && (
        <div className="mb-3 space-y-1.5" onClick={(e) => e.stopPropagation()}>
          <p className="text-xs text-gray-500 font-medium">Khoảng thời gian đơn hàng</p>
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-0.5">Từ ngày</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full text-xs border border-teal-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-teal-400"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-0.5">Đến ngày</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full text-xs border border-teal-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-teal-400"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">* Ngày sẽ được gán đều cho tất cả đơn trong file</p>
        </div>
      )}

      {/* Status */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Đang xử lý...
        </div>
      ) : result ? (
        <div>
          <p className="text-xs text-green-600 font-medium">✓ {result.filename}</p>
          <p className="text-xs text-gray-500 mt-1">{result.rows} dòng đã chuẩn hóa</p>
          <button
            onClick={() => inputRef.current?.click()}
            className="text-xs text-gray-400 underline mt-2 block"
          >
            Bấm để upload lại
          </button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} className="w-full text-left">
          <p className="text-sm text-gray-600 font-medium">Chọn file CSV / Excel</p>
          <p className="text-xs text-gray-400 mt-1">Bấm để mở file browser</p>
        </button>
      )}
    </div>
  );
}
