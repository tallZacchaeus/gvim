<?php
define('SITE_NAME', "God's Vessels International Ministry");
define('SITE_SHORT', 'GVIM');
define('CONTACT_EMAIL', 'godvesselsinternational@gmail.com');
define('SITE_PHONE', '+1 (825) 202-7450');
define('SITE_ADDRESS', '4511, 36 Ave NW, Edmonton, T6L 3R9, Alberta, Canada');

define('ROOT_DIR', dirname(__DIR__));
define('UPLOAD_DIR', ROOT_DIR . '/uploads/');
define('DATA_DIR', ROOT_DIR . '/data/');
define('GALLERY_JSON', DATA_DIR . 'gallery.json');
define('SERMONS_JSON', DATA_DIR . 'sermons.json');

define('MAX_FILE_SIZE', 50 * 1024 * 1024);
define('ALLOWED_IMAGE_EXTS', ['jpg', 'jpeg', 'png', 'webp', 'gif']);
define('ALLOWED_VIDEO_EXTS', ['mp4', 'webm', 'ogg', 'mov']);
define('ALLOWED_AUDIO_EXTS', ['mp3', 'ogg', 'wav', 'm4a']);
define('ALLOWED_IMAGE_MIMES', ['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
define('ALLOWED_VIDEO_MIMES', ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']);
define('ALLOWED_AUDIO_MIMES', ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4']);

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']);
    session_start();
}

function csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_csrf(string $token): bool {
    return !empty($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

function load_gallery(): array {
    if (!file_exists(GALLERY_JSON)) return ['items' => []];
    return json_decode(file_get_contents(GALLERY_JSON), true) ?? ['items' => []];
}

function save_gallery(array $data): bool {
    return file_put_contents(GALLERY_JSON, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false;
}

function load_sermons(): array {
    if (!file_exists(SERMONS_JSON)) return ['sermons' => []];
    return json_decode(file_get_contents(SERMONS_JSON), true) ?? ['sermons' => []];
}

function save_sermons(array $data): bool {
    return file_put_contents(SERMONS_JSON, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false;
}

function sanitize_filename(string $name): string {
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $base = pathinfo($name, PATHINFO_FILENAME);
    $base = mb_strtolower($base);
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

function get_gallery_items(?string $category = null): array {
    $categories = ['worship', 'events', 'community', 'youth'];
    $scan_cats = $category ? [$category] : $categories;

    $gallery_data = load_gallery();
    $metadata = [];
    foreach ($gallery_data['items'] as $item) {
        $metadata[$item['file']] = $item;
    }

    $items = [];
    foreach ($scan_cats as $cat) {
        $dir = UPLOAD_DIR . 'gallery/' . $cat . '/';
        if (!is_dir($dir)) continue;
        $files = glob($dir . '*.{jpg,jpeg,png,gif,webp,mp4,webm,ogg,mov}', GLOB_BRACE);
        if (!$files) continue;
        foreach ($files as $file) {
            $filename = basename($file);
            $rel = 'uploads/gallery/' . $cat . '/' . $filename;
            $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
            $is_video = in_array($ext, ['mp4', 'webm', 'ogg', 'mov']);
            $meta = $metadata[$rel] ?? [];
            $items[] = [
                'path'        => $rel,
                'filename'    => $filename,
                'category'    => $cat,
                'type'        => $is_video ? 'video' : 'image',
                'title'       => $meta['title'] ?? ucfirst($cat) . ' Ministry',
                'description' => $meta['description'] ?? 'GVIM ' . ucfirst($cat) . ' moments',
                'date'        => $meta['date'] ?? date('Y-m-d', filemtime($file)),
                'id'          => $meta['id'] ?? md5($rel),
            ];
        }
    }

    usort($items, fn($a, $b) => strcmp($b['date'], $a['date']));
    return $items;
}
