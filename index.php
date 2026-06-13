<?php
$page_title = '';
$page_desc = "God's Vessels International Ministry — Where faith meets community and hearts are transformed. Join us in Edmonton, Alberta.";
$root = '';
require_once 'includes/header.php';

$gallery_items = get_gallery_items();
$featured = array_slice($gallery_items, 0, 6);
?>

<!-- Hero -->
<section class="hero">
    <div class="hero-aurora" aria-hidden="true"><span></span><span></span><span></span></div>
    <div class="hero-overlay" aria-hidden="true"></div>
    <div class="hero-content">
        <span class="eyebrow" data-hero><i class="fas fa-dove"></i> Vessels of Truth · Edmonton, Canada</span>
        <h1 data-hero>Where faith meets community and hearts are <span class="accent">transformed</span></h1>
        <p data-hero>God's Vessels International Ministry is a family church standing for the truth — equipping every believer to walk confidently in their divine purpose.</p>
        <div class="hero-buttons" data-hero>
            <a href="about.php" class="btn btn-accent"><i class="fas fa-book-open"></i> Discover GVIM</a>
            <a href="mailto:godvesselsinternational@gmail.com?subject=Donation&body=I would like to make a donation to GVIM." class="btn btn-ghost-light">
                <i class="fas fa-heart"></i> Give a Gift
            </a>
        </div>
    </div>
    <a href="#service-times" class="scroll-cue" aria-label="Scroll to content"><span class="mouse"></span> Explore</a>
</section>

<!-- Service Times -->
<section class="service-times" id="service-times">
    <div class="container">
        <div class="section-head">
            <span class="eyebrow">Gather With Us</span>
            <h2>Service Times</h2>
            <p class="lede">Join us in person or online throughout the week as we worship, study, and pray together.</p>
        </div>
        <div class="times-grid">
            <div class="time-card">
                <i class="fas fa-sun fa-2x"></i>
                <h3>Sunday Morning</h3>
                <p>First Service</p>
                <span class="time">10:00 AM MDT</span>
            </div>
            <div class="time-card">
                <i class="fas fa-sunset fa-2x"></i>
                <h3>Sunday Afternoon</h3>
                <p>Second Service</p>
                <span class="time">2:00 PM MDT</span>
            </div>
            <div class="time-card">
                <i class="fas fa-book-open fa-2x"></i>
                <h3>Tuesday</h3>
                <p>Bible Study</p>
                <span class="time">6:00 PM MDT</span>
            </div>
            <div class="time-card">
                <i class="fas fa-hands-praying fa-2x"></i>
                <h3>1st of the Month</h3>
                <p>Healing Hour</p>
                <span class="time">6:00 AM MDT</span>
            </div>
            <div class="time-card special-service">
                <i class="fas fa-heart fa-2x"></i>
                <h3>Third Sunday</h3>
                <p>"Just as it was" — Family Service</p>
                <span class="time">2:00 PM MDT</span>
            </div>
            <div class="time-card special-service">
                <i class="fas fa-heart fa-2x"></i>
                <h3>Fourth Sunday</h3>
                <p>Prayer Meeting</p>
                <span class="time">2:00 PM MDT</span>
            </div>
            <div class="time-card special-service">
                <i class="fas fa-users fa-2x"></i>
                <h3>Fifth Sunday</h3>
                <p>Youth Service</p>
                <span class="time">2:00 PM MDT</span>
            </div>
        </div>
    </div>
</section>

<!-- Monthly Theme -->
<section class="monthly-theme">
    <div class="container">
        <div class="theme-content">
            <div class="theme-text">
                <span class="eyebrow">This Month's Theme</span>
                <h2>Walking in Divine Purpose</h2>
                <p>Join us this month as we explore God's divine purpose for our lives. Through prayer, study, and fellowship, we'll discover how to align our hearts with His will and walk confidently in the path He has prepared for us.</p>
                <blockquote>
                    "For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, to give you hope and a future."
                    <cite>— Jeremiah 29:11</cite>
                </blockquote>
            </div>
            <div class="theme-visual" aria-hidden="true">
                <i class="fas fa-dove fa-7x"></i>
            </div>
        </div>
    </div>
</section>

<!-- Welcome -->
<section class="welcome">
    <div class="container">
        <div class="welcome-grid">
            <div class="welcome-text">
                <span class="eyebrow">Welcome Home</span>
                <h2>A Family Church for Every Vessel</h2>
                <p>At God's Vessels International Ministry, we believe that every person is a vessel chosen by God for His glory. Our mission is to equip believers to fulfill their divine calling through worship, fellowship, and service.</p>
                <p>Whether you're seeking spiritual growth, community connection, or answers to life's questions, you'll find a warm welcome here. Join us as we journey together in faith, hope, and love.</p>
                <a href="about.php" class="btn btn-outline">Discover Our Story</a>
            </div>
            <div class="welcome-features">
                <div class="feature">
                    <i class="fas fa-bible fa-lg"></i>
                    <div>
                        <h4>Biblical Teaching</h4>
                        <p>Sound doctrine grounded in God's Word</p>
                    </div>
                </div>
                <div class="feature">
                    <i class="fas fa-hands-helping fa-lg"></i>
                    <div>
                        <h4>Community Service</h4>
                        <p>Serving our community with love and compassion</p>
                    </div>
                </div>
                <div class="feature">
                    <i class="fas fa-heart fa-lg"></i>
                    <div>
                        <h4>Worship &amp; Fellowship</h4>
                        <p>Authentic worship and meaningful connections</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Mini Gallery (dynamic) -->
<?php if (!empty($featured)): ?>
<section class="mini-gallery">
    <div class="container">
        <div class="section-head">
            <span class="eyebrow">Life at GVIM</span>
            <h2>Our Ministry in Action</h2>
            <p class="lede">Capturing moments of faith, fellowship, and community service.</p>
        </div>
        <div class="mini-gallery-grid">
            <?php foreach ($featured as $item): ?>
            <div class="mini-gallery-item">
                <?php if ($item['type'] === 'video'): ?>
                    <video src="<?= h($item['file_path']) ?>" muted preload="metadata" poster="" class="gallery-thumb-video"></video>
                <?php else: ?>
                    <img src="<?= h($item['file_path']) ?>" alt="<?= h($item['title']) ?>" loading="lazy" width="400" height="300">
                <?php endif; ?>
                <div class="mini-overlay"><h4><?= h($item['title']) ?></h4></div>
            </div>
            <?php endforeach; ?>
        </div>
        <div class="text-center" style="margin-top:2rem">
            <a href="gallery.php" class="btn btn-primary">View Full Gallery</a>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- Testimonials -->
<section class="testimonials">
    <div class="container">
        <div class="section-head">
            <span class="eyebrow">Lives Transformed</span>
            <h2>Stories From Our Family</h2>
            <p class="lede">Hear from our church family about God's work in their lives.</p>
        </div>
        <div class="testimonials-grid">
            <?php
            $testimonials = [
                ['name'=>'Hammed Boluwatife Victoria','role'=>'Church Member','img'=>'assets/images/leaders/bolu.jpg','text'=>'God has been faithful to me in all ways. God gave me a job last two months. Halleluyah!'],
                ['name'=>'Jeremiah Victor','role'=>'Member','img'=>'assets/images/leaders/jerry.png','text'=>"God's Vessel International Ministry is literally a family for me. I love especially how genuine love of God runs this family and how we share and learn undiluted truth of God's Word. May God keep blessing and increasing the Ministry. God bless you real good."],
                ['name'=>'Enyi Lawrence O.','role'=>'Leader','img'=>'assets/images/leaders/lawrence.jpg','text'=>'GVIM is a gathering where Jesus is taught and learnt in full righteousness and experience. I\'m really blessed to be part of this family.'],
                ['name'=>'Adetutu Akorede Olutimi','role'=>'Leader','img'=>'assets/images/leaders/akorebami.jpg','text'=>'GVIM has been a blessing in all ways — spiritual food, physical and financial blessings. GVIM is a game changer for every child of God.'],
                ['name'=>'Ajibike Christianah Obayomi','role'=>'Member','img'=>'assets/images/members/Ajibike.jpeg','text'=>'A space where the word of God is taught with clarity. My stay in GVIM has given me more insights and understanding. Glory to God!'],
                ['name'=>'Oladimeji Shina','role'=>'Leader','img'=>'assets/images/leaders/shina.jpg','text'=>'Being a member of the GVIM family has uplifted my spiritual life. The teachings and prayers have kept my faith alive in Christ Jesus.'],
            ];
            foreach ($testimonials as $t):
            ?>
            <div class="testimonial-card">
                <div class="testimonial-content"><p><?= h($t['text']) ?></p></div>
                <div class="testimonial-author">
                    <div class="author-avatar">
                        <img src="<?= h($t['img']) ?>" alt="<?= h($t['name']) ?>" loading="lazy" width="60" height="60">
                    </div>
                    <div class="author-info">
                        <h4><?= h($t['name']) ?></h4>
                        <span><?= h($t['role']) ?></span>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<?php require_once 'includes/footer.php'; ?>
