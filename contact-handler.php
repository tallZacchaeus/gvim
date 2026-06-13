<?php
require_once 'includes/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: contact.php');
    exit;
}

/** Redirect back to the form, preserving what the visitor typed. */
function back_with_error(string $code, array $keep = []): void {
    $params = ['error' => $code] + $keep;
    header('Location: contact.php?' . http_build_query($params));
    exit;
}

// CSRF check
if (!verify_csrf($_POST['csrf_token'] ?? '')) {
    back_with_error('csrf');
}

// Honeypot anti-spam — silently accept and discard
if (!empty($_POST['honeypot'])) {
    header('Location: contact.php?sent=1');
    exit;
}

// Lightweight rate limiting (per session): min 15s between sends, max 5 / 10 min
$now  = time();
$log  = array_filter($_SESSION['contact_log'] ?? [], fn($t) => $t > $now - 600);
$last = empty($log) ? 0 : max($log);
if ($last && ($now - $last) < 15)  back_with_error('ratelimit');
if (count($log) >= 5)              back_with_error('ratelimit');

// Validate and sanitize inputs
$name    = trim(strip_tags($_POST['name'] ?? ''));
$email   = trim($_POST['email'] ?? '');
$phone   = trim(strip_tags($_POST['phone'] ?? ''));
$subject = trim(strip_tags($_POST['subject'] ?? ''));
$message = trim(strip_tags($_POST['message'] ?? ''));
$newsletter = !empty($_POST['newsletter']);

// Enforce sane length limits
$name    = mb_substr($name, 0, 120);
$email   = mb_substr($email, 0, 200);
$phone   = mb_substr($phone, 0, 40);
$message = mb_substr($message, 0, 5000);

$keep = [
    'name'  => $name,
    'email' => $email,
    'phone' => $phone,
    'msg'   => $message,
];

$allowed_subjects = ['General Inquiry','Prayer Request','Testimony','Ministry Involvement','Counseling Request','Event Information','Volunteer Opportunities','Pastoral Care','Other'];

if (mb_strlen($name) < 2)                         back_with_error('validation', $keep);
if (!filter_var($email, FILTER_VALIDATE_EMAIL))   back_with_error('validation', $keep);
if (!in_array($subject, $allowed_subjects, true)) back_with_error('validation', $keep);
if (mb_strlen($message) < 10)                     back_with_error('validation', $keep);

// Strip CR/LF from anything used in email headers (header-injection guard)
$safe_name  = preg_replace('/[\r\n]+/', ' ', $name);
$safe_email = preg_replace('/[\r\n]+/', '', $email);

$to           = CONTACT_EMAIL;
$subject_line = '[GVIM Contact] ' . $subject . ' from ' . $safe_name;

$body  = "New message from the GVIM website contact form.\n\n";
$body .= "Name:    {$name}\n";
$body .= "Email:   {$email}\n";
$body .= "Phone:   " . ($phone ?: 'Not provided') . "\n";
$body .= "Subject: {$subject}\n";
if ($newsletter) $body .= "Newsletter: Yes — please add to mailing list\n";
$body .= "\nMessage:\n{$message}\n\n";
$body .= "---\nSent via GVIM website contact form on " . date('Y-m-d H:i:s T');

$headers  = "From: GVIM Website <noreply@gvim.org>\r\n";
$headers .= "Reply-To: {$safe_name} <{$safe_email}>\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Save to database (the durable record — email delivery is best-effort)
$stored = false;
try {
    insert_contact([
        'name'       => $name,
        'email'      => $email,
        'phone'      => $phone,
        'subject'    => $subject,
        'message'    => $message,
        'newsletter' => $newsletter,
        'ip'         => $_SERVER['REMOTE_ADDR'] ?? null,
    ]);
    $stored = true;
} catch (Throwable $e) {
    error_log('Contact insert failed: ' . $e->getMessage());
}

$sent = @mail($to, $subject_line, $body, $headers);

// Record this submission against the rate limit
$log[] = $now;
$_SESSION['contact_log'] = array_values($log);

// Success if the message was either emailed or safely stored for follow-up.
if ($sent || $stored) {
    header('Location: contact.php?sent=1');
} else {
    back_with_error('mail', $keep);
}
exit;
