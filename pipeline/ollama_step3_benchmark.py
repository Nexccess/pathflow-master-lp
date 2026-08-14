#!/usr/bin/env python3
"""Run the Path-Flow Step3 golden-set benchmark against local Ollama/Qwen.

This script is deliberately local-only:
- reads prepared store input JSON files
- sends them to Ollama on localhost
- applies a deterministic grounding repair layer
- validates JSON structure and grounding quality
- compares quality-claim policy against benchmarks/golden-10.json
- writes raw and repaired outputs plus a summary report

It does NOT fetch Google/website data and does NOT deploy anything.
"""

from __future__ import annotations

import argparse
import json
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

DEFAULT_MODEL = "hf.co/Qwen/Qwen2.5-7B-Instruct-GGUF:latest"
DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
OWNER_PERSPECTIVE_TERMS = ("売上", "集客", "リピート率", "広告", "経営", "顧客獲得", "利益")
PLACEHOLDER_TERMS = ("strong/weak", "strong", "weak")
UNVERIFIED_SERVICE_TERMS = ("入会", "会員", "ネイルケア", "メンテナンス", "コース", "プラン")
GENERIC_FEATURE_TITLES = ("目的", "見え方の希望", "利用シーン", "利用経験", "予約前に整理したいこと")


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def post_json(url: str, payload: dict[str, Any], timeout: int = 180) -> dict[str, Any]:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return json.loads(res.read().decode("utf-8"))
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Ollama connection failed: {exc}") from exc


def build_prompt(system_prompt: str, source: dict[str, Any]) -> str:
    return (
        system_prompt
        + "\n\n以下が1店舗分の入力データです。入力情報だけを根拠に店舗カルテを生成してください。\n"
        + json.dumps(source, ensure_ascii=False, indent=2)
    )


def compact_text(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def confirmed_source_text(source: dict[str, Any]) -> str:
    facts = source.get("facts") or {}
    pieces: list[str] = []
    pieces.extend(str(x) for x in (facts.get("verifiedFacts") or []))
    for menu in facts.get("menus") or []:
        if isinstance(menu, dict):
            pieces.extend(str(v) for v in menu.values() if v)
        else:
            pieces.append(str(menu))
    return " ".join(pieces)


def safe_facts_only_questions() -> list[dict[str, Any]]:
    """A conservative receptionist fallback that expresses user intent, not store services."""
    return [
        {
            "id": "purpose",
            "text": "今回は、どんなことを相談したいですか？",
            "options": ["見た目を整えたい", "少し変化をつけたい", "初めてなので相談したい", "まだ決めていない"],
        },
        {
            "id": "preference",
            "text": "仕上がりのイメージはありますか？",
            "options": ["自然な印象にしたい", "少し変化を楽しみたい", "相談しながら決めたい", "まだ決めていない"],
        },
        {
            "id": "scene",
            "text": "どんな場面を意識していますか？",
            "options": ["仕事や日常", "特別な予定", "特に決めていない", "相談したい"],
        },
        {
            "id": "experience",
            "text": "こうしたお店の利用経験はありますか？",
            "options": ["初めて", "利用したことがある", "よく分からない", "相談したい"],
        },
    ]


def repair_grounding(output: dict[str, Any], source: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    """Deterministically remove known hallucination patterns without hiding the raw model output."""
    repaired = json.loads(json.dumps(output, ensure_ascii=False))
    repairs: list[str] = []

    facts = source.get("facts") or {}
    policy = repaired.get("policy") or {}
    experience = repaired.get("experience") or {}
    source_menus = facts.get("menus") or []
    verified_facts = [str(x) for x in (facts.get("verifiedFacts") or [])]

    # Never allow policy placeholders to leak into production data.
    if any(term.lower() in compact_text(policy).lower() for term in PLACEHOLDER_TERMS):
        policy["doNotPromote"] = [
            "入力で確認できない品質・効果・サービスを訴求しない",
            "ネガティブな口コミ内容を販促表現へ転用しない",
        ]
        policy["allowedRecommendationScope"] = [
            "来店客の希望を整理し、予約・問い合わせ時に伝えやすくする範囲"
        ]
        repairs.append("policy_placeholders_replaced")

    # facts_only features are not creative copy: rebuild them from verified facts only.
    if policy.get("qualityClaimMode") == "facts_only":
        safe_features = [
            {
                "title": fact,
                "text": f"確認済み情報として「{fact}」があります。",
                "evidenceRefs": [fact],
            }
            for fact in verified_facts
        ]
        if experience.get("features") != safe_features:
            experience["features"] = safe_features
            repairs.append("facts_only_features_rebuilt")

        if not str(experience.get("headline") or "").strip():
            store_name = str(facts.get("storeName") or "この店舗")
            experience["headline"] = f"{store_name}｜予約前の希望整理"
            repairs.append("empty_headline_repaired")

        # If no services/menus are verified, use a deterministic intent-only reception set.
        if not source_menus:
            exp_text = compact_text(experience)
            source_confirmed = confirmed_source_text(source)
            has_unverified_service = any(
                term in exp_text and term not in source_confirmed for term in UNVERIFIED_SERVICE_TERMS
            )
            if has_unverified_service:
                reception = experience.get("reception") or {}
                reception["questions"] = safe_facts_only_questions()
                reception["intro"] = "こんにちは。予約や問い合わせの前に、ご希望を簡単に整理します。"
                reception["recommendationPolicy"] = (
                    "回答を要約し、予約・問い合わせ時に伝えると相談が進めやすい希望を1つ提案する。"
                    "未確認のメニュー・価格・効果は出さない。"
                )
                reception["ctaLabel"] = "この内容で相談してみる"
                experience["reception"] = reception
                experience["flow"] = [
                    "相談したいことを整理する",
                    "仕上がりのイメージを整理する",
                    "利用する場面を整理する",
                    "利用経験を確認する",
                ]
                repairs.append("unverified_service_terms_removed")

    repaired["policy"] = policy
    repaired["experience"] = experience

    validation = repaired.get("validation") or {}
    if repairs and validation.get("status") == "PASS":
        validation["status"] = "PASS_WITH_LIMITED_SOURCE_DATA"
    repaired["validation"] = validation
    return repaired, repairs


def practical_validate(output: dict[str, Any], source: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    required_top = {"schemaVersion", "storeId", "source", "facts", "evidence", "policy", "experience", "validation"}
    missing = required_top - set(output)
    if missing:
        errors.append("missing_top_fields:" + ",".join(sorted(missing)))

    policy = output.get("policy") or {}
    if policy.get("qualityClaimMode") not in {"evidence_allowed", "facts_only"}:
        errors.append("invalid_qualityClaimMode")

    experience = output.get("experience") or {}
    if not str(experience.get("headline") or "").strip():
        errors.append("empty_headline")

    policy_text = compact_text(policy).lower()
    if any(term.lower() in policy_text for term in PLACEHOLDER_TERMS):
        errors.append("placeholder_policy_term")

    reception = experience.get("reception") or {}
    questions = reception.get("questions") or []
    if not (3 <= len(questions) <= 7):
        errors.append("question_count_out_of_range")

    verified_facts = set(str(x) for x in ((source.get("facts") or {}).get("verifiedFacts") or []))
    if policy.get("qualityClaimMode") == "facts_only":
        for feature in experience.get("features") or []:
            title = str(feature.get("title") or "")
            refs = [str(x) for x in (feature.get("evidenceRefs") or [])]
            if title in GENERIC_FEATURE_TITLES:
                errors.append("generic_question_used_as_feature:" + title)
            if not refs:
                errors.append("feature_without_evidence:" + title)
            elif verified_facts and not any(ref in verified_facts for ref in refs):
                errors.append("feature_evidence_not_verified:" + title)

    source_confirmed = confirmed_source_text(source)
    if not ((source.get("facts") or {}).get("menus") or []):
        exp_text = compact_text(experience)
        for term in UNVERIFIED_SERVICE_TERMS:
            if term in exp_text and term not in source_confirmed:
                errors.append("unverified_service_term:" + term)

    return errors


def owner_perspective_count(output: dict[str, Any]) -> int:
    questions = (((output.get("experience") or {}).get("reception") or {}).get("questions") or [])
    count = 0
    for q in questions:
        text = str(q.get("text", ""))
        if any(term in text for term in OWNER_PERSPECTIVE_TERMS):
            count += 1
    return count


def score_one(output: dict[str, Any], golden: dict[str, Any], source: dict[str, Any]) -> dict[str, Any]:
    validation = output.get("validation") or {}
    actual_mode = (output.get("policy") or {}).get("qualityClaimMode")
    expected_mode = golden["expectedQualityClaimMode"]
    return {
        "storeId": golden["storeId"],
        "storeName": golden["storeName"],
        "expectedQualityClaimMode": expected_mode,
        "actualQualityClaimMode": actual_mode,
        "qualityClaimModeMatch": actual_mode == expected_mode,
        "negativeReviewLeak": bool(validation.get("negativeReviewLeak", False)),
        "unsupportedClaimCount": len(validation.get("unsupportedClaims") or []),
        "unsupportedMenuReferenceCount": len(validation.get("unsupportedMenuReferences") or []),
        "factConflictCount": len(validation.get("factConflicts") or []),
        "ownerPerspectiveQuestionCount": owner_perspective_count(output),
        "structureErrors": practical_validate(output, source),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Benchmark local Qwen for Path-Flow Step3")
    parser.add_argument("input_dir", type=Path, help="Directory containing <storeId>.json input files")
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--url", default=DEFAULT_OLLAMA_URL)
    parser.add_argument("--golden", type=Path, default=Path("benchmarks/golden-10.json"))
    parser.add_argument("--system-prompt", type=Path, default=Path("prompts/step3_qwen_system.txt"))
    parser.add_argument("--schema", type=Path, default=Path("data/schema/store-card.schema.json"))
    parser.add_argument("--output-dir", type=Path, default=Path("benchmark-output"))
    parser.add_argument("--limit", type=int, default=0, help="0 = all available golden stores")
    parser.add_argument("--store-id", help="Run only one golden store, e.g. --store-id 44")
    args = parser.parse_args()

    golden_doc = load_json(args.golden)
    system_prompt = args.system_prompt.read_text(encoding="utf-8")
    schema = load_json(args.schema)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    results: list[dict[str, Any]] = []
    stores = golden_doc["stores"]
    if args.store_id:
        stores = [store for store in stores if str(store["storeId"]) == str(args.store_id)]
        if not stores:
            raise SystemExit(f"store id {args.store_id} is not present in the golden set")
    elif args.limit:
        stores = stores[: args.limit]

    for index, golden in enumerate(stores, 1):
        store_id = golden["storeId"]
        input_path = args.input_dir / f"{store_id}.json"
        if not input_path.exists():
            results.append({"storeId": store_id, "storeName": golden["storeName"], "status": "MISSING_INPUT"})
            print(f"[{index}/{len(stores)}] {store_id}: missing input")
            continue

        source = load_json(input_path)
        payload = {
            "model": args.model,
            "prompt": build_prompt(system_prompt, source),
            "stream": False,
            "format": schema,
            "options": {"temperature": 0.1},
        }

        print(f"[{index}/{len(stores)}] {store_id} {golden['storeName']} ...")
        started = time.perf_counter()
        try:
            response = post_json(args.url, payload)
            raw = response.get("response", "")
            raw_output = json.loads(raw)
            elapsed = round(time.perf_counter() - started, 2)
            (args.output_dir / f"{store_id}.raw.json").write_text(
                json.dumps(raw_output, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            output, repairs = repair_grounding(raw_output, source)
            (args.output_dir / f"{store_id}.json").write_text(
                json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            scored = score_one(output, golden, source)
            scored.update({"status": "OK", "elapsedSeconds": elapsed, "repairs": repairs})
            results.append(scored)
            suffix = "PASS" if not scored["structureErrors"] else "CHECK"
            repair_note = f" / repaired:{len(repairs)}" if repairs else ""
            print(f"  -> {scored['actualQualityClaimMode']} / {elapsed}s / {suffix}{repair_note}")
            for repair in repairs:
                print(f"     ~ {repair}")
            if scored["structureErrors"]:
                for error in scored["structureErrors"]:
                    print(f"     ! {error}")
        except Exception as exc:
            results.append({"storeId": store_id, "storeName": golden["storeName"], "status": "ERROR", "error": str(exc)})
            print(f"  -> ERROR: {exc}")

    completed = [r for r in results if r.get("status") == "OK"]
    matches = sum(1 for r in completed if r.get("qualityClaimModeMatch"))
    summary = {
        "model": args.model,
        "requestedStores": len(stores),
        "completedStores": len(completed),
        "qualityClaimModeAccuracy": (matches / len(completed)) if completed else None,
        "negativeReviewLeakCount": sum(1 for r in completed if r.get("negativeReviewLeak")),
        "unsupportedClaimCount": sum(int(r.get("unsupportedClaimCount", 0)) for r in completed),
        "unsupportedMenuReferenceCount": sum(int(r.get("unsupportedMenuReferenceCount", 0)) for r in completed),
        "ownerPerspectiveQuestionCount": sum(int(r.get("ownerPerspectiveQuestionCount", 0)) for r in completed),
        "structureErrorCount": sum(len(r.get("structureErrors") or []) for r in completed),
        "repairCount": sum(len(r.get("repairs") or []) for r in completed),
        "results": results,
    }
    (args.output_dir / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print("\n=== SUMMARY ===")
    print(json.dumps({k: v for k, v in summary.items() if k != "results"}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
