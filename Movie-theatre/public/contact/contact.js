// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar scroll effect
const navbar = document.querySelector('.glass-nav');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards
document.querySelectorAll('.liquid-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Contact Form Submission
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };
        
        // Simulate form submission
        const submitBtn = contactForm.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<span>Sending...</span>';
        submitBtn.style.pointerEvents = 'none';
        
        setTimeout(() => {
            alert(`Thank you ${formData.firstName}! Your message has been received. We'll get back to you at ${formData.email} soon.`);
            contactForm.reset();
            submitBtn.innerHTML = originalText;
            submitBtn.style.pointerEvents = 'auto';
        }, 1500);
    });
}

// Form input animations
const formInputs = document.querySelectorAll('.form-group input, .form-group select, .form-group textarea');
formInputs.forEach(input => {
    input.addEventListener('focus', () => {
        input.parentElement.style.transform = 'scale(1.02)';
    });
    
    input.addEventListener('blur', () => {
        input.parentElement.style.transform = 'scale(1)';
    });
});

// Search button functionality
const searchBtn = document.querySelector('.search-btn');
if (searchBtn) {
    searchBtn.addEventListener('click', () => {
        const query = prompt('Search for movies, showtimes, or experiences:');
        if (query) {
            alert(`Searching for: "${query}". Search feature coming soon!`);
        }
    });
}

// Liquid card mouse tracking effect
document.querySelectorAll('.liquid-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        card.style.setProperty('--mouse-x', `${x}%`);
        card.style.setProperty('--mouse-y', `${y}%`);
    });
});

// Info card hover effects
document.querySelectorAll('.info-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        const icon = this.querySelector('.info-icon');
        if (icon) {
            icon.style.transform = 'scale(1.1) rotate(5deg)';
        }
    });
    
    card.addEventListener('mouseleave', function() {
        const icon = this.querySelector('.info-icon');
        if (icon) {
            icon.style.transform = 'scale(1) rotate(0deg)';
        }
    });
});

// Social button interactions
document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const platform = btn.querySelector('svg title')?.textContent || 'social media';
        alert(`Opening ${platform}. Social media integration coming soon!`);
    });
});

// Form validation with visual feedback
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const emailInput = document.getElementById('email');
if (emailInput) {
    emailInput.addEventListener('blur', () => {
        if (emailInput.value && !validateEmail(emailInput.value)) {
            emailInput.style.borderColor = 'rgba(255, 100, 100, 0.5)';
            emailInput.style.boxShadow = '0 0 20px rgba(255, 100, 100, 0.2)';
        } else {
            emailInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            emailInput.style.boxShadow = 'none';
        }
    });
}

// Phone number formatting (basic)
const phoneInput = document.getElementById('phone');
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 10) {
            value = value.slice(0, 10);
        }
        e.target.value = value;
    });
}

// Character counter for message textarea
const messageInput = document.getElementById('message');
if (messageInput) {
    const maxChars = 500;
    const counter = document.createElement('div');
    counter.style.cssText = 'font-size: 0.85rem; color: rgba(255, 255, 255, 0.4); text-align: right; margin-top: 0.5rem;';
    messageInput.parentElement.appendChild(counter);
    
    const updateCounter = () => {
        const remaining = maxChars - messageInput.value.length;
        counter.textContent = `${remaining} characters remaining`;
        
        if (remaining < 50) {
            counter.style.color = 'rgba(255, 200, 100, 0.8)';
        } else {
            counter.style.color = 'rgba(255, 255, 255, 0.4)';
        }
    };
    
    messageInput.addEventListener('input', updateCounter);
    messageInput.setAttribute('maxlength', maxChars);
    updateCounter();
}

// Add active state to navigation based on scroll position
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;
    
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 200;
        const sectionId = section.getAttribute('id');
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-menu a').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
});

// Simulate map loading animation
const mapPlaceholder = document.querySelector('.map-placeholder');
if (mapPlaceholder) {
    setTimeout(() => {
        mapPlaceholder.querySelector('p').textContent = 'Map ready! Click to view directions';
        mapPlaceholder.style.cursor = 'pointer';
        
        mapPlaceholder.addEventListener('click', () => {
            alert('Opening Google Maps for directions to Nilambur Films Complex...');
        });
    }, 2000);
}

// Console welcome message
console.log('%c📧 Contact Page Loaded', 'font-size: 18px; color: #8a50ff; font-weight: bold;');
console.log('%cNilambur Films - We\'re here to help!', 'font-size: 14px; color: #6a30dd;');

// Dynamic greeting based on time of day
const updateGreeting = () => {
    const hour = new Date().getHours();
    let greeting = 'Hello';
    
    if (hour >= 5 && hour < 12) {
        greeting = 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
        greeting = 'Good Afternoon';
    } else if (hour >= 17 && hour < 22) {
        greeting = 'Good Evening';
    } else {
        greeting = 'Good Night';
    }
    
    console.log(`${greeting}! Ready to assist you.`);
};

updateGreeting();

// Add subtle parallax effect to hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.contact-hero');
    
    if (hero && scrolled < window.innerHeight) {
        hero.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
});

// Animate submit button on page load
window.addEventListener('load', () => {
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
        setTimeout(() => {
            submitBtn.style.animation = 'pulse 2s infinite';
        }, 1000);
    }
});

// Add pulse animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { box-shadow: 0 8px 30px rgba(138, 80, 255, 0.4); }
        50% { box-shadow: 0 8px 30px rgba(138, 80, 255, 0.6); }
    }
`;
document.head.appendChild(style);

// Performance: Lazy load if needed
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
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