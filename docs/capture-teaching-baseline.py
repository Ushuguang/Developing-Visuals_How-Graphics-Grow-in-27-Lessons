"""Reproducible, read-only course inventory from a pinned Git object.

Usage: python docs/capture-teaching-baseline.py [commit] [output.json]
No checkout files are modified except the explicitly requested output file.
"""
from collections import Counter
from hashlib import sha256
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
import csv
import io
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent

def git(*args):
    return subprocess.check_output(["git", "-C", str(ROOT), *args])

def digest(value):
    return sha256(value).hexdigest()

def plain(value):
    return re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", "", value))).strip()

class PanelParser(HTMLParser):
    """Collect exact text of panels using a div depth counter, not a greedy regex."""
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.depth = 0
        self.active = None
        self.start_depth = None
        self.parts = []
        self.panels = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "div":
            self.depth += 1
            if "tab-panel" in attrs.get("class", "").split():
                self.active = attrs.get("data-panel")
                self.start_depth = self.depth
                self.parts = []
                return
        if self.active:
            self.parts.append(self.get_starttag_text())

    def handle_endtag(self, tag):
        if tag == "div" and self.active and self.depth == self.start_depth:
            self.panels[self.active] = "".join(self.parts)
            self.active = None
        elif self.active:
            self.parts.append(f"</{tag}>")
        if tag == "div":
            self.depth -= 1

    def handle_startendtag(self, tag, attrs):
        if self.active:
            self.parts.append(self.get_starttag_text())

    def handle_data(self, value):
        if self.active:
            self.parts.append(value)

    def handle_entityref(self, value):
        if self.active:
            self.parts.append(f"&{value};")

    def handle_charref(self, value):
        if self.active:
            self.parts.append(f"&#{value};")

    def handle_comment(self, value):
        if self.active:
            self.parts.append(f"<!--{value}-->")

def main():
    commit = git("rev-parse", sys.argv[1] if len(sys.argv) > 1 else "477706e").decode().strip()
    target = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "docs/teaching-baseline.json"
    if target.exists():
        raise SystemExit("Output already exists. Choose a different output path; baseline is immutable.")
    files = {}
    for entry in git("ls-tree", "-rlz", commit).split(b"\0"):
        if not entry:
            continue
        metadata, path = entry.split(b"\t", 1)
        mode, kind, oid, size = metadata.decode().split()
        rel = path.decode("utf-8")
        blob = git("cat-file", "blob", oid)
        files[rel] = {"bytes": int(size), "sha256": digest(blob), "gitBlob": oid}

    def read(path):
        return git("show", f"{commit}:{path}").decode("utf-8-sig")

    i18n = read("i18n.js")
    translations = {}
    for key, value in re.findall(r"'((?:sec-\d+-\d+)\.title)'\s*:\s*'([^'\n]+)'", i18n):
        translations.setdefault(key, []).append(value)
    sections = []
    chapters = []
    for chapter in range(1, 6):
        prefix = f"lesson-{chapter:02}"
        source = read(f"{prefix}/index.html")
        script = read(f"{prefix}/lesson.js")
        demo_matches = list(re.finditer(r'(?:window\.)?DEMOS\["([^"]+)"\]\s*=', script))
        demos = {}
        for i, match in enumerate(demo_matches):
            demos[match.group(1)] = script[match.start():demo_matches[i+1].start() if i+1 < len(demo_matches) else len(script)]
        chapters.append({
            "chapter": chapter,
            "scripts": re.findall(r'<script[^>]+src="([^"]+)"', source),
            "styles": re.findall(r'<link[^>]+href="([^"]+)"', source),
            "allDemosQueuedAtStartup": "queueMicrotask(() => __renderAllDemos())" in script,
            "asyncMountCatch": "Promise.resolve()" in script[:script.find("function __renderAllDemos")],
            "dataFileReferences": sorted(set(re.findall(r'(?:\.?\.?/)?data/[\w.\-/]+', script))),
        })
        for article in re.findall(r'<article\b.*?</article>', source, re.S):
            article_id = re.search(r'\bid="(ch-\d+-\d+)"', article).group(1)
            sid = article_id[3:].replace("-", ".")
            heading = re.search(r'<h2\b[^>]*>(.*?)</h2>', article, re.S).group(1)
            demo_id_match = re.search(r'\bdata-demo="([^"]+)"', article)
            if not demo_id_match:
                demo_id_match = re.search(r'\bid="demo-mount-([^"]+)"', article)
            demo_id = demo_id_match.group(1)
            demo = demos[demo_id]
            panels = PanelParser()
            panels.feed(article)
            code_blocks = [unescape(re.sub(r'</?[A-Za-z][^>]*>', '', code)).replace('\r\n', '\n') for code in re.findall(r'<pre\b[^>]*>\s*<code\b[^>]*>(.*?)</code>\s*</pre>', panels.panels.get("code", ""), re.S)]
            concepts = [plain(h) for h in re.findall(r'<h[34]\b(?![^>]*data-lang="en-US")[^>]*>(.*?)</h[34]>', panels.panels.get("explain", ""), re.S)]
            focus = [plain(h) for h in re.findall(r'<h[34]\b(?![^>]*data-lang="en-US")[^>]*>(.*?)</h[34]>', panels.panels.get("code", ""), re.S)]
            api = sorted(set(re.findall(r'\bd3\.[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*|\.[A-Za-z_$][\w$]*(?=\s*\()', "\n".join(code_blocks))))
            data = sorted(set(re.findall(r'(?:\.?\.?/)?data/[\w.\-/]+', demo)))
            if chapter == 2 and sid != "2.1":
                data = ["./data/newstudent.csv (via loadStudents)"]
            key = f"sec-{chapter:02}-{sid.split('.')[1]}.title"
            controls = re.findall(r'<input\b[^>]*>|<select\b[^>]*>.*?</select>|<button\b[^>]*>.*?</button>', demo, re.S)
            sections.append({
                "sectionId": sid, "articleId": article_id, "page": f"{prefix}/index.html", "originalTitle": plain(heading),
                "runtimeTitleZh": (translations.get(key) or [None])[0],
                "runtimeTitleEn": (translations.get(key) or [None, None])[-1],
                "coreConcepts": concepts, "originalCodePoints": focus,
                "codeAPIs": api, "originalDemoId": demo_id,
                "registryScope": prefix, "dataSources": data or ["inline constants / generated data; inspect demo body"],
                "controlsMarkup": controls, "codeBlockCount": len(code_blocks),
                "codeBlocks": [{"sha256": digest(code.encode()), "characters": len(code)} for code in code_blocks],
                "panelHashes": {name: digest(content.encode()) for name, content in panels.panels.items()},
                "demoDefinitionSha256": digest(demo.encode()),
            })

    counts = Counter(Path(path).suffix.lower() or "[none]" for path in files)
    bytes_ext = Counter()
    for path, meta in files.items():
        bytes_ext[Path(path).suffix.lower() or "[none]"] += meta["bytes"]
    data_summary = {}
    for path in files:
        if "/data/" in path and path.endswith(".csv"):
            rows = list(csv.DictReader(io.StringIO(read(path))))
            data_summary[path] = {"rows": len(rows), "columns": list(rows[0]) if rows else []}
        if path == "lesson-05/data/french_names.json":
            data = json.loads(read(path))
            data_summary[path] = {"type": type(data).__name__, "keys": list(data) if isinstance(data, dict) else [], "length": len(data)}
    external = sorted(set(url.rstrip(";,)") for path in files if Path(path).suffix in {".js", ".css", ".html"} for url in re.findall(r'https?://[^\s\'"<>`]+', read(path))))
    result = {
        "baselineCommit": commit, "capturedAt": "2026-10-21 Asia/Singapore", "source": "Git objects, never mutable working tree",
        "files": files, "chapters": chapters, "sections": sections, "dataSummary": data_summary,
        "resources": {"trackedFiles": len(files), "totalBytes": sum(x["bytes"] for x in files.values()), "byExtensionCount": dict(counts), "byExtensionBytes": dict(bytes_ext), "jsCssBytes": sum(v["bytes"] for p, v in files.items() if Path(p).suffix.lower() in {".js", ".mjs", ".css"}), "htmlJsCssBytes": sum(v["bytes"] for p, v in files.items() if Path(p).suffix.lower() in {".js", ".mjs", ".css", ".html"}), "over250KiB": [dict(path=p, **v) for p, v in files.items() if v["bytes"] > 250 * 1024]},
        "externalUrlLiterals": external,
    }
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(target), "commit": commit, "sections": len(sections), **result["resources"]}, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
