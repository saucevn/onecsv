from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pandas as pd
import io

from mappers.shopee import map_shopee
from mappers.tiktok import map_tiktok
from mappers.pos_cake import map_pos_cake
from utils.sql_generator import generate_sql
from utils.validator import validate_unified

app = FastAPI(title="Ladospice ETL API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ladospice.vercel.app",
        "http://localhost:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

MAPPERS = {
    "shopee":   map_shopee,
    "tiktok":   map_tiktok,
    "pos_cake": map_pos_cake,
}


@app.get("/")
def health():
    return {"status": "ok", "service": "Ladospice ETL API"}


@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    source: str = Form(...),
):
    """
    Upload CSV/Excel từ một nền tảng → trả về unified schema dạng JSON.
    source: "shopee" | "tiktok" | "pos_cake"
    """
    if source not in MAPPERS:
        raise HTTPException(400, f"Unknown source '{source}'. Chọn: {list(MAPPERS)}")

    content = await file.read()
    name = file.filename or ""

    try:
        if name.lower().endswith(".csv"):
            # Thử utf-8-sig trước (Excel CSV Vietnam), fallback utf-8
            try:
                raw_df = pd.read_csv(io.BytesIO(content), encoding="utf-8-sig")
            except Exception:
                raw_df = pd.read_csv(io.BytesIO(content), encoding="utf-8")
        else:
            raw_df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(422, f"Không đọc được file: {e}")

    unified_df = MAPPERS[source](raw_df)
    errors = validate_unified(unified_df)

    # Convert datetime → ISO string để JSON serialize được
    for col in unified_df.select_dtypes(include=["datetime64[ns]", "datetimetz"]).columns:
        unified_df[col] = unified_df[col].dt.strftime("%Y-%m-%dT%H:%M:%S")

    return {
        "rows":    len(unified_df),
        "errors":  errors,
        "preview": unified_df.fillna("").to_dict(orient="records"),
    }


@app.post("/api/export/csv")
async def export_csv(payload: dict):
    """Gộp tất cả records → CSV download (UTF-8 BOM cho Excel)."""
    records = payload.get("records", [])
    if not records:
        raise HTTPException(400, "Không có dữ liệu để export")

    df = pd.DataFrame(records)
    stream = io.StringIO()
    df.to_csv(stream, index=False, encoding="utf-8-sig")
    stream.seek(0)

    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv; charset=utf-8-sig",
        headers={"Content-Disposition": 'attachment; filename="unified_orders.csv"'},
    )


@app.post("/api/export/sql")
async def export_sql(payload: dict):
    """Tạo CREATE TABLE + INSERT INTO SQL từ unified records."""
    records = payload.get("records", [])
    if not records:
        raise HTTPException(400, "Không có dữ liệu để export")

    sql = generate_sql(pd.DataFrame(records))
    return {"sql": sql}
