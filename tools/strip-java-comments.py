#!/usr/bin/env python3
"""
strip-java-comments.py — remove every comment from the Java files in java-source/

This was a one-time pass: the .java files in this repo have already been run
through it, so running it again does nothing. It's kept here so the edit is on
the record rather than being an unexplained difference from the files as they
were written.

Why: those files were coursework, and their comments were written for a marker
("hope that's allowed", "not sure if the extra credit wanted...", and so on).
That reads oddly on a portfolio site, so the site shows the code without them.

What it removes: // line comments, /* block */ comments and /** javadoc */.
What it never touches: anything inside a string or character literal, so a "//"
in a URL or a "/*" inside quotes survives intact.

Afterwards: lines that held nothing but a comment are dropped entirely rather
than left as blank holes, trailing whitespace goes, and runs of blank lines
collapse to one.

    python3 tools/strip-java-comments.py [--check]

--check reports what would change without writing anything.
"""

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
JAVA_DIR = ROOT / "java-source"


def strip_comments(src):
    """Walk the source once, copying everything that isn't a comment.

    The scanner has to understand string and character literals, because a
    sequence like "http://x" or '/' inside quotes is code, not a comment.
    """
    out = []
    i, n = 0, len(src)

    while i < n:
        c = src[i]

        # --- string literal: copy verbatim to the closing quote -----------
        if c == '"':
            j = i + 1
            while j < n:
                if src[j] == "\\":
                    j += 2
                    continue
                if src[j] == '"' or src[j] == "\n":
                    j += 1
                    break
                j += 1
            out.append(src[i:min(j, n)])
            i = min(j, n)

        # --- character literal --------------------------------------------
        elif c == "'":
            j = i + 1
            while j < n:
                if src[j] == "\\":
                    j += 2
                    continue
                if src[j] == "'" or src[j] == "\n":
                    j += 1
                    break
                j += 1
            out.append(src[i:min(j, n)])
            i = min(j, n)

        # --- // line comment: drop to (not including) the newline ---------
        elif c == "/" and i + 1 < n and src[i + 1] == "/":
            j = src.find("\n", i)
            i = n if j == -1 else j

        # --- /* block comment */, javadoc included ------------------------
        elif c == "/" and i + 1 < n and src[i + 1] == "*":
            j = src.find("*/", i + 2)
            i = n if j == -1 else j + 2

        else:
            out.append(c)
            i += 1

    return "".join(out)


def tidy(original, stripped):
    """Drop lines the comments left empty, and collapse blank-line runs."""
    before = original.split("\n")
    after = stripped.split("\n")
    kept = []

    for idx, line in enumerate(after):
        line = line.rstrip()
        was_blank = idx < len(before) and not before[idx].strip()
        # A line that had content and now has none was comment-only: drop it.
        if not line and not was_blank:
            continue
        kept.append(line)

    text = "\n".join(kept)
    text = re.sub(r"\n{3,}", "\n\n", text)     # no more than one blank line
    return text.strip("\n") + "\n"


def main():
    check = "--check" in sys.argv
    files = sorted(JAVA_DIR.rglob("*.java"))
    if not files:
        print("no .java files under", JAVA_DIR)
        return

    changed = 0
    for path in files:
        original = path.read_text(encoding="utf-8")
        result = tidy(original, strip_comments(original))
        if result == original:
            print("  unchanged  %s" % path.relative_to(ROOT))
            continue
        changed += 1
        removed = original.count("\n") - result.count("\n")
        print("  %s  %s  (%d lines)" % (
            "would strip" if check else "stripped   ",
            path.relative_to(ROOT), removed))
        if not check:
            path.write_text(result, encoding="utf-8")

    print("%d of %d files %s." % (
        changed, len(files), "would change" if check else "changed"))


if __name__ == "__main__":
    main()
