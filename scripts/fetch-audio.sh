#!/usr/bin/env bash
# Downloads the narration of the reference reel into public/audio/narration.m4a (git-ignored).
# Requires: yt-dlp (pip install yt-dlp) and ffmpeg.
set -euo pipefail
URL="${1:-https://www.instagram.com/reel/DfSsHlYtpNc/}"
cd "$(dirname "$0")/.."
mkdir -p public/audio .cache
yt-dlp -q -f 'ba/b' -o '.cache/reel.%(ext)s' "$URL"
SRC=$(ls .cache/reel.* | head -n1)
ffmpeg -v error -y -i "$SRC" -vn -c:a aac -b:a 160k public/audio/narration.m4a
echo "Saved public/audio/narration.m4a"
