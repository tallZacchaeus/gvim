<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/credentials.php';

function require_admin(): void {
    if (empty($_SESSION['gvim_admin'])) {
        header('Location: index.php');
        exit;
    }
}

function admin_login(string $username, string $password): bool {
    return $username === ADMIN_USERNAME
        && password_verify($password, ADMIN_PASSWORD_HASH);
}

function admin_flash(string $type, string $msg): void {
    $_SESSION['flash'] = ['type' => $type, 'msg' => $msg];
}

function admin_get_flash(): ?array {
    $f = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    return $f;
}
