<?php
require_once __DIR__ . '/auth.php';
require_admin();

$flash = admin_get_flash();
$gallery_data = load_gallery();
$gallery_count = count(get_gallery_items());
$sermons_data = load_sermons();
$sermons_count = count($sermons_data['sermons'] ?? []);
$categories = ['worship', 'events', 'community', 'youth'];
$cat_counts = [];
foreach ($categories as $cat) {
    $items = get_gallery_items($cat);
    $cat_counts[$cat] = count($items);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard — GVIM Admin</title>
    <link rel="icon" href="../assets/images/gvim-logo.jpg" type="image/jpeg">
    <link rel="stylesheet" href="assets/admin.css">
</head>
<body class="admin-body">
<nav class="admin-nav">
    <div class="admin-nav-brand">
        <img src="../assets/images/gvim-logo.jpg" alt="GVIM" width="40" height="40">
        <span>GVIM Admin</span>
    </div>
    <div class="admin-nav-links">
        <a href="dashboard.php" class="active">Dashboard</a>
        <a href="gallery-upload.php">Upload Media</a>
        <a href="gallery-manage.php">Gallery</a>
        <a href="sermon-add.php">Add Sermon</a>
        <a href="sermon-manage.php">Sermons</a>
        <a href="../index.php" target="_blank">View Site</a>
        <a href="logout.php" class="logout-link">Logout</a>
    </div>
</nav>
<main class="admin-main">
    <div class="admin-container">
        <h1>Dashboard</h1>
        <p>Welcome back, <?= htmlspecialchars($_SESSION['admin_user'] ?? 'Admin', ENT_QUOTES, 'UTF-8') ?>!</p>

        <?php if ($flash): ?>
        <div class="alert alert-<?= $flash['type'] ?>"><?= htmlspecialchars($flash['msg'], ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>

        <!-- Stats -->
        <div class="stats-grid">
            <div class="stat-card">
                <i class="fas fa-images stat-icon"></i>
                <div class="stat-body">
                    <h2><?= $gallery_count ?></h2>
                    <p>Gallery Items</p>
                </div>
            </div>
            <div class="stat-card">
                <i class="fas fa-microphone stat-icon"></i>
                <div class="stat-body">
                    <h2><?= $sermons_count ?></h2>
                    <p>Sermons</p>
                </div>
            </div>
            <?php foreach ($cat_counts as $cat => $count): ?>
            <div class="stat-card">
                <i class="fas fa-folder stat-icon"></i>
                <div class="stat-body">
                    <h2><?= $count ?></h2>
                    <p><?= ucfirst($cat) ?></p>
                </div>
            </div>
            <?php endforeach; ?>
        </div>

        <!-- Quick Actions -->
        <h2>Quick Actions</h2>
        <div class="quick-actions">
            <a href="gallery-upload.php" class="action-card">
                <i class="fas fa-cloud-upload-alt fa-2x"></i>
                <h3>Upload Photo / Video</h3>
                <p>Add new media to the gallery</p>
            </a>
            <a href="sermon-add.php" class="action-card">
                <i class="fas fa-plus-circle fa-2x"></i>
                <h3>Add Sermon</h3>
                <p>Upload or link a new message</p>
            </a>
            <a href="gallery-manage.php" class="action-card">
                <i class="fas fa-th fa-2x"></i>
                <h3>Manage Gallery</h3>
                <p>View and delete gallery items</p>
            </a>
            <a href="sermon-manage.php" class="action-card">
                <i class="fas fa-list fa-2x"></i>
                <h3>Manage Sermons</h3>
                <p>Edit or delete sermon entries</p>
            </a>
        </div>
    </div>
</main>
<script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/js/all.min.js" defer></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</body>
</html>
