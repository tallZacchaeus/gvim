<?php
$page_title = 'Contact Us';
$page_desc = "Get in touch with God's Vessels International Ministry. Send a message, prayer request, or testimony.";
$root = '';
$success = $_GET['sent'] ?? '';
$error = $_GET['error'] ?? '';
require_once 'includes/header.php';
?>

<section class="page-header">
    <div class="container">
        <span class="eyebrow" data-hero>We're Listening</span>
        <h1 data-hero>Contact Us</h1>
        <p data-hero>We'd love to hear from you. Reach out with questions, prayer requests, or testimonies.</p>
    </div>
</section>

<section class="contact-section">
    <div class="container">
        <?php if ($success): ?>
        <div class="alert alert-success" role="alert">
            <i class="fas fa-check-circle"></i> Thank you! Your message has been received. We'll get back to you soon.
        </div>
        <?php elseif ($error):
            $error_messages = [
                'ratelimit'  => 'You\'ve sent a few messages already — please wait a moment before sending another.',
                'validation' => 'Please check the highlighted fields and try again.',
                'csrf'       => 'Your session expired. Please refresh the page and try again.',
                'mail'       => 'Sorry, there was an issue sending your message. Please try again or email us directly.',
            ];
            $error_text = $error_messages[$error] ?? $error_messages['mail'];
        ?>
        <div class="alert alert-error" role="alert">
            <i class="fas fa-exclamation-circle"></i> <?= h($error_text) ?>
        </div>
        <?php endif; ?>

        <div class="contact-grid">
            <!-- Contact Form -->
            <div class="contact-form-section">
                <h2>Send Us a Message</h2>
                <form class="contact-form" id="contactForm" action="contact-handler.php" method="POST" novalidate>
                    <input type="hidden" name="csrf_token" value="<?= h(csrf_token()) ?>">
                    <input type="text" name="honeypot" style="display:none" tabindex="-1" autocomplete="off">

                    <div class="form-group">
                        <label for="name">Full Name <span aria-hidden="true">*</span></label>
                        <input type="text" id="name" name="name" required autocomplete="name"
                               value="<?= h($_GET['name'] ?? '') ?>">
                        <span class="error-message" id="nameError" role="alert"></span>
                    </div>
                    <div class="form-group">
                        <label for="email">Email Address <span aria-hidden="true">*</span></label>
                        <input type="email" id="email" name="email" required autocomplete="email"
                               value="<?= h($_GET['email'] ?? '') ?>">
                        <span class="error-message" id="emailError" role="alert"></span>
                    </div>
                    <div class="form-group">
                        <label for="phone">Phone Number</label>
                        <input type="tel" id="phone" name="phone" autocomplete="tel"
                               value="<?= h($_GET['phone'] ?? '') ?>">
                        <span class="error-message" id="phoneError" role="alert"></span>
                    </div>
                    <div class="form-group">
                        <label for="subject">Subject <span aria-hidden="true">*</span></label>
                        <select id="subject" name="subject" required>
                            <option value="">Please select a subject</option>
                            <option value="General Inquiry">General Inquiry</option>
                            <option value="Prayer Request">Prayer Request</option>
                            <option value="Testimony">Testimony</option>
                            <option value="Ministry Involvement">Ministry Involvement</option>
                            <option value="Counseling Request">Counseling Request</option>
                            <option value="Event Information">Event Information</option>
                            <option value="Volunteer Opportunities">Volunteer Opportunities</option>
                            <option value="Pastoral Care">Pastoral Care</option>
                            <option value="Other">Other</option>
                        </select>
                        <span class="error-message" id="subjectError" role="alert"></span>
                    </div>
                    <div class="form-group">
                        <label for="message">Message <span aria-hidden="true">*</span></label>
                        <textarea id="message" name="message" rows="6" required
                                  placeholder="Share your message, prayer request, or testimony..."><?= h($_GET['msg'] ?? '') ?></textarea>
                        <span class="error-message" id="messageError" role="alert"></span>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="newsletter" name="newsletter" value="1">
                            <span>I would like to receive newsletters and updates from GVIM</span>
                        </label>
                    </div>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i> Send Message
                    </button>
                </form>
            </div>

            <!-- Contact Info -->
            <div class="contact-info-section">
                <h2>Get in Touch</h2>
                <div class="contact-info">
                    <div class="info-item">
                        <div class="info-icon"><i class="fas fa-map-marker-alt"></i></div>
                        <div class="info-content">
                            <h4>Visit Us</h4>
                            <p>4511, 36 Ave NW<br>Edmonton, T6L 3R9<br>Alberta, Canada</p>
                            <a href="https://maps.google.com/maps?q=4511+36+Ave+NW+Edmonton+T6L+3R9" target="_blank" rel="noopener" class="map-link">
                                <i class="fas fa-external-link-alt"></i> View on Google Maps
                            </a>
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-icon"><i class="fas fa-phone"></i></div>
                        <div class="info-content">
                            <h4>Call Us</h4>
                            <p>Main: <a href="tel:+18252027450">+1 (825) 202-7450</a></p>
                            <p>Prayer Line: <a href="http://bit.ly/463cEXB" target="_blank" rel="noopener">Join Prayer Line</a></p>
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-icon"><i class="fas fa-envelope"></i></div>
                        <div class="info-content">
                            <h4>Email Us</h4>
                            <p><a href="mailto:godvesselsinternational@gmail.com">godvesselsinternational@gmail.com</a></p>
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-icon"><i class="fas fa-clock"></i></div>
                        <div class="info-content">
                            <h4>Office Hours</h4>
                            <p>Monday – Friday: 9:00 AM – 5:00 PM</p>
                            <p>Saturday: 10:00 AM – 2:00 PM</p>
                            <p>Sunday: Available during services</p>
                        </div>
                    </div>
                </div>
                <div class="emergency-contact">
                    <h3><i class="fas fa-phone-alt"></i> Emergency Pastoral Care</h3>
                    <p>For urgent pastoral care needs, please call:</p>
                    <a href="tel:+18252027450" class="emergency-number">
                        <i class="fas fa-phone"></i> +1 (825) 202-7450
                    </a>
                    <p><small>Available 24/7 for members in crisis</small></p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Map -->
<section class="map-section">
    <div class="container">
        <h2>Find Us</h2>
        <div class="map-container">
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2375.11420203308!2d-113.41212712326103!3d53.46641907232445!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x53a0198e69c5e943%3A0x4ce40c4e96f6e407!2s4511%2036%20Ave%20NW%2C%20Edmonton%2C%20AB%20T6L%203R9%2C%20Canada!5e0!3m2!1sen!2sng!4v1750483764377!5m2!1sen!2sng"
                    width="100%" height="450" style="border:0" allowfullscreen loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade" title="GVIM Location Map"></iframe>
        </div>
    </div>
</section>

<?php require_once 'includes/footer.php'; ?>
