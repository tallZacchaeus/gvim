#!/usr/bin/env bash
# Provision the VPS for GVIM. Idempotent: safe to re-run.
#
#   sudo bash deploy/setup-vps.sh <server_name>
#
# Creates the service user, the directory layout, the env file skeleton, the
# systemd unit and the nginx site. It does NOT issue a certificate or start
# the service — run certbot once DNS points here, then deploy the app.
set -euo pipefail

SERVER_NAME="${1:-}"
[ -n "$SERVER_NAME" ] || { echo "usage: setup-vps.sh <server_name>" >&2; exit 2; }

APP_USER=gvim
APP_DIR=/srv/gvim/app
DATA_DIR=/var/lib/gvim
ENV_FILE=/etc/gvim/env
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

say() { printf '  %s\n' "$*"; }

say "service user"
if ! id -u "$APP_USER" >/dev/null 2>&1; then
  useradd --system --home-dir "$DATA_DIR" --shell /usr/sbin/nologin "$APP_USER"
  say "  created $APP_USER"
else
  say "  $APP_USER already exists"
fi

say "directories"
install -d -o "$APP_USER" -g "$APP_USER" -m 755 /srv/gvim "$APP_DIR"
install -d -o "$APP_USER" -g "$APP_USER" -m 755 "$DATA_DIR" "$DATA_DIR/media"
install -d -o root -g root -m 750 /etc/gvim

say "env file"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<'ENVEOF'
# GVIM runtime environment. Root-owned, 600 — systemd reads it as root
# before dropping to the service user.

# Local SQLite file. libSQL takes a file: URL exactly as it took the Turso
# one, so no query or table changed when the database moved here.
TURSO_DATABASE_URL=file:/var/lib/gvim/gvim.db

# Where uploaded media lives on disk. nginx serves this tree at /media/.
MEDIA_ROOT=/var/lib/gvim/media

# Public URL prefix the API prepends to each stored file_path.
PUBLIC_GALLERY_BASE=/media
PUBLIC_SERMONS_BASE=/media

# REQUIRED — fill these in before starting the service.
JWT_SECRET=
ADMIN_USERNAME=
ADMIN_PASSWORD_HASH=

# Optional: contact-form notifications.
RESEND_API_KEY=
CONTACT_NOTIFY_TO=
ENVEOF
  chmod 600 "$ENV_FILE"
  say "  created $ENV_FILE (secrets still blank)"
else
  say "  $ENV_FILE already exists, left alone"
fi

say "systemd unit"
install -m 644 "$HERE/gvim.service" /etc/systemd/system/gvim.service
systemctl daemon-reload
say "  installed, not started"

say "nginx site"
sed "s/SERVER_NAME_PLACEHOLDER/$SERVER_NAME/g" "$HERE/nginx-gvim.conf" \
  > /etc/nginx/sites-available/gvim
ln -sfn /etc/nginx/sites-available/gvim /etc/nginx/sites-enabled/gvim
if nginx -t 2>/dev/null; then
  systemctl reload nginx
  say "  installed for $SERVER_NAME and reloaded"
else
  say "  nginx config test FAILED — not reloaded"
  nginx -t || true
  exit 1
fi

cat <<DONE

  Provisioned. Still to do, in order:
    1. Fill JWT_SECRET, ADMIN_USERNAME and ADMIN_PASSWORD_HASH in $ENV_FILE
    2. Point DNS for $SERVER_NAME at this host
    3. certbot --nginx -d $SERVER_NAME
    4. Deploy the app, then: systemctl enable --now gvim
DONE
