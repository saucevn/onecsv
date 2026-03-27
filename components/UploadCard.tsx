"use client";
import { useRef } from "react";
import type { UploadResult } from "@/types/etl";

type Props = {
  source: string;
  label: string;
  icon: string;
  color: string;
  result?: UploadResult;
  loading: boolean;
  onUpload: (source: string, file: File) => void;
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

export default function UploadCard({
  source, label, icon, color, result, loading, onUpload,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload(source, file);
    e.target.value = "";
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-5 cursor-pointer transition-all ${colorMap[color] ?? colorMap.orange}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleChange}
      />

      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeMap[color]}`}>
          {label}
        </span>
      </div>

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
          <p className="text-xs text-gray-400 mt-2 underline">Bấm để upload lại</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600 font-medium">Chọn file CSV / Excel</p>
          <p className="text-xs text-gray-400 mt-1">Bấm để mở file browser</p>
        </div>
      )}
    </div>
  );
}
