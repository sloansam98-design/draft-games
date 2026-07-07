#!/bin/bash
# Start a local preview server for Draft Games
cd "$(dirname "$0")"
PORT=8080

echo ""
echo "  Draft Games preview running at:"
echo "  → http://localhost:$PORT"
echo ""
echo "  Press Ctrl+C to stop."
echo ""

if command -v python3 >/dev/null 2>&1 && python3 -c "import http.server" 2>/dev/null; then
  python3 -m http.server "$PORT"
else
  ruby -e "require 'webrick'; WEBrick::HTTPServer.new(Port: $PORT, DocumentRoot: Dir.pwd).start"
fi
