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

    // Security: path must stay inside uploads/gallery/
    $abs          = realpath(ROOT_DIR . '/' . $rel_path);
    $allowed_base = realpath(UPLOAD_DIR . 'gallery');
    if ($abs && $allowed_base && str_starts_with($abs, $allowed_base)) {
        @unlink($abs);
    }

    delete_gallery_item($rel_path);
    admin_flash('success', 'Gallery item deleted.');
    header('Location: gallery-manage.php');

} elseif ($type === 'sermon') {
    $id   = $_POST['id']   ?? '';
    $file = $_POST['file'] ?? '';

    // Delete local file if present
    if ($file) {
        $abs          = realpath(ROOT_DIR . '/' . $file);
        $allowed_base = realpath(UPLOAD_DIR . 'sermons');
        if ($abs && $allowed_base && str_starts_with($abs, $allowed_base)) {
            @unlink($abs);
        }
    }

    delete_sermon($id);
    admin_flash('success', 'Sermon deleted.');
    header('Location: sermon-manage.php');

} else {
    header('Location: dashboard.php');
}
exit;
