<?php
require_once __DIR__ . '/auth.php';
require_admin();

$flash    = admin_get_flash();
$contacts = get_contacts(100);
$admin_page    = 'contacts';
$admin_title   = 'Messages';
$admin_subtitle = count($contacts) . ' submission' . (count($contacts) === 1 ? '' : 's') . ' from the contact form';
require __DIR__ . '/partials/header.php';
?>
        <?php if ($flash): ?>
        <div class="alert alert-<?= $flash['type'] ?>"><?= h($flash['msg']) ?></div>
        <?php endif; ?>

        <?php if (empty($contacts)): ?>
        <div class="empty-state">
            <i class="fas fa-inbox fa-3x"></i>
            <p>No messages yet.</p>
        </div>
        <?php else: ?>
        <div class="admin-table-wrap">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Name / Email</th>
                        <th>Subject</th>
                        <th>Message</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($contacts as $c): ?>
                    <tr class="msg-row">
                        <td style="white-space:nowrap">
                            <?= h(date('M j, Y', strtotime($c['submitted_at']))) ?><br>
                            <small class="text-muted"><?= h(date('g:i a', strtotime($c['submitted_at']))) ?></small>
                        </td>
                        <td>
                            <strong><?= h($c['name']) ?></strong><br>
                            <a href="mailto:<?= h($c['email']) ?>" style="font-size:0.85rem"><?= h($c['email']) ?></a>
                            <?php if ($c['phone']): ?>
                            <br><small class="text-muted"><?= h($c['phone']) ?></small>
                            <?php endif; ?>
                            <?php if ($c['newsletter']): ?>
                            <br><small class="newsletter-yes"><i class="fas fa-check-circle"></i> Newsletter</small>
                            <?php endif; ?>
                        </td>
                        <td><?= h($c['subject']) ?></td>
                        <td><div class="msg-body"><?= h($c['message']) ?></div></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php endif; ?>
<?php require __DIR__ . '/partials/footer.php'; ?>
