<?php
/**
 * Shared admin chrome (sidebar + topbar). Set these before including:
 *   $admin_page     — slug of the active nav item (e.g. 'dashboard')
 *   $admin_title    — page title (browser tab + topbar heading)
 *   $admin_subtitle — optional small line under the topbar heading
 *   $admin_actions  — optional HTML for the topbar right side
 *   $use_charts     — true to load Chart.js on this page
 * Pages must require auth.php + require_admin() before including this.
 */
$admin_page   = $admin_page   ?? '';
$admin_title  = $admin_title  ?? 'Admin';
$admin_user   = $_SESSION['admin_user'] ?? 'Admin';
$msg_count    = function_exists('count_contacts') ? count_contacts() : 0;

$nav_groups = [
    'Menu' => [
        ['key' => 'dashboard',      'href' => 'dashboard.php',      'icon' => 'fa-gauge-high', 'label' => 'Overview'],
    ],
    'Content' => [
        ['key' => 'gallery-manage', 'href' => 'gallery-manage.php', 'icon' => 'fa-images',         'label' => 'Gallery'],
        ['key' => 'gallery-upload', 'href' => 'gallery-upload.php', 'icon' => 'fa-cloud-arrow-up', 'label' => 'Upload Media'],
        ['key' => 'categories',     'href' => 'categories.php',     'icon' => 'fa-tags',           'label' => 'Categories'],
        ['key' => 'sermon-manage',  'href' => 'sermon-manage.php',  'icon' => 'fa-microphone',     'label' => 'Sermons'],
        ['key' => 'sermon-add',     'href' => 'sermon-add.php',     'icon' => 'fa-circle-plus',    'label' => 'Add Sermon'],
    ],
    'Engagement' => [
        ['key' => 'contacts',       'href' => 'contacts.php',       'icon' => 'fa-envelope',       'label' => 'Messages', 'badge' => $msg_count],
    ],
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#16245c">
    <title><?= h($admin_title) ?> — GVIM Admin</title>
    <link rel="icon" href="../assets/images/gvim-logo.jpg" type="image/jpeg">
    <link rel="stylesheet" href="assets/admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <?php if (!empty($use_charts)): ?>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js" defer></script>
    <?php endif; ?>
    <script src="assets/admin.js" defer></script>
</head>
<body class="admin-body">
<div class="admin-shell">
    <aside class="sidebar" id="sidebar" aria-label="Admin navigation">
        <div class="sidebar-brand">
            <img src="../assets/images/gvim-logo.jpg" alt="GVIM" width="40" height="40">
            <span><strong>GVIM</strong>Admin Console</span>
        </div>
        <nav class="sidebar-nav">
            <?php foreach ($nav_groups as $nav_group_label => $nav_group_items): ?>
            <p class="nav-group-label"><?= h($nav_group_label) ?></p>
            <?php foreach ($nav_group_items as $it): ?>
            <a href="<?= $it['href'] ?>" class="nav-item<?= $admin_page === $it['key'] ? ' active' : '' ?>">
                <i class="fas <?= $it['icon'] ?>" aria-hidden="true"></i>
                <span><?= h($it['label']) ?></span>
                <?php if (!empty($it['badge'])): ?><span class="nav-badge"><?= (int) $it['badge'] ?></span><?php endif; ?>
            </a>
            <?php endforeach; ?>
            <?php endforeach; ?>
        </nav>
        <div class="sidebar-foot">
            <a href="../index.php" target="_blank" rel="noopener" class="nav-item">
                <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i> <span>View Site</span>
            </a>
            <div class="sidebar-user">
                <span class="user-avatar"><?= h(strtoupper(substr($admin_user, 0, 1))) ?></span>
                <span class="user-meta"><strong><?= h($admin_user) ?></strong><span>Administrator</span></span>
                <a href="logout.php" class="user-logout" aria-label="Log out" title="Log out"><i class="fas fa-right-from-bracket"></i></a>
            </div>
        </div>
    </aside>
    <div class="scrim" id="scrim" hidden></div>

    <div class="admin-main-col">
        <header class="topbar">
            <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Toggle menu" aria-expanded="false">
                <i class="fas fa-bars"></i>
            </button>
            <div class="topbar-titles">
                <h1><?= h($admin_title) ?></h1>
                <?php if (!empty($admin_subtitle)): ?><p><?= h($admin_subtitle) ?></p><?php endif; ?>
            </div>
            <div class="topbar-actions">
                <?= $admin_actions ?? '' ?>
            </div>
        </header>
        <main class="admin-content">
            <div class="admin-inner">
