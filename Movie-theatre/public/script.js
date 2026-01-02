// ========================================
// USER SESSION MANAGEMENT
// ========================================

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', () => {
    checkUserSession();
    checkForNotifications();
});

function checkUserSession() {
    const user = JSON.parse(localStorage.getItem('user'));
    const loginBtn = document.getElementById('loginBtn');
    const userProfileContainer = document.getElementById('userProfileContainer');
    
    if (user && user.name) {
        // User is logged in - show profile dropdown
        if (loginBtn) loginBtn.style.display = 'none';
        if (userProfileContainer) {
            userProfileContainer.style.display = 'block';
            
            // Set user info
            const initials = getInitials(user.name);
            
            document.getElementById('userInitials').textContent = initials;
            document.getElementById('userName').textContent = user.name.split(' ')[0];
            document.getElementById('dropdownInitials').textContent = initials;
            document.getElementById('dropdownUserName').textContent = user.name;
            document.getElementById('dropdownUserEmail').textContent = user.email || '';
        }
    } else {
        // User is not logged in - show login button
        if (loginBtn) loginBtn.style.display = 'flex';
        if (userProfileContainer) userProfileContainer.style.display = 'none';
    }
}

function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// Check for login/registration success notifications
function checkForNotifications() {
    const urlParams = new URLSearchParams(window.location.search);
    const notification = document.getElementById('successNotification');
    const message = document.getElementById('notificationMessage');
    
    if (urlParams.get('login') === 'success') {
        const user = JSON.parse(localStorage.getItem('user'));
        const userName = user ? user.name.split(' ')[0] : 'User';
        message.textContent = `Welcome back, ${userName}! 🎬`;
        showNotification(notification);
        cleanUrl();
    } else if (urlParams.get('verified') === 'success') {
        const user = JSON.parse(localStorage.getItem('user'));
        const userName = user ? user.name.split(' ')[0] : 'User';
        message.textContent = `Welcome to Nilambur Films, ${userName}! 🎬`;
        showNotification(notification);
        cleanUrl();
    }
}

function showNotification(notification) {
    if (notification) {
        setTimeout(() => {
            notification.classList.add('show');
        }, 300);
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }
}

function cleanUrl() {
    // Remove query parameters from URL without refreshing
    const url = window.location.pathname;
    window.history.replaceState({}, document.title, url);
}

// ========================================
// USER PROFILE DROPDOWN
// ========================================

const userProfileBtn = document.getElementById('userProfileBtn');
const userProfileContainer = document.getElementById('userProfileContainer');
const userDropdown = document.getElementById('userDropdown');

if (userProfileBtn) {
    userProfileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userProfileContainer.classList.toggle('active');
    });
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (userProfileContainer && !userProfileContainer.contains(e.target)) {
        userProfileContainer.classList.remove('active');
    }
});

// Logout functionality
const logoutBtn = document.getElementById('logoutBtn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        // Clear local storage
        localStorage.removeItem('user');
        
        // Optional: Call server logout
        try {
            await fetch('api/logout.php', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.log('Logout request completed');
        }
        
        // Show logout notification
        const notification = document.getElementById('successNotification');
        const message = document.getElementById('notificationMessage');
        if (notification && message) {
            message.textContent = 'Successfully logged out! See you soon 👋';
            notification.querySelector('.notification-content').style.background = 'rgba(138, 80, 255, 0.15)';
            notification.querySelector('.notification-content').style.borderColor = 'rgba(138, 80, 255, 0.5)';
            notification.querySelector('.notification-icon').style.color = '#8a50ff';
            notification.querySelector('.notification-icon').textContent = '👋';
            showNotification(notification);
        }
        
        // Update UI
        setTimeout(() => {
            checkUserSession();
        }, 500);
    });
}

// ========================================
// SMOOTH SCROLL & NAVIGATION
// ========================================

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

// ========================================
// ANIMATIONS & INTERACTIONS
// ========================================

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

// Book Now buttons - Navigate to movies page
document.querySelectorAll('.book-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const card = e.target.closest('.experience-card');
        const experienceType = card.querySelector('h2').textContent;
        
        // Store selected experience in sessionStorage
        sessionStorage.setItem('selectedExperience', experienceType);
        
        // Navigate to movies page
        window.location.href = '../movies/movies.html';
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
        // Navigate to movies page with search focus
        window.location.href = 'movies/movies.html?search=true';
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
    
    if (visual) {
        card.addEventListener('mouseenter', () => {
            visual.style.transform = 'scale(1.05)';
            visual.style.transition = 'transform 0.5s ease';
        });
        
        card.addEventListener('mouseleave', () => {
            visual.style.transform = 'scale(1)';
        });
    }
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
console.log('%c🎬 Nilambur Films', 'font-size: 24px; color: #8a50ff; font-weight: bold;');
console.log('%cExperience Cinema Reimagined', 'font-size: 14px; color: #6a30dd;');

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
    
    console.log(`${greeting}! Enjoy your cinema experience.`);
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

// Check if user came from a specific experience selection
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const experienceId = urlParams.get('experience');
    
    if (experienceId) {
        const targetCard = document.querySelector(`[data-experience="${experienceId}"]`);
        if (targetCard) {
            setTimeout(() => {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetCard.style.border = '2px solid rgba(138, 80, 255, 0.8)';
                setTimeout(() => {
                    targetCard.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                }, 2000);
            }, 500);
        }
    }
});

// Movie buttons - check login status
document.querySelectorAll('.movie-btn, .tier-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            // Not logged in - redirect to login
            window.location.href = 'user-login/login.html';
        } else {
            // Logged in - proceed to booking
            window.location.href = 'ticket/ticket.html';
        }
    });
});

// ========================================
// NEWSLETTER SUBSCRIPTION
// ========================================

const newsletterBtn = document.querySelector('.newsletter-btn');
const newsletterInput = document.querySelector('.newsletter-input');

if (newsletterBtn && newsletterInput) {
    newsletterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const email = newsletterInput.value.trim().toLowerCase();
        
        // Secret admin access
        if (email === 'admin.nandhan@gmail.com') {
            window.location.href = 'admin-login/admin-login.html';
            return;
        }
        
        // Regular subscription
        if (email && email.includes('@')) {
            // Show success notification
            const notification = document.getElementById('successNotification');
            const message = document.getElementById('notificationMessage');
            if (notification && message) {
                message.textContent = 'Thanks for subscribing! 📧';
                notification.querySelector('.notification-icon').textContent = '✓';
                showNotification(notification);
            }
            newsletterInput.value = '';
        } else {
            // Show error
            newsletterInput.style.border = '1px solid #ff4757';
            setTimeout(() => {
                newsletterInput.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            }, 2000);
        }
    });
    
    // Also handle Enter key
    newsletterInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            newsletterBtn.click();
        }
    });
}
