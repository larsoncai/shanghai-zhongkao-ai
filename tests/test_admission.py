from types import SimpleNamespace

import pytest

from backend.data.demo_data import MIDDLE_SCHOOLS
from backend.services.admission import simulate_admission


def wishes(**overrides):
    data = {"to_school": [], "to_district": [], "unified": []}
    data.update(overrides)
    return SimpleNamespace(**data)


def test_to_school_batch_wins_before_later_batches():
    middle = next(item for item in MIDDLE_SCHOOLS if item["district"] == "徐汇区")
    school_id = next(iter(middle["school_quotas"]))
    result = simulate_admission("徐汇区", middle["id"], 750, wishes(to_school=[school_id], unified=["shanghai"]))
    assert result["admitted"] is True
    assert result["result"]["batch"] == "to_school"
    assert len(result["timeline"]) == 1


def test_failed_choice_continues_to_next_choice():
    middle = next(item for item in MIDDLE_SCHOOLS if item["district"] == "徐汇区")
    result = simulate_admission("徐汇区", middle["id"], 700, wishes(unified=["shanghai", "no2"]))
    assert result["admitted"] is True
    assert result["result"]["school_id"] == "no2"
    assert result["timeline"][0]["passed"] is False


def test_duplicate_wish_is_rejected():
    middle = next(item for item in MIDDLE_SCHOOLS if item["district"] == "徐汇区")
    with pytest.raises(ValueError, match="不能重复"):
        simulate_admission("徐汇区", middle["id"], 700, wishes(unified=["shanghai", "shanghai"]))


def test_middle_school_must_match_district():
    middle = next(item for item in MIDDLE_SCHOOLS if item["district"] == "徐汇区")
    with pytest.raises(ValueError, match="不属于"):
        simulate_admission("浦东新区", middle["id"], 700, wishes())
