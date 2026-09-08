# -*- coding: utf-8 -*-
from __future__ import annotations

import sqlite3
import tempfile
import unittest
from pathlib import Path

from lead_11a_evidence import connect, insert_approved, latest_approved


class Lead11AEvidenceTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.db = Path(self.tmp.name) / "test.db"
        with sqlite3.connect(self.db) as con:
            con.execute("CREATE TABLE leads (id INTEGER PRIMARY KEY, company_name TEXT)")
            con.execute("INSERT INTO leads(id, company_name) VALUES(1721, 'soil by ROMMY.')")
            con.commit()

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def payload(self, html: str) -> dict:
        return dict(
            lead_id=1721,
            store_id="soil-by-rommy",
            store_name="soil by ROMMY.",
            evidence=[{"type":"REVIEW_TREND","signal":"CONSULTATION","value":"相談しやすい"}],
            customer_voice_summary=["相談しやすい"],
            service_signals=["髪質改善","ショート"],
            store_taste="warm editorial / consultation first",
            image_color_direction={"base":"warm greige","accent":"muted olive"},
            creative_interpretation="髪の悩みも、なりたいイメージも、話しながら自然に形にしていける",
            visual_direction_summary={"photography":"natural hair texture","density":"low-medium"},
            approved_lp_html=html,
        )

    def test_revision_and_latest(self) -> None:
        with connect(self.db) as con:
            r1 = insert_approved(con, **self.payload("<html>v1</html>"))
            r2 = insert_approved(con, **self.payload("<html>v2</html>"))
            self.assertEqual(r1["revision"], 1)
            self.assertEqual(r2["revision"], 2)
            latest = latest_approved(con, 1721)
            self.assertEqual(latest["revision"], 2)
            self.assertEqual(latest["approved_lp_html"], "<html>v2</html>")
            self.assertEqual(latest["stage_11a_status"], "APPROVED_11A")
            self.assertEqual(latest["next_stage"], "11B_DIAGNOSIS_INTEGRATION")

    def test_unknown_lead_blocks(self) -> None:
        with connect(self.db) as con:
            bad = self.payload("<html>x</html>")
            bad["lead_id"] = 9999
            with self.assertRaises(ValueError):
                insert_approved(con, **bad)


if __name__ == "__main__":
    unittest.main()
