"use client";
import { useState } from "react";

type Props = {
  sql: string;
  onClose: () => void;
};

export default function SqlOutput({ sql, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-gray-950 rounded-xl overflow-hidden border border-gray-800">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <span className="text-xs font-mono text-green-400">SQL Output</span>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="text-xs px-3 py-1 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition"
          >
            {copied ? "✓ Đã copy" : "Copy"}
          </button>
          <button
            onClick={onClose}
            className="text-xs px-3 py-1 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition"
          >
            Đóng
          </button>
        </div>
      </div>
      <textarea
        readOnly
        value={sql}
        className="w-full h-72 font-mono text-xs p-4 bg-gray-950 text-green-400 resize-none outline-none"
      />
    </div>
  );
}
