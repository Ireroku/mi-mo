"""docs の文体規約とリンク切れを機械的に検査する。

    python3 scripts/checkdocs.py            # docs/ 全体を検査
    python3 scripts/checkdocs.py docs/impl  # 一部だけ検査

正典は docs/impl/README.md の「文体の規約」。

- 宣言形（現在形）で書く
- 「だ・である」調を使わない

「〜であること」「〜済みであることを」のような名詞節は違反にあたらないため、
正規表現は句読点まで含めて誤検出を避ける。記号と絵文字の規約はコードの
コメントが対象なので、ここでは検査しない。

docs/superpowers/ は作業ログで仕様の正典ではないため対象から外す。
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

STYLE_RULES = [
    (re.compile(r"である[。、]"), "「である」調"),
    (re.compile(r"であり[、。]"), "「であり」調"),
    (re.compile(r"[^たな]だ[。、]"), "断定の「だ」"),
    (re.compile(r"のだ[がろ]"), "「のだが」「のだろう」"),
    (re.compile(r"[^たな]だ(?:が、|から|と思|とす)"), "断定の「だ」+接続"),
]

LINK_PATTERN = re.compile(r"\]\(([^)]+)\)")

# テンプレート中の <相対パス> のようなプレースホルダは実在しなくてよい
SKIP_LINK_PREFIXES = ("http://", "https://", "#", "mailto:", "<")


def collect(args: list[str]) -> list[Path]:
    targets = [Path(arg) for arg in args] if args else [ROOT / "docs"]
    files: list[Path] = []
    for path in targets:
        found = sorted(path.rglob("*.md")) if path.is_dir() else [path]
        files.extend(f for f in found if "superpowers" not in f.parts)
    return files


def main() -> int:
    files = collect(sys.argv[1:])
    style_hits = 0
    broken = 0

    for md in files:
        rel = md.resolve().relative_to(ROOT)
        # 正典そのものは規約を引用するため文体検査から外す
        skip_style = rel.as_posix() == "docs/impl/README.md"

        for lineno, line in enumerate(md.read_text(encoding="utf-8").splitlines(), 1):
            if not skip_style:
                for pattern, label in STYLE_RULES:
                    if pattern.search(line):
                        print(f"STYLE  {rel}:{lineno}  {label}")
                        print(f"       {line.strip()[:100]}")
                        style_hits += 1
                        break

            for match in LINK_PATTERN.finditer(line):
                link = match.group(1)
                if link.startswith(SKIP_LINK_PREFIXES):
                    continue
                target = (md.parent / link.split("#")[0]).resolve()
                if not target.exists():
                    print(f"LINK   {rel}:{lineno}  ->  {link}")
                    broken += 1

    print(f"\n{len(files)} file(s): style {style_hits}, broken link {broken}")
    return 1 if style_hits or broken else 0


if __name__ == "__main__":
    sys.exit(main())
