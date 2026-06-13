<?php
require_once __DIR__ . '/auth.php';
require_admin();

$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf($_POST['csrf_token'] ?? '')) {
        $errors[] = 'Security token invalid.';
    } else {
        $title       = trim(strip_tags($_POST['title'] ?? ''));
        $speaker     = trim(strip_tags($_POST['speaker'] ?? ''));
        $date        = trim($_POST['date'] ?? '');
        $scripture   = trim(strip_tags($_POST['scripture'] ?? ''));
        $description = trim(strip_tags($_POST['description'] ?? ''));
        $youtube     = trim($_POST['youtube'] ?? '');
        $duration    = trim(strip_tags($_POST['duration'] ?? ''));

        if (strlen($title) < 3)    $errors[] = 'Title is required (min 3 characters).';
        if (strlen($speaker) < 2)  $errors[] = 'Speaker name is required.';
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) $errors[] = 'Please enter a valid date.';

        // Extract YouTube ID if full URL provided
        if ($youtube && preg_match('/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/', $youtube, $m)) {
            $youtube = $m[1];
        } elseif ($youtube && !preg_match('/^[a-zA-Z0-9_-]{11}$/', $youtube)) {
            $youtube = '';
        }

        $file_path = '';
        if (empty($errors) && isset($_FILES['media']) && $_FILES['media']['error'] === UPLOAD_ERR_OK) {
            $file = $_FILES['media'];
            $ext  = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime  = $finfo->file($file['tmp_name']);

            $allowed = array_merge(ALLOWED_VIDEO_MIMES, ALLOWED_AUDIO_MIMES);
            if (!in_array($mime, $allowed)) {
                $errors[] = "File type not allowed: $mime";
            } elseif ($file['size'] > MAX_FILE_SIZE) {
                $errors[] = 'File too large (max 50MB).';
            } else {
                $safe_name = generate_id() . '_' . sanitize_filename($file['name']);
                $dest = UPLOAD_DIR . 'sermons/' . $safe_name;
                if (!is_dir(UPLOAD_DIR . 'sermons/')) mkdir(UPLOAD_DIR . 'sermons/', 0755, true);
                if (move_uploaded_file($file['tmp_name'], $dest)) {
                    $file_path = 'uploads/sermons/' . $safe_name;
                } else {
                    $errors[] = 'Failed to save file.';
                }
            }
        }

        if (empty($errors)) {
            insert_sermon([
                'id'          => generate_id(),
                'title'       => $title,
                'speaker'     => $speaker,
                'sermon_date' => $date,
                'scripture'   => $scripture,
                'description' => $description,
                'youtube_id'  => $youtube,
                'file_path'   => $file_path,
                'duration'    => $duration,
            ]);
            admin_flash('success', "Sermon \"$title\" added successfully.");
            header('Location: sermon-manage.php');
            exit;
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
    <title>Add Sermon — GVIM Admin</title>
    <link rel="icon" href="../assets/images/gvim-logo.jpg" type="image/jpeg">
    <link rel="stylesheet" href="assets/admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body class="admin-body">
<nav class="admin-nav">
    <div class="admin-nav-brand"><img src="../assets/images/gvim-logo.jpg" alt="GVIM" width="40" height="40"><span>GVIM Admin</span></div>
    <div class="admin-nav-links">
        <a href="dashboard.php">Dashboard</a>
        <a href="gallery-upload.php">Upload Media</a>
        <a href="gallery-manage.php">Gallery</a>
        <a href="categories.php">Categories</a>
        <a href="sermon-add.php" class="active">Add Sermon</a>
        <a href="sermon-manage.php">Sermons</a>
        <a href="contacts.php">Messages</a>
        <a href="../index.php" target="_blank">View Site</a>
        <a href="logout.php" class="logout-link">Logout</a>
    </div>
</nav>
<main class="admin-main">
    <div class="admin-container">
        <h1><i class="fas fa-plus-circle"></i> Add New Sermon</h1>

        <?php if (!empty($errors)): ?>
        <div class="alert alert-error">
            <ul style="margin:0;padding-left:1.25rem">
                <?php foreach ($errors as $e): ?><li><?= htmlspecialchars($e, ENT_QUOTES, 'UTF-8') ?></li><?php endforeach; ?>
            </ul>
        </div>
        <?php endif; ?>

        <div class="admin-card">
            <form method="POST" action="sermon-add.php" enctype="multipart/form-data">
                <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">

                <div class="form-row">
                    <div class="form-group">
                        <label for="title">Sermon Title <span class="required">*</span></label>
                        <input type="text" id="title" name="title" required
                               value="<?= htmlspecialchars($_POST['title'] ?? '', ENT_QUOTES, 'UTF-8') ?>"
                               placeholder="e.g. Walking in Divine Purpose">
                    </div>
                    <div class="form-group">
                        <label for="speaker">Speaker <span class="required">*</span></label>
                        <input type="text" id="speaker" name="speaker" required
                               value="<?= htmlspecialchars($_POST['speaker'] ?? 'Rev. Godwin BB. Olutimi', ENT_QUOTES, 'UTF-8') ?>">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="date">Date <span class="required">*</span></label>
                        <input type="date" id="date" name="date" required
                               value="<?= htmlspecialchars($_POST['date'] ?? date('Y-m-d'), ENT_QUOTES, 'UTF-8') ?>">
                    </div>
                    <div class="form-group">
                        <label for="duration">Duration (optional)</label>
                        <input type="text" id="duration" name="duration" placeholder="e.g. 45 minutes"
                               value="<?= htmlspecialchars($_POST['duration'] ?? '', ENT_QUOTES, 'UTF-8') ?>">
                    </div>
                </div>

                <div class="form-group">
                    <label for="scripture">Key Scripture</label>
                    <input type="text" id="scripture" name="scripture"
                           placeholder='e.g. "For I know the plans..." — Jeremiah 29:11'
                           value="<?= htmlspecialchars($_POST['scripture'] ?? '', ENT_QUOTES, 'UTF-8') ?>">
                </div>

                <div class="form-group">
                    <label for="description">Description / Summary</label>
                    <textarea id="description" name="description" rows="4"
                              placeholder="Brief summary of the sermon message..."><?= htmlspecialchars($_POST['description'] ?? '', ENT_QUOTES, 'UTF-8') ?></textarea>
                </div>

                <hr style="margin:1.5rem 0; border-color:#e2e8f0">
                <h3 style="margin-bottom:1rem">Media (choose one or both)</h3>

                <div class="form-group">
                    <label for="youtube">YouTube Video ID or URL</label>
                    <input type="text" id="youtube" name="youtube"
                           placeholder="e.g. dQw4w9WgXcQ or full YouTube URL"
                           value="<?= htmlspecialchars($_POST['youtube'] ?? '', ENT_QUOTES, 'UTF-8') ?>">
                    <small>The video will be embedded inline on the Sermons page.</small>
                </div>

                <div class="form-group">
                    <label for="media">Upload Video or Audio File</label>
                    <div class="file-drop-area">
                        <i class="fas fa-film fa-2x"></i>
                        <p>Click to select MP4, WebM, MP3, or audio file</p>
                        <p class="file-hint">Max 50MB &nbsp;|&nbsp; Video: MP4, WebM, MOV &nbsp;|&nbsp; Audio: MP3, M4A, WAV</p>
                        <input type="file" id="media" name="media"
                               accept="video/mp4,video/webm,video/ogg,audio/mpeg,audio/ogg,audio/wav,audio/mp4" class="file-input">
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn-admin-primary"><i class="fas fa-save"></i> Save Sermon</button>
                    <a href="sermon-manage.php" class="btn-admin-secondary">Cancel</a>
                </div>
            </form>
        </div>
    </div>
</main>
<script>
document.querySelectorAll('.file-drop-area').forEach(area => {
    const input = area.querySelector('.file-input');
    area.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
        if (input.files[0]) {
            area.querySelector('p').textContent = input.files[0].name + ' (' + (input.files[0].size/1024/1024).toFixed(2) + ' MB)';
        }
    });
});
</script>
</body>
</html>
