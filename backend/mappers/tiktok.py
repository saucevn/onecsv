"""
TikTok Shop → Unified Schema
Cột export TikTok Seller Hub:
  Order ID, Order Creation Time, Product Name, Seller SKU,
  Quantity, SKU Unit Original Price, Order Amount,
  Platform Commission, Buyer Username, Shipping Address Phone,
  Order Status, Payment Method
"""
import pandas as pd

TIKTOK_COL_MAP = {
    "Order ID":                 "order_id",
    "Order Creation Time":      "order_date",
    "Product Name":             "product_name",
    "Seller SKU":               "sku",
    "Quantity":                 "quantity",
    "SKU Unit Original Price":  "unit_price",
    "Order Amount":             "gross_revenue",
    "Platform Commission":      "platform_fee",
    "Buyer Username":           "customer_name",
    "Shipping Address Phone":   "customer_phone",
    "Order Status":             "status",
    "Payment Method":           "payment_method",
}


def _to_num(s: pd.Series) -> pd.Series:
    return pd.to_numeric(
        s.astype(str).str.replace(r"[^\d.]", "", regex=True),
        errors="coerce",
    ).fillna(0.0)


def map_tiktok(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.rename(columns={k: v for k, v in TIKTOK_COL_MAP.items() if k in df.columns}, inplace=True)

    if "order_date" in df.columns:
        df["order_date"] = pd.to_datetime(df["order_date"], errors="coerce")

    for col in ["unit_price", "gross_revenue", "platform_fee"]:
        if col in df.columns:
            df[col] = _to_num(df[col])

    if "platform_fee" not in df.columns:
        df["platform_fee"] = 0.0

    df["net_revenue"] = df.get("gross_revenue", 0) - df["platform_fee"]
    df["channel"]     = "TikTok Shop"
    df["currency"]    = "VND"

    return _to_unified(df)


def _to_unified(df: pd.DataFrame) -> pd.DataFrame:
    cols = [
        "order_id", "order_date", "channel", "sku", "product_name",
        "quantity", "unit_price", "gross_revenue", "platform_fee",
        "net_revenue", "currency", "customer_name", "customer_phone",
        "status", "payment_method",
    ]
    for c in cols:
        if c not in df.columns:
            df[c] = None
    return df[cols]
