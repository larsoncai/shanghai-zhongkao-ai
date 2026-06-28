import math

from backend.data.demo_data import BATCH_LABELS, DISTRICTS, MIDDLE_BY_ID, SCHOOLS

DISCLAIMER = "本系统使用2025演示数据推演2026结果，仅供产品演示，不代表官方录取线或录取结论。"


def validate_candidate(district: str, middle_school_id: str, score: float):
    if district not in DISTRICTS:
        raise ValueError("请选择有效的上海市行政区")
    middle = MIDDLE_BY_ID.get(middle_school_id)
    if not middle:
        raise ValueError("请选择有效的示例初中")
    if middle["district"] != district:
        raise ValueError("所选初中不属于考生所在区")
    if not 0 <= score <= 750:
        raise ValueError("中考分数必须在0至750分之间")
    return middle


def sigmoid_probability(score: float, predicted_line: float, batch: str) -> float:
    base = 1 / (1 + math.exp(-(score - predicted_line) / 6))
    modifier = {"to_school": 0.03, "to_district": 0.01, "unified": 0}[batch]
    return round(max(0.01, min(0.99, base + modifier)), 4)


def recommendation_tier(probability: float) -> str:
    if probability < 0.25:
        return "高风险"
    if probability < 0.55:
        return "冲"
    if probability < 0.80:
        return "稳"
    return "保"


def batch_eligibility(school: dict, district: str, middle: dict, batch: str):
    local_or_cross = school["district"] == district or district in school["cross_districts"]
    if batch == "to_school":
        quota = middle["school_quotas"].get(school["id"], 0)
        return quota > 0, quota, "该初中无此校演示到校名额" if quota <= 0 else "具备演示到校资格"
    if batch == "to_district":
        quota = school["quotas"]["to_district"] if local_or_cross else 0
        return quota > 0, quota, "该校未向考生所在区开放演示到区名额" if quota <= 0 else "具备演示到区资格"
    quota = school["quotas"]["unified"] if local_or_cross else 0
    return quota > 0, quota, "该校不在本区或演示跨区招生范围内" if quota <= 0 else "具备统一招生资格"


def school_recommendation(school: dict, district: str, middle: dict, score: float):
    batches = []
    for batch in BATCH_LABELS:
        eligible, quota, reason = batch_eligibility(school, district, middle, batch)
        if not eligible:
            continue
        line_2025 = school["lines_2025"][batch]
        predicted = line_2025 + school["trend"]
        probability = sigmoid_probability(score, predicted, batch)
        batches.append({
            "key": batch,
            "label": BATCH_LABELS[batch],
            "line_2025": line_2025,
            "predicted_line_2026": predicted,
            "difference": round(score - predicted, 1),
            "probability": probability,
            "probability_percent": round(probability * 100, 1),
            "tier": recommendation_tier(probability),
            "quota": quota,
            "eligibility": reason,
        })
    if not batches:
        return None
    best = max(batches, key=lambda item: item["probability"])
    return {
        "id": school["id"],
        "name": school["name"],
        "district": school["district"],
        "type": school["type"],
        "scope": "本区" if school["district"] == district else "跨区",
        "trend": school["trend"],
        "best_probability": best["probability"],
        "best_probability_percent": best["probability_percent"],
        "best_tier": best["tier"],
        "batches": batches,
    }


def build_recommendations(district: str, middle_school_id: str, score: float):
    middle = validate_candidate(district, middle_school_id, score)
    schools = [school_recommendation(s, district, middle, score) for s in SCHOOLS]
    schools = [school for school in schools if school]
    schools.sort(key=lambda item: item["best_probability"], reverse=True)
    return {
        "candidate": {
            "district": district,
            "middle_school_id": middle["id"],
            "middle_school_name": middle["name"],
            "score": score,
        },
        "schools": schools,
        "disclaimer": DISCLAIMER,
    }
