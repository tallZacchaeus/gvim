<?php
require_once __DIR__ . '/auth.php';
require_admin();

$flash          = admin_get_flash();
$gallery_count  = count_gallery();
$sermons_count  = count_sermons();
$contacts_count = count_contacts();
$newsletter     = count_newsletter_subscribers();
$new_this_week  = count_messages_since(date('Y-m-d H:i:s', strtotime('-7 days')));

$by_week    = analytics_messages_by_week(8);
$by_subject = analytics_messages_by_subject();
$recent     = get_contacts(5);

$categories = get_categories();
$cat_labels = [];
$cat_data   = [];
foreach ($categories as $cat) {
    $cat_labels[] = $cat['label'];
    $cat_data[]   = count_gallery($cat['slug']);
}

// Top subjects (cap at 6 for a readable bar chart)
$subj_labels = [];
$subj_data   = [];
foreach (array_slice($by_subject, 0, 6) as $row) {
    $subj_labels[] = $row['subject'];
    $subj_data[]   = (int) $row['total'];
}

$admin_page     = 'dashboard';
$admin_title    = 'Overview';
$admin_subtitle = 'Welcome back, ' . ($_SESSION['admin_user'] ?? 'Admin') . ' · ' . date('l, F j, Y');
$use_charts     = true;
$admin_actions  = '<a href="gallery-upload.php" class="btn-admin-secondary"><i class="fas fa-cloud-arrow-up"></i> Upload</a>'
                . '<a href="sermon-add.php" class="btn-admin-primary"><i class="fas fa-circle-plus"></i> Add Sermon</a>';

require __DIR__ . '/partials/header.php';
?>

<?php if ($flash): ?>
<div class="alert alert-<?= h($flash['type']) ?>"><i class="fas fa-circle-info"></i> <?= h($flash['msg']) ?></div>
<?php endif; ?>

<!-- KPI cards -->
<div class="kpi-grid">
    <div class="kpi-card">
        <div class="kpi-top">
            <span class="kpi-icon"><i class="fas fa-images"></i></span>
        </div>
        <div class="kpi-value"><?= number_format($gallery_count) ?></div>
        <div class="kpi-label">Gallery items across <?= count($categories) ?> categories</div>
    </div>
    <div class="kpi-card">
        <div class="kpi-top">
            <span class="kpi-icon amber"><i class="fas fa-microphone"></i></span>
        </div>
        <div class="kpi-value"><?= number_format($sermons_count) ?></div>
        <div class="kpi-label">Published sermons</div>
    </div>
    <div class="kpi-card">
        <div class="kpi-top">
            <span class="kpi-icon green"><i class="fas fa-envelope"></i></span>
            <?php if ($new_this_week > 0): ?>
            <span class="kpi-trend"><i class="fas fa-arrow-up"></i> <?= $new_this_week ?> this week</span>
            <?php else: ?>
            <span class="kpi-trend flat">No new</span>
            <?php endif; ?>
        </div>
        <div class="kpi-value"><?= number_format($contacts_count) ?></div>
        <div class="kpi-label">Total messages received</div>
    </div>
    <div class="kpi-card">
        <div class="kpi-top">
            <span class="kpi-icon rose"><i class="fas fa-bell"></i></span>
        </div>
        <div class="kpi-value"><?= number_format($newsletter) ?></div>
        <div class="kpi-label">Newsletter subscribers</div>
    </div>
</div>

<!-- Trend + category breakdown -->
<div class="dash-grid">
    <section class="panel">
        <div class="panel-head">
            <div>
                <h2>Messages Received</h2>
                <p class="panel-sub">Weekly volume over the last 8 weeks</p>
            </div>
            <a href="contacts.php">View all <i class="fas fa-arrow-right"></i></a>
        </div>
        <div class="panel-body">
            <div class="chart-box">
                <?php if ($contacts_count > 0): ?>
                <canvas id="chart-messages"></canvas>
                <?php else: ?>
                <div class="chart-empty"><i class="fas fa-inbox"></i><p>No messages yet. Submissions from the contact form will appear here.</p></div>
                <?php endif; ?>
            </div>
        </div>
    </section>

    <section class="panel">
        <div class="panel-head">
            <div>
                <h2>Gallery by Category</h2>
                <p class="panel-sub"><?= number_format($gallery_count) ?> items total</p>
            </div>
            <a href="gallery-manage.php">Manage</a>
        </div>
        <div class="panel-body">
            <div class="chart-box sm">
                <?php if ($gallery_count > 0): ?>
                <canvas id="chart-categories"></canvas>
                <?php else: ?>
                <div class="chart-empty"><i class="fas fa-images"></i><p>No media uploaded yet.</p></div>
                <?php endif; ?>
            </div>
        </div>
    </section>
</div>

<!-- Subjects + recent messages -->
<div class="dash-grid even">
    <section class="panel">
        <div class="panel-head">
            <div>
                <h2>Top Message Subjects</h2>
                <p class="panel-sub">What people are reaching out about</p>
            </div>
        </div>
        <div class="panel-body">
            <div class="chart-box sm">
                <?php if (!empty($subj_data)): ?>
                <canvas id="chart-subjects"></canvas>
                <?php else: ?>
                <div class="chart-empty"><i class="fas fa-tags"></i><p>No messages to categorise yet.</p></div>
                <?php endif; ?>
            </div>
        </div>
    </section>

    <section class="panel">
        <div class="panel-head">
            <div><h2>Recent Messages</h2></div>
            <a href="contacts.php">Inbox <i class="fas fa-arrow-right"></i></a>
        </div>
        <div class="panel-body">
            <?php if (empty($recent)): ?>
            <div class="chart-empty" style="min-height:160px"><i class="fas fa-inbox"></i><p>No messages yet.</p></div>
            <?php else: ?>
            <div class="recent-list">
                <?php foreach ($recent as $c): ?>
                <div class="recent-item">
                    <span class="recent-avatar"><?= h(strtoupper(substr($c['name'], 0, 1))) ?></span>
                    <div class="recent-meta">
                        <div class="r-name"><?= h($c['name']) ?></div>
                        <div class="r-sub"><?= h($c['email']) ?></div>
                        <span class="r-subject"><?= h($c['subject']) ?></span>
                    </div>
                    <span class="recent-time"><?= h(date('M j', strtotime($c['submitted_at']))) ?></span>
                </div>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>
        </div>
    </section>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Chart === 'undefined') return;
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    Chart.defaults.color = 'hsl(224 12% 42%)';
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.boxWidth = 8;

    const BRAND = 'hsl(224 60% 42%)';
    const PALETTE = ['hsl(224 60% 42%)','hsl(40 92% 52%)','hsl(222 70% 62%)','hsl(160 55% 42%)','hsl(280 45% 58%)','hsl(0 70% 62%)','hsl(200 65% 50%)'];

    const msgEl = document.getElementById('chart-messages');
    if (msgEl) {
        const ctx = msgEl.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, 280);
        grad.addColorStop(0, 'hsl(224 70% 50% / 0.28)');
        grad.addColorStop(1, 'hsl(224 70% 50% / 0)');
        new Chart(ctx, {
            type: 'line',
            data: { labels: <?= json_encode($by_week['labels']) ?>, datasets: [{
                label: 'Messages', data: <?= json_encode($by_week['data']) ?>,
                borderColor: BRAND, backgroundColor: grad, fill: true, tension: 0.4,
                borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: BRAND, pointHoverRadius: 5,
            }]},
            options: { responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'hsl(36 22% 90%)' } },
                          x: { grid: { display: false } } } }
        });
    }

    const catEl = document.getElementById('chart-categories');
    if (catEl) {
        new Chart(catEl, {
            type: 'doughnut',
            data: { labels: <?= json_encode($cat_labels) ?>, datasets: [{
                data: <?= json_encode($cat_data) ?>, backgroundColor: PALETTE, borderColor: '#fff', borderWidth: 2 }]},
            options: { responsive: true, maintainAspectRatio: false, cutout: '62%',
                plugins: { legend: { position: 'right' } } }
        });
    }

    const subjEl = document.getElementById('chart-subjects');
    if (subjEl) {
        new Chart(subjEl, {
            type: 'bar',
            data: { labels: <?= json_encode($subj_labels) ?>, datasets: [{
                label: 'Messages', data: <?= json_encode($subj_data) ?>,
                backgroundColor: 'hsl(224 60% 50%)', borderRadius: 6, barThickness: 18 }]},
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'hsl(36 22% 90%)' } },
                          y: { grid: { display: false } } } }
        });
    }
});
</script>

<?php require __DIR__ . '/partials/footer.php'; ?>
