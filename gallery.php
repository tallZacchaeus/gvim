<?php
$page_title = 'Gallery';
$page_desc = "Browse photos and videos from GVIM worship services, community outreach, special events, and youth ministry.";
$root = '';
require_once 'includes/header.php';

$db_cats    = get_categories();
$valid_slugs = array_column($db_cats, 'slug');
$filter     = in_array($_GET['cat'] ?? '', $valid_slugs) ? $_GET['cat'] : null;
$all_items  = get_gallery_items($filter);
?>

<section class="page-header">
    <div class="container">
        <span class="eyebrow" data-hero>Moments of Grace</span>
        <h1 data-hero>Photo &amp; Video Gallery</h1>
        <p data-hero>Celebrating moments of worship, fellowship, and community service.</p>
    </div>
</section>

<section class="gallery-filter">
    <div class="container">
        <div class="filter-buttons">
            <button class="filter-btn <?= !$filter ? 'active' : '' ?>" data-filter="all">All Media</button>
            <?php foreach ($db_cats as $cat): ?>
            <button class="filter-btn <?= $filter === $cat['slug'] ? 'active' : '' ?>"
                    data-filter="<?= h($cat['slug']) ?>"><?= h($cat['label']) ?></button>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<section class="gallery">
    <div class="container">
        <?php if (empty($all_items)): ?>
        <p class="text-center" style="padding:3rem">No media yet. Check back soon!</p>
        <?php else: ?>
        <div class="gallery-grid" id="gallery-grid">
            <?php foreach ($all_items as $item): ?>
            <div class="gallery-item" data-category="<?= h($item['category']) ?>">
                <?php if ($item['type'] === 'video'): ?>
                    <video src="<?= h($item['file_path']) ?>"
                           preload="metadata"
                           muted
                           class="gallery-media"
                           data-type="video"
                           data-title="<?= h($item['title']) ?>"
                           data-description="<?= h($item['description']) ?>">
                    </video>
                    <div class="video-badge"><i class="fas fa-play-circle"></i></div>
                <?php else: ?>
                    <img src="<?= h($item['file_path']) ?>"
                         alt="<?= h($item['title']) ?>"
                         loading="lazy"
                         class="gallery-media"
                         data-type="image"
                         data-title="<?= h($item['title']) ?>"
                         data-description="<?= h($item['description']) ?>"
                         data-src="<?= h($item['file_path']) ?>"
                         width="400" height="300">
                <?php endif; ?>
                <div class="gallery-overlay">
                    <h4><?= h($item['title']) ?></h4>
                    <p><?= h($item['description']) ?></p>
                    <button class="view-btn"
                            data-type="<?= h($item['type']) ?>"
                            data-src="<?= h($item['file_path']) ?>"
                            data-title="<?= h($item['title']) ?>"
                            data-description="<?= h($item['description']) ?>">
                        <?= $item['type'] === 'video' ? '<i class="fas fa-play"></i> Play' : '<i class="fas fa-expand"></i> View' ?>
                    </button>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
    </div>
</section>

<!-- Lightbox Modal -->
<div id="gallery-modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="modal-content modal-media-content">
        <button class="close" aria-label="Close">&times;</button>
        <div class="modal-media" id="modal-media"></div>
        <div class="modal-info">
            <h3 id="modal-title"></h3>
            <p id="modal-description"></p>
        </div>
    </div>
</div>

<?php require_once 'includes/footer.php'; ?>
