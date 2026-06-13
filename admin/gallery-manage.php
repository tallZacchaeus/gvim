<?php
require_once __DIR__ . '/auth.php';
require_admin();

$flash = admin_get_flash();
$filter_cat = $_GET['cat'] ?? 'all';
$items = $filter_cat !== 'all' && in_array($filter_cat, ['worship','events','community','youth'])
    ? get_gallery_items($filter_cat)
    : get_gallery_items();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Gallery — GVIM Admin</title>
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
        <a href="gallery-manage.php" class="active">Gallery</a>
        <a href="sermon-add.php">Add Sermon</a>
        <a href="sermon-manage.php">Sermons</a>
        <a href="../index.php" target="_blank">View Site</a>
        <a href="logout.php" class="logout-link">Logout</a>
    </div>
</nav>
<main class="admin-main">
    <div class="admin-container">
        <div class="page-header-admin">
            <h1><i class="fas fa-th"></i> Gallery (<?= count($items) ?> items)</h1>
            <a href="gallery-upload.php" class="btn-admin-primary"><i class="fas fa-plus"></i> Upload New</a>
        </div>

        <?php if ($flash): ?>
        <div class="alert alert-<?= $flash['type'] ?>"><?= htmlspecialchars($flash['msg'], ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>

        <!-- Filter tabs -->
        <div class="filter-tabs">
            <?php foreach (['all'=>'All', 'worship'=>'Worship', 'events'=>'Events', 'community'=>'Community', 'youth'=>'Youth'] as $k => $v): ?>
            <a href="?cat=<?= $k ?>" class="filter-tab <?= $filter_cat === $k ? 'active' : '' ?>"><?= $v ?></a>
            <?php endforeach; ?>
        </div>

        <?php if (empty($items)): ?>
        <div class="empty-state">
            <i class="fas fa-images fa-3x"></i>
            <p>No media in this category yet. <a href="gallery-upload.php">Upload some!</a></p>
        </div>
        <?php else: ?>
        <div class="admin-gallery-grid">
            <?php foreach ($items as $item): ?>
            <div class="admin-gallery-item">
                <?php if ($item['type'] === 'video'): ?>
                    <video src="../<?= htmlspecialchars($item['path'], ENT_QUOTES, 'UTF-8') ?>" muted preload="metadata" class="admin-thumb"></video>
                    <div class="media-type-badge video"><i class="fas fa-film"></i></div>
                <?php else: ?>
                    <img src="../<?= htmlspecialchars($item['path'], ENT_QUOTES, 'UTF-8') ?>" alt="<?= htmlspecialchars($item['title'], ENT_QUOTES, 'UTF-8') ?>" class="admin-thumb" loading="lazy">
                <?php endif; ?>
                <div class="admin-item-info">
                    <p class="item-title"><?= htmlspecialchars($item['title'], ENT_QUOTES, 'UTF-8') ?></p>
                    <span class="cat-badge cat-<?= $item['category'] ?>"><?= ucfirst($item['category']) ?></span>
                </div>
                <div class="admin-item-actions">
                    <form method="POST" action="delete.php" onsubmit="return confirm('Delete this item? This cannot be undone.')">
                        <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                        <input type="hidden" name="type" value="gallery">
                        <input type="hidden" name="path" value="<?= htmlspecialchars($item['path'], ENT_QUOTES, 'UTF-8') ?>">
                        <input type="hidden" name="filename" value="<?= htmlspecialchars($item['filename'], ENT_QUOTES, 'UTF-8') ?>">
                        <button type="submit" class="btn-delete" title="Delete"><i class="fas fa-trash"></i></button>
                    </form>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
    </div>
</main>
</body>
</html>
