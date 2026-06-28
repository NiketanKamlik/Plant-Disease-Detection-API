"""API-backed treatment and precaution guidance for plant diseases."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from .llm_service import get_medicine_advice


def get_local_advice(
    plant: str,
    disease: str,
    is_healthy: bool,
    suggestions: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, str]:
    return get_medicine_advice(plant, disease, is_healthy, suggestions=suggestions)