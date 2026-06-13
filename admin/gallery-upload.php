<?php
require_once __DIR__ . '/auth.php';
require_admin();

$errors = [];
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf($_POST['csrf_token'] ?? '')) {
        $errors[] = 'Security token invalid. Please refresh and try again.';
    } else {
        $category    = $_POST['category'] ?? '';
        $title       = trim(strip_tags($_POST['title'] ?? ''));
        $description = trim(strip_tags($_POST['description'] ?? ''));
        $valid_cats  = ['worship', 'events', 'community', 'youth'];

        if (!in_array($category, $valid_cats)) $errors[] = 'Invalid category.';
        if (strlen($title) < 2)                $errors[] = 'Title is required.';

        if (empty($errors) && isset($_FILES['media']) && $_FILES['media']['error'] === UPLOAD_ERR_OK) {
            $file      = $_FILES['media'];
            $orig_name = $file['name'];
            $tmp       = $file['tmp_name'];
            $size      = $file['size'];
            $ext       = strtolower(pathinfo($orig_name, PATHINFO_EXTENSION));

            // Validate size
            if ($size > MAX_FILE_SIZE) {
                $errors[] = 'File too large. Maximum size is 50MB.';
            }

            // Validate MIME type using finfo (not just extension)
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime  = $finfo->file($tmp);

            $allowed_mimes = array_merge(ALLOWED_IMAGE_MIMES, ALLOWED_VIDEO_MIMES);
            if (!in_array($mime, $allowed_mimes)) {
                $errors[] = "File type not allowed ({$mime}). Only images and videos are permitted.";
            }

            if (empty($errors)) {
                $safe_name  = generate_id() . '_' . sanitize_filename($orig_name);
                $dest_dir   = UPLOAD_DIR . 'gallery/' . $category . '/';
                $dest_path  = $dest_dir . $safe_name;
                $rel_path   = 'uploads/gallery/' . $category . '/' . $safe_name;

                if (!is_dir($dest_dir)) mkdir($dest_dir, 0755, true);

                if (move_uploaded_file($tmp, $dest_path)) {
                    // Update gallery.json with metadata
                    $gallery   = load_gallery();
                    $gallery['items'][] = [
                        'id'          => generate_id(),
                        'file'        => $rel_path,
                        'filename'    => $safe_name,
                        'category'    => $category,
                        'title'       => $title,
                        'description' => $description,
                        'type'        => in_array($mime, ALLOWED_VIDEO_MIMES) ? 'video' : 'image',
                        'date'        => date('Y-m-d'),
                        'uploaded_at' => date('Y-m-d H:i:s'),
                    ];
                    save_gallery($gallery);
                    admin_flash('success', "\"$title\" uploaded successfully.");
                    header('Location: gallery-manage.php');
                    exit;
                } else {
                    $errors[] = 'Failed to save file. Check folder permissions.';
                }
            }
        } elseif (empty($_FILES['media']['name'])) {
            $errors[] = 'Please select a file to upload.';
        } else {
            $upload_errors = [
                UPLOAD_ERR_INI_SIZE   => 'File exceeds server upload limit.',
                UPLOAD_ERR_FORM_SIZE  => 'File exceeds form upload limit.',
                UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded.',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder.',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write to disk.',
            ];
            $errors[] = $upload_errors[$_FILES['media']['error']] ?? 'Upload error code: ' . $_FILES['media']['error'];
        }
    }
}

$flash = admin_get_flash();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upload Media — GVIM Admin</title>
    <link rel="icon" href="../assets/images/gvim-logo.jpg" type="image/jpeg">
    <link rel="stylesheet" href="assets/admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body class="admin-body">
<nav class="admin-nav">
    <div class="admin-nav-brand">
        <img src="../assets/images/gvim-logo.jpg" alt="GVIM" width="40" height="40">
        <span>GVIM Admin</span>
    </div>
    <div class="admin-nav-links">
        <a href="dashboard.php">Dashboard</a>
        <a href="gallery-upload.php" class="active">Upload Media</a>
        <a href="gallery-manage.php">Gallery</a>
        <a href="sermon-add.php">Add Sermon</a>
        <a href="sermon-manage.php">Sermons</a>
        <a href="../index.php" target="_blank">View Site</a>
        <a href="logout.php" class="logout-link">Logout</a>
    </div>
</nav>
<main class="admin-main">
    <div class="admin-container">
        <h1><i class="fas fa-cloud-upload-alt"></i> Upload Photo or Video</h1>

        <?php if ($flash): ?>
        <div class="alert alert-<?= $flash['type'] ?>"><?= htmlspecialchars($flash['msg'], ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>

        <?php if (!empty($errors)): ?>
        <div class="alert alert-error">
            <ul style="margin:0;padding-left:1.25rem">
                <?php foreach ($errors as $e): ?><li><?= htmlspecialchars($e, ENT_QUOTES, 'UTF-8') ?></li><?php endforeach; ?>
            </ul>
        </div>
        <?php endif; ?>

        <div class="admin-card">
            <form method="POST" action="gallery-upload.php" enctype="multipart/form-data">
                <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">

                <div class="form-group">
                    <label for="media">Select File <span class="required">*</span></label>
                    <div class="file-drop-area" id="file-drop">
                        <i class="fas fa-cloud-upload-alt fa-3x"></i>
                        <p>Drag &amp; drop or click to select</p>
                        <p class="file-hint">Images: JPG, PNG, WebP, GIF &nbsp;|&nbsp; Videos: MP4, WebM, MOV &nbsp;|&nbsp; Max: 50MB</p>
                        <input type="file" id="media" name="media" accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime" required class="file-input">
                    </div>
                    <div id="file-preview" class="file-preview hidden"></div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="category">Category <span class="required">*</span></label>
                        <select id="category" name="category" required>
                            <option value="">Select category</option>
                            <option value="worship">Worship Services</option>
                            <option value="events">Special Events</option>
                            <option value="community">Community Service</option>
                            <option value="youth">Youth Ministry</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="title">Title <span class="required">*</span></label>
                        <input type="text" id="title" name="title" required maxlength="100"
                               placeholder="e.g. Sunday Worship Service"
                               value="<?= htmlspecialchars($_POST['title'] ?? '', ENT_QUOTES, 'UTF-8') ?>">
                    </div>
                </div>

                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea id="description" name="description" rows="3" maxlength="500"
                              placeholder="Brief description of this photo or video..."><?= htmlspecialchars($_POST['description'] ?? '', ENT_QUOTES, 'UTF-8') ?></textarea>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn-admin-primary">
                        <i class="fas fa-upload"></i> Upload
                    </button>
                    <a href="gallery-manage.php" class="btn-admin-secondary">Cancel</a>
                </div>
            </form>
        </div>
    </div>
</main>
<script>
const dropArea = document.getElementById('file-drop');
const fileInput = document.getElementById('media');
const preview  = document.getElementById('file-preview');

dropArea.addEventListener('click', () => fileInput.click());
dropArea.addEventListener('dragover', e => { e.preventDefault(); dropArea.classList.add('drag-over'); });
dropArea.addEventListener('dragleave', () => dropArea.classList.remove('drag-over'));
dropArea.addEventListener('drop', e => {
    e.preventDefault();
    dropArea.classList.remove('drag-over');
    fileInput.files = e.dataTransfer.files;
    showPreview(fileInput.files[0]);
});
fileInput.addEventListener('change', () => showPreview(fileInput.files[0]));

function showPreview(file) {
    if (!file) return;
    preview.classList.remove('hidden');
    preview.innerHTML = '';
    const url = URL.createObjectURL(file);
    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = url; img.alt = 'Preview';
        preview.appendChild(img);
    } else if (file.type.startsWith('video/')) {
        const vid = document.createElement('video');
        vid.src = url; vid.controls = true; vid.muted = true;
        preview.appendChild(vid);
    }
    const info = document.createElement('p');
    info.textContent = file.name + ' (' + (file.size / 1024 / 1024).toFixed(2) + ' MB)';
    preview.appendChild(info);
}
</script>
</body>
</html>
