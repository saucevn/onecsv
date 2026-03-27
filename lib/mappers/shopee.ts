import type { UnifiedRow } from "@/lib/types";
import { cleanMoney, parseDate, str } from "@/lib/etl-utils";

type MapperOpts = { dateFrom?: string; dateTo?: string };

export function mapShopee(rows: Record<string, unknown>[], _opts: MapperOpts = {}): UnifiedRow[] {
  return rows.map((row) => {
    const gross = cleanMoney(
      row["Tổng số tiền Người mua thanh toán"] ??
      row["Tổng giá trị đơn hàng (VND)"]
    );

    const fee = cleanMoney(row["Phí cố định"])
              + cleanMoney(row["Phí Dịch Vụ"])
              + cleanMoney(row["Phí thanh toán"]);

    return {
      order_id:       str(row["Mã đơn hàng"]),
      order_date:     parseDate(row["Ngày đặt hàng"]),
      channel:        "Shopee",
      sku:            str(row["SKU phân loại hàng"]) || str(row["SKU sản phẩm"]),
      product_name:   str(row["Tên sản phẩm"]),
      quantity:       parseFloat(str(row["Số lượng"])) || 0,
      unit_price:     cleanMoney(row["Giá gốc"]),
      gross_revenue:  gross,
      platform_fee:   parseFloat(fee.toFixed(0)),
      net_revenue:    parseFloat((gross - fee).toFixed(0)),
      currency:       "VND",
      customer_name:  str(row["Người Mua"]),
      customer_phone: str(row["Số điện thoại"]),
      status:         str(row["Trạng Thái Đơn Hàng"]),
      payment_method: str(row["Phương thức thanh toán"]),
    };
  });
}
