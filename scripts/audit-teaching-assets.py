"""Compare pinned Git resources with the current working tree; never delete files.

python scripts/audit-teaching-assets.py [baseline] [report.json]
All byte totals use raw bytes; reports both runtime and tests-inclusive JS/CSS.
"""
from collections import Counter
from hashlib import sha256
from pathlib import Path
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
BASELINE = sys.argv[1] if len(sys.argv) > 1 else "477706e"
OUTPUT = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "docs/teaching-viz-resource-diff.json"
CODE = {".js", ".mjs", ".css"}
BLOCKED = {".mp4", ".webm", ".mov", ".m4v", ".avi", ".gif", ".lottie", ".glb", ".gltf", ".woff", ".woff2", ".ttf", ".otf"}
MEDIA = BLOCKED | {".png", ".jpg", ".jpeg", ".webp", ".avif", ".mp3", ".wav", ".ogg"}

def git(*args):
    return subprocess.check_output(["git", "-C", str(ROOT), *args])

def meta(data):
    return {"bytes": len(data), "lfBytes": len(data.replace(b"\r\n", b"\n")), "sha256": sha256(data).hexdigest()}

commit = git("rev-parse", BASELINE).decode().strip()
before = {}
before_urls = set()
for entry in git("ls-tree", "-rlz", commit).split(b"\0"):
    if not entry:
        continue
    metadata, name = entry.split(b"\t", 1)
    oid = metadata.decode().split()[2]
    path = name.decode("utf-8")
    blob = git("cat-file", "blob", oid)
    before[path] = meta(blob)
    if Path(path).suffix in CODE:
        before_urls.update(re.findall(r'https?://[^\s\'"<>`]+', blob.decode("utf-8-sig")))

after = {}
for file in ROOT.rglob("*"):
    if not file.is_file() or any(part in {".git", "node_modules", "__pycache__"} for part in file.relative_to(ROOT).parts):
        continue
    rel = file.relative_to(ROOT).as_posix()
    if file.resolve() == OUTPUT.resolve():
        continue
    # Reports cannot include their own changing byte totals.
    if rel in {"docs/teaching-viz-resource-diff.json", "docs/teaching-viz-resource-diff.md"}:
        continue
    after[rel] = meta(file.read_bytes())

def totals(files):
    by_extension = Counter()
    for path, item in files.items():
        by_extension[Path(path).suffix.lower() or "[none]"] += item["bytes"]
    return {
        "files": len(files), "bytes": sum(item["bytes"] for item in files.values()),
        "allJsMjsCss": sum(item["bytes"] for path, item in files.items() if Path(path).suffix in CODE),
        "runtimeJsMjsCss": sum(item["bytes"] for path, item in files.items() if Path(path).suffix in CODE and not path.startswith(("tests/", "docs/", "scripts/"))),
        "byExtensionBytes": dict(sorted(by_extension.items())),
    }

changes = []
for path in sorted(set(before) | set(after)):
    a, b = before.get(path), after.get(path)
    if a != b:
        changes.append({"path": path, "status": "added" if a is None else "missing" if b is None else "modified", "before": a, "after": b, "deltaBytes": (b or {}).get("bytes", 0) - (a or {}).get("bytes", 0)})
code_delta = sum(item["deltaBytes"] for item in changes if Path(item["path"]).suffix in CODE)
runtime_delta = sum(item["deltaBytes"] for item in changes if Path(item["path"]).suffix in CODE and not item["path"].startswith(("tests/", "docs/", "scripts/")))
normalized_delta = sum((item["after"] or {}).get("lfBytes", 0) - (item["before"] or {}).get("lfBytes", 0) for item in changes if Path(item["path"]).suffix in CODE)
normalized_runtime_delta = sum((item["after"] or {}).get("lfBytes", 0) - (item["before"] or {}).get("lfBytes", 0) for item in changes if Path(item["path"]).suffix in CODE and not item["path"].startswith(("tests/", "docs/", "scripts/")))
protected_data = []
for path, item in before.items():
    if "/data/" in path and path.endswith((".csv", ".json")):
        file = ROOT / path
        original = git("show", f"{commit}:{path}").replace(b"\r\n", b"\n")
        if not file.exists() or file.read_bytes().replace(b"\r\n", b"\n") != original:
            protected_data.append(path)
new_code_urls = sorted(set(url for item in changes if Path(item["path"]).suffix in CODE and item["after"] for url in re.findall(r'https?://[^\s\'"<>`]+', (ROOT / item["path"]).read_text(encoding="utf-8-sig"))))
report = {
    "baseline": commit, "timestampContext": "2026-10-21 Asia/Singapore",
    "method": "Git object bytes versus live working tree; excludes .git/node_modules/__pycache__ and resource reports themselves; static audit, not Browser Network",
    "before": totals(before), "after": totals(after),
    "netJsMjsCssDeltaBytes": code_delta, "netRuntimeJsMjsCssDeltaBytes": runtime_delta,
    "netLfNormalizedJsMjsCssDeltaBytes": normalized_delta,
    "netLfNormalizedRuntimeJsMjsCssDeltaBytes": normalized_runtime_delta,
    "budgetBytes": 160 * 1024, "allCodeBudgetStatus": "PASS" if code_delta <= 160 * 1024 else "OVER_TARGET", "runtimeCodeBudgetStatus": "PASS" if runtime_delta <= 160 * 1024 else "OVER_TARGET",
    "addedBlockedMediaOrFonts": [item for item in changes if item["status"] == "added" and Path(item["path"]).suffix.lower() in BLOCKED],
    "addedMedia": [item for item in changes if item["status"] == "added" and Path(item["path"]).suffix.lower() in MEDIA],
    "changedProtectedDataValuesOrText": protected_data,
    "urlLiteralsInChangedCode": new_code_urls,
    "newExternalUrlLiterals": sorted(set(new_code_urls) - before_urls),
    "changes": changes,
}
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({key: report[key] for key in ["baseline", "before", "after", "netJsMjsCssDeltaBytes", "netRuntimeJsMjsCssDeltaBytes", "budgetBytes", "allCodeBudgetStatus", "runtimeCodeBudgetStatus", "addedBlockedMediaOrFonts", "addedMedia", "changedProtectedDataValuesOrText"]}, ensure_ascii=False, indent=2))
