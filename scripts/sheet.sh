#!/usr/bin/env bash
# Tile screenshots (sorted by timestamp) into a contact sheet: sheet.sh <dir> <out.jpg> [cols] [width]
set -euo pipefail
DIR=$1; OUT=$2; COLS=${3:-8}; W=${4:-240}
mapfile -t F < <(ls "$DIR"/s_*.png | sort -t_ -k2 -g)
N=${#F[@]}; H=$(( W * 16 / 9 ))
IN=(); FC=""; ST=""; LAY=""
for i in "${!F[@]}"; do IN+=(-i "${F[$i]}"); FC+="[$i]scale=$W:$H[a$i];"; ST+="[a$i]"; LAY+="$(( (i % COLS) * W ))_$(( (i / COLS) * H ))|"; done
ffmpeg -v error -y "${IN[@]}" -filter_complex "${FC}${ST}xstack=inputs=$N:fill=black:layout=${LAY%|}" "$OUT"
