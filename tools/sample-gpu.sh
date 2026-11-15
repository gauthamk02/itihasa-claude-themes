#!/bin/bash
# Samples the whole Mac's GPU "Device Utilization %" once a second and prints
# mean, min and max. No sudo needed (reads ioreg's IOAccelerator statistics).
#
#   tools/sample-gpu.sh 20          # 20 one-second samples
#   tools/sample-gpu.sh 20 heavy    # same, labelled
#
# It measures the WHOLE GPU, not one app: close video, games and other heavy
# windows, and compare runs against a baseline taken the same way.
# A stray 0% sample now and then is a read glitch; repeat a run that has one.

n=${1:-20}
label=${2:-sample}
vals=()
for ((i = 0; i < n; i++)); do
  v=$(ioreg -r -d 1 -w 0 -c IOAccelerator | grep -o '"Device Utilization %"=[0-9]*' | head -1 | cut -d= -f2)
  vals+=("${v:-0}")
  /bin/sleep 1
done
printf '%s\n' "${vals[@]}" | awk -v label="$label" '
  { s += $1; if (min == "" || $1 < min) min = $1; if ($1 > max) max = $1; if ($1 == 0) zeros++ }
  END { printf "%-10s mean %.1f%%  min %d%%  max %d%%  (n=%d, zero samples=%d)\n", label, s / NR, min, max, NR, zeros }'
