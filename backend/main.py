from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.data.demo_data import DISTRICTS, MIDDLE_SCHOOLS
from backend.schemas import RecommendationResponse, CandidateInput, SimulationRequest, SimulationResponse
from backend.services.admission import simulate_admission
from backend.services.recommendation import build_recommendations

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(
    title="上海中考AI志愿系统",
    description="基于2025演示数据和可解释Sigmoid模型的2026志愿推荐演示API。",
    version="1.0.0",
)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "上海中考AI志愿系统"}


@app.get("/api/districts")
def districts():
    return {"districts": DISTRICTS}


@app.get("/api/middle-schools")
def middle_schools(district: str = Query(...)):
    if district not in DISTRICTS:
        raise HTTPException(status_code=400, detail="请选择有效的上海市行政区")
    return {"schools": [{"id": item["id"], "name": item["name"]} for item in MIDDLE_SCHOOLS if item["district"] == district]}


@app.post("/api/recommendations", response_model=RecommendationResponse)
def recommendations(payload: CandidateInput):
    try:
        return build_recommendations(payload.district, payload.middle_school_id, payload.score)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/api/simulate", response_model=SimulationResponse)
def simulate(payload: SimulationRequest):
    try:
        return simulate_admission(payload.district, payload.middle_school_id, payload.score, payload.wishes)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


@app.get("/", include_in_schema=False)
def index():
    return FileResponse(FRONTEND_DIR / "index.html")
