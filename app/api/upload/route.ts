import { NextResponse } from "next/server";

// Parse file đã chuyển sang client-side hoàn toàn (lib/client-etl.ts).
// Route này không còn được sử dụng — giữ lại để tránh 404.
export async function POST() {
  return NextResponse.json(
    { error: "Deprecated. Upload được xử lý client-side." },
    { status: 410 }
  );
}
