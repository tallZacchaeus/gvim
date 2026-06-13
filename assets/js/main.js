'use strict';

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initGalleryFilter();
    initGalleryModal();
    initContactForm();
    initScrollToTop();
    initScrollAnimations();
});

// ── Mobile navigation ──────────────────────────────────────────────────────
function initMobileNav() {
    const toggle = document.getElementById('mobile-menu');
    const menu   = document.getElementById('nav-menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
        const open = menu.classList.toggle('active');
        toggle.classList.toggle('active', open);
        toggle.setAttribute('aria-expanded', open);
        document.body.style.overflow = open ? 'hidden' : '';
    });

    menu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('active');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        });
    });

    document.addEventListener('click', e => {
        if (!toggle.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('active');
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    });
}

// ── Gallery filter (client-side) ───────────────────────────────────────────
function initGalleryFilter() {
    const btns  = document.querySelectorAll('.filter-btn');
    const items = document.querySelectorAll('.gallery-item');
    if (!btns.length || !items.length) return;

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            items.forEach(item => {
                const match = filter === 'all' || item.dataset.category === filter;
                if (match) {
                    item.style.display = 'block';
                    requestAnimationFrame(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    });
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(-12px)';
                    setTimeout(() => { item.style.display = 'none'; }, 250);
                }
            });
        });
    });
}

// ── Gallery lightbox modal ─────────────────────────────────────────────────
function initGalleryModal() {
    const modal   = document.getElementById('gallery-modal');
    const mediaEl = document.getElementById('modal-media');
    const titleEl = document.getElementById('modal-title');
    const descEl  = document.getElementById('modal-description');
    const closeBtn = modal?.querySelector('.close');
    if (!modal) return;

    function openModal(btn) {
        const type  = btn.dataset.type;
        const src   = btn.dataset.src;
        const title = btn.dataset.title || '';
        const desc  = btn.dataset.description || '';

        titleEl.textContent = title;
        descEl.textContent  = desc;
        mediaEl.innerHTML   = '';

        if (type === 'video') {
            const vid = document.createElement('video');
            vid.src = src; vid.controls = true; vid.autoplay = true;
            vid.style.cssText = 'max-width:100%;max-height:60vh;display:block;margin:0 auto;';
            mediaEl.appendChild(vid);
        } else {
            const img = document.createElement('img');
            img.src = src; img.alt = title;
            img.style.cssText = 'max-width:100%;max-height:60vh;object-fit:contain;display:block;margin:0 auto;';
            mediaEl.appendChild(img);
        }

        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
        // Stop video if playing
        const vid = mediaEl.querySelector('video');
        if (vid) { vid.pause(); vid.src = ''; }
        mediaEl.innerHTML = '';
    }

    // Delegate clicks on .view-btn
    document.addEventListener('click', e => {
        const btn = e.target.closest('.view-btn');
        if (btn) { e.stopPropagation(); openModal(btn); }
    });

    // Also click on gallery item itself opens modal
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', e => {
            if (e.target.closest('.view-btn')) return;
            const media = item.querySelector('[data-type]');
            if (media) openModal(media);
        });
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        item.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
        });
    });

    closeBtn?.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
}

// ── Contact form client-side validation ───────────────────────────────────
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', e => {
        clearErrors();
        let valid = true;

        const name    = form.querySelector('#name');
        const email   = form.querySelector('#email');
        const subject = form.querySelector('#subject');
        const message = form.querySelector('#message');

        if (!name?.value.trim())    { showErr('nameError', 'Full name is required.'); valid = false; }
        if (!email?.value.trim())   { showErr('emailError', 'Email address is required.'); valid = false; }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
            showErr('emailError', 'Please enter a valid email.'); valid = false;
        }
        if (!subject?.value)        { showErr('subjectError', 'Please select a subject.'); valid = false; }
        if (!message?.value.trim() || message.value.trim().length < 10) {
            showErr('messageError', 'Message must be at least 10 characters.'); valid = false;
        }

        if (!valid) e.preventDefault();
        else {
            const btn = form.querySelector('[type=submit]');
            if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…'; }
        }
    });

    // Live clearing
    form.querySelectorAll('input, select, textarea').forEach(el => {
        el.addEventListener('input', () => {
            const err = document.getElementById(el.id + 'Error');
            if (err) { err.textContent = ''; el.style.borderColor = ''; }
        });
    });
}

function showErr(id, msg) {
    const el = document.getElementById(id);
    const field = document.getElementById(id.replace('Error',''));
    if (el) el.textContent = msg;
    if (field) field.style.borderColor = 'hsl(0 84% 60%)';
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-group input, .form-group select, .form-group textarea')
        .forEach(el => el.style.borderColor = '');
}

// ── Scroll-to-top button ───────────────────────────────────────────────────
function initScrollToTop() {
    const btn = document.createElement('button');
    btn.className = 'scroll-to-top';
    btn.setAttribute('aria-label', 'Scroll to top');
    btn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    document.body.appendChild(btn);

    const toggle = () => btn.classList.toggle('visible', window.scrollY > 300);
    window.addEventListener('scroll', toggle, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ── Intersection observer animations ──────────────────────────────────────
function initScrollAnimations() {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.time-card,.vm-card,.pillar,.leader-card,.sermon-card,.feature,.gallery-item,.testimonial-card,.stat')
        .forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(24px)';
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(el);
        });
}
