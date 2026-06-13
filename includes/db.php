<?php
// ── Database credentials ───────────────────────────────────────────────────
// Local overrides: if includes/db.local.php exists it may define DB_HOST/DB_NAME/
// DB_USER/DB_PASS/DB_PORT before the production defaults below are applied. This
// lets you run the site locally without changing the committed production values.
if (is_file(__DIR__ . '/db.local.php')) {
    require __DIR__ . '/db.local.php';
}

// Fill these in from Hostinger hPanel > Databases > MySQL Databases
if (!defined('DB_HOST')) define('DB_HOST', 'localhost');
if (!defined('DB_NAME')) define('DB_NAME', 'u787676365_gvim');   // e.g. u123456789_gvim
if (!defined('DB_USER')) define('DB_USER', 'u787676365_gvim_admin');   // e.g. u123456789_gvim
if (!defined('DB_PASS')) define('DB_PASS', '3tnOqphLyjD?');
if (!defined('DB_PORT')) define('DB_PORT', '3306');

function db(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
    } catch (PDOException $e) {
        error_log('DB connection failed: ' . $e->getMessage());
        http_response_code(500);
        die('Database unavailable. Please try again later.');
    }

    return $pdo;
}
