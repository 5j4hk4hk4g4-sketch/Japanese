#!/usr/bin/env python3
"""
Offline Japanese TTS asset pipeline for Tokyo Day 1.
Scans scenario JSONs and N5 core vocabulary, generating MP3 audio clips into public/audio/
with SHA-1 incremental caching in public/audio/manifest.json.

Usage:
  python scripts/generate-audio.py
  python scripts/generate-audio.py --dry-run
  python scripts/generate-audio.py --engine voicevox
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import sys
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
SCENARIO_DIR = ROOT / "src" / "data" / "scenarios"
VOCAB_FILE = ROOT / "src" / "data" / "vocab" / "n5-core.json"
OUT_DIR = ROOT / "public" / "audio"
MANIFEST_PATH = OUT_DIR / "manifest.json"

EDGE_VOICES = {
    "nanami": "ja-JP-NanamiNeural",
    "keita": "ja-JP-KeitaNeural",
}

VOICEVOX_SPEAKERS = {
    "nanami": 2,  # 四国めたん (ノーマル)
    "keita": 13,  # 青山龍星 (ノーマル)
}


def tokens_to_text(tokens: list[dict[str, Any]]) -> str:
    return "".join(t.get("text", "") for t in tokens)


def collect_clips() -> list[dict[str, str]]:
    clips: list[dict[str, str]] = []

    for path in sorted(SCENARIO_DIR.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        for node in data.get("nodes", []):
            text = node.get("ttsText") or tokens_to_text(node.get("npcTokens", []))
            clips.append(
                {
                    "audioId": node["audioId"],
                    "voiceKey": node.get("speakerVoice", "nanami"),
                    "text": text,
                    "filename": f"{node['audioId']}.mp3",
                }
            )

    vocab_items = json.loads(VOCAB_FILE.read_text(encoding="utf-8"))
    for item in vocab_items:
        text = item.get("ttsText") or item.get("reading") or item["word"]
        clips.append(
            {
                "audioId": item["audioId"],
                "voiceKey": "nanami",
                "text": text,
                "filename": f"{item['audioId']}.mp3",
            }
        )

    return clips


def compute_hash(engine: str, voice: str, text: str) -> str:
    payload = f"{engine}|{voice}|{text}".encode("utf-8")
    return hashlib.sha1(payload).hexdigest()[:12]


async def synthesize_edge(clips: list[dict[str, str]], manifest: dict[str, Any], force: bool) -> int:
    try:
        import edge_tts
    except ImportError:
        print(
            "[generate-audio] Missing 'edge-tts'. Install via: python -m pip install edge-tts",
            file=sys.stderr,
        )
        return 1

    generated = 0
    skipped = 0
    for clip in clips:
        voice = EDGE_VOICES[clip["voiceKey"]]
        clip_hash = compute_hash("edge", voice, clip["text"])
        out_file = OUT_DIR / clip["filename"]
        prev = manifest.get(clip["audioId"])

        if not force and prev and prev.get("hash") == clip_hash and out_file.exists():
            skipped += 1
            continue

        comm = edge_tts.Communicate(clip["text"], voice=voice, rate="+0%")
        await comm.save(str(out_file))
        manifest[clip["audioId"]] = {
            "file": clip["filename"],
            "hash": clip_hash,
            "voice": voice,
            "text": clip["text"],
        }
        generated += 1
        print(f"  + {clip['filename']} ({voice})")

    print(f"[generate-audio] edge-tts complete: {generated} generated, {skipped} skipped (cached).")
    return 0


def synthesize_voicevox(
    clips: list[dict[str, str]], manifest: dict[str, Any], force: bool, base_url: str
) -> int:
    generated = 0
    skipped = 0
    for clip in clips:
        speaker_id = VOICEVOX_SPEAKERS[clip["voiceKey"]]
        voice_label = f"voicevox:{speaker_id}"
        clip_hash = compute_hash("voicevox", voice_label, clip["text"])
        filename = clip["audioId"] + ".wav"
        out_file = OUT_DIR / filename
        prev = manifest.get(clip["audioId"])

        if not force and prev and prev.get("hash") == clip_hash and out_file.exists():
            skipped += 1
            continue

        encoded_text = urllib.parse.quote(clip["text"])
        q_req = urllib.request.Request(
            f"{base_url}/audio_query?text={encoded_text}&speaker={speaker_id}",
            method="POST",
        )
        with urllib.request.urlopen(q_req, timeout=15) as resp:
            query_json = resp.read()

        s_req = urllib.request.Request(
            f"{base_url}/synthesis?speaker={speaker_id}",
            data=query_json,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(s_req, timeout=30) as resp:
            wav_bytes = resp.read()

        out_file.write_bytes(wav_bytes)
        manifest[clip["audioId"]] = {
            "file": filename,
            "hash": clip_hash,
            "voice": voice_label,
            "text": clip["text"],
        }
        generated += 1
        print(f"  + {filename} ({voice_label})")

    print(f"[generate-audio] VOICEVOX complete: {generated} generated, {skipped} skipped.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate offline TTS audio clips for Tokyo Day 1.")
    parser.add_argument("--engine", choices=["edge", "voicevox"], default="edge")
    parser.add_argument("--voicevox-url", default="http://127.0.0.1:50021")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, Any] = {}
    if MANIFEST_PATH.exists():
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    clips = collect_clips()
    print(f"[generate-audio] Found {len(clips)} audio items (engine={args.engine}).")

    if args.dry_run:
        for c in clips[:6]:
            print(f"  [dry-run] {c['audioId']} ({c['voiceKey']}): {c['text']}")
        if len(clips) > 6:
            print(f"  ... and {len(clips) - 6} more items")
        return 0

    if args.engine == "edge":
        rc = asyncio.run(synthesize_edge(clips, manifest, args.force))
    else:
        import urllib.parse  # noqa: F401
        rc = synthesize_voicevox(clips, manifest, args.force, args.voicevox_url)

    if rc == 0:
        MANIFEST_PATH.write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
