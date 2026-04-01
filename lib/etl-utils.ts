/**
 * ETL Utilities — One CSV v2
 * Shared helpers cho tất cả mappers
 */

/** Xóa ký tự tiền tệ, dấu phẩy → number */
export function cleanMoney(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0;
  const cleaned = String(val).replace(/[^\d.]/g, "");
  return cleaned === "" ? 0 : parseFloat(cleaned) || 0;
}

/** String safe */
export function str(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

/** Int safe */
export function num(val: unknown): number {
  const n = parseFloat(str(val).replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
}

/**
 * Parse ngày Shopee: "YYYY-MM-DD HH:MM" hoặc "YYYY-MM-DD"
 * → "YYYY-MM-DD HH:MM:SS"
 */
export function parseDateShopee(val: unknown): string {
  const s = str(val);
  if (!s) return "";
  // Đã là ISO-like format → chỉ cần normalize
  const d = new Date(s);
  if (!isNaN(d.getTime())) return toISO(d);
  return "";
}

/**
 * Parse ngày TikTok: "DD/MM/YYYY HH:MM:SS"
 * → "YYYY-MM-DD HH:MM:SS"
 */
export function parseDateTikTok(val: unknown): string {
  const s = str(val);
  if (!s) return "";
  // Match DD/MM/YYYY HH:MM:SS
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{2}:\d{2}:\d{2})$/);
  if (m) {
    const [, dd, mm, yyyy, time] = m;
    return `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")} ${time}`;
  }
  // Match DD/MM/YYYY chỉ có ngày
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m2) {
    const [, dd, mm, yyyy] = m2;
    return `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")} 00:00:00`;
  }
  return "";
}

/**
 * Parse ngày POS Cake: "HH:MM DD/MM/YYYY"
 * → "YYYY-MM-DD HH:MM:SS"
 */
export function parseDatePOS(val: unknown): string {
  const s = str(val);
  if (!s) return "";
  // Match "HH:MM DD/MM/YYYY"
  const m = s.match(/^(\d{2}:\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, time, dd, mm, yyyy] = m;
    return `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")} ${time}:00`;
  }
  // Match "DD/MM/YYYY" (Ngày tạo đơn — date only)
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m2) {
    const [, dd, mm, yyyy] = m2;
    return `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")} 00:00:00`;
  }
  return "";
}

/** Date object → "YYYY-MM-DD HH:MM:SS" */
function toISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
