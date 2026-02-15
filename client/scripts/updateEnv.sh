#!/usr/bin/env bash
IP=$(ip route get 8.8.8.8 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' | head -n1)
PORT="${BACKEND_PORT:-3000}"
ENVFILE=".env"
if [ -z "$IP" ]; then
  echo "Could not detect IP address."
  exit 1
fi
ROUTE="EXPO_PUBLIC_BASE_URL=http://$IP:$PORT"

touch "$ENVFILE"
if grep -q '^EXPO_PUBLIC_BASE_URL=' "$ENVFILE"; then
  sed -i "s|^EXPO_PUBLIC_BASE_URL=.*|$ROUTE|" "$ENVFILE"
else
  echo "$ROUTE" >> "$ENVFILE"
fi

echo "Wrote $ROUTE to $ENVFILE"