/* ============================================
   MyKal Landing Page — Shared JavaScript
   Unified hero-story scroll, GSAP ScrollTrigger
   ============================================ */

// --- Mobile Menu ---
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        mobileMenu.classList.toggle('open');
        document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
}
function closeMenu() {
    if (hamburger) hamburger.classList.remove('open');
    if (mobileMenu) mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
}

// --- Language Switch ---
const langTarget = document.documentElement.getAttribute('data-lang-target');
window.switchLang = function() {
    const isAr = document.documentElement.lang === 'ar';
    localStorage.setItem('mykal-lang', isAr ? 'en' : 'ar');
    window.location.href = langTarget;
};

// --- Nav Scroll & Progress Bar (rAF + passive) ---
const navbar = document.getElementById('navbar');
const scrollProgress = document.getElementById('scrollProgress');
if (navbar && scrollProgress) {
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (scrollTicking) return;
        scrollTicking = true;
        requestAnimationFrame(() => {
            navbar.classList.toggle('scrolled', window.scrollY > 20);
            const s = window.scrollY;
            const mx = document.documentElement.scrollHeight - window.innerHeight;
            if (mx > 0) scrollProgress.style.width = (s / mx * 100) + '%';
            scrollTicking = false;
        });
    }, { passive: true });
}

// --- IntersectionObserver: View Animations ---
const viewObs = new IntersectionObserver(entries => {
    entries.forEach(el => {
        if (el.isIntersecting) {
            el.target.classList.add('visible');
            viewObs.unobserve(el.target);
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
document.querySelectorAll('.view-item,.view-up').forEach(el => viewObs.observe(el));

// --- GSAP Animations ---
window.addEventListener('DOMContentLoaded', () => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // GSAP fallback: if CDN fails, show content statically
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        var heroStoryFb = document.getElementById('heroStorySection');
        if (heroStoryFb) heroStoryFb.style.height = 'auto';
        var stickyFb = heroStoryFb ? heroStoryFb.querySelector('.hero-story-sticky') : null;
        if (stickyFb) stickyFb.style.position = 'relative';
        var overlayFb = document.getElementById('heroOverlay');
        if (overlayFb) overlayFb.classList.remove('fade-out');
        var labelsFb = document.getElementById('storyLabels');
        if (labelsFb) {
            labelsFb.classList.remove('fade-out');
            labelsFb.querySelectorAll('.story-label').forEach(function(l) { l.classList.add('active'); });
        }
        var interFb = document.getElementById('heroInterstitial');
        if (interFb) interFb.classList.add('active');
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // ============================================
    // UNIFIED HERO-STORY SCROLL (6 phases)
    // One section, one phone, scroll-driven
    // ============================================
    const heroStory = document.getElementById('heroStorySection');
    const heroOverlay = document.getElementById('heroOverlay');
    const heroToasts = document.getElementById('heroToasts');
    const scrollHint = document.getElementById('scrollHint');
    const storyLabels = document.getElementById('storyLabels');
    const heroInterstitial = document.getElementById('heroInterstitial');
    const phoneWrapper = document.getElementById('heroPhoneWrapper');

    if (heroStory && heroOverlay && heroToasts && phoneWrapper) {
        const screens = heroStory.querySelectorAll('.screen-state');
        const labels = storyLabels ? storyLabels.querySelectorAll('.story-label') : [];

        // Track last phase to avoid redundant DOM thrashing
        let lastPhase = -1;

        // EaseOutCubic for smooth phone shrink
        function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

        ScrollTrigger.create({
            trigger: heroStory,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.2,
            onUpdate: (self) => {
                const p = self.progress;

                // Determine current phase
                // Phase 0: 0-0.15    Hero visible
                // Phase 1: 0.15-0.25 Transition (hero fades proportionally)
                // Phase 2: 0.25-0.45 Snap (camera screen)
                // Phase 3: 0.45-0.65 Log (analysis screen)
                // Phase 4: 0.65-0.85 Track (dashboard screen)
                // Phase 5: 0.85-1.0  Interstitial (phone shrinks, statement)
                let phase;
                if (p < 0.15) phase = 0;
                else if (p < 0.25) phase = 1;
                else if (p < 0.45) phase = 2;
                else if (p < 0.65) phase = 3;
                else if (p < 0.85) phase = 4;
                else phase = 5;

                // Phase 1: drive overlay opacity proportionally
                if (phase === 1) {
                    const t1 = (p - 0.15) / 0.10;
                    heroOverlay.style.opacity = 1 - t1;
                    heroToasts.style.opacity = 1 - t1;
                } else if (phase === 0) {
                    heroOverlay.style.opacity = '';
                    heroToasts.style.opacity = '';
                }

                if (phase === lastPhase && phase !== 1 && phase !== 5) return;
                lastPhase = phase;

                // Hero overlay + toasts + scroll hint
                heroOverlay.classList.toggle('fade-out', phase >= 2);
                heroToasts.classList.toggle('fade-out', phase >= 2);
                if (scrollHint) scrollHint.classList.toggle('fade-out', p > 0.03);

                // Screen states: 0=dashboard(hero), 1=camera(snap), 2=analysis(log), 3=dashboard-updated(track)
                let activeScreen = 0;
                if (phase === 2) activeScreen = 1;
                else if (phase === 3) activeScreen = 2;
                else if (phase >= 4) activeScreen = 3;

                screens.forEach((s, i) => s.classList.toggle('active', i === activeScreen));

                // Story labels: shown during snap/log/track phases
                let activeLabel = -1;
                if (phase === 2) activeLabel = 0;      // "Snap."
                else if (phase === 3) activeLabel = 1;  // "Log."
                else if (phase === 4) activeLabel = 2;  // "Track."

                if (labels.length) {
                    labels.forEach((l, i) => l.classList.toggle('active', i === activeLabel));
                }

                // Story labels container visibility
                if (storyLabels) {
                    storyLabels.classList.toggle('fade-out', phase < 2 || phase >= 5);
                }

                // Interstitial statement
                if (heroInterstitial) {
                    heroInterstitial.classList.toggle('active', phase === 5);
                }

                // Phone scale/fade during interstitial (easeOutCubic)
                if (phase === 5) {
                    const ip = easeOutCubic(Math.min((p - 0.85) / 0.15, 1));
                    phoneWrapper.style.transform = 'scale(' + (1 - ip * 0.4) + ')';
                    phoneWrapper.style.opacity = 1 - ip;
                } else if (phase < 5) {
                    phoneWrapper.style.transform = '';
                    phoneWrapper.style.opacity = '';
                }
            }
        });
    }

    // --- Feature Card Stagger Entrance (scroll-driven) ---
    gsap.utils.toArray('.feature-card').forEach((card, i) => {
        gsap.from(card, {
            y: 60,
            opacity: 0,
            duration: 0.8,
            delay: i * 0.12,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none'
            }
        });
    });

    // --- Stats Counter Animation ---
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length) {
        ScrollTrigger.create({
            trigger: '.stats-section',
            start: 'top 75%',
            once: true,
            onEnter: () => {
                statNumbers.forEach(el => {
                    el.style.opacity = '0';
                    el.style.transform = 'translateY(20px)';
                    gsap.to(el, {
                        opacity: 1,
                        y: 0,
                        duration: 0.6,
                        ease: 'power2.out',
                        delay: 0.1
                    });
                });
            }
        });
    }

    // --- Bento Card Reveal (stagger) ---
    gsap.utils.toArray('.bento-card').forEach((card, i) => {
        gsap.from(card, {
            y: 40,
            opacity: 0,
            duration: 0.7,
            delay: i * 0.1,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none'
            }
        });
    });

    // --- Showcase Section Parallax ---
    var showcasePhone = document.querySelector('.showcase-phone-wrapper');
    if (showcasePhone) {
        gsap.from(showcasePhone, {
            y: 80,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.showcase-section',
                start: 'top 70%',
                toggleActions: 'play none none none'
            }
        });
    }

    // --- Feature Card 3D Tilt (desktop, rAF-throttled) ---
    if (window.innerWidth > 768) {
        document.querySelectorAll('.feature-card').forEach(card => {
            let cardTicking = false;
            card.addEventListener('mousemove', e => {
                if (cardTicking) return;
                cardTicking = true;
                requestAnimationFrame(() => {
                    const rect = card.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width - 0.5;
                    const y = (e.clientY - rect.top) / rect.height - 0.5;
                    card.style.transform = `translateY(-16px) perspective(800px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
                    cardTicking = false;
                });
            }, { passive: true });
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }
});
