"""生成 GitHub Pages 静态站点。"""

import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.data.demo_data import BATCH_LABELS, DISTRICTS, MIDDLE_SCHOOLS, SCHOOLS

FRONTEND = ROOT / "frontend"
PAGES_SOURCE = ROOT / "pages"
OUTPUT = ROOT / "docs"


def build():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    html = (FRONTEND / "index.html").read_text(encoding="utf-8")
    html = html.replace('href="/static/styles.css"', 'href="./styles.css"')
    html = html.replace(
        '<script type="text/babel" src="/static/app.js"></script>',
        '<script>window.ZHONGKAO_REPO_URL="https://github.com/larsoncai/shanghai-zhongkao-ai";</script>\n'
        '  <script src="./data.js"></script>\n'
        '  <script src="./static-api.js"></script>\n'
        '  <script type="text/babel" src="./app.js"></script>',
    )
    (OUTPUT / "index.html").write_text(html, encoding="utf-8")
    payload = {
        "districts": DISTRICTS,
        "schools": SCHOOLS,
        "middle_schools": MIDDLE_SCHOOLS,
        "batch_labels": BATCH_LABELS,
    }
    (OUTPUT / "data.js").write_text(
        "window.ZHONGKAO_DATA = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    shutil.copy2(FRONTEND / "app.js", OUTPUT / "app.js")
    shutil.copy2(FRONTEND / "styles.css", OUTPUT / "styles.css")
    shutil.copy2(PAGES_SOURCE / "static-api.js", OUTPUT / "static-api.js")
    (OUTPUT / ".nojekyll").write_text("", encoding="utf-8")
    print(f"GitHub Pages site generated in {OUTPUT}")


if __name__ == "__main__":
    build()
