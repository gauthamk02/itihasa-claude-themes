#!/bin/bash
# Renders an SVG scene to a PNG with headless Chrome, at a window size, so a
# scene can be looked at without the browser pane.
#
#   tools/shoot.sh tools/preview/ananta-still.svg 1400 800   -> tools/shots/ananta-still-1400x800.png
#   tools/shoot.sh tools/preview/ananta-still.svg 390 844 panels   (with Code-tab-like panels on top)

svg=$(cd "$(dirname "$1")" && pwd)/$(basename "$1")
w=${2:-1400}
h=${3:-800}
mode=${4:-bare}
here=$(cd "$(dirname "$0")" && pwd)
name=$(basename "$svg" .svg)
out="$here/shots/$name-${w}x$h${mode/bare/}.png"
page=$(mktemp -d)/page.html
if [ "$mode" = panels ]; then
  side=$(( w > 700 ? 240 : 0 ))
  cat > "$page" <<HTML
<!doctype html><style>html,body{margin:0;height:100%;overflow:hidden;background:#000;font:15px -apple-system,sans-serif;color:#e8eeff}
img{position:fixed;inset:0;width:100%;height:100%}.p{position:fixed;border-radius:12px;background:rgba(10,15,34,.55);padding:16px;box-sizing:border-box}
#s{left:0;top:0;bottom:0;width:${side}px;border-radius:0}#m{left:$((side+20))px;right:20px;top:20px;bottom:110px}#i{left:$((side+60))px;right:60px;bottom:24px;height:64px}</style>
<img src="file://$svg"><div class="p" id="s">Sessions</div><div class="p" id="m"><p>add a cook time badge to each recipe card</p><p>Done! Every recipe card now shows a cook time badge.</p></div><div class="p" id="i">Type / for commands</div>
HTML
else
  printf '<!doctype html><style>html,body{margin:0;overflow:hidden;background:#000}img{display:block;width:%spx;height:%spx}</style><img src="file://%s">' "$w" "$h" "$svg" > "$page"
fi
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --allow-file-access-from-files --window-size="$(( w < 600 ? 600 : w )),$h" --screenshot="$out" "file://$page" >/dev/null 2>&1
# Headless Chrome won't make a window narrower than about 500px: crop to size.
[ "$w" -lt 600 ] && magick "$out" -crop "${w}x${h}+0+0" +repage "$out"
echo "$out"
