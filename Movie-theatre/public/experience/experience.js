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

// Observe all experience cards
document.querySelectorAll('.experience-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Book Now buttons
document.querySelectorAll('.book-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const card = e.target.closest('.experience-card');
        const experienceType = card.querySelector('h2').textContent;
        const price = card.querySelector('.price').textContent;
        
        alert(`Booking ${experienceType} at ${price}. Our booking system will be available soon!`);
    });
});

// Add liquid effect on mouse move
document.querySelectorAll('.liquid-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        card.style.setProperty('--mouse-x', `${x}%`);
        card.style.setProperty('--mouse-y', `${y}%`);
    });
});

// Comparison table scroll indicator
const tableWrapper = document.querySelector('.comparison-table-wrapper');
if (tableWrapper) {
    let isScrolling = false;
    
    tableWrapper.addEventListener('scroll', () => {
        if (!isScrolling) {
            tableWrapper.style.boxShadow = '0 0 40px rgba(138, 80, 255, 0.2)';
            isScrolling = true;
            
            setTimeout(() => {
                tableWrapper.style.boxShadow = 'none';
                isScrolling = false;
            }, 1000);
        }
    });
}

// Search button functionality
const searchBtn = document.querySelector('.search-btn');
if (searchBtn) {
    searchBtn.addEventListener('click', () => {
        const query = prompt('Search for experiences:');
        if (query) {
            alert(`Searching for: "${query}". Search feature coming soon!`);
        }
    });
}

// Highlight active nav item based on scroll
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

// Add hover animations to experience cards
document.querySelectorAll('.experience-card').forEach(card => {
    const visual = card.querySelector('.experience-visual');
    
    card.addEventListener('mouseenter', () => {
        visual.style.transform = 'scale(1.05)';
        visual.style.transition = 'transform 0.5s ease';
    });
    
    card.addEventListener('mouseleave', () => {
        visual.style.transform = 'scale(1)';
    });
});

// Animate pricing on scroll
const priceObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const price = entry.target;
            price.style.animation = 'priceGlow 2s ease-in-out infinite';
            priceObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.price').forEach(price => {
    priceObserver.observe(price);
});

// Add CSS animation for price glow
const style = document.createElement('style');
style.textContent = `
    @keyframes priceGlow {
        0%, 100% {
            filter: drop-shadow(0 0 5px rgba(138, 80, 255, 0.5));
        }
        50% {
            filter: drop-shadow(0 0 15px rgba(138, 80, 255, 0.8));
        }
    }
`;
document.head.appendChild(style);

// Console welcome message
console.log('%c🎬 Nilambur Films - Experiences Page', 'font-size: 20px; color: #8a50ff; font-weight: bold;');
console.log('%cExplore our premium cinema experiences', 'font-size: 14px; color: #6a30dd;');

// Performance: Lazy load images if any are added
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

// Add parallax effect to hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    
    if (hero && scrolled < window.innerHeight) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Dynamic greeting based on time of day
const updateGreeting = () => {
    const hour = new Date().getHours();
    let greeting = 'Welcome';
    
    if (hour >= 5 && hour < 12) {
        greeting = 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
        greeting = 'Good Afternoon';
    } else if (hour >= 17 && hour < 22) {
        greeting = 'Good Evening';
    } else {
        greeting = 'Late Night Cinema';
    }
    
    console.log(`${greeting}! Choose your perfect experience.`);
};

updateGreeting();

// Add subtle animation to feature items
document.querySelectorAll('.feature-item').forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateX(-20px)';
    item.style.transition = `all 0.5s ease ${index * 0.1}s`;
    
    const featureObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateX(0)';
                featureObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    
    featureObserver.observe(item);
});