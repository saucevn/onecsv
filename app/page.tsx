import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-6">

      {/* Logo */}
      <div className="flex items-center gap-3">
        <span className="bg-blue-600 text-white text-2xl font-bold px-4 py-2 rounded-xl tracking-tight">1CSV</span>
      </div>

      <div>
        <h1 className="text-4xl font-bold text-gray-900">One CSV</h1>
        <p className="text-blue-600 font-medium mt-1 text-base">Đồng nhất dữ liệu bán hàng đa kênh về 1 file CSV duy nhất</p>
      </div>

      <p className="text-gray-400 max-w-lg text-base leading-relaxed">
        Upload báo cáo từ Shopee, TikTok Shop và POS Cake —
        hệ thống tự động chuẩn hóa, gộp và xuất ra 1 file CSV
        sẵn sàng kết nối Looker Studio.
      </p>

      <div className="flex gap-4 mt-2">
        <Link
          href="/etl"
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
        >
          Bắt đầu gộp dữ liệu →
        </Link>
        <Link
          href="https://github.com/saucevn/onecsv"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:border-gray-400 transition"
        >
          GitHub
        </Link>
      </div>

      {/* Source cards */}
      <div className="grid grid-cols-3 gap-4 mt-6 text-sm text-left w-full max-w-xl">
        {[
          { icon: "📦", title: "Shopee",      desc: "Seller Center export" },
          { icon: "🎵", title: "TikTok Shop", desc: "Seller Hub export"    },
          { icon: "🧾", title: "POS Cake",    desc: "Báo cáo đơn hàng"    },
        ].map((s) => (
          <div key={s.title} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="font-semibold text-gray-900 text-sm">{s.title}</div>
            <div className="text-gray-400 text-xs mt-0.5">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Arrow + output */}
      <div className="flex items-center gap-3 text-sm text-gray-400 mt-2">
        <span>3 nguồn dữ liệu</span>
        <span className="text-2xl">→</span>
        <span className="bg-blue-50 text-blue-700 font-semibold px-3 py-1 rounded-lg border border-blue-100">
          1 file CSV chuẩn
        </span>
      </div>

    </div>
  );
}
