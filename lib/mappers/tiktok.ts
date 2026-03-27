import type { UnifiedRow } from "@/lib/types";
import { cleanMoney, parseDate, str } from "@/lib/etl-utils";

type MapperOpts = { dateFrom?: string; dateTo?: string };

export function mapTiktok(rows: Record<string, unknown>[], _opts: MapperOpts = {}): UnifiedRow[] {
  return rows
    .filter((row) => {
      const id = str(row["Order ID"]);
      return id !== "" && !id.toLowerCase().includes("platform unique");
    })
    .map((row) => {
      const gross = cleanMoney(row["Order Amount"]);

      return {
        order_id:       str(row["Order ID"]),
        order_date:     parseDate(row["Created Time"] ?? row["Paid Time"]),
        channel:        "TikTok Shop",
        sku:            str(row["Seller SKU"]),
        product_name:   str(row["Product Name"]),
        quantity:       parseFloat(str(row["Quantity"])) || 0,
        unit_price:     cleanMoney(row["SKU Unit Original Price"]),
        gross_revenue:  gross,
        platform_fee:   0,
        net_revenue:    gross,
        currency:       "VND",
        customer_name:  str(row["Buyer Username"]),
        customer_phone: str(row["Phone #"]),
        status:         str(row["Order Status"]),
        payment_method: str(row["Payment Method"]),
      };
    });
}
