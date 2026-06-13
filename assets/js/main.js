'use strict';

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initHeaderScroll();
    initGalleryFilter();
    initGalleryModal();
    initContactForm();
    initScrollToTop();
    initMotion();
});

// ── Mobile navigation ──────────────────────────────────────────────────────
function initMobileNav() {
    const toggle = document.getElementById('mobile-menu');
    const menu   = document.getElementById('nav-menu');
    if (!toggle || !menu) return;

    const close = () => {
        menu.classList.remove('active');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    };

    toggle.addEventListener('click', () => {
        const open = menu.classList.toggle('active');
        toggle.classList.toggle('active', open);
        toggle.setAttribute('aria-expanded', open);
        document.body.style.overflow = open ? 'hidden' : '';
    });

    menu.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', close));

    document.addEventListener('click', e => {
        if (!toggle.contains(e.target) && !menu.contains(e.target)) close();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

// ── Sticky header scroll state ─────────────────────────────────────────────
function initHeaderScroll() {
    const header = document.getElementById('site-header');
    if (!header) return;
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
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
                    if (window.gsap && !REDUCED_MOTION) {
                        window.gsap.fromTo(item, { opacity: 0, scale: 0.94, y: 12 },
                            { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'transform' });
                    } else {
                        requestAnimationFrame(() => { item.style.opacity = '1'; item.style.transform = 'none'; });
                    }
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(-10px)';
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
            mediaEl.appendChild(vid);
        } else {
            const img = document.createElement('img');
            img.src = src; img.alt = title;
            mediaEl.appendChild(img);
        }

        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        closeBtn?.focus();
    }

    function closeModal() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
        const vid = mediaEl.querySelector('video');
        if (vid) { vid.pause(); vid.src = ''; }
        setTimeout(() => { mediaEl.innerHTML = ''; }, 300);
    }

    document.addEventListener('click', e => {
        const btn = e.target.closest('.view-btn');
        if (btn) { e.stopPropagation(); openModal(btn); }
    });

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

        if (!valid) {
            e.preventDefault();
            form.querySelector('.error-message:not(:empty)')?.closest('.form-group')
                ?.querySelector('input,select,textarea')?.focus();
        } else {
            const btn = form.querySelector('[type=submit]');
            if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…'; }
        }
    });

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
    if (field) field.style.borderColor = 'hsl(0 72% 51%)';
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

    const toggle = () => btn.classList.toggle('visible', window.scrollY > 400);
    window.addEventListener('scroll', toggle, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: REDUCED_MOTION ? 'auto' : 'smooth' }));
}

// ── Motion system (GSAP, progressive enhancement) ──────────────────────────
function initMotion() {
    const gsap = window.gsap;
    // No GSAP or reduced motion → leave everything in its natural, visible state.
    if (!gsap || REDUCED_MOTION) { animateCounters(true); return; }

    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    // Hero entrance
    const heroBits = document.querySelectorAll('.hero [data-hero]');
    if (heroBits.length) {
        gsap.timeline({ defaults: { ease: 'power3.out' } })
            .from(heroBits, { y: 36, opacity: 0, duration: 0.9, stagger: 0.12, delay: 0.1 });
    }

    // Page-header entrance
    const phBits = document.querySelectorAll('.page-header [data-hero]');
    if (phBits.length) {
        gsap.from(phBits, { y: 28, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' });
    }

    if (!window.ScrollTrigger) { animateCounters(true); return; }
    const ST = window.ScrollTrigger;

    // Scroll reveals — staggered, batched per section
    const revealSel = '.section-head, .time-card, .vm-card, .pillar, .leader-card, .sermon-card,'
        + '.feature, .gallery-item, .testimonial-card, .stat, .info-item, .theme-text, .theme-visual,'
        + '.welcome-text, .welcome-features, .mini-gallery-item, .milestones, .emergency-contact, .contact-form';

    gsap.set(revealSel, { opacity: 0, y: 30 });
    ST.batch(revealSel, {
        start: 'top 88%',
        onEnter: batch => gsap.to(batch, {
            opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.08, overwrite: true,
        }),
    });

    // Parallax on hero aurora blobs
    document.querySelectorAll('.hero-aurora span').forEach((blob, i) => {
        gsap.to(blob, {
            yPercent: (i + 1) * 12, ease: 'none',
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
        });
    });

    // Featured visual subtle parallax
    const visual = document.querySelector('.theme-visual');
    if (visual) {
        gsap.to(visual, { yPercent: -8, ease: 'none',
            scrollTrigger: { trigger: visual, start: 'top bottom', end: 'bottom top', scrub: true } });
    }

    animateCounters(false);
    initMagnetic();
    ST.refresh();
}

// ── Animated stat counters ─────────────────────────────────────────────────
function animateCounters(immediate) {
    const els = document.querySelectorAll('[data-count]');
    if (!els.length) return;
    const gsap = window.gsap;

    els.forEach(el => {
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const fmt = v => Math.round(v).toLocaleString() + suffix;

        if (immediate || !gsap || !window.ScrollTrigger) { el.textContent = fmt(target); return; }

        const obj = { v: 0 };
        gsap.to(obj, {
            v: target, duration: 1.6, ease: 'power2.out',
            onUpdate: () => { el.textContent = fmt(obj.v); },
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        });
    });
}

// ── Magnetic buttons (pointer-fine devices only) ───────────────────────────
function initMagnetic() {
    const gsap = window.gsap;
    if (!gsap || !window.matchMedia('(pointer:fine)').matches) return;

    document.querySelectorAll('.btn-primary, .btn-accent, .scroll-to-top').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const r = btn.getBoundingClientRect();
            const mx = e.clientX - r.left - r.width / 2;
            const my = e.clientY - r.top - r.height / 2;
            gsap.to(btn, { x: mx * 0.25, y: my * 0.3, duration: 0.4, ease: 'power3.out' });
        });
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
        });
    });
}
