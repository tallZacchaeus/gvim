<?php
require_once __DIR__ . '/auth.php';
require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !verify_csrf($_POST['csrf_token'] ?? '')) {
    header('Location: dashboard.php');
    exit;
}

$type = $_POST['type'] ?? '';

if ($type === 'gallery') {
    $rel_path = $_POST['path'] ?? '';
    $filename = basename($rel_path);

    // Security: ensure path stays within uploads/gallery/
    $abs = realpath(ROOT_DIR . '/' . $rel_path);
    $allowed_base = realpath(UPLOAD_DIR . 'gallery');
    if ($abs && $allowed_base && str_starts_with($abs, $allowed_base)) {
        @unlink($abs);
    }

    // Remove from gallery.json
    $gallery = load_gallery();
    $gallery['items'] = array_values(array_filter(
        $gallery['items'],
        fn($item) => $item['file'] !== $rel_path
    ));
    save_gallery($gallery);
    admin_flash('success', 'Gallery item deleted.');
    header('Location: gallery-manage.php');

} elseif ($type === 'sermon') {
    $id = $_POST['id'] ?? '';
    $file = $_POST['file'] ?? '';

    // Delete file if it's a local upload
    if ($file) {
        $abs = realpath(ROOT_DIR . '/' . $file);
        $allowed_base = realpath(UPLOAD_DIR . 'sermons');
        if ($abs && $allowed_base && str_starts_with($abs, $allowed_base)) {
            @unlink($abs);
        }
    }

    // Remove from sermons.json
    $data = load_sermons();
    $data['sermons'] = array_values(array_filter(
        $data['sermons'],
        fn($s) => $s['id'] !== $id
    ));
    save_sermons($data);
    admin_flash('success', 'Sermon deleted.');
    header('Location: sermon-manage.php');

} else {
    header('Location: dashboard.php');
}
exit;
