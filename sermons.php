<?php
$page_title = 'Sermons';
$page_desc = "Listen to and watch messages from God's Vessels International Ministry. Be encouraged and inspired by the Word of God.";
$root = '';
require_once 'includes/header.php';

$data = load_sermons();
$sermons = $data['sermons'] ?? [];
$featured = !empty($sermons) ? $sermons[0] : null;
$rest = array_slice($sermons, 1);
?>

<section class="page-header">
    <div class="container">
        <h1>Sermons &amp; Messages</h1>
        <p>Be encouraged and inspired by God's Word through our sermons and teachings</p>
    </div>
</section>

<?php if ($featured): ?>
<!-- Featured / Latest Sermon -->
<section class="featured-sermon">
    <div class="container">
        <h2>Latest Message</h2>
        <div class="featured-content">
            <div class="sermon-video">
                <?php if (!empty($featured['file'])): ?>
                    <?php $ext = strtolower(pathinfo($featured['file'], PATHINFO_EXTENSION)); ?>
                    <?php if (in_array($ext, ['mp4','webm','ogg','mov'])): ?>
                        <video controls preload="metadata" poster="<?= h($featured['thumbnail'] ?? '') ?>" style="width:100%;border-radius:0.75rem">
                            <source src="../<?= h($featured['file']) ?>" type="video/mp4">
                            Your browser does not support video.
                        </video>
                    <?php elseif (in_array($ext, ['mp3','ogg','wav','m4a'])): ?>
                        <div class="video-placeholder">
                            <img src="assets/images/gvim-logo.jpg" alt="GVIM" class="sermon-logo">
                            <div class="play-overlay"><i class="fas fa-headphones fa-3x"></i></div>
                        </div>
                        <audio controls style="width:100%;margin-top:1rem">
                            <source src="<?= h($featured['file']) ?>" type="audio/mpeg">
                        </audio>
                    <?php elseif (!empty($featured['youtube'])): ?>
                        <iframe src="https://www.youtube.com/embed/<?= h($featured['youtube']) ?>"
                                frameborder="0" allowfullscreen style="width:100%;aspect-ratio:16/9;border-radius:0.75rem"
                                loading="lazy"></iframe>
                    <?php endif; ?>
                <?php elseif (!empty($featured['youtube'])): ?>
                    <iframe src="https://www.youtube.com/embed/<?= h($featured['youtube']) ?>"
                            frameborder="0" allowfullscreen style="width:100%;aspect-ratio:16/9;border-radius:0.75rem"
                            loading="lazy"></iframe>
                <?php else: ?>
                    <div class="video-placeholder">
                        <img src="assets/images/gvim-logo.jpg" alt="GVIM" class="sermon-logo">
                        <div class="play-overlay"><i class="fas fa-play-circle fa-4x"></i></div>
                    </div>
                <?php endif; ?>
            </div>
            <div class="sermon-details">
                <h3><?= h($featured['title']) ?></h3>
                <p class="sermon-meta">
                    <i class="fas fa-calendar"></i> <?= h($featured['date'] ?? '') ?> &nbsp;|&nbsp;
                    <i class="fas fa-user"></i> <?= h($featured['speaker'] ?? 'Rev. Godwin BB. Olutimi') ?> &nbsp;|&nbsp;
                    <i class="fas fa-clock"></i> <?= h($featured['duration'] ?? '') ?>
                </p>
                <p class="sermon-description"><?= nl2br(h($featured['description'] ?? '')) ?></p>
                <?php if (!empty($featured['scripture'])): ?>
                <p class="sermon-verse"><strong>Key Scripture:</strong> <?= h($featured['scripture']) ?></p>
                <?php endif; ?>
                <div class="sermon-actions">
                    <?php if (!empty($featured['youtube'])): ?>
                    <a href="https://www.youtube.com/watch?v=<?= h($featured['youtube']) ?>" target="_blank" rel="noopener" class="btn btn-primary">
                        <i class="fab fa-youtube"></i> Watch on YouTube
                    </a>
                    <?php endif; ?>
                    <?php if (!empty($featured['file']) && in_array(strtolower(pathinfo($featured['file'], PATHINFO_EXTENSION)), ['mp3','wav','m4a'])): ?>
                    <a href="<?= h($featured['file']) ?>" download class="btn btn-outline">
                        <i class="fas fa-download"></i> Download Audio
                    </a>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</section>

<?php if (!empty($rest)): ?>
<section class="recent-sermons">
    <div class="container">
        <h2>More Messages</h2>
        <div class="sermons-grid">
            <?php foreach ($rest as $s): ?>
            <div class="sermon-card">
                <div class="sermon-thumbnail">
                    <?php if (!empty($s['thumbnail'])): ?>
                        <img src="<?= h($s['thumbnail']) ?>" alt="<?= h($s['title']) ?>" class="sermon-thumbnail-logo" loading="lazy">
                    <?php else: ?>
                        <img src="assets/images/gvim-logo.jpg" alt="GVIM" class="sermon-thumbnail-logo" loading="lazy">
                    <?php endif; ?>
                    <div class="sermon-play-overlay"><i class="fas fa-play-circle fa-3x"></i></div>
                </div>
                <div class="sermon-info">
                    <h4><?= h($s['title']) ?></h4>
                    <p class="sermon-date"><i class="fas fa-calendar"></i> <?= h($s['date'] ?? '') ?></p>
                    <p class="sermon-speaker"><i class="fas fa-user"></i> <?= h($s['speaker'] ?? 'Rev. Godwin BB. Olutimi') ?></p>
                    <p class="sermon-excerpt"><?= h(mb_substr($s['description'] ?? '', 0, 120)) ?>...</p>
                    <div class="sermon-links">
                        <?php if (!empty($s['youtube'])): ?>
                        <a href="https://www.youtube.com/watch?v=<?= h($s['youtube']) ?>" target="_blank" rel="noopener" class="watch-link">
                            <i class="fas fa-play"></i> Watch
                        </a>
                        <?php elseif (!empty($s['file'])): ?>
                        <a href="<?= h($s['file']) ?>" class="watch-link">
                            <i class="fas fa-play"></i> Play
                        </a>
                        <?php endif; ?>
                        <?php if (!empty($s['file']) && in_array(strtolower(pathinfo($s['file'], PATHINFO_EXTENSION)), ['mp3','wav','m4a'])): ?>
                        <a href="<?= h($s['file']) ?>" download class="audio-link">
                            <i class="fas fa-download"></i> Audio
                        </a>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<?php else: ?>
<section style="padding:4rem 0; text-align:center">
    <div class="container">
        <i class="fas fa-microphone-slash fa-3x" style="color:#a0aec0; margin-bottom:1rem"></i>
        <h2>Sermons Coming Soon</h2>
        <p>Check back soon or subscribe to our YouTube channel for the latest messages.</p>
    </div>
</section>
<?php endif; ?>

<!-- Stay Connected -->
<section class="sermon-subscribe">
    <div class="container">
        <div class="subscribe-content">
            <h2>Stay Connected</h2>
            <p>Subscribe to our YouTube channel, follow us on Facebook, and join our live Bible study sessions.</p>
            <div class="subscribe-links">
                <a href="https://www.youtube.com/@godsvesselsinternationalmi4365" target="_blank" rel="noopener" class="subscribe-btn youtube">
                    <i class="fab fa-youtube"></i> Subscribe on YouTube
                </a>
                <a href="https://web.facebook.com/GVIMM" target="_blank" rel="noopener" class="subscribe-btn facebook">
                    <i class="fab fa-facebook"></i> Follow on Facebook
                </a>
                <a href="https://us02web.zoom.us/j/5723669101?pwd=QzY3R2lKYXNpQy81QTdwaEJQUEZDUT09" target="_blank" rel="noopener" class="subscribe-btn zoom">
                    <i class="fas fa-video"></i> Join Us Live
                </a>
            </div>
        </div>
    </div>
</section>

<?php require_once 'includes/footer.php'; ?>
