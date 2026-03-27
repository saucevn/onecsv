import pandas as pd


_PY_TO_SQL = {
    "object":          "TEXT",
    "int64":           "BIGINT",
    "float64":         "NUMERIC(18,2)",
    "datetime64[ns]":  "TIMESTAMP",
    "bool":            "BOOLEAN",
}


def generate_sql(df: pd.DataFrame, table: str = "unified_orders") -> str:
    if df.empty:
        return "-- Không có dữ liệu"

    # CREATE TABLE
    col_defs = []
    for col, dtype in df.dtypes.items():
        sql_type = _PY_TO_SQL.get(str(dtype), "TEXT")
        col_defs.append(f"  {col} {sql_type}")

    ddl = (
        f"-- ============================\n"
        f"-- Ladospice Unified Orders\n"
        f"-- ============================\n"
        f"CREATE TABLE IF NOT EXISTS {table} (\n"
        + ",\n".join(col_defs)
        + "\n);\n\n"
    )

    # INSERT INTO (batch-friendly)
    cols_str = ", ".join(str(c) for c in df.columns)
    rows = []
    for _, row in df.iterrows():
        vals = []
        for v in row:
            if pd.isna(v) or v == "":
                vals.append("NULL")
            elif isinstance(v, (int, float)):
                vals.append(str(v))
            elif isinstance(v, pd.Timestamp):
                vals.append(f"'{v.strftime('%Y-%m-%d %H:%M:%S')}'")
            else:
                safe = str(v).replace("'", "''")
                vals.append(f"'{safe}'")
        rows.append(f"({', '.join(vals)})")

    inserts = f"INSERT INTO {table} ({cols_str})\nVALUES\n"
    inserts += ",\n".join(rows) + ";"

    return ddl + inserts
