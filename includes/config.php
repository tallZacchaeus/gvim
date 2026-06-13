<?php
define('SITE_NAME', "God's Vessels International Ministry");
define('SITE_SHORT', 'GVIM');
define('CONTACT_EMAIL', 'godvesselsinternational@gmail.com');
define('SITE_PHONE', '+1 (825) 202-7450');
define('SITE_ADDRESS', '4511, 36 Ave NW, Edmonton, T6L 3R9, Alberta, Canada');

define('ROOT_DIR',    dirname(__DIR__));
define('UPLOAD_DIR',  ROOT_DIR . '/uploads/');
define('DATA_DIR',    ROOT_DIR . '/data/');

define('MAX_FILE_SIZE',      50 * 1024 * 1024);
define('ALLOWED_IMAGE_EXTS', ['jpg','jpeg','png','webp','gif']);
define('ALLOWED_VIDEO_EXTS', ['mp4','webm','ogg','mov']);
define('ALLOWED_AUDIO_EXTS', ['mp3','ogg','wav','m4a']);
define('ALLOWED_IMAGE_MIMES', ['image/jpeg','image/png','image/webp','image/gif']);
define('ALLOWED_VIDEO_MIMES', ['video/mp4','video/webm','video/ogg','video/quicktime']);
define('ALLOWED_AUDIO_MIMES', ['audio/mpeg','audio/ogg','audio/wav','audio/mp4']);

require_once __DIR__ . '/db.php';

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']);
    session_start();
}

// ── CSRF ───────────────────────────────────────────────────────────────────
function csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_csrf(string $token): bool {
    return !empty($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

// ── Helpers ────────────────────────────────────────────────────────────────
function sanitize_filename(string $name): string {
    $ext  = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $base = mb_strtolower(pathinfo($name, PATHINFO_FILENAME));
    $base = preg_replace('/[^a-z0-9_-]/', '_', $base);
    $base = preg_replace('/_+/', '_', trim($base, '_'));
    return $base . '.' . $ext;
}

function generate_id(): string {
    return bin2hex(random_bytes(8));
}

function h(string $str): string {
    return htmlspecialchars($str, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

// ── Category DB functions ──────────────────────────────────────────────────
function get_categories(): array {
    return db()->query("SELECT * FROM gallery_categories ORDER BY label ASC")->fetchAll();
}

function get_category_slugs(): array {
    $rows = db()->query("SELECT slug FROM gallery_categories")->fetchAll();
    return array_column($rows, 'slug');
}

function insert_category(string $label): string {
    $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower(trim($label)));
    $slug = trim($slug, '-');
    $stmt = db()->prepare("INSERT IGNORE INTO gallery_categories (slug, label) VALUES (?, ?)");
    $stmt->execute([$slug, trim($label)]);
    return $slug;
}

function delete_category(string $slug): bool {
    $stmt = db()->prepare("DELETE FROM gallery_categories WHERE slug = ?");
    return $stmt->execute([$slug]);
}

function category_in_use(string $slug): bool {
    $stmt = db()->prepare("SELECT COUNT(*) FROM gallery WHERE category = ?");
    $stmt->execute([$slug]);
    return (int) $stmt->fetchColumn() > 0;
}

// ── Gallery DB functions ───────────────────────────────────────────────────
function get_gallery_items(?string $category = null): array {
    $sql = 'SELECT * FROM gallery';
    $params = [];
    if ($category) {
        $sql .= ' WHERE category = ?';
        $params[] = $category;
    }
    $sql .= ' ORDER BY item_date DESC, created_at DESC';
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function insert_gallery_item(array $item): bool {
    $stmt = db()->prepare("
        INSERT INTO gallery (id, title, description, category, file_path, filename, type, item_date)
        VALUES (:id, :title, :description, :category, :file_path, :filename, :type, :item_date)
    ");
    return $stmt->execute([
        ':id'          => $item['id'],
        ':title'       => $item['title'],
        ':description' => $item['description'] ?? '',
        ':category'    => $item['category'],
        ':file_path'   => $item['file_path'],
        ':filename'    => $item['filename'],
        ':type'        => $item['type'],
        ':item_date'   => $item['item_date'] ?? date('Y-m-d'),
    ]);
}

function delete_gallery_item(string $file_path): bool {
    $stmt = db()->prepare("DELETE FROM gallery WHERE file_path = ?");
    return $stmt->execute([$file_path]);
}

function count_gallery(?string $category = null): int {
    if ($category) {
        $stmt = db()->prepare("SELECT COUNT(*) FROM gallery WHERE category = ?");
        $stmt->execute([$category]);
    } else {
        $stmt = db()->query("SELECT COUNT(*) FROM gallery");
    }
    return (int) $stmt->fetchColumn();
}

// ── Sermons DB functions ───────────────────────────────────────────────────
function get_sermons(): array {
    return db()->query("SELECT * FROM sermons ORDER BY sermon_date DESC, created_at DESC")->fetchAll();
}

function get_sermon_by_id(string $id): ?array {
    $stmt = db()->prepare("SELECT * FROM sermons WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

function insert_sermon(array $s): bool {
    $stmt = db()->prepare("
        INSERT INTO sermons (id, title, speaker, sermon_date, scripture, description, youtube_id, file_path, duration)
        VALUES (:id, :title, :speaker, :sermon_date, :scripture, :description, :youtube_id, :file_path, :duration)
    ");
    return $stmt->execute([
        ':id'          => $s['id'],
        ':title'       => $s['title'],
        ':speaker'     => $s['speaker'],
        ':sermon_date' => $s['sermon_date'],
        ':scripture'   => $s['scripture'] ?? null,
        ':description' => $s['description'] ?? null,
        ':youtube_id'  => $s['youtube_id'] ?? null,
        ':file_path'   => $s['file_path'] ?? null,
        ':duration'    => $s['duration'] ?? null,
    ]);
}

function delete_sermon(string $id): bool {
    $stmt = db()->prepare("DELETE FROM sermons WHERE id = ?");
    return $stmt->execute([$id]);
}

function count_sermons(): int {
    return (int) db()->query("SELECT COUNT(*) FROM sermons")->fetchColumn();
}

// ── Contact submissions ────────────────────────────────────────────────────
function insert_contact(array $c): bool {
    $stmt = db()->prepare("
        INSERT INTO contact_submissions (name, email, phone, subject, message, newsletter, ip_address)
        VALUES (:name, :email, :phone, :subject, :message, :newsletter, :ip)
    ");
    return $stmt->execute([
        ':name'       => $c['name'],
        ':email'      => $c['email'],
        ':phone'      => $c['phone'] ?? null,
        ':subject'    => $c['subject'],
        ':message'    => $c['message'],
        ':newsletter' => $c['newsletter'] ? 1 : 0,
        ':ip'         => $c['ip'] ?? null,
    ]);
}

function get_contacts(int $limit = 50): array {
    $stmt = db()->prepare("SELECT * FROM contact_submissions ORDER BY submitted_at DESC LIMIT ?");
    $stmt->execute([$limit]);
    return $stmt->fetchAll();
}

function count_contacts(): int {
    return (int) db()->query("SELECT COUNT(*) FROM contact_submissions")->fetchColumn();
}
