#!/usr/bin/env bash
# Back up the GVIM database and media.
#
#   sudo bash /srv/gvim/app/deploy/backup.sh [dest_dir]
#
# Turso and R2 were replicated and managed. A file on one disk is not, so
# this is now the only thing standing between a disk failure and losing both
# the site's content and every photograph.
#
# IMPORTANT: this writes to the SAME MACHINE. It protects against a bad
# deploy or an accidental delete, not against losing the box. Something has
# to copy BACKUP_DIR off the host — see the note printed at the end.
set -euo pipefail

DB=/var/lib/gvim/gvim.db
MEDIA=/var/lib/gvim/media
DEST="${1:-/var/backups/gvim}"
KEEP=14
STAMP="$(date +%Y%m%d-%H%M%S)"

command -v sqlite3 >/dev/null 2>&1 || {
  echo "sqlite3 is not installed — apt-get install -y sqlite3" >&2; exit 1; }

mkdir -p "$DEST"

# .backup, never cp: the database is live, and copying it byte-for-byte can
# capture a half-written page. That produces an archive that looks fine and
# will not open when it is finally needed.
sqlite3 "$DB" ".backup '$DEST/gvim-$STAMP.db'"
gzip -9 "$DEST/gvim-$STAMP.db"
echo "  database  -> $DEST/gvim-$STAMP.db.gz"

tar -C "$(dirname "$MEDIA")" -czf "$DEST/media-$STAMP.tar.gz" "$(basename "$MEDIA")"
echo "  media     -> $DEST/media-$STAMP.tar.gz"

# Verify the snapshot actually opens and carries rows, so a silent failure
# does not sit undetected until a restore.
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
gunzip -c "$DEST/gvim-$STAMP.db.gz" > "$TMP/check.db"
ROWS="$(sqlite3 "$TMP/check.db" 'SELECT COUNT(*) FROM gallery')"
INTEGRITY="$(sqlite3 "$TMP/check.db" 'PRAGMA integrity_check')"
echo "  verified  -> integrity=$INTEGRITY, gallery rows=$ROWS"
[ "$INTEGRITY" = "ok" ] || { echo "  INTEGRITY CHECK FAILED" >&2; exit 1; }

find "$DEST" -name 'gvim-*.db.gz'   -mtime "+$KEEP" -delete
find "$DEST" -name 'media-*.tar.gz' -mtime "+$KEEP" -delete
echo "  pruned anything older than $KEEP days"
echo
echo "  NOTE: these sit on the same disk as the data they protect."
echo "        Copy $DEST off this host (rclone, scp, object storage) or"
echo "        a disk failure still loses everything."
