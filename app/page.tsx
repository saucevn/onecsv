import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-6">
      <div className="text-6xl">🌶</div>
      <h1 className="text-4xl font-bold text-gray-900">Ladospice ETL</h1>
      <p className="text-gray-500 max-w-md text-lg">
        Chuẩn hóa dữ liệu đơn hàng từ Shopee, TikTok Shop và POS Cake về một
        định dạng thống nhất — sẵn sàng cho Looker Studio.
      </p>
      <div className="flex gap-4 mt-4">
        <Link
          href="/etl"
          className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition"
        >
          Bắt đầu ETL →
        </Link>
        <Link
          href="https://github.com/saucevn/ladospice"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:border-gray-500 transition"
        >
          GitHub
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-8 text-sm text-left">
        {[
          { icon: "📦", title: "Shopee",      desc: "CSV / Excel từ Seller Center" },
          { icon: "🎵", title: "TikTok Shop", desc: "CSV / Excel từ Seller Hub"    },
          { icon: "🧾", title: "POS Cake",    desc: "Báo cáo bán hàng xuất ra"     },
        ].map((s) => (
          <div key={s.title} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="font-semibold text-gray-900">{s.title}</div>
            <div className="text-gray-400 text-xs mt-1">{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
