<?php
/**
 * One-time database setup script.
 * Run once via browser: yourdomain.com/admin/setup.php
 * DELETE THIS FILE after setup is complete.
 */
require_once __DIR__ . '/auth.php';
require_admin();

$messages = [];
$errors   = [];

$pdo = db();

// ── Create tables ──────────────────────────────────────────────────────────
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS gallery (
            id         CHAR(16)     NOT NULL,
            title      VARCHAR(255) NOT NULL,
            description TEXT,
            category   ENUM('worship','events','community','youth') NOT NULL,
            file_path  VARCHAR(512) NOT NULL,
            filename   VARCHAR(255) NOT NULL,
            type       ENUM('image','video') NOT NULL DEFAULT 'image',
            item_date  DATE         NOT NULL,
            created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_category (category),
            INDEX idx_date (item_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $messages[] = 'Table <strong>gallery</strong> — OK';
} catch (PDOException $e) {
    $errors[] = 'gallery table: ' . $e->getMessage();
}

try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS sermons (
            id          CHAR(16)     NOT NULL,
            title       VARCHAR(255) NOT NULL,
            speaker     VARCHAR(255) NOT NULL,
            sermon_date DATE         NOT NULL,
            scripture   VARCHAR(255),
            description TEXT,
            youtube_id  VARCHAR(20),
            file_path   VARCHAR(512),
            duration    VARCHAR(50),
            created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_date (sermon_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $messages[] = 'Table <strong>sermons</strong> — OK';
} catch (PDOException $e) {
    $errors[] = 'sermons table: ' . $e->getMessage();
}

try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS contact_submissions (
            id           INT          NOT NULL AUTO_INCREMENT,
            name         VARCHAR(255) NOT NULL,
            email        VARCHAR(255) NOT NULL,
            phone        VARCHAR(50),
            subject      VARCHAR(100) NOT NULL,
            message      TEXT         NOT NULL,
            newsletter   TINYINT(1)   NOT NULL DEFAULT 0,
            ip_address   VARCHAR(45),
            submitted_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_submitted (submitted_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $messages[] = 'Table <strong>contact_submissions</strong> — OK';
} catch (PDOException $e) {
    $errors[] = 'contact_submissions table: ' . $e->getMessage();
}

// ── Migrate existing filesystem images into gallery table ──────────────────
if (empty($errors)) {
    $categories = ['worship', 'events', 'community', 'youth'];
    $imported   = 0;
    $skipped    = 0;

    $check_stmt  = $pdo->prepare("SELECT id FROM gallery WHERE file_path = ? LIMIT 1");
    $insert_stmt = $pdo->prepare("
        INSERT INTO gallery (id, title, description, category, file_path, filename, type, item_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");

    foreach ($categories as $cat) {
        $dir = ROOT_DIR . '/uploads/gallery/' . $cat . '/';
        if (!is_dir($dir)) continue;
        $files = glob($dir . '*.{jpg,jpeg,png,gif,webp,mp4,webm,ogg,mov}', GLOB_BRACE) ?: [];
        foreach ($files as $file) {
            $filename  = basename($file);
            $rel_path  = 'uploads/gallery/' . $cat . '/' . $filename;
            $ext       = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
            $is_video  = in_array($ext, ['mp4', 'webm', 'ogg', 'mov']);
            $item_date = date('Y-m-d', filemtime($file));

            $check_stmt->execute([$rel_path]);
            if ($check_stmt->fetch()) { $skipped++; continue; }

            $title = ucfirst($cat) . ' — ' . pathinfo($filename, PATHINFO_FILENAME);
            $title = preg_replace('/[_-]+/', ' ', $title);

            $insert_stmt->execute([
                bin2hex(random_bytes(8)),
                $title,
                'GVIM ' . ucfirst($cat) . ' moments.',
                $cat,
                $rel_path,
                $filename,
                $is_video ? 'video' : 'image',
                $item_date,
            ]);
            $imported++;
        }
    }

    $messages[] = "Gallery migration: <strong>{$imported} imported</strong>, {$skipped} already existed";
}

// ── Migrate existing sermons.json into sermons table ──────────────────────
if (empty($errors) && file_exists(DATA_DIR . 'sermons.json')) {
    $raw  = json_decode(file_get_contents(DATA_DIR . 'sermons.json'), true);
    $list = $raw['sermons'] ?? [];
    $sim  = 0; $sskip = 0;

    $check_s  = $pdo->prepare("SELECT id FROM sermons WHERE id = ? LIMIT 1");
    $insert_s = $pdo->prepare("
        INSERT INTO sermons (id, title, speaker, sermon_date, scripture, description, youtube_id, file_path, duration, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    foreach ($list as $s) {
        $check_s->execute([$s['id']]);
        if ($check_s->fetch()) { $sskip++; continue; }
        $insert_s->execute([
            $s['id'],
            $s['title'],
            $s['speaker'] ?? '',
            $s['date'] ?? date('Y-m-d'),
            $s['scripture'] ?? null,
            $s['description'] ?? null,
            $s['youtube'] ?? null,
            $s['file'] ?? null,
            $s['duration'] ?? null,
            $s['created_at'] ?? date('Y-m-d H:i:s'),
        ]);
        $sim++;
    }
    $messages[] = "Sermons migration: <strong>{$sim} imported</strong>, {$sskip} already existed";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Setup — GVIM Admin</title>
    <link rel="stylesheet" href="assets/admin.css">
</head>
<body class="admin-body">
<main class="admin-main">
    <div class="admin-container" style="max-width:700px">
        <h1 style="margin-bottom:1.5rem">Database Setup</h1>

        <?php foreach ($messages as $m): ?>
        <div class="alert alert-success"><?= $m ?></div>
        <?php endforeach; ?>

        <?php foreach ($errors as $e): ?>
        <div class="alert alert-error"><?= htmlspecialchars($e, ENT_QUOTES, 'UTF-8') ?></div>
        <?php endforeach; ?>

        <?php if (empty($errors)): ?>
        <div class="admin-card">
            <h3 style="color:#166534;margin-bottom:1rem">Setup complete!</h3>
            <p>All tables created and existing data migrated.</p>
            <p style="margin-top:1rem;color:#dc2626"><strong>Important:</strong> Delete this file (<code>admin/setup.php</code>) from your server now.</p>
            <a href="dashboard.php" class="btn-admin-primary" style="margin-top:1.5rem;display:inline-flex">Go to Dashboard</a>
        </div>
        <?php endif; ?>
    </div>
</main>
</body>
</html>
