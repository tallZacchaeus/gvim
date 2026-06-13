<?php
require_once 'includes/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: contact.php');
    exit;
}

// CSRF check
if (!verify_csrf($_POST['csrf_token'] ?? '')) {
    header('Location: contact.php?error=csrf');
    exit;
}

// Honeypot anti-spam
if (!empty($_POST['honeypot'])) {
    header('Location: contact.php?sent=1'); // Silently discard
    exit;
}

// Validate and sanitize inputs
$errors = [];

$name    = trim(strip_tags($_POST['name'] ?? ''));
$email   = trim($_POST['email'] ?? '');
$phone   = trim(strip_tags($_POST['phone'] ?? ''));
$subject = trim(strip_tags($_POST['subject'] ?? ''));
$message = trim(strip_tags($_POST['message'] ?? ''));
$newsletter = !empty($_POST['newsletter']);

$allowed_subjects = ['General Inquiry','Prayer Request','Testimony','Ministry Involvement','Counseling Request','Event Information','Volunteer Opportunities','Pastoral Care','Other'];

if (strlen($name) < 2)                            $errors[] = 'Full name is required.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL))   $errors[] = 'Valid email address is required.';
if (!in_array($subject, $allowed_subjects, true)) $errors[] = 'Please select a valid subject.';
if (strlen($message) < 10)                        $errors[] = 'Message must be at least 10 characters.';

if (!empty($errors)) {
    header('Location: contact.php?error=validation');
    exit;
}

$to      = CONTACT_EMAIL;
$subject_line = '[GVIM Contact] ' . $subject . ' from ' . $name;

$body  = "New message from the GVIM website contact form.\n\n";
$body .= "Name:    {$name}\n";
$body .= "Email:   {$email}\n";
$body .= "Phone:   " . ($phone ?: 'Not provided') . "\n";
$body .= "Subject: {$subject}\n";
if ($newsletter) $body .= "Newsletter: Yes — please add to mailing list\n";
$body .= "\nMessage:\n{$message}\n\n";
$body .= "---\nSent via GVIM website contact form on " . date('Y-m-d H:i:s T');

$headers  = "From: GVIM Website <noreply@gvim.org>\r\n";
$headers .= "Reply-To: {$name} <{$email}>\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = mail($to, $subject_line, $body, $headers);

if ($sent) {
    header('Location: contact.php?sent=1');
} else {
    header('Location: contact.php?error=mail');
}
exit;
