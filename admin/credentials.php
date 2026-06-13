<?php
define('ADMIN_USERNAME', 'gvim-admin');

// Hash is generated once on first load and stored in .admin_hash
$_hash_file = __DIR__ . '/.admin_hash';
if (!file_exists($_hash_file) || trim(file_get_contents($_hash_file)) === '') {
    $hash = password_hash('@gvim@admin-user', PASSWORD_BCRYPT, ['cost' => 12]);
    file_put_contents($_hash_file, $hash);
    @chmod($_hash_file, 0600);
    define('ADMIN_PASSWORD_HASH', $hash);
} else {
    define('ADMIN_PASSWORD_HASH', trim(file_get_contents($_hash_file)));
}
