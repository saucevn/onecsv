import pandas as pd


def validate_unified(df: pd.DataFrame) -> list[str]:
    """Kiểm tra data quality. Trả về danh sách cảnh báo."""
    errors: list[str] = []

    REQUIRED = ["order_id", "order_date", "channel", "gross_revenue"]
    for col in REQUIRED:
        if col not in df.columns or df[col].isnull().all():
            errors.append(f"Cột bắt buộc bị thiếu hoặc rỗng: '{col}'")

    if "order_id" in df.columns:
        dupes = int(df["order_id"].duplicated().sum())
        if dupes:
            errors.append(f"{dupes} mã đơn hàng bị trùng (order_id)")

    if "gross_revenue" in df.columns:
        neg = int((pd.to_numeric(df["gross_revenue"], errors="coerce").fillna(0) < 0).sum())
        if neg:
            errors.append(f"{neg} dòng có gross_revenue âm")

    if "order_date" in df.columns:
        bad = int(df["order_date"].isnull().sum())
        if bad:
            errors.append(f"{bad} dòng không parse được ngày tháng")

    return errors
