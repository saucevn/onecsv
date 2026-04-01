import { NextResponse } from "next/server";

// Export CSV và SQL đã chuyển sang client-side hoàn toàn.
// Route này không còn được sử dụng — giữ lại để tránh 404.
export async function POST() {
  return NextResponse.json(
    { error: "Deprecated. Export được xử lý client-side." },
    { status: 410 }
  );
}
