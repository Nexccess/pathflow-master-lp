#!/usr/bin/env python3
from __future__ import annotations

import unittest

from design_intelligence_filter import disposition, filter_document


BASE = {
    "candidateId": "x",
    "category": "color",
    "recommendation": "candidate",
    "evidenceAlignment": "PASS",
    "creativeConceptAlignment": "PASS",
    "storeSpecificity": "HIGH",
    "genericnessRisk": "LOW",
    "claimSafety": "PASS",
    "existingBrandAlignment": "PASS",
    "reasons": [],
}


class DesignIntelligenceFilterTests(unittest.TestCase):
    def test_accept_when_all_filters_pass(self) -> None:
        result, reasons = disposition(dict(BASE))
        self.assertEqual(result, "ACCEPT")
        self.assertEqual(reasons, ["all_mandatory_filters_passed"])

    def test_rejects_evidence_conflict(self) -> None:
        candidate = dict(BASE, evidenceAlignment="CONFLICT")
        result, reasons = disposition(candidate)
        self.assertEqual(result, "REJECT")
        self.assertIn("store_evidence_conflict", reasons)

    def test_rejects_generic_low_specificity_candidate(self) -> None:
        candidate = dict(BASE, storeSpecificity="LOW", genericnessRisk="HIGH")
        result, reasons = disposition(candidate)
        self.assertEqual(result, "REJECT")
        self.assertIn("generic_industry_preset_risk", reasons)

    def test_unknown_never_silently_passes(self) -> None:
        candidate = dict(BASE, existingBrandAlignment="UNKNOWN")
        result, reasons = disposition(candidate)
        self.assertEqual(result, "REVIEW_REQUIRED")
        self.assertTrue(reasons[0].startswith("unknown:"))

    def test_partial_alignment_requires_modification(self) -> None:
        candidate = dict(BASE, creativeConceptAlignment="PARTIAL")
        result, reasons = disposition(candidate)
        self.assertEqual(result, "MODIFY")
        self.assertIn("partial_creative_concept_alignment", reasons)

    def test_document_preserves_original_assessment(self) -> None:
        result = filter_document({"storeId": "girasol", "candidates": [dict(BASE)]})
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["summary"]["ACCEPT"], 1)
        self.assertEqual(result["candidates"][0]["originalAssessment"]["claimSafety"], "PASS")


if __name__ == "__main__":
    unittest.main()
