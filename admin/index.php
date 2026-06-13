<?php
require_once __DIR__ . '/auth.php';

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf($_POST['csrf_token'] ?? '')) {
        $error = 'Security token mismatch. Please try again.';
    } else {
        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';
        if (admin_login($username, $password)) {
            $_SESSION['gvim_admin'] = true;
            $_SESSION['admin_user'] = $username;
            header('Location: dashboard.php');
            exit;
        } else {
            $error = 'Invalid username or password.';
        }
    }
}

// Already logged in
if (!empty($_SESSION['gvim_admin'])) {
    header('Location: dashboard.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login — GVIM</title>
    <link rel="icon" href="../assets/images/gvim-logo.jpg" type="image/jpeg">
    <link rel="stylesheet" href="assets/admin.css">
</head>
<body class="admin-login-page">
<div class="login-wrapper">
    <div class="login-card">
        <div class="login-logo">
            <img src="../assets/images/gvim-logo.jpg" alt="GVIM Logo" width="80" height="80">
            <h1>GVIM Admin</h1>
            <p>God's Vessels International Ministry</p>
        </div>
        <?php if ($error): ?>
        <div class="alert alert-error"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>
        <form method="POST" action="index.php">
            <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" required autocomplete="username"
                       value="<?= htmlspecialchars($_POST['username'] ?? '', ENT_QUOTES, 'UTF-8') ?>">
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required autocomplete="current-password">
            </div>
            <button type="submit" class="btn-admin-primary">Sign In</button>
        </form>
        <p style="text-align:center;margin-top:1.5rem">
            <a href="../index.php">← Back to website</a>
        </p>
    </div>
</div>
</body>
</html>
