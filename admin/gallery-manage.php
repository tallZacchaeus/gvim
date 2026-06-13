<?php
require_once __DIR__ . '/auth.php';
require_admin();

$flash      = admin_get_flash();
$categories = get_categories();
$filter_cat = $_GET['cat'] ?? 'all';
$valid_slugs = array_column($categories, 'slug');
$items = ($filter_cat !== 'all' && in_array($filter_cat, $valid_slugs))
    ? get_gallery_items($filter_cat)
    : get_gallery_items();
$admin_page    = 'gallery-manage';
$admin_title   = 'Gallery';
$admin_subtitle = count($items) . ' item' . (count($items) === 1 ? '' : 's')
    . ($filter_cat !== 'all' ? ' in this category' : ' across all categories');
$admin_actions = '<a href="gallery-upload.php" class="btn-admin-primary"><i class="fas fa-cloud-arrow-up"></i> Upload New</a>';
require __DIR__ . '/partials/header.php';
?>
        <?php if ($flash): ?>
        <div class="alert alert-<?= $flash['type'] ?>"><?= h($flash['msg']) ?></div>
        <?php endif; ?>

        <div class="filter-tabs">
            <a href="?cat=all" class="filter-tab <?= $filter_cat === 'all' ? 'active' : '' ?>">All</a>
            <?php foreach ($categories as $cat): ?>
            <a href="?cat=<?= h($cat['slug']) ?>" class="filter-tab <?= $filter_cat === $cat['slug'] ? 'active' : '' ?>">
                <?= h($cat['label']) ?>
            </a>
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
                    <video src="../<?= h($item['file_path']) ?>" muted preload="metadata" class="admin-thumb"></video>
                    <div class="media-type-badge video"><i class="fas fa-film"></i></div>
                <?php else: ?>
                    <img src="../<?= h($item['file_path']) ?>" alt="<?= h($item['title']) ?>" class="admin-thumb" loading="lazy">
                <?php endif; ?>
                <div class="admin-item-info">
                    <p class="item-title"><?= h($item['title']) ?></p>
                    <span class="cat-badge" style="background:var(--blue-light);color:var(--blue-dark)"><?= h($item['category']) ?></span>
                </div>
                <div class="admin-item-actions">
                    <form method="POST" action="delete.php" onsubmit="return confirm('Delete this item? This cannot be undone.')">
                        <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                        <input type="hidden" name="type" value="gallery">
                        <input type="hidden" name="path" value="<?= h($item['file_path']) ?>">
                        <input type="hidden" name="filename" value="<?= h($item['filename']) ?>">
                        <button type="submit" class="btn-delete" title="Delete"><i class="fas fa-trash"></i></button>
                    </form>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
<?php require __DIR__ . '/partials/footer.php'; ?>
