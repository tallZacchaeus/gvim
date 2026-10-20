#!/usr/bin/env bash
# Set the admin login for the live site.
#
#   sudo bash /srv/gvim/app/set-admin.sh
#
# Prompts for the username and password. The password is read with the echo
# off and never appears on screen, in your shell history, or in the process
# list — only its salted hash is written to /etc/gvim/env.
set -euo pipefail

ENV_FILE=/etc/gvim/env
HASHER=/srv/gvim/app/hash-password.mjs

[ -f "$ENV_FILE" ] || { echo "No $ENV_FILE — is this the right host?" >&2; exit 1; }
[ -f "$HASHER" ]   || { echo "No $HASHER — deploy the app first." >&2; exit 1; }

CURRENT="$(grep -oP '(?<=^ADMIN_USERNAME=).*' "$ENV_FILE" || true)"
read -rp "Admin username [${CURRENT:-admin}]: " USERNAME
USERNAME="${USERNAME:-${CURRENT:-admin}}"

read -rsp "New password (min 12 chars, not shown): " PW1; echo
read -rsp "Repeat it: " PW2; echo
[ "$PW1" = "$PW2" ] || { echo "Passwords do not match." >&2; exit 1; }
[ "${#PW1}" -ge 12 ] || { echo "Too short — use at least 12 characters." >&2; exit 1; }

# Passed as an argument to a local node process only; never logged.
HASH="$(node "$HASHER" "$PW1" | grep -oE 'sha256:[a-f0-9]+:[a-f0-9]+' | head -1)"
[ -n "$HASH" ] || { echo "Hashing failed." >&2; exit 1; }

cp "$ENV_FILE" "${ENV_FILE}.bak.$(date +%s)"
sed -i "s|^ADMIN_USERNAME=.*|ADMIN_USERNAME=$USERNAME|" "$ENV_FILE"
sed -i "s|^ADMIN_PASSWORD_HASH=.*|ADMIN_PASSWORD_HASH=$HASH|" "$ENV_FILE"
unset PW1 PW2

systemctl restart gvim
for i in $(seq 1 15); do
  curl -fsS --max-time 3 http://127.0.0.1:3001/api/health 2>/dev/null | grep -q '"ok":true' && break
  sleep 1
done

echo
echo "  Admin login updated for '$USERNAME'. Existing sessions still work until"
echo "  their cookie expires; to cut them off now, also rotate JWT_SECRET:"
echo "    sed -i \"s|^JWT_SECRET=.*|JWT_SECRET=\$(openssl rand -hex 32)|\" $ENV_FILE && systemctl restart gvim"
echo
echo "  Then remove the temporary credential file:"
echo "    rm -f /root/gvim-temp-admin.txt"
