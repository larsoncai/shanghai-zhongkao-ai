from backend.data.demo_data import BATCH_LABELS, SCHOOL_BY_ID
from backend.services.recommendation import DISCLAIMER, batch_eligibility, validate_candidate


def simulate_admission(district: str, middle_school_id: str, score: float, wishes):
    middle = validate_candidate(district, middle_school_id, score)
    timeline = []
    for batch in BATCH_LABELS:
        school_ids = getattr(wishes, batch)
        if len(school_ids) != len(set(school_ids)):
            raise ValueError(f"{BATCH_LABELS[batch]}志愿中不能重复添加同一学校")
        for order, school_id in enumerate(school_ids, 1):
            school = SCHOOL_BY_ID.get(school_id)
            if not school:
                raise ValueError("志愿表中包含不存在的学校")
            eligible, quota, reason = batch_eligibility(school, district, middle, batch)
            predicted = school["lines_2025"][batch] + school["trend"]
            passed = eligible and quota > 0 and score >= predicted
            if not eligible:
                decision = reason
            elif quota <= 0:
                decision = "演示名额已用完"
            elif score < predicted:
                decision = f"低于2026预测线{round(predicted - score, 1)}分，继续检索"
            else:
                decision = "达到预测线且有演示名额，模拟录取"
            step = {
                "batch": batch,
                "batch_label": BATCH_LABELS[batch],
                "order": order,
                "school_id": school_id,
                "school_name": school["name"],
                "score": score,
                "predicted_line_2026": predicted,
                "quota": quota,
                "eligible": eligible,
                "passed": passed,
                "decision": decision,
            }
            timeline.append(step)
            if passed:
                return {"admitted": True, "result": step, "timeline": timeline, "disclaimer": DISCLAIMER}
    return {"admitted": False, "result": None, "timeline": timeline, "disclaimer": DISCLAIMER}
