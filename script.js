/**
 * Portfolio Website JavaScript
 * Handles navigation, animations, and interactivity
 * For Cloud/DevOps/Platform Engineer - Azure Specialist
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    initNavigation();
    initSmoothScroll();
    initScrollAnimations();
    initContactForm();
    initTypingEffect();
});

const CONTACT_RATE_LIMIT_CONFIG = {
    storageKey: 'kk_contact_rate_limit_v1',
    cooldownMs: 45 * 1000,
    windowMs: 10 * 60 * 1000,
    maxSubmissionsInWindow: 3
};

let contactRateLimitTimer = null;

/**
 * Mobile Navigation Toggle
 */
function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Toggle mobile menu
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
    
    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });
    
    // Update active nav link on scroll
    window.addEventListener('scroll', () => {
        updateActiveNavLink();
        updateNavbarBackground();
    });
}

/**
 * Update active navigation link based on scroll position
 */
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

/**
 * Update navbar background on scroll
 */
function updateNavbarBackground() {
    const navbar = document.querySelector('.navbar');
    
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.78)';
        navbar.style.boxShadow = '0 16px 34px rgba(26, 43, 74, 0.12)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.62)';
        navbar.style.boxShadow = 'none';
    }
}

/**
 * Smooth Scroll for Navigation Links
 */
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = link.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Scroll Animations using Intersection Observer
 */
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Elements to animate
    const animateElements = document.querySelectorAll(
        '.skill-category, .project-card, .cert-card, .timeline-item, .about-text, .about-image, .contact-info, .contact-form'
    );
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });
}

/**
 * Contact Form Handling
 */
function initContactForm() {
    const form = document.getElementById('contactForm');
    const formEndpoint = 'https://formsubmit.co/ajax/kaplannkerem@gmail.com';
    
    if (form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (!submitBtn.dataset.originalText) {
            submitBtn.dataset.originalText = submitBtn.innerHTML;
        }

        const initialStatus = getContactRateLimitStatus();
        if (initialStatus.blocked) {
            applyRateLimitButtonState(submitBtn, initialStatus.retryMs);
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const rateLimitStatus = getContactRateLimitStatus();
            if (rateLimitStatus.blocked) {
                const waitSeconds = Math.ceil(rateLimitStatus.retryMs / 1000);
                showNotification(`Please wait ${waitSeconds}s before sending again.`, 'error');
                applyRateLimitButtonState(submitBtn, rateLimitStatus.retryMs);
                return;
            }

            const originalText = submitBtn.dataset.originalText || submitBtn.innerHTML;
            
            // Show loading state
            submitBtn.innerHTML = '<span>Sending...</span> <i class="fas fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;
            
            try {
                await submitContactForm(form, formEndpoint);
                recordContactFormSubmission();
                
                // Show success message
                showNotification('Message sent successfully!', 'success');
                form.reset();
            } catch (error) {
                // Show error message
                showNotification('Failed to send message. Please try again.', 'error');
                console.error('Contact form submission failed:', error);
            } finally {
                const postSubmitStatus = getContactRateLimitStatus();
                if (postSubmitStatus.blocked) {
                    applyRateLimitButtonState(submitBtn, postSubmitStatus.retryMs);
                } else {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            }
        });
    }
}

function getContactRateLimitState() {
    const raw = localStorage.getItem(CONTACT_RATE_LIMIT_CONFIG.storageKey);
    if (!raw) {
        return { lastSubmissionAt: 0, attempts: [] };
    }

    try {
        const parsed = JSON.parse(raw);
        return {
            lastSubmissionAt: Number(parsed.lastSubmissionAt) || 0,
            attempts: Array.isArray(parsed.attempts) ? parsed.attempts.filter((t) => Number.isFinite(Number(t))).map(Number) : []
        };
    } catch (error) {
        return { lastSubmissionAt: 0, attempts: [] };
    }
}

function setContactRateLimitState(state) {
    localStorage.setItem(CONTACT_RATE_LIMIT_CONFIG.storageKey, JSON.stringify(state));
}

function pruneSubmissionAttempts(attempts, now) {
    return attempts.filter((timestamp) => now - timestamp <= CONTACT_RATE_LIMIT_CONFIG.windowMs);
}

function getContactRateLimitStatus(now = Date.now()) {
    const state = getContactRateLimitState();
    const attempts = pruneSubmissionAttempts(state.attempts, now);

    let retryMs = 0;

    if (state.lastSubmissionAt > 0) {
        const cooldownRemaining = CONTACT_RATE_LIMIT_CONFIG.cooldownMs - (now - state.lastSubmissionAt);
        if (cooldownRemaining > retryMs) {
            retryMs = cooldownRemaining;
        }
    }

    if (attempts.length >= CONTACT_RATE_LIMIT_CONFIG.maxSubmissionsInWindow) {
        const oldestAttemptInWindow = attempts[0];
        const windowRemaining = CONTACT_RATE_LIMIT_CONFIG.windowMs - (now - oldestAttemptInWindow);
        if (windowRemaining > retryMs) {
            retryMs = windowRemaining;
        }
    }

    const normalizedState = {
        lastSubmissionAt: state.lastSubmissionAt,
        attempts
    };
    setContactRateLimitState(normalizedState);

    return {
        blocked: retryMs > 0,
        retryMs: Math.max(0, retryMs)
    };
}

function recordContactFormSubmission(now = Date.now()) {
    const state = getContactRateLimitState();
    const attempts = pruneSubmissionAttempts(state.attempts, now);
    attempts.push(now);

    setContactRateLimitState({
        lastSubmissionAt: now,
        attempts
    });
}

function applyRateLimitButtonState(submitBtn, retryMs) {
    if (contactRateLimitTimer) {
        clearInterval(contactRateLimitTimer);
        contactRateLimitTimer = null;
    }

    const originalText = submitBtn.dataset.originalText || submitBtn.innerHTML;
    submitBtn.dataset.originalText = originalText;

    const update = () => {
        const status = getContactRateLimitStatus();
        if (!status.blocked) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            if (contactRateLimitTimer) {
                clearInterval(contactRateLimitTimer);
                contactRateLimitTimer = null;
            }
            return;
        }

        const secondsLeft = Math.max(1, Math.ceil(status.retryMs / 1000));
        submitBtn.innerHTML = `<span>Wait ${secondsLeft}s</span> <i class="fas fa-clock"></i>`;
        submitBtn.disabled = true;
    };

    if (retryMs > 0) {
        update();
        contactRateLimitTimer = setInterval(update, 1000);
    }
}

/**
 * Submit contact form data to FormSubmit
 */
async function submitContactForm(form, endpoint) {
    const formData = new FormData(form);
    const visitorEmail = formData.get('email');

    if (visitorEmail) {
        formData.set('_replyto', visitorEmail);
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Accept': 'application/json'
        },
        body: formData
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Contact form request failed');
    }
}

/**
 * Show notification message
 */
function showNotification(message, type = 'success') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: ${type === 'success' ? '#27c93f' : '#ff5f56'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.95rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove notification after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

/**
 * Typing Effect for Hero Section
 */
function initTypingEffect() {
    const codeContent = document.querySelector('.code-content code');
    
    if (codeContent) {
        const originalHTML = codeContent.innerHTML;
        const textContent = codeContent.textContent;
        
        // Only apply typing effect on larger screens
        if (window.innerWidth > 768) {
            codeContent.innerHTML = '';
            let charIndex = 0;
            
            const typeChar = () => {
                if (charIndex < textContent.length) {
                    // This is a simplified typing effect
                    // For a more sophisticated version, you'd need to handle HTML tags
                    charIndex++;
                    codeContent.textContent = textContent.substring(0, charIndex);
                    setTimeout(typeChar, 20);
                } else {
                    // Restore original HTML with syntax highlighting
                    codeContent.innerHTML = originalHTML;
                }
            };
            
            // Start typing after a delay
            setTimeout(typeChar, 500);
        }
    }
}

/**
 * Project Card Hover Effects
 */
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mouseenter', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});

/**
 * Scroll to Top functionality
 */
function createScrollToTop() {
    const scrollBtn = document.createElement('button');
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollBtn.setAttribute('aria-label', 'Scroll to top');
    
    scrollBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: var(--azure-blue);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        box-shadow: 0 4px 15px rgba(0, 120, 212, 0.4);
        transition: all 0.3s ease;
        z-index: 1000;
    `;
    
    document.body.appendChild(scrollBtn);
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            scrollBtn.style.display = 'flex';
        } else {
            scrollBtn.style.display = 'none';
        }
    });
    
    // Scroll to top on click
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Hover effect
    scrollBtn.addEventListener('mouseenter', () => {
        scrollBtn.style.transform = 'translateY(-5px)';
    });
    
    scrollBtn.addEventListener('mouseleave', () => {
        scrollBtn.style.transform = 'translateY(0)';
    });
}

// Initialize scroll to top button
createScrollToTop();

/**
 * Lazy Loading for Images (if any are added later)
 */
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

/**
 * Console Easter Egg
 */
console.log('%c☁️ Cloud/DevOps Engineer Portfolio', 'font-size: 24px; font-weight: bold; color: #0078d4;');
console.log('%cSpecialized in Azure Infrastructure & Platform Engineering', 'font-size: 14px; color: #ff8c00;');
console.log('%cCheck out my projects at: github.com', 'font-size: 12px; color: #888;');