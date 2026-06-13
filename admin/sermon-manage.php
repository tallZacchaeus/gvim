<?php
require_once __DIR__ . '/auth.php';
require_admin();

$flash = admin_get_flash();
$data = load_sermons();
$sermons = $data['sermons'] ?? [];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Sermons — GVIM Admin</title>
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
        <a href="sermon-add.php">Add Sermon</a>
        <a href="sermon-manage.php" class="active">Sermons</a>
        <a href="../index.php" target="_blank">View Site</a>
        <a href="logout.php" class="logout-link">Logout</a>
    </div>
</nav>
<main class="admin-main">
    <div class="admin-container">
        <div class="page-header-admin">
            <h1><i class="fas fa-microphone"></i> Sermons (<?= count($sermons) ?>)</h1>
            <a href="sermon-add.php" class="btn-admin-primary"><i class="fas fa-plus"></i> Add New</a>
        </div>

        <?php if ($flash): ?>
        <div class="alert alert-<?= $flash['type'] ?>"><?= htmlspecialchars($flash['msg'], ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>

        <?php if (empty($sermons)): ?>
        <div class="empty-state">
            <i class="fas fa-microphone-slash fa-3x"></i>
            <p>No sermons yet. <a href="sermon-add.php">Add your first sermon!</a></p>
        </div>
        <?php else: ?>
        <div class="admin-table-wrap">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Speaker</th>
                        <th>Date</th>
                        <th>Media</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($sermons as $s): ?>
                    <tr>
                        <td>
                            <strong><?= htmlspecialchars($s['title'], ENT_QUOTES, 'UTF-8') ?></strong>
                            <?php if (!empty($s['scripture'])): ?>
                            <br><small class="text-muted"><?= htmlspecialchars(mb_substr($s['scripture'], 0, 60), ENT_QUOTES, 'UTF-8') ?></small>
                            <?php endif; ?>
                        </td>
                        <td><?= htmlspecialchars($s['speaker'] ?? '', ENT_QUOTES, 'UTF-8') ?></td>
                        <td><?= htmlspecialchars($s['date'] ?? '', ENT_QUOTES, 'UTF-8') ?></td>
                        <td>
                            <?php if (!empty($s['youtube'])): ?>
                                <span class="badge badge-youtube"><i class="fab fa-youtube"></i> YouTube</span>
                            <?php endif; ?>
                            <?php if (!empty($s['file'])): ?>
                                <span class="badge badge-file"><i class="fas fa-file-video"></i> File</span>
                            <?php endif; ?>
                        </td>
                        <td>
                            <form method="POST" action="delete.php" onsubmit="return confirm('Delete this sermon?')" style="display:inline">
                                <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                                <input type="hidden" name="type" value="sermon">
                                <input type="hidden" name="id" value="<?= htmlspecialchars($s['id'], ENT_QUOTES, 'UTF-8') ?>">
                                <input type="hidden" name="file" value="<?= htmlspecialchars($s['file'] ?? '', ENT_QUOTES, 'UTF-8') ?>">
                                <button type="submit" class="btn-delete"><i class="fas fa-trash"></i> Delete</button>
                            </form>
                        </td>
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
