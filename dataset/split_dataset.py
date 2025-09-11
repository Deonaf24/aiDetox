#!/usr/bin/env python3
"""
Stratified JSONL splitter for AI justification dataset.

- Reads a JSONL file (default: all.jsonl) with at least a "label" field.
- Produces train/dev/test JSONL files with the requested ratios.
- Preserves class balance via per-label stratified sampling.
- Prints a summary table of counts and percentages.

Usage:
  python split_dataset.py --input all.jsonl --outdir . \
      --train 0.8 --dev 0.1 --test 0.1 --seed 42 --label-field label

Notes:
- Ratios need not sum to 1.0; they will be normalized if not.
- Ensures each split gets at least 1 item per label when possible.
"""

import argparse
import json
import math
import os
import random
from collections import defaultdict, Counter
from typing import List, Dict, Any, Tuple

def read_jsonl(path: str) -> List[Dict[str, Any]]:
    items = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                items.append(obj)
            except json.JSONDecodeError as e:
                raise RuntimeError(f"Invalid JSON on line: {line[:120]}...") from e
    return items

def write_jsonl(path: str, items: List[Dict[str, Any]]) -> None:
    with open(path, "w", encoding="utf-8") as f:
        for obj in items:
            f.write(json.dumps(obj, ensure_ascii=False) + "\n")

def normalize_ratios(train: float, dev: float, test: float) -> Tuple[float, float, float]:
    s = train + dev + test
    if s <= 0:
        raise ValueError("train+dev+test must be > 0")
    return train / s, dev / s, test / s

def stratified_split(
    data: List[Dict[str, Any]],
    label_field: str,
    ratios: Tuple[float, float, float],
    seed: int,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    random.seed(seed)

    # bucket by label
    buckets: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for obj in data:
        if label_field not in obj:
            raise KeyError(f"Missing label field '{label_field}' in: {obj}")
        buckets[str(obj[label_field])].append(obj)

    train_r, dev_r, test_r = ratios
    train_set: List[Dict[str, Any]] = []
    dev_set: List[Dict[str, Any]] = []
    test_set: List[Dict[str, Any]] = []

    for label, items in buckets.items():
        random.shuffle(items)
        n = len(items)

        # initial counts by rounding down
        n_train = int(math.floor(n * train_r))
        n_dev   = int(math.floor(n * dev_r))
        # assign remainder to test to keep totals consistent
        n_test  = n - n_train - n_dev

        # Make sure each split has at least 1 sample when feasible (n >= 3)
        # and only if there are enough items to do so.
        if n >= 3:
            if n_train == 0: n_train = 1
            if n_dev   == 0 and n - n_train >= 2: n_dev = 1
            n_test = n - n_train - n_dev
            if n_test == 0 and n - n_train - n_dev >= 0:
                # borrow one from the largest of train/dev
                if n_train >= n_dev and n_train > 1:
                    n_train -= 1; n_test += 1
                elif n_dev > 1:
                    n_dev -= 1; n_test += 1

        # final safety checks
        if n_train < 0 or n_dev < 0 or n_test < 0 or n_train + n_dev + n_test != n:
            # fallback: simple proportional with rounding
            n_train = round(n * train_r)
            n_dev   = round(n * dev_r)
            n_test  = n - n_train - n_dev
            if n_test < 0:
                n_test = 0
                # adjust dev if needed
                n_dev = n - n_train

        train_set.extend(items[:n_train])
        dev_set.extend(items[n_train:n_train+n_dev])
        test_set.extend(items[n_train+n_dev:])

    # final shuffle to mix labels
    random.shuffle(train_set)
    random.shuffle(dev_set)
    random.shuffle(test_set)
    return train_set, dev_set, test_set

def summarize(split_name: str, items: List[Dict[str, Any]], label_field: str) -> None:
    total = len(items)
    counts = Counter(str(x[label_field]) for x in items)
    print(f"\n{split_name}  (n={total})")
    for lbl, c in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0])):
        pct = (c / total * 100) if total else 0.0
        print(f"  {lbl:16s} {c:6d}  ({pct:5.1f}%)")

def main():
    ap = argparse.ArgumentParser(description="Stratified split of JSONL dataset.")
    ap.add_argument("--input", default="all.jsonl", help="Path to input JSONL (default: all.jsonl)")
    ap.add_argument("--outdir", default=".", help="Output directory (default: .)")
    ap.add_argument("--train", type=float, default=0.8, help="Train ratio (default: 0.8)")
    ap.add_argument("--dev", type=float, default=0.1, help="Dev/validation ratio (default: 0.1)")
    ap.add_argument("--test", type=float, default=0.1, help="Test ratio (default: 0.1)")
    ap.add_argument("--seed", type=int, default=42, help="Random seed (default: 42)")
    ap.add_argument("--label-field", default="label", help="Label field name (default: 'label')")
    args = ap.parse_args()

    os.makedirs(args.outdir, exist_ok=True)

    train_r, dev_r, test_r = normalize_ratios(args.train, args.dev, args.test)
    print(f"Ratios (normalized): train={train_r:.3f}, dev={dev_r:.3f}, test={test_r:.3f}")

    data = read_jsonl(args.input)
    if not data:
        raise SystemExit("Input file is empty.")

    train_set, dev_set, test_set = stratified_split(
        data, args.label_field, (train_r, dev_r, test_r), args.seed
    )

    out_train = os.path.join(args.outdir, "train.jsonl")
    out_dev   = os.path.join(args.outdir, "dev.jsonl")
    out_test  = os.path.join(args.outdir, "test.jsonl")

    write_jsonl(out_train, train_set)
    write_jsonl(out_dev, dev_set)
    write_jsonl(out_test, test_set)

    print(f"\nWrote:\n  {out_train}\n  {out_dev}\n  {out_test}")
    summarize("TRAIN", train_set, args.label_field)
    summarize("DEV",   dev_set,   args.label_field)
    summarize("TEST",  test_set,  args.label_field)

if __name__ == "__main__":
    main()
