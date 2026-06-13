<?php
require_once __DIR__ . '/auth.php';
require_admin();

$errors  = [];
$flash   = null;

// Handle add
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'add') {
    if (!verify_csrf($_POST['csrf_token'] ?? '')) {
        $errors[] = 'Security token invalid.';
    } else {
        $label = trim(strip_tags($_POST['label'] ?? ''));
        if (strlen($label) < 2) {
            $errors[] = 'Category name must be at least 2 characters.';
        } else {
            $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower($label));
            $slug = trim($slug, '-');
            $existing = get_category_slugs();
            if (in_array($slug, $existing)) {
                $errors[] = "A category with that name already exists.";
            } else {
                insert_category($label);
                admin_flash('success', "Category \"$label\" added.");
                header('Location: categories.php');
                exit;
            }
        }
    }
}

// Handle delete
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'delete') {
    if (!verify_csrf($_POST['csrf_token'] ?? '')) {
        $errors[] = 'Security token invalid.';
    } else {
        $slug = $_POST['slug'] ?? '';
        if (category_in_use($slug)) {
            $errors[] = 'Cannot delete — this category still has gallery items. Delete or reassign them first.';
        } else {
            delete_category($slug);
            admin_flash('success', 'Category deleted.');
            header('Location: categories.php');
            exit;
        }
    }
}

$flash      = admin_get_flash();
$categories = get_categories();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Categories — GVIM Admin</title>
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
        <a href="categories.php" class="active">Categories</a>
        <a href="sermon-add.php">Add Sermon</a>
        <a href="sermon-manage.php">Sermons</a>
        <a href="contacts.php">Messages</a>
        <a href="../index.php" target="_blank">View Site</a>
        <a href="logout.php" class="logout-link">Logout</a>
    </div>
</nav>
<main class="admin-main">
    <div class="admin-container" style="max-width:700px">
        <h1><i class="fas fa-tags"></i> Gallery Categories</h1>

        <?php if ($flash): ?>
        <div class="alert alert-<?= $flash['type'] ?>"><?= h($flash['msg']) ?></div>
        <?php endif; ?>

        <?php if (!empty($errors)): ?>
        <div class="alert alert-error">
            <?php foreach ($errors as $e): ?><p style="margin:0"><?= h($e) ?></p><?php endforeach; ?>
        </div>
        <?php endif; ?>

        <!-- Add category -->
        <div class="admin-card" style="margin-bottom:1.5rem">
            <h3 style="margin-bottom:1rem;font-size:1rem">Add New Category</h3>
            <form method="POST" action="categories.php" style="display:flex;gap:0.75rem;align-items:flex-end;flex-wrap:wrap">
                <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                <input type="hidden" name="action" value="add">
                <div class="form-group" style="flex:1;min-width:200px;margin:0">
                    <label for="label">Category Name</label>
                    <input type="text" id="label" name="label" required maxlength="100"
                           placeholder="e.g. Outreach Ministry"
                           value="<?= h($_POST['label'] ?? '') ?>">
                </div>
                <button type="submit" class="btn-admin-primary" style="margin-bottom:1.25rem">
                    <i class="fas fa-plus"></i> Add
                </button>
            </form>
        </div>

        <!-- Existing categories -->
        <div class="admin-card">
            <h3 style="margin-bottom:1rem;font-size:1rem">Existing Categories</h3>
            <?php if (empty($categories)): ?>
            <p class="text-muted">No categories yet.</p>
            <?php else: ?>
            <div class="admin-table-wrap" style="box-shadow:none">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Label</th>
                            <th>Slug</th>
                            <th>Items</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($categories as $cat): ?>
                        <?php $count = count_gallery($cat['slug']); ?>
                        <tr>
                            <td><strong><?= h($cat['label']) ?></strong></td>
                            <td><code style="font-size:0.8rem;background:var(--gray-100);padding:0.125rem 0.375rem;border-radius:3px"><?= h($cat['slug']) ?></code></td>
                            <td><?= $count ?></td>
                            <td>
                                <?php if ($count === 0): ?>
                                <form method="POST" action="categories.php" onsubmit="return confirm('Delete category \"<?= h(addslashes($cat['label'])) ?>\"?')" style="display:inline">
                                    <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                                    <input type="hidden" name="action" value="delete">
                                    <input type="hidden" name="slug" value="<?= h($cat['slug']) ?>">
                                    <button type="submit" class="btn-delete"><i class="fas fa-trash"></i> Delete</button>
                                </form>
                                <?php else: ?>
                                <span class="text-muted" style="font-size:0.8rem">In use</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>
        </div>
    </div>
</main>
</body>
</html>
