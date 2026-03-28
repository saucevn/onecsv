"use client";
import { useState } from "react";

type Props = {
  sql:      string;
  rows:     number;
  onClose:  () => void;
  onDownload: () => void;
};

export default function SqlOutput({ sql, rows, onClose, onDownload }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Chỉ preview 200 dòng đầu trong textarea để tránh lag UI
  const preview  = sql.split("\n").slice(0, 200).join("\n");
  const isTrunc  = sql.split("\n").length > 200;

  return (
    <div className="bg-gray-950 rounded-xl overflow-hidden border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-green-400 font-semibold">SQL Output</span>
          <span className="text-xs text-gray-500">
            {rows.toLocaleString()} dòng · {Math.ceil(rows / 500)} batch INSERT
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="text-xs px-3 py-1 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition"
          >
            {copied ? "✓ Đã copy" : "Copy"}
          </button>
          <button
            onClick={onDownload}
            className="text-xs px-3 py-1 bg-green-700 text-white rounded hover:bg-green-600 transition flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Tải .sql
          </button>
          <button
            onClick={onClose}
            className="text-xs px-3 py-1 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Preview */}
      <textarea
        readOnly
        value={preview}
        className="w-full h-72 font-mono text-xs p-4 bg-gray-950 text-green-400 resize-none outline-none"
      />

      {/* Truncation notice */}
      {isTrunc && (
        <div className="px-4 py-2 border-t border-gray-800 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Đang hiển thị 200 / {sql.split("\n").length.toLocaleString()} dòng — bấm "Tải .sql" để lấy file đầy đủ
          </span>
        </div>
      )}
    </div>
  );
}
