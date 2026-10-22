"""Check original lecture text/code, data assets, and lesson scripts against the pinned snapshot.

No dependencies; reports facts without changing any source. HTML insertions outside
the original pre/code blocks are allowed. Run from any directory.
"""
from hashlib import sha256
from html import unescape
from pathlib import Path
import importlib.util
import json
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("baseline", ROOT / "docs/capture-teaching-baseline.py")
baseline = importlib.util.module_from_spec(spec)
spec.loader.exec_module(baseline)
snapshot = json.loads((ROOT / "docs/teaching-baseline.json").read_text(encoding="utf-8"))
failures = []
checked = 0

for section in snapshot["sections"]:
    text = (ROOT / section["page"]).read_text(encoding="utf-8-sig")
    article = next((part for part in re.findall(r'<article\b.*?</article>', text, re.S) if f'id="{section["articleId"]}"' in part), None)
    if not article:
        failures.append(f'{section["sectionId"]}: missing article')
        continue
    parser = baseline.PanelParser()
    parser.feed(article)
    if not {"explain", "code", "demo"}.issubset(parser.panels):
        failures.append(f'{section["sectionId"]}: three original panels missing')
    original = baseline.git("show", f'{snapshot["baselineCommit"]}:{section["page"]}').decode("utf-8-sig")
    original_article = next(part for part in re.findall(r'<article\b.*?</article>', original, re.S) if f'id="{section["articleId"]}"' in part)
    old_parser = baseline.PanelParser()
    old_parser.feed(original_article)
    old_explain = re.sub(r"\s+", " ", unescape(re.sub(r'</?[A-Za-z][^>]*>', '', old_parser.panels["explain"]))).strip()
    new_explain = re.sub(r"\s+", " ", unescape(re.sub(r'</?[A-Za-z][^>]*>', '', parser.panels["explain"]))).strip()
    if old_explain not in new_explain:
        failures.append(f'{section["sectionId"]}: original explanation text changed or reordered')
    blocks = [unescape(re.sub(r'</?[A-Za-z][^>]*>', '', code)) for code in re.findall(r'<pre\b[^>]*>\s*<code\b[^>]*>(.*?)</code>\s*</pre>', parser.panels.get("code", ""), re.S)]
    current_hashes = [sha256(code.encode()).hexdigest() for code in blocks]
    expected = [item["sha256"] for item in section["codeBlocks"]]
    cursor = 0
    for expected_hash in expected:
        try:
            cursor = current_hashes.index(expected_hash, cursor) + 1
        except ValueError:
            failures.append(f'{section["sectionId"]}: original code block changed, missing or reordered')
            break
    if section["originalDemoId"] not in article:
        failures.append(f'{section["sectionId"]}: original demo mount missing')
    checked += 1

protected = []
runtime_changed = []
for path, meta in snapshot["files"].items():
    name = Path(path)
    if path.startswith("lesson-") and name.name == "lesson.js":
        original = baseline.git("show", f'{snapshot["baselineCommit"]}:{path}').replace(b'\r\n', b'\n')
        if (ROOT / path).read_bytes().replace(b'\r\n', b'\n') != original:
            runtime_changed.append(path)
    if path.startswith("lesson-") and (name.name in {"lecture.md", "lecture-en.md", "en_blocks.json", "zh_blocks.json"} or "/data/" in path or "/demo/" in path):
        protected.append(path)
        file = ROOT / path
        original = baseline.git("show", f'{snapshot["baselineCommit"]}:{path}').replace(b'\r\n', b'\n')
        if not file.exists() or file.read_bytes().replace(b'\r\n', b'\n') != original:
            failures.append(f"{path}: protected baseline file changed or missing")

print(json.dumps({"baseline": snapshot["baselineCommit"], "sectionsChecked": checked, "protectedFilesChecked": len(protected), "runtimeScriptsChangedRequiringReview": runtime_changed, "status": "FAIL" if failures else "PASS", "failures": failures}, ensure_ascii=False, indent=2))
sys.exit(bool(failures))
