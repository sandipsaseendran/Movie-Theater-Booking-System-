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

// Observe all cards and sections
document.querySelectorAll('.liquid-card, .value-card, .team-card, .award-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Animate stats counter
const animateCounter = (element, target, duration = 2000) => {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
};

// Trigger counter animation when stats are visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const stats = entry.target.querySelectorAll('.stat-item h3');
            stats.forEach(stat => {
                const text = stat.textContent;
                
                // Handle different stat formats
                if (text.includes('K')) {
                    const num = parseInt(text.replace('K+', ''));
                    stat.textContent = '0';
                    setTimeout(() => {
                        animateCounter(stat, num);
                        setTimeout(() => {
                            stat.textContent = num + 'K+';
                        }, 2000);
                    }, 300);
                } else if (!isNaN(text)) {
                    const num = parseInt(text);
                    stat.textContent = '0';
                    setTimeout(() => {
                        animateCounter(stat, num);
                    }, 300);
                }
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const storyStats = document.querySelector('.story-stats');
if (storyStats) {
    statsObserver.observe(storyStats);
}

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

// CTA buttons
const ctaButtons = document.querySelectorAll('.cta-btn');
ctaButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const btnText = e.target.textContent;
        if (btnText.includes('Book')) {
            alert('Redirecting to ticket booking... Feature coming soon!');
        } else if (btnText.includes('Schedule')) {
            alert('Viewing movie schedule... Feature coming soon!');
        }
    });
});

// Add hover effect to team cards
document.querySelectorAll('.team-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        const photo = this.querySelector('.team-photo');
        if (photo) {
            photo.style.transform = 'scale(1.1) rotate(5deg)';
            photo.style.transition = 'transform 0.3s ease';
        }
    });
    
    card.addEventListener('mouseleave', function() {
        const photo = this.querySelector('.team-photo');
        if (photo) {
            photo.style.transform = 'scale(1) rotate(0deg)';
        }
    });
});

// Add hover effect to award cards
document.querySelectorAll('.award-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.borderColor = 'rgba(138, 80, 255, 0.5)';
        this.style.boxShadow = '0 12px 40px rgba(138, 80, 255, 0.2)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        this.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
    });
});

// Parallax effect for images
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    
    document.querySelectorAll('.image-card img').forEach(img => {
        const rect = img.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            const speed = 0.3;
            const yPos = -(scrolled * speed);
            img.style.transform = `translateY(${yPos}px)`;
        }
    });
});

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

// Console welcome message
console.log('%c🎬 Nilambur Films - About Us', 'font-size: 20px; color: #8a50ff; font-weight: bold;');
console.log('%cDiscover our story, values, and commitment to excellence', 'font-size: 14px; color: #6a30dd;');

// Dynamic greeting based on time of day
const updateGreeting = () => {
    const hour = new Date().getHours();
    let greeting = 'Welcome to Nilambur Films';
    
    if (hour >= 5 && hour < 12) {
        greeting = 'Good Morning! Welcome to Nilambur Films';
    } else if (hour >= 12 && hour < 17) {
        greeting = 'Good Afternoon! Welcome to Nilambur Films';
    } else if (hour >= 17 && hour < 22) {
        greeting = 'Good Evening! Welcome to Nilambur Films';
    } else {
        greeting = 'Welcome to Nilambur Films';
    }
    
    console.log(`${greeting}`);
};

updateGreeting();

// Performance: Lazy load images
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

// Add stagger animation to grid items
const addStaggerAnimation = () => {
    const grids = [
        '.values-grid .value-card',
        '.team-grid .team-card',
        '.awards-grid .award-card'
    ];
    
    grids.forEach(selector => {
        document.querySelectorAll(selector).forEach((item, index) => {
            item.style.transitionDelay = `${index * 0.1}s`;
        });
    });
};

addStaggerAnimation();

// Smooth transitions for page load
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Add subtle parallax to hero section
const heroContent = document.querySelector('.hero-content');
if (heroContent) {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        if (scrolled < window.innerHeight) {
            heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
            heroContent.style.opacity = 1 - (scrolled / window.innerHeight) * 0.5;
        }
    });
}