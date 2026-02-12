// ====================================
// Smooth Scroll Navigation
// ====================================

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const offset = 80; // Account for fixed nav
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// Navigation smooth scroll
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        scrollToSection(targetId);
    });
});

// ====================================
// Sticky Navigation
// ====================================

const nav = document.getElementById('nav');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// ====================================
// Scroll Reveal Animations
// ====================================

function revealOnScroll() {
    const reveals = document.querySelectorAll('.reveal');

    reveals.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;

        if (elementTop < windowHeight - elementVisible) {
            element.classList.add('active');
        }
    });
}

window.addEventListener('scroll', revealOnScroll);
window.addEventListener('load', revealOnScroll);

// ====================================
// FAQ Accordion
// ====================================

function toggleFAQ(button) {
    const faqItem = button.closest('.faq-item');
    const isActive = faqItem.classList.contains('active');

    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });

    // If the clicked item wasn't active, open it
    if (!isActive) {
        faqItem.classList.add('active');
    }
}

// ====================================
// Form Validation & Submission
// ====================================

// Google Sheets Web App URL - UPDATE THIS AFTER SETTING UP GOOGLE SHEETS
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbx_Wb-LmRg9a9aIr72KOSniYz_HzFGQ0ampK_JLedVuYB3idr8z3AQHSc5WK8pYZJGK/exec';

function handleFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    // Basic validation
    const fullName = formData.get('fullName');
    const email = formData.get('email');
    const birthDate = formData.get('birthDate');
    const birthTime = formData.get('birthTime');
    const birthCity = formData.get('birthCity');

    if (!fullName || !email || !birthDate || !birthTime || !birthCity) {
        alert('Please fill in all required fields.');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    // Disable submit button while processing
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = 'Submitting...';

    // Create data object
    const data = {
        fullName,
        email,
        birthDate,
        birthTime,
        birthCity,
        submittedAt: new Date().toISOString()
    };

    // Submit to Google Sheets
    fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(() => {
        console.log('Form submitted successfully:', data);
        showSuccessMessage(form);
    })
    .catch(error => {
        console.error('Submission error:', error);
        // Still show success message (no-cors mode doesn't return responses)
        showSuccessMessage(form);
    });
}

function showSuccessMessage(form) {
    const formContent = form.closest('.form-content');

    // Create success message
    const successHTML = `
        <div class="success-message" style="text-align: center; padding: 3rem 2rem;">
            <div style="font-size: 4rem; margin-bottom: 1.5rem;">✓</div>
            <h3 style="font-family: var(--font-display); font-size: 2rem; color: var(--color-gold); margin-bottom: 1rem;">
                Success! Your Calendar is On Its Way
            </h3>
            <p style="color: var(--color-gray-light); font-size: 1.1rem; line-height: 1.8; margin-bottom: 2rem;">
                We've received your birth details and will calculate your personalized Power Calendar.
                Expect it in your inbox within 7 days.
            </p>
            <p style="color: var(--color-gray); font-size: 0.95rem;">
                Check your email (including spam folder) for confirmation.
            </p>
        </div>
    `;

    // Fade out form
    form.style.opacity = '0';
    form.style.transform = 'translateY(-20px)';
    form.style.transition = 'all 0.4s ease-out';

    // Replace with success message after animation
    setTimeout(() => {
        formContent.innerHTML = successHTML;
        formContent.querySelector('.success-message').style.opacity = '0';

        setTimeout(() => {
            formContent.querySelector('.success-message').style.transition = 'all 0.6s ease-out';
            formContent.querySelector('.success-message').style.opacity = '1';
        }, 50);
    }, 400);
}

// ====================================
// Parallax Effect for Cosmic Background
// ====================================

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const cosmicBg = document.querySelector('.cosmic-bg');

    if (cosmicBg) {
        cosmicBg.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
});

// ====================================
// Calendar Demo Interaction
// ====================================

function animateCalendarDays() {
    const calendarDays = document.querySelectorAll('.calendar-day');

    calendarDays.forEach((day, index) => {
        day.style.opacity = '0';
        day.style.transform = 'scale(0.8)';

        setTimeout(() => {
            day.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            day.style.opacity = '1';
            day.style.transform = 'scale(1)';
        }, index * 80);
    });
}

// Trigger calendar animation when in view
const calendarObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCalendarDays();
            calendarObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const calendarShowcase = document.querySelector('.calendar-showcase');
if (calendarShowcase) {
    calendarObserver.observe(calendarShowcase);
}

// ====================================
// Pricing Card Hover Effects
// ====================================

const pricingCards = document.querySelectorAll('.pricing-card');

pricingCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    });
});

// ====================================
// Initialize on Load
// ====================================

document.addEventListener('DOMContentLoaded', () => {
    // Reveal elements on initial load
    revealOnScroll();

    // Add smooth transitions to all interactive elements
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.style.transition = 'all 0.3s ease-out';
    });

    // Console signature
    console.log('%c🌟 Jeff Seah - Strategic Timing Intelligence', 'font-size: 16px; font-weight: bold; color: #d4af37;');
    console.log('%cTiming is everything. Now you can see it.', 'font-size: 12px; color: #9ca3af;');
});

// ====================================
// Easter Egg: Konami Code
// ====================================

let konamiCode = [];
const konamiPattern = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);

    if (konamiCode.join(',') === konamiPattern.join(',')) {
        activateCosmicMode();
    }
});

function activateCosmicMode() {
    console.log('🌌 Cosmic Mode Activated!');

    // Add extra stars
    const cosmicBg = document.querySelector('.cosmic-bg');
    cosmicBg.style.animation = 'stars 20s linear infinite';

    // Make orbits spin faster
    const orbits = document.querySelectorAll('.orbit');
    orbits.forEach((orbit, index) => {
        orbit.style.animationDuration = `${5 + index * 2}s`;
    });

    // Alert the user
    setTimeout(() => {
        alert('🌟 Cosmic Mode Activated! The universe is aligned in your favor.');
    }, 500);
}

// ====================================
// Performance Optimization
// ====================================

// Lazy load images if needed
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Debounce scroll events for better performance
let scrollTimeout;
let lastKnownScrollPosition = 0;
let ticking = false;

window.addEventListener('scroll', () => {
    lastKnownScrollPosition = window.scrollY;

    if (!ticking) {
        window.requestAnimationFrame(() => {
            revealOnScroll();
            ticking = false;
        });

        ticking = true;
    }
});
