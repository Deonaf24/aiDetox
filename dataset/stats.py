#!/usr/bin/env python3
"""
stats.py — quick stats for AI justification datasets (JSONL)

Each line in the input file(s) must be a JSON object with:
  - "justification": str
  - "label": str

Examples:
  python stats.py dataset/all.jsonl
  python stats.py dataset/train.jsonl dataset/dev.jsonl dataset/test.jsonl
  python stats.py dataset/*.jsonl
"""

import argparse
import json
import math
import os
import sys
from collections import Counter, defaultdict
from typing import Dict, List, Tuple

ALLOWED_LABELS = {"VALID", "NOT VALID", "UNSAFE", "NEEDS MORE INFO"}

def read_jsonl(path: str) -> List[Dict]:
    items = []
    with open(path, "r", encoding="utf-8") as f:
        for ln, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                items.append(obj)
            except json.JSONDecodeError as e:
                raise RuntimeError(f"{path}:{ln}: invalid JSON") from e
    return items

def word_count(text: str) -> int:
    return len(text.strip().split())

def summarize(path: str) -> None:
    rows = read_jsonl(path)
    n = len(rows)

    if n == 0:
        print(f"\n{os.path.basename(path)}: EMPTY")
        return

    # Validate schema & gather stats
    label_counts = Counter()
    length_chars = []
    length_words = []
    per_label_lengths_chars = defaultdict(list)
    per_label_lengths_words = defaultdict(list)
    justifications = []
    bad_rows = 0
    bad_labels = Counter()

    for i, r in enumerate(rows):
        j = r.get("justification")
        y = r.get("label")
        if not isinstance(j, str) or not isinstance(y, str):
            bad_rows += 1
            continue
        justifications.append(j)
        label_counts[y] += 1
        c = len(j)
        w = word_count(j)
        length_chars.append(c)
        length_words.append(w)
        per_label_lengths_chars[y].append(c)
        per_label_lengths_words[y].append(w)
        if y not in ALLOWED_LABELS:
            bad_labels[y] += 1

    unique_justifications = len(set(justifications))
    dupes = n - unique_justifications
    dupe_rate = (dupes / n * 100.0) if n else 0.0

    def avg(lst: List[int]) -> float:
        return sum(lst) / len(lst) if lst else 0.0

    # Print summary
    print(f"\n=== {os.path.basename(path)} ===")
    print(f"Total rows:            {n}")
    print(f"Invalid rows:          {bad_rows}")
    print(f"Unique justifications: {unique_justifications}")
    print(f"Duplicate count:       {dupes} ({dupe_rate:.1f}%)")
    print(f"Avg length (chars):    {avg(length_chars):.1f}")
    print(f"Avg length (words):    {avg(length_words):.1f}")

    if bad_labels:
        print("WARNING: Found labels outside allowed set:")
        for lbl, cnt in sorted(bad_labels.items(), key=lambda x: (-x[1], x[0])):
            print(f"  {lbl:16s} {cnt}")

    # Label distribution
    print("\nLabel distribution:")
    for lbl, cnt in sorted(label_counts.items(), key=lambda x: (-x[1], x[0])):
        pct = cnt / n * 100.0
        print(f"  {lbl:16s} {cnt:6d}  ({pct:5.1f}%)")

    # Per-label averages
    print("\nPer-label avg lengths:")
    for lbl in sorted(label_counts.keys()):
        ac = avg(per_label_lengths_chars[lbl])
        aw = avg(per_label_lengths_words[lbl])
        print(f"  {lbl:16s} chars: {ac:5.1f}   words: {aw:4.1f}")

    # Top duplicates (if any)
    if dupe_rate > 0:
        dup_counts = Counter(justifications)
        common = [(txt, c) for txt, c in dup_counts.most_common(10) if c > 1]
        if common:
            print("\nTop duplicates:")
            for txt, c in common:
                preview = (txt[:90] + "…") if len(txt) > 90 else txt
                print(f"  x{c:3d}  {preview}")

def main():
    ap = argparse.ArgumentParser(description="Show stats for JSONL justification datasets.")
    ap.add_argument("paths", nargs="+", help="One or more JSONL files (glob in shell).")
    args = ap.parse_args()

    for p in args.paths:
        if not os.path.isfile(p):
            print(f"{p}: not found or not a file", file=sys.stderr)
            continue
        summarize(p)

if __name__ == "__main__":
    main()
