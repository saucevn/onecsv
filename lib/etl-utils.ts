/** Xóa ký tự tiền tệ, dấu phẩy → number */
export function cleanMoney(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0;
  const cleaned = String(val).replace(/[^\d.]/g, "");
  return cleaned === "" ? 0 : parseFloat(cleaned) || 0;
}

/** Parse ngày tháng linh hoạt → ISO string hoặc "" nếu lỗi */
export function parseDate(val: unknown): string {
  if (!val) return "";
  const s = String(val).trim();
  if (!s) return "";

  // dd/mm/yyyy hoặc dd-mm-yyyy → yyyy-mm-dd
  const dmySlash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(.*)/);
  if (dmySlash) {
    const iso = `${dmySlash[3]}-${dmySlash[2].padStart(2,"0")}-${dmySlash[1].padStart(2,"0")}${dmySlash[4]}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 19);
  }

  const dmyDash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(.*)/);
  if (dmyDash) {
    const iso = `${dmyDash[3]}-${dmyDash[2].padStart(2,"0")}-${dmyDash[1].padStart(2,"0")}${dmyDash[4]}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 19);
  }

  // ISO / yyyy-mm-dd / native
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 19);

  return "";
}

export function str(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}
