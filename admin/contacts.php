<?php
require_once __DIR__ . '/auth.php';
require_admin();

$flash    = admin_get_flash();
$contacts = get_contacts(100);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Messages — GVIM Admin</title>
    <link rel="icon" href="../assets/images/gvim-logo.jpg" type="image/jpeg">
    <link rel="stylesheet" href="assets/admin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        .msg-row td { vertical-align: top; }
        .msg-body { white-space: pre-wrap; font-size: 0.875rem; color: var(--gray-700); max-width: 400px; }
        .newsletter-yes { color: var(--green); font-size: 0.8rem; }
    </style>
</head>
<body class="admin-body">
<nav class="admin-nav">
    <div class="admin-nav-brand"><img src="../assets/images/gvim-logo.jpg" alt="GVIM" width="40" height="40"><span>GVIM Admin</span></div>
    <div class="admin-nav-links">
        <a href="dashboard.php">Dashboard</a>
        <a href="gallery-upload.php">Upload Media</a>
        <a href="gallery-manage.php">Gallery</a>
        <a href="categories.php">Categories</a>
        <a href="sermon-add.php">Add Sermon</a>
        <a href="sermon-manage.php">Sermons</a>
        <a href="contacts.php" class="active">Messages</a>
        <a href="../index.php" target="_blank">View Site</a>
        <a href="logout.php" class="logout-link">Logout</a>
    </div>
</nav>
<main class="admin-main">
    <div class="admin-container">
        <h1><i class="fas fa-envelope"></i> Contact Messages (<?= count($contacts) ?>)</h1>

        <?php if ($flash): ?>
        <div class="alert alert-<?= $flash['type'] ?>"><?= h($flash['msg']) ?></div>
        <?php endif; ?>

        <?php if (empty($contacts)): ?>
        <div class="empty-state">
            <i class="fas fa-inbox fa-3x"></i>
            <p>No messages yet.</p>
        </div>
        <?php else: ?>
        <div class="admin-table-wrap">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Name / Email</th>
                        <th>Subject</th>
                        <th>Message</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($contacts as $c): ?>
                    <tr class="msg-row">
                        <td style="white-space:nowrap">
                            <?= h(date('M j, Y', strtotime($c['submitted_at']))) ?><br>
                            <small class="text-muted"><?= h(date('g:i a', strtotime($c['submitted_at']))) ?></small>
                        </td>
                        <td>
                            <strong><?= h($c['name']) ?></strong><br>
                            <a href="mailto:<?= h($c['email']) ?>" style="font-size:0.85rem"><?= h($c['email']) ?></a>
                            <?php if ($c['phone']): ?>
                            <br><small class="text-muted"><?= h($c['phone']) ?></small>
                            <?php endif; ?>
                            <?php if ($c['newsletter']): ?>
                            <br><small class="newsletter-yes"><i class="fas fa-check-circle"></i> Newsletter</small>
                            <?php endif; ?>
                        </td>
                        <td><?= h($c['subject']) ?></td>
                        <td><div class="msg-body"><?= h($c['message']) ?></div></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php endif; ?>
    </div>
</main>
</body>
</html>
