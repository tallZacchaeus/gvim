<?php
require_once __DIR__ . '/config.php';
$root = $root ?? '';
$current = basename($_SERVER['PHP_SELF'], '.php');

function nav_active(string $page, string $current): string {
    return $page === $current ? ' active' : '';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="<?= h($page_desc ?? "God's Vessels International Ministry — Where faith meets community and hearts are transformed.") ?>">
    <meta name="theme-color" content="#2563eb">
    <title><?= h(($page_title ?? '') ? $page_title . ' — GVIM' : "God's Vessels International Ministry") ?></title>
    <link rel="icon" href="<?= $root ?>assets/images/gvim-logo.jpg" type="image/jpeg">
    <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
    <link rel="stylesheet" href="<?= $root ?>assets/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" media="print" onload="this.media='all'">
    <noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"></noscript>
</head>
<body>
<header class="header">
    <nav class="navbar" aria-label="Main navigation">
        <div class="nav-container">
            <div class="nav-logo">
                <a href="<?= $root ?>index.php">
                    <img src="<?= $root ?>assets/images/gvim-logo.jpg" alt="GVIM Logo" class="header-logo" width="60" height="60">
                </a>
            </div>
            <ul class="nav-menu" id="nav-menu">
                <li class="nav-item"><a href="<?= $root ?>index.php" class="nav-link<?= nav_active('index', $current) ?>">Home</a></li>
                <li class="nav-item"><a href="<?= $root ?>about.php" class="nav-link<?= nav_active('about', $current) ?>">About</a></li>
                <li class="nav-item"><a href="<?= $root ?>gallery.php" class="nav-link<?= nav_active('gallery', $current) ?>">Gallery</a></li>
                <li class="nav-item"><a href="<?= $root ?>sermons.php" class="nav-link<?= nav_active('sermons', $current) ?>">Sermons</a></li>
                <li class="nav-item"><a href="<?= $root ?>contact.php" class="nav-link<?= nav_active('contact', $current) ?>">Contact</a></li>
            </ul>
            <button class="nav-toggle" id="mobile-menu" aria-label="Toggle navigation" aria-expanded="false" aria-controls="nav-menu">
                <span class="bar"></span>
                <span class="bar"></span>
                <span class="bar"></span>
            </button>
        </div>
    </nav>
</header>
<main>
