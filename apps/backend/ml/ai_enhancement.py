# Ml/ai_enhancement.py
from typing import Dict, Any

def enhance_prediction(prediction: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Adds AI insights and strategic advice to prediction
    """
    home = context.get("homeTeam")
    away = context.get("awayTeam")
    return {
        "prediction": prediction,
        "aiInsights": f"Based on {home} vs {away}, consider key player form.",
        "strategicAdvice": f"Favor {prediction['prediction']} for optimal outcomes."
    }