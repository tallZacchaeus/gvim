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
    <meta name="theme-color" content="#16245c">
    <title><?= h(($page_title ?? '') ? $page_title . ' — GVIM' : "God's Vessels International Ministry") ?></title>
    <link rel="icon" href="<?= $root ?>assets/images/gvim-logo.jpg" type="image/jpeg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&family=Inter:wght@400;500;600;700&display=swap">
    <link rel="stylesheet" href="<?= $root ?>assets/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" media="print" onload="this.media='all'">
    <noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"></noscript>
</head>
<body>
<a href="#main" class="skip-link">Skip to content</a>
<header class="header" id="site-header">
    <nav class="navbar" aria-label="Main navigation">
        <div class="nav-container">
            <div class="nav-logo">
                <a href="<?= $root ?>index.php">
                    <img src="<?= $root ?>assets/images/gvim-logo.jpg" alt="GVIM Logo" class="header-logo" width="52" height="52">
                    <span class="nav-brand-text">
                        <strong>God's Vessels</strong>
                        <span>International Ministry</span>
                    </span>
                </a>
            </div>
            <div class="nav-right">
                <ul class="nav-menu" id="nav-menu">
                    <li class="nav-item"><a href="<?= $root ?>index.php" class="nav-link<?= nav_active('index', $current) ?>">Home</a></li>
                    <li class="nav-item"><a href="<?= $root ?>about.php" class="nav-link<?= nav_active('about', $current) ?>">About</a></li>
                    <li class="nav-item"><a href="<?= $root ?>gallery.php" class="nav-link<?= nav_active('gallery', $current) ?>">Gallery</a></li>
                    <li class="nav-item"><a href="<?= $root ?>sermons.php" class="nav-link<?= nav_active('sermons', $current) ?>">Sermons</a></li>
                    <li class="nav-item"><a href="<?= $root ?>contact.php" class="nav-link<?= nav_active('contact', $current) ?>">Contact</a></li>
                </ul>
                <a href="mailto:godvesselsinternational@gmail.com?subject=Donation&body=I would like to make a donation to GVIM." class="btn btn-accent btn-sm nav-cta"><i class="fas fa-heart"></i> Give</a>
                <button class="nav-toggle" id="mobile-menu" aria-label="Toggle navigation" aria-expanded="false" aria-controls="nav-menu">
                    <span class="bar"></span>
                    <span class="bar"></span>
                    <span class="bar"></span>
                </button>
            </div>
        </div>
    </nav>
</header>
<main id="main">
