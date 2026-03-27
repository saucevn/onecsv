import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ladospice — ETL Dashboard",
  description: "Chuẩn hóa dữ liệu đơn hàng từ Shopee, TikTok Shop, POS Cake",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
          <span className="font-semibold text-gray-900 text-lg">🌶 Ladospice</span>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">Trang chủ</Link>
          <Link href="/etl" className="text-sm text-gray-500 hover:text-gray-900">ETL Tool</Link>
        </nav>
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </body>
    </html>
  );
}
