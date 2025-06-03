// GVIM Website JavaScript
// Handles mobile navigation, gallery functionality, contact forms, and other interactions

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initMobileNavigation();
    initGalleryFunctionality();
    initContactForm();
    initSmoothScrolling();
    initActiveNavigation();
});

// Mobile Navigation Toggle
function initMobileNavigation() {
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenu && navMenu) {
        mobileMenu.addEventListener('click', function() {
            // Toggle mobile menu
            mobileMenu.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        // Close mobile menu when clicking on nav links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileMenu.contains(event.target) && !navMenu.contains(event.target)) {
                mobileMenu.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// Gallery Functionality
function initGalleryFunctionality() {
    initGalleryFilter();
    initGalleryModal();
}

// Gallery Filter
function initGalleryFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (filterButtons.length === 0 || galleryItems.length === 0) return;

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter gallery items
            galleryItems.forEach(item => {
                const category = item.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    item.style.display = 'block';
                    // Add animation
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                    
                    setTimeout(() => {
                        item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(-20px)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// Gallery Modal
function initGalleryModal() {
    const modal = document.getElementById('gallery-modal');
    const viewButtons = document.querySelectorAll('.view-btn');
    const closeButton = document.querySelector('.close');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');

    if (!modal) return;

    // Open modal when view button is clicked
    viewButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const title = this.getAttribute('data-title');
            const description = this.getAttribute('data-description');
            
            if (modalTitle && modalDescription) {
                modalTitle.textContent = title;
                modalDescription.textContent = description;
            }
            
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Add entrance animation
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.transition = 'opacity 0.3s ease';
                modal.style.opacity = '1';
            }, 10);
        });
    });

    // Close modal when close button is clicked
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }

    // Close modal when clicking outside of modal content
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal with escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });

    function closeModal() {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }
}

// Contact Form Validation and Handling
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (!contactForm) return;

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            submitForm();
        }
    });

    // Real-time validation
    const inputs = contactForm.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });

        input.addEventListener('input', function() {
            clearError(this);
        });
    });
}

function validateForm() {
    const form = document.getElementById('contactForm');
    let isValid = true;

    // Clear all previous errors
    clearAllErrors();

    // Validate required fields
    const requiredFields = [
        { id: 'name', message: 'Full name is required' },
        { id: 'email', message: 'Email address is required' },
        { id: 'subject', message: 'Please select a subject' },
        { id: 'message', message: 'Message is required' }
    ];

    requiredFields.forEach(field => {
        const input = document.getElementById(field.id);
        if (!input.value.trim()) {
            showError(field.id, field.message);
            isValid = false;
        }
    });

    // Validate email format
    const email = document.getElementById('email');
    if (email.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value.trim())) {
            showError('email', 'Please enter a valid email address');
            isValid = false;
        }
    }

    // Validate phone number if provided
    const phone = document.getElementById('phone');
    if (phone.value.trim()) {
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(phone.value.trim())) {
            showError('phone', 'Please enter a valid phone number');
            isValid = false;
        }
    }

    // Validate message length
    const message = document.getElementById('message');
    if (message.value.trim() && message.value.trim().length < 10) {
        showError('message', 'Message must be at least 10 characters long');
        isValid = false;
    }

    return isValid;
}

function validateField(field) {
    clearError(field);

    switch (field.id) {
        case 'name':
            if (!field.value.trim()) {
                showError('name', 'Full name is required');
                return false;
            }
            break;

        case 'email':
            if (!field.value.trim()) {
                showError('email', 'Email address is required');
                return false;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value.trim())) {
                showError('email', 'Please enter a valid email address');
                return false;
            }
            break;

        case 'phone':
            if (field.value.trim()) {
                const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
                if (!phoneRegex.test(field.value.trim())) {
                    showError('phone', 'Please enter a valid phone number');
                    return false;
                }
            }
            break;

        case 'subject':
            if (!field.value) {
                showError('subject', 'Please select a subject');
                return false;
            }
            break;

        case 'message':
            if (!field.value.trim()) {
                showError('message', 'Message is required');
                return false;
            }
            if (field.value.trim().length < 10) {
                showError('message', 'Message must be at least 10 characters long');
                return false;
            }
            break;
    }
    return true;
}

function showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + 'Error');
    const field = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    if (field) {
        field.style.borderColor = 'hsl(0 84% 60%)'; // Error color
        field.classList.add('error');
    }
}

function clearError(field) {
    const errorElement = document.getElementById(field.id + 'Error');
    
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
    
    field.style.borderColor = '';
    field.classList.remove('error');
}

function clearAllErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    const inputElements = document.querySelectorAll('input, select, textarea');
    
    errorElements.forEach(element => {
        element.textContent = '';
        element.style.display = 'none';
    });
    
    inputElements.forEach(element => {
        element.style.borderColor = '';
        element.classList.remove('error');
    });
}

function submitForm() {
    const form = document.getElementById('contactForm');
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    // Show loading state
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitButton.disabled = true;
    
    // Collect form data
    const formData = new FormData(form);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone') || '',
        subject: formData.get('subject'),
        message: formData.get('message'),
        newsletter: formData.get('newsletter') ? true : false,
        timestamp: new Date().toISOString()
    };
    
    // In a real implementation, you would send this data to your server
    // For this demo, we'll simulate a successful submission
    setTimeout(() => {
        // Simulate successful submission
        showSuccessMessage();
        form.reset();
        
        // Reset button
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        
        // Clear any validation errors
        clearAllErrors();
        
        console.log('Form data that would be sent:', data);
    }, 2000);
}

function showSuccessMessage() {
    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background-color: hsl(142 76% 36%);
        color: white;
        padding: 1rem 2rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: slideDown 0.3s ease;
    `;
    
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>Thank you! Your message has been sent successfully. We'll get back to you soon.</span>
    `;
    
    document.body.appendChild(successDiv);
    
    // Remove message after 5 seconds
    setTimeout(() => {
        successDiv.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 300);
    }, 5000);
}

// Smooth Scrolling for Anchor Links
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href === '#') return;
            
            const target = document.querySelector(href);
            
            if (target) {
                e.preventDefault();
                
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Active Navigation Based on Current Page
function initActiveNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Remove existing active classes
        link.classList.remove('active');
        
        // Add active class to current page
        if (href === currentPage || 
            (currentPage === '' && href === 'index.html') ||
            (currentPage === '/' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// Scroll to Top Functionality
function addScrollToTop() {
    // Create scroll to top button
    const scrollButton = document.createElement('button');
    scrollButton.innerHTML = '<i class="fas fa-chevron-up"></i>';
    scrollButton.className = 'scroll-to-top';
    scrollButton.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 50px;
        height: 50px;
        background-color: hsl(25 47% 15%);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.3s ease;
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
    `;
    
    document.body.appendChild(scrollButton);
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollButton.style.opacity = '1';
            scrollButton.style.transform = 'scale(1)';
        } else {
            scrollButton.style.opacity = '0';
            scrollButton.style.transform = 'scale(0.8)';
        }
    });
    
    // Scroll to top when clicked
    scrollButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Hover effects
    scrollButton.addEventListener('mouseenter', function() {
        this.style.backgroundColor = 'hsl(45 100% 60%)';
        this.style.color = 'hsl(25 47% 15%)';
        this.style.transform = 'scale(1.1)';
    });
    
    scrollButton.addEventListener('mouseleave', function() {
        this.style.backgroundColor = 'hsl(25 47% 15%)';
        this.style.color = 'white';
        this.style.transform = window.pageYOffset > 300 ? 'scale(1)' : 'scale(0.8)';
    });
}

// Initialize scroll to top when page loads
document.addEventListener('DOMContentLoaded', function() {
    addScrollToTop();
});

// Animation for elements when they come into view
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Elements to animate
    const animatedElements = document.querySelectorAll(`
        .time-card,
        .vm-card,
        .pillar,
        .leader-card,
        .sermon-card,
        .feature,
        .gallery-item
    `);
    
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

// Initialize scroll animations when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Delay to ensure all content is loaded
    setTimeout(initScrollAnimations, 100);
});

// Add CSS animations for success message
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translate(-50%, -20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translate(-50%, 0);
        }
        to {
            opacity: 0;
            transform: translate(-50%, -20px);
        }
    }
    
    .form-group input.error,
    .form-group select.error,
    .form-group textarea.error {
        border-color: hsl(0 84% 60%) !important;
        box-shadow: 0 0 0 3px hsl(0 84% 60% / 0.1) !important;
    }
    
    .success-message {
        font-weight: 500;
    }
    
    .scroll-to-top:hover {
        box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;
    }
`;

document.head.appendChild(style);

// Utility function to format phone numbers as user types
function formatPhoneNumber(input) {
    const phoneInput = document.getElementById('phone');
    
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length >= 6) {
                value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
            } else if (value.length >= 3) {
                value = value.replace(/(\d{3})(\d{3})/, '($1) $2');
            }
            
            e.target.value = value;
        });
    }
}

// Initialize phone formatting when page loads
document.addEventListener('DOMContentLoaded', function() {
    formatPhoneNumber();
});

// Enhanced form accessibility
function enhanceFormAccessibility() {
    const form = document.getElementById('contactForm');
    
    if (!form) return;
    
    // Add ARIA attributes
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        const label = form.querySelector(`label[for="${input.id}"]`);
        if (label) {
            input.setAttribute('aria-describedby', input.id + 'Error');
        }
    });
    
    // Announce errors to screen readers
    const errorElements = form.querySelectorAll('.error-message');
    errorElements.forEach(error => {
        error.setAttribute('role', 'alert');
        error.setAttribute('aria-live', 'polite');
    });
}

// Initialize accessibility enhancements
document.addEventListener('DOMContentLoaded', function() {
    enhanceFormAccessibility();
});

// Keyboard navigation for gallery
function initKeyboardNavigation() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach((item, index) => {
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', `View gallery image ${index + 1}`);
        
        item.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const viewButton = this.querySelector('.view-btn');
                if (viewButton) {
                    viewButton.click();
                }
            }
        });
    });
}

// Initialize keyboard navigation
document.addEventListener('DOMContentLoaded', function() {
    initKeyboardNavigation();
});

// Error handling for missing elements
function handleMissingElements() {
    // Check for critical elements and provide fallbacks
    const criticalElements = [
        { selector: '.nav-menu', message: 'Navigation menu not found' },
        { selector: '.header', message: 'Header not found' },
        { selector: '.footer', message: 'Footer not found' }
    ];
    
    criticalElements.forEach(element => {
        if (!document.querySelector(element.selector)) {
            console.warn(`GVIM Website: ${element.message}`);
        }
    });
}

// Initialize error handling
document.addEventListener('DOMContentLoaded', function() {
    handleMissingElements();
});

// Export functions for potential testing or external use
window.GVIMWebsite = {
    validateForm,
    validateField,
    showError,
    clearError,
    clearAllErrors,
    submitForm,
    showSuccessMessage
};
