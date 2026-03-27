"""
POS Cake → Unified Schema
Cột export Cake POS:
  Mã hóa đơn, Thời gian, Tên món, Mã món,
  Số lượng, Đơn giá, Thành tiền, Giảm giá,
  Tổng tiền, Phương thức thanh toán, Trạng thái,
  Tên khách hàng, Số điện thoại
"""
import pandas as pd

CAKE_COL_MAP = {
    "Mã hóa đơn":               "order_id",
    "Thời gian":                 "order_date",
    "Tên món":                   "product_name",
    "Mã món":                    "sku",
    "Số lượng":                  "quantity",
    "Đơn giá":                   "unit_price",
    "Thành tiền":                "gross_revenue",
    "Giảm giá":                  "discount",
    "Tổng tiền":                 "net_revenue",
    "Phương thức thanh toán":    "payment_method",
    "Trạng thái":                "status",
    "Tên khách hàng":            "customer_name",
    "Số điện thoại":             "customer_phone",
}


def _clean_money(s: pd.Series) -> pd.Series:
    return (
        s.astype(str)
        .str.replace(r"[^\d.]", "", regex=True)
        .replace("", "0")
        .astype(float)
    )


def map_pos_cake(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.rename(columns={k: v for k, v in CAKE_COL_MAP.items() if k in df.columns}, inplace=True)

    if "order_date" in df.columns:
        df["order_date"] = pd.to_datetime(df["order_date"], dayfirst=True, errors="coerce")

    for col in ["unit_price", "gross_revenue", "net_revenue", "discount"]:
        if col in df.columns:
            df[col] = _clean_money(df[col])

    # POS không có platform_fee
    df["platform_fee"] = 0.0

    # Tính net_revenue nếu chưa có
    if "net_revenue" not in df.columns or df["net_revenue"].isnull().all():
        gross    = df.get("gross_revenue", pd.Series(0.0, index=df.index))
        discount = df.get("discount",      pd.Series(0.0, index=df.index))
        df["net_revenue"] = gross - discount

    df["channel"]  = "POS Cake"
    df["currency"] = "VND"

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
