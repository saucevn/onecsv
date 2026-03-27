"""
Shopee → Unified Schema
Cột export Shopee thường gặp (Seller Center):
  Mã đơn hàng, Thời gian đặt hàng, Tên người mua, Số điện thoại người mua,
  Tên sản phẩm, SKU sản phẩm, Số lượng, Giá gốc (VNĐ), Thành tiền,
  Phí dịch vụ (%), Trạng thái đơn hàng, Phương thức thanh toán
"""
import pandas as pd

SHOPEE_COL_MAP = {
    "Mã đơn hàng":               "order_id",
    "Thời gian đặt hàng":        "order_date",
    "Tên người mua":             "customer_name",
    "Số điện thoại người mua":   "customer_phone",
    "Tên sản phẩm":              "product_name",
    "SKU sản phẩm":              "sku",
    "Số lượng":                  "quantity",
    "Giá gốc (VNĐ)":            "unit_price",
    "Thành tiền":                "gross_revenue",
    "Phí dịch vụ (%)":          "platform_fee_pct",
    "Trạng thái đơn hàng":       "status",
    "Phương thức thanh toán":    "payment_method",
}


def _clean_money(s: pd.Series) -> pd.Series:
    return (
        s.astype(str)
        .str.replace(r"[^\d.]", "", regex=True)
        .replace("", "0")
        .astype(float)
    )


def map_shopee(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.rename(columns={k: v for k, v in SHOPEE_COL_MAP.items() if k in df.columns}, inplace=True)

    # Datetime
    if "order_date" in df.columns:
        df["order_date"] = pd.to_datetime(df["order_date"], dayfirst=True, errors="coerce")

    # Money
    for col in ["unit_price", "gross_revenue"]:
        if col in df.columns:
            df[col] = _clean_money(df[col])

    # Platform fee: % → VNĐ
    if "platform_fee_pct" in df.columns:
        df["platform_fee_pct"] = (
            df["platform_fee_pct"].astype(str).str.replace("%", "").str.strip()
            .replace("", "0").astype(float)
        )
        df["platform_fee"] = df.get("gross_revenue", pd.Series(0.0, index=df.index)) \
                             * df["platform_fee_pct"] / 100
    else:
        df["platform_fee"] = 0.0

    df["net_revenue"] = df.get("gross_revenue", 0) - df["platform_fee"]
    df["channel"]     = "Shopee"
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
