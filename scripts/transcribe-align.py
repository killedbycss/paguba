#!/usr/bin/env python3
"""Create word-level timings by aligning Whisper output to the supplied book text."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import numpy as np
import whisper


ROOT = Path(__file__).resolve().parents[1]
BOOK_PATH = ROOT / "content" / "book.js"
OUTPUT_PATH = ROOT / "content" / "word-timings.js"
AUDIO_DIR = ROOT / "content" / "AudioPart2"


def load_book() -> list[dict[str, str]]:
    raw = BOOK_PATH.read_text(encoding="utf-8").strip()
    raw = re.sub(r"^window\.BOOK_DATA\s*=\s*", "", raw)
    raw = raw[:-1] if raw.endswith(";") else raw
    return json.loads(raw)


def normalize(word: str) -> str:
    return re.sub(r"[^0-9a-zа-я]+", "", word.lower().replace("ё", "е"))


def align_words(source_norm: list[str], recognized_norm: list[str]) -> list[tuple[int, int]]:
    """Globally align both streams so repeated words cannot jump across the chapter."""
    rows, columns = len(source_norm) + 1, len(recognized_norm) + 1
    score = np.zeros((rows, columns), dtype=np.int16)
    direction = np.zeros((rows, columns), dtype=np.uint8)
    score[:, 0] = -np.arange(rows)
    score[0, :] = -np.arange(columns)
    direction[1:, 0] = 1
    direction[0, 1:] = 2

    for source_index in range(1, rows):
        for heard_index in range(1, columns):
            diagonal = score[source_index - 1, heard_index - 1] + (3 if source_norm[source_index - 1] == recognized_norm[heard_index - 1] else -1)
            above = score[source_index - 1, heard_index] - 1
            left = score[source_index, heard_index - 1] - 1
            best = max(diagonal, above, left)
            score[source_index, heard_index] = best
            direction[source_index, heard_index] = 0 if best == diagonal else (1 if best == above else 2)

    pairs: list[tuple[int, int]] = []
    source_index, heard_index = len(source_norm), len(recognized_norm)
    while source_index or heard_index:
        move = direction[source_index, heard_index]
        if source_index and heard_index and move == 0:
            pairs.append((source_index - 1, heard_index - 1))
            source_index -= 1
            heard_index -= 1
        elif source_index and (not heard_index or move == 1):
            source_index -= 1
        else:
            heard_index -= 1
    return list(reversed(pairs))


def interpolate(source_words: list[str], recognized: list[dict], duration: float) -> list[dict]:
    source_norm = [normalize(word) for word in source_words]
    recognized = [word for word in recognized if normalize(word["word"])]
    recognized_norm = [normalize(word["word"]) for word in recognized]
    anchors: dict[int, tuple[float, float]] = {}
    for target, heard_index in align_words(source_norm, recognized_norm):
        heard = recognized[heard_index]
        start = min(duration, float(heard["start"]))
        end = min(duration, float(heard["end"]))
        anchors[target] = (start, max(start + .025, end))

    timings: list[dict] = []
    anchor_indexes = sorted(anchors)
    if not anchor_indexes:
        step = duration / max(1, len(source_words))
        return [{"start": round(i * step, 3), "end": round((i + 1) * step, 3)} for i in range(len(source_words))]

    for index in range(len(source_words)):
        if index in anchors:
            start, end = anchors[index]
        else:
            previous = max((item for item in anchor_indexes if item < index), default=None)
            following = min((item for item in anchor_indexes if item > index), default=None)
            left_index = previous if previous is not None else -1
            right_index = following if following is not None else len(source_words)
            left_time = anchors[previous][1] if previous is not None else 0.0
            right_time = anchors[following][0] if following is not None else duration
            count = max(1, right_index - left_index - 1)
            step = max(0.035, (right_time - left_time) / count)
            position = index - left_index - 1
            start = left_time + step * position
            end = min(right_time, start + step)

        if timings:
            start = max(start, timings[-1]["start"] + 0.001)
        start = min(duration - .025, start)
        end = min(duration, max(start + 0.025, end))
        timings.append({"start": round(start, 3), "end": round(end, 3)})

    return timings


def main() -> None:
    model_name = sys.argv[1] if len(sys.argv) > 1 else "base"
    start_chapter = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    chapters = load_book()
    model = whisper.load_model(model_name, download_root="/private/tmp/paguba-whisper-models")
    all_timings: list[list[dict]] = []
    if start_chapter > 1 and OUTPUT_PATH.exists():
        existing = OUTPUT_PATH.read_text(encoding="utf-8").strip()
        existing = re.sub(r"^window\.WORD_TIMINGS\s*=\s*", "", existing)
        existing = existing[:-1] if existing.endswith(";") else existing
        all_timings = json.loads(existing)[: start_chapter - 1]

    for chapter_index, chapter in enumerate(chapters[start_chapter - 1 :], start_chapter):
        audio_path = AUDIO_DIR / f"Record{chapter_index}.m4a"
        print(f"[{chapter_index}/{len(chapters)}] {chapter['title']}", flush=True)
        audio = whisper.load_audio(str(audio_path))
        duration = len(audio) / whisper.audio.SAMPLE_RATE
        result = model.transcribe(
            audio,
            language="ru",
            fp16=False,
            word_timestamps=True,
            verbose=False,
            condition_on_previous_text=True,
        )
        recognized = [word for segment in result["segments"] for word in segment.get("words", [])]
        source_words = re.split(r"\s+", chapter["text"].strip())
        timings = interpolate(source_words, recognized, duration)
        all_timings.append(timings)
        OUTPUT_PATH.write_text(
            "window.WORD_TIMINGS = " + json.dumps(all_timings, ensure_ascii=False, separators=(",", ":")) + ";\n",
            encoding="utf-8",
        )
        print(f"  aligned {len(timings)} source words to {len(recognized)} spoken words", flush=True)


if __name__ == "__main__":
    main()
