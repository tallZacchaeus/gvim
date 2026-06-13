</main>
<footer class="footer">
    <div class="container">
        <div class="footer-content">
            <div class="footer-section">
                <h3>God's Vessels International Ministry</h3>
                <p>Transforming lives through the power of God's love — a vessel of truth in Edmonton and beyond.</p>
                <?php require_once __DIR__ . '/social-icons.php'; ?>
                <div class="social-links">
                    <a href="https://web.facebook.com/GVIMM" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><?= social_icon('facebook') ?></a>
                    <a href="https://www.youtube.com/@godsvesselsinternationalmi4365" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><?= social_icon('youtube') ?></a>
                    <a href="#" aria-label="Instagram"><?= social_icon('instagram') ?></a>
                    <a href="#" aria-label="X (Twitter)"><?= social_icon('x') ?></a>
                </div>
            </div>
            <div class="footer-section">
                <h4>Quick Links</h4>
                <ul>
                    <li><a href="<?= $root ?>index.php">Home</a></li>
                    <li><a href="<?= $root ?>about.php">About</a></li>
                    <li><a href="<?= $root ?>gallery.php">Gallery</a></li>
                    <li><a href="<?= $root ?>sermons.php">Sermons</a></li>
                    <li><a href="<?= $root ?>contact.php">Contact</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>Service Times</h4>
                <ul>
                    <li>Sunday: 10:00 AM &amp; 2:00 PM MDT</li>
                    <li>Tuesday: 6:00 PM MDT (Bible Study)</li>
                    <li>1st of Month: 6:00 AM MDT (Healing Hour)</li>
                    <li>3rd Sunday: 2:00 PM MDT (Family Service)</li>
                    <li>4th Sunday: 2:00 PM MDT (Prayer Meeting)</li>
                    <li>5th Sunday: 2:00 PM MDT (Youth Service)</li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>Contact Info</h4>
                <ul>
                    <li><i class="fas fa-map-marker-alt"></i> 4511, 36 Ave NW, Edmonton, T6L 3R9</li>
                    <li><i class="fas fa-phone"></i> <a href="tel:+18252027450">+1 (825) 202-7450</a></li>
                    <li><i class="fas fa-envelope"></i> <a href="mailto:godvesselsinternational@gmail.com">godvesselsinternational@gmail.com</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; <?= date('Y') ?> God's Vessels International Ministry. All rights reserved.</p>
        </div>
    </div>
</footer>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" defer></script>
<script src="<?= $root ?>assets/js/main.js" defer></script>
</body>
</html>
