import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "One CSV — Đồng nhất dữ liệu bán hàng đa kênh",
  description: "Gộp dữ liệu Shopee, TikTok Shop, POS Cake về 1 file CSV duy nhất cho Looker Studio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 text-lg">
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-md tracking-tight">1CSV</span>
            <span>One CSV</span>
          </Link>
          <div className="w-px h-4 bg-gray-200" />
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">Trang chủ</Link>
          <Link href="/etl" className="text-sm text-gray-500 hover:text-gray-900">Gộp dữ liệu</Link>
        </nav>
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </body>
    </html>
  );
}
