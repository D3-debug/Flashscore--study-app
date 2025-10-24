# Ml/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import logging
from predictionModel import MagajiCoMLPredictor
from ai_enhancement import enhance_prediction
from circuit_breaker import ml_circuit_breaker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MagajiCo ML API")

predictor = MagajiCoMLPredictor()

# ===== Request Models =====
class PredictionRequest(BaseModel):
    homeTeam: str
    awayTeam: str
    features: List[float]
    enableAI: bool = False

class BatchPredictionRequest(BaseModel):
    predictions: List[PredictionRequest]

class TrainRequest(BaseModel):
    data: List[List[float]]
    labels: List[int]

# ===== Endpoints =====
@app.get("/health")
def health_check():
    return {"status": "ok", "version": predictor.model_version}

@app.post("/predict")
def predict(req: PredictionRequest):
    try:
        result = ml_circuit_breaker.call(predictor.predict, req.features)
        if req.enableAI:
            result = enhance_prediction(result, {"homeTeam": req.homeTeam, "awayTeam": req.awayTeam})
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(e)
        # graceful fallback
        return {"success": False, "error": str(e), "fallback": "rule-based used"}

@app.post("/predict/batch")
def predict_batch(req: BatchPredictionRequest):
    results = []
    for p in req.predictions:
        try:
            res = ml_circuit_breaker.call(predictor.predict, p.features)
            if p.enableAI:
                res = enhance_prediction(res, {"homeTeam": p.homeTeam, "awayTeam": p.awayTeam})
            results.append(res)
        except Exception as e:
            results.append({"error": str(e), "fallback": "rule-based used"})
    return {"success": True, "results": results}

@app.post("/train")
def train_model(req: TrainRequest):
    try:
        return predictor.train(req.data, req.labels)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))