'use strict';

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initFileDrops();
});

// ── Off-canvas sidebar (mobile) ────────────────────────────────────────────
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle  = document.getElementById('sidebar-toggle');
    const scrim   = document.getElementById('scrim');
    if (!sidebar || !toggle) return;

    const open = () => {
        sidebar.classList.add('open');
        scrim.hidden = false;
        requestAnimationFrame(() => scrim.classList.add('show'));
        toggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    };
    const close = () => {
        sidebar.classList.remove('open');
        scrim.classList.remove('show');
        setTimeout(() => { scrim.hidden = true; }, 250);
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    };

    toggle.addEventListener('click', () =>
        sidebar.classList.contains('open') ? close() : open());
    scrim.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    sidebar.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
}

// ── Generic file-drop areas ────────────────────────────────────────────────
// Pages with richer behaviour (e.g. multi-file upload with previews) mark their
// drop area with data-advanced and handle it inline; we skip those here.
function initFileDrops() {
    document.querySelectorAll('.file-drop-area:not([data-advanced])').forEach(area => {
        const input = area.querySelector('.file-input');
        if (!input) return;
        const label = area.querySelector('[data-drop-label]') || area.querySelector('p');
        const original = label ? label.textContent : '';

        area.addEventListener('click', () => input.click());
        area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('drag-over'); });
        area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
        area.addEventListener('drop', e => {
            e.preventDefault();
            area.classList.remove('drag-over');
            input.files = e.dataTransfer.files;
            input.dispatchEvent(new Event('change'));
        });
        input.addEventListener('change', () => {
            if (!label) return;
            const f = input.files[0];
            label.textContent = f ? `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)` : original;
        });
    });
}
