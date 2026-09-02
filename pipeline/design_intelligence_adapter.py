#!/usr/bin/env python3
"""11A adapter for UI/UX Pro Max candidate generation.

Boundary:
- Executes the local UI/UX Pro Max search.py helper.
- Captures the raw recommendation output and execution metadata.
- Does NOT approve recommendations.
- Does NOT modify upstream Store Intelligence / Creative Concept.
- Does NOT perform 11B diagnostic-AI work.

The next stage is the Path-Flow Design Intelligence Filter.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DEFAULT_SEARCH_SCRIPT = Path(".agents/skills/ui-ux-pro-max/scripts/search.py")
DEFAULT_OUTPUT_DIR = Path("generated/design-intelligence/raw")


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def build_command(
    python_executable: str,
    search_script: Path,
    query: str,
    project_name: str | None,
) -> list[str]:
    command = [
        python_executable,
        str(search_script),
        query,
        "--design-system",
        "--format",
        "markdown",
    ]
    if project_name:
        command.extend(["-p", project_name])
    return command


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def run_adapter(
    *,
    query: str,
    store_id: str,
    project_name: str | None,
    search_script: Path,
    output_dir: Path,
    python_executable: str,
    timeout_seconds: int,
) -> dict[str, Any]:
    started_at = utc_now_iso()
    base_result: dict[str, Any] = {
        "schemaVersion": "11A-design-intelligence-adapter-v0.1",
        "storeId": store_id,
        "projectName": project_name,
        "query": query,
        "searchScript": str(search_script),
        "startedAt": started_at,
        "adapterStatus": None,
        "returnCode": None,
        "stdoutFile": None,
        "stderr": "",
    }

    metadata_path = output_dir / f"{store_id}.adapter.json"
    raw_output_path = output_dir / f"{store_id}.uiux.md"

    if not search_script.is_file():
        base_result.update(
            {
                "adapterStatus": "TOOL_NOT_FOUND",
                "stderr": f"UI/UX Pro Max search.py was not found: {search_script}",
                "finishedAt": utc_now_iso(),
            }
        )
        write_json(metadata_path, base_result)
        return base_result

    command = build_command(
        python_executable=python_executable,
        search_script=search_script,
        query=query,
        project_name=project_name,
    )

    base_result["arguments"] = command[2:]

    try:
        completed = subprocess.run(
            command,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout_seconds,
        )
    except subprocess.TimeoutExpired as exc:
        base_result.update(
            {
                "adapterStatus": "EXECUTION_FAILED",
                "stderr": f"UI/UX Pro Max timed out after {timeout_seconds}s: {exc}",
                "finishedAt": utc_now_iso(),
            }
        )
        write_json(metadata_path, base_result)
        return base_result
    except OSError as exc:
        base_result.update(
            {
                "adapterStatus": "EXECUTION_FAILED",
                "stderr": f"Failed to start UI/UX Pro Max: {exc}",
                "finishedAt": utc_now_iso(),
            }
        )
        write_json(metadata_path, base_result)
        return base_result

    stdout = completed.stdout or ""
    stderr = completed.stderr or ""

    if completed.returncode != 0:
        status = "EXECUTION_FAILED"
    elif not stdout.strip():
        status = "EMPTY_OUTPUT"
    else:
        status = "PASS"
        write_text(raw_output_path, stdout)

    base_result.update(
        {
            "adapterStatus": status,
            "returnCode": completed.returncode,
            "stdoutFile": str(raw_output_path) if stdout.strip() else None,
            "stdoutBytes": len(stdout.encode("utf-8")),
            "stderr": stderr,
            "finishedAt": utc_now_iso(),
        }
    )
    write_json(metadata_path, base_result)
    return base_result


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run UI/UX Pro Max as the 11A Design Intelligence candidate generator"
    )
    parser.add_argument("--store-id", required=True, help="Stable store identifier, e.g. girasol")
    parser.add_argument("--query", required=True, help="Evidence-derived UI/UX Pro Max query")
    parser.add_argument("--project-name", help="Optional project/store label passed to UI/UX Pro Max")
    parser.add_argument(
        "--search-script",
        type=Path,
        default=DEFAULT_SEARCH_SCRIPT,
        help=f"Path to UI/UX Pro Max search.py (default: {DEFAULT_SEARCH_SCRIPT})",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help=f"Raw candidate output directory (default: {DEFAULT_OUTPUT_DIR})",
    )
    parser.add_argument(
        "--python",
        default=sys.executable,
        help="Python executable used to invoke search.py (default: current interpreter)",
    )
    parser.add_argument("--timeout", type=int, default=120, help="Execution timeout in seconds")
    args = parser.parse_args()

    result = run_adapter(
        query=args.query,
        store_id=args.store_id,
        project_name=args.project_name,
        search_script=args.search_script,
        output_dir=args.output_dir,
        python_executable=args.python,
        timeout_seconds=args.timeout,
    )

    print(json.dumps(result, ensure_ascii=False, indent=2))
    if result["adapterStatus"] != "PASS":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
