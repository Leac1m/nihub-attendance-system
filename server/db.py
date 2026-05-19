from __future__ import annotations

import json
from pathlib import Path
from typing import Any


DATA_FILE = Path(__file__).parent / "data" / "data.json"
print(f"Using data file: {DATA_FILE}")


def load_data() -> dict[str, Any]:
    if not DATA_FILE.exists():
        return {"courses": [], "staffs": []}

    with DATA_FILE.open("r", encoding="utf-8") as file:
        payload = json.load(file)

    if "courses" not in payload or not isinstance(payload["courses"], list):
        payload["courses"] = []
    if "staffs" not in payload or not isinstance(payload["staffs"], list):
        payload["staffs"] = []

    return payload


def save_data(data: dict[str, Any]) -> None:
    with DATA_FILE.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)