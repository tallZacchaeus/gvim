<?php
require_once __DIR__ . '/auth.php';
require_admin();

$errors   = [];
$uploaded = 0;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf($_POST['csrf_token'] ?? '')) {
        $errors[] = 'Security token invalid. Please refresh and try again.';
    } else {
        $category    = $_POST['category'] ?? '';
        $description = trim(strip_tags($_POST['description'] ?? ''));
        $valid_slugs = get_category_slugs();

        if (!in_array($category, $valid_slugs)) $errors[] = 'Please select a valid category.';

        if (empty($errors) && !empty($_FILES['media']['name'][0])) {
            $files     = $_FILES['media'];
            $count     = count($files['name']);
            $dest_dir  = UPLOAD_DIR . 'gallery/' . $category . '/';
            if (!is_dir($dest_dir)) mkdir($dest_dir, 0755, true);

            $upload_error_map = [
                UPLOAD_ERR_INI_SIZE   => 'Exceeds server limit.',
                UPLOAD_ERR_FORM_SIZE  => 'Exceeds form limit.',
                UPLOAD_ERR_PARTIAL    => 'Only partially uploaded.',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temp folder.',
                UPLOAD_ERR_CANT_WRITE => 'Cannot write to disk.',
            ];

            for ($i = 0; $i < $count; $i++) {
                if ($files['error'][$i] !== UPLOAD_ERR_OK) {
                    $errors[] = h($files['name'][$i]) . ': ' . ($upload_error_map[$files['error'][$i]] ?? 'Upload error.');
                    continue;
                }
                if ($files['size'][$i] > MAX_FILE_SIZE) {
                    $errors[] = h($files['name'][$i]) . ': File too large (max 50MB).';
                    continue;
                }

                $finfo = new finfo(FILEINFO_MIME_TYPE);
                $mime  = $finfo->file($files['tmp_name'][$i]);
                $allowed = array_merge(ALLOWED_IMAGE_MIMES, ALLOWED_VIDEO_MIMES);
                if (!in_array($mime, $allowed)) {
                    $errors[] = h($files['name'][$i]) . ": File type not allowed ({$mime}).";
                    continue;
                }

                $orig_name = $files['name'][$i];
                $safe_name = generate_id() . '_' . sanitize_filename($orig_name);
                $dest_path = $dest_dir . $safe_name;
                $rel_path  = 'uploads/gallery/' . $category . '/' . $safe_name;

                // Auto-generate title from filename
                $title = ucwords(str_replace(['_','-'], ' ', pathinfo($orig_name, PATHINFO_FILENAME)));

                if (move_uploaded_file($files['tmp_name'][$i], $dest_path)) {
                    insert_gallery_item([
                        'id'          => generate_id(),
                        'file_path'   => $rel_path,
                        'filename'    => $safe_name,
                        'category'    => $category,
                        'title'       => $title,
                        'description' => $description,
                        'type'        => in_array($mime, ALLOWED_VIDEO_MIMES) ? 'video' : 'image',
                        'item_date'   => date('Y-m-d'),
                    ]);
                    $uploaded++;
                } else {
                    $errors[] = h($orig_name) . ': Failed to save. Check folder permissions.';
                }
            }

            if ($uploaded > 0 && empty($errors)) {
                admin_flash('success', "{$uploaded} file(s) uploaded successfully.");
                header('Location: gallery-manage.php');
                exit;
            } elseif ($uploaded > 0) {
                admin_flash('success', "{$uploaded} file(s) uploaded. Some files had errors — see below.");
            }
        } elseif (empty($errors)) {
            $errors[] = 'Please select at least one file to upload.';
        }
    }
}

$flash      = admin_get_flash();
$categories = get_categories();
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
    <style>
        .file-list { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .file-list-item { display: flex; align-items: center; gap: 0.75rem; background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: var(--radius); padding: 0.5rem 0.75rem; font-size: 0.875rem; }
        .file-list-item img, .file-list-item video { width: 48px; height: 48px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
        .file-list-item .file-info { flex: 1; min-width: 0; }
        .file-list-item .file-name { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .file-list-item .file-size { color: var(--gray-400); font-size: 0.8rem; }
        .file-count-badge { display: inline-flex; align-items: center; gap: 0.375rem; background: var(--blue); color: #fff; border-radius: 1rem; padding: 0.25rem 0.75rem; font-size: 0.875rem; font-weight: 600; }
    </style>
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
        <a href="categories.php">Categories</a>
        <a href="sermon-add.php">Add Sermon</a>
        <a href="sermon-manage.php">Sermons</a>
        <a href="contacts.php">Messages</a>
        <a href="../index.php" target="_blank">View Site</a>
        <a href="logout.php" class="logout-link">Logout</a>
    </div>
</nav>
<main class="admin-main">
    <div class="admin-container">
        <h1><i class="fas fa-cloud-upload-alt"></i> Upload Photos &amp; Videos</h1>

        <?php if ($flash): ?>
        <div class="alert alert-<?= $flash['type'] ?>"><?= h($flash['msg']) ?></div>
        <?php endif; ?>

        <?php if (!empty($errors)): ?>
        <div class="alert alert-error">
            <ul style="margin:0;padding-left:1.25rem">
                <?php foreach ($errors as $e): ?><li><?= $e ?></li><?php endforeach; ?>
            </ul>
        </div>
        <?php endif; ?>

        <div class="admin-card">
            <form method="POST" action="gallery-upload.php" enctype="multipart/form-data" id="upload-form">
                <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">

                <!-- Drop zone -->
                <div class="form-group">
                    <label>Select Files <span class="required">*</span>
                        <span id="file-count-badge" style="display:none" class="file-count-badge">
                            <i class="fas fa-check"></i> <span id="file-count-text">0 files</span>
                        </span>
                    </label>
                    <div class="file-drop-area" id="file-drop">
                        <i class="fas fa-cloud-upload-alt fa-3x"></i>
                        <p><strong>Drag &amp; drop files here</strong> or click to select</p>
                        <p class="file-hint">Images: JPG, PNG, WebP, GIF &nbsp;|&nbsp; Videos: MP4, WebM, MOV &nbsp;|&nbsp; Max 50MB each &nbsp;|&nbsp; Multiple files allowed</p>
                        <input type="file" id="media" name="media[]" multiple
                               accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime"
                               required class="file-input">
                    </div>
                    <div id="file-list" class="file-list"></div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="category">Category <span class="required">*</span></label>
                        <select id="category" name="category" required>
                            <option value="">Select category</option>
                            <?php foreach ($categories as $cat): ?>
                            <option value="<?= h($cat['slug']) ?>" <?= ($_POST['category'] ?? '') === $cat['slug'] ? 'selected' : '' ?>>
                                <?= h($cat['label']) ?>
                            </option>
                            <?php endforeach; ?>
                        </select>
                        <small><a href="categories.php">Manage categories</a></small>
                    </div>
                    <div class="form-group">
                        <label for="description">Description <small>(applies to all files)</small></label>
                        <input type="text" id="description" name="description" maxlength="255"
                               placeholder="e.g. Sunday morning worship service"
                               value="<?= h($_POST['description'] ?? '') ?>">
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn-admin-primary" id="submit-btn">
                        <i class="fas fa-upload"></i> Upload All
                    </button>
                    <a href="gallery-manage.php" class="btn-admin-secondary">Cancel</a>
                </div>
            </form>
        </div>
    </div>
</main>
<script>
const dropArea  = document.getElementById('file-drop');
const fileInput = document.getElementById('media');
const fileList  = document.getElementById('file-list');
const badge     = document.getElementById('file-count-badge');
const badgeText = document.getElementById('file-count-text');
const submitBtn = document.getElementById('submit-btn');

dropArea.addEventListener('click', () => fileInput.click());
dropArea.addEventListener('dragover', e => { e.preventDefault(); dropArea.classList.add('drag-over'); });
dropArea.addEventListener('dragleave', () => dropArea.classList.remove('drag-over'));
dropArea.addEventListener('drop', e => {
    e.preventDefault();
    dropArea.classList.remove('drag-over');
    fileInput.files = e.dataTransfer.files;
    renderList(fileInput.files);
});
fileInput.addEventListener('change', () => renderList(fileInput.files));

function renderList(files) {
    fileList.innerHTML = '';
    if (!files.length) { badge.style.display = 'none'; return; }

    badge.style.display = 'inline-flex';
    badgeText.textContent = files.length + ' file' + (files.length > 1 ? 's' : '') + ' selected';
    submitBtn.innerHTML = '<i class="fas fa-upload"></i> Upload ' + files.length + ' File' + (files.length > 1 ? 's' : '');

    Array.from(files).forEach(file => {
        const item = document.createElement('div');
        item.className = 'file-list-item';
        const url = URL.createObjectURL(file);
        let media = '';
        if (file.type.startsWith('image/')) {
            media = `<img src="${url}" alt="">`;
        } else if (file.type.startsWith('video/')) {
            media = `<video src="${url}" muted></video>`;
        } else {
            media = `<div style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;background:var(--gray-100);border-radius:4px"><i class="fas fa-file" style="color:var(--gray-400)"></i></div>`;
        }
        const size = (file.size / 1024 / 1024).toFixed(2);
        item.innerHTML = `${media}<div class="file-info"><div class="file-name">${file.name}</div><div class="file-size">${size} MB</div></div>`;
        fileList.appendChild(item);
    });
}

document.getElementById('upload-form').addEventListener('submit', () => {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading…';
});
</script>
</body>
</html>
