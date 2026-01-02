// ========================================
// SHARED MOBILE MENU FUNCTIONALITY
// ========================================
function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    
    if (!mobileMenuToggle || !mobileMenu || !mobileMenuOverlay) {
        console.warn('Mobile menu elements not found');
        return;
    }
    
    function openMenu() {
        mobileMenu.classList.add('active');
        mobileMenuOverlay.classList.add('active');
        mobileMenuToggle.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeMenu() {
        mobileMenu.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    function toggleMenu() {
        if (mobileMenu.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    }
    
    // Toggle menu on hamburger click
    mobileMenuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });
    
    // Close menu on overlay click (but not on menu itself)
    mobileMenuOverlay.addEventListener('click', (e) => {
        // Only close if clicking the overlay itself, not the menu
        if (e.target === mobileMenuOverlay) {
            closeMenu();
        }
    });
    
    // Handle menu link clicks - allow navigation
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (!href || href === '#') {
                e.preventDefault();
                return false;
            }
            
            // Stop propagation to prevent overlay from catching the click
            e.stopPropagation();
            
            // For external links (not starting with #), allow normal navigation
            if (!href.startsWith('#')) {
                // Close menu immediately
                closeMenu();
                // Allow browser to navigate normally - don't prevent default
                // Navigation will happen automatically
                return true;
            }
            
            // For hash links (same page anchors), handle scrolling
            if (href.startsWith('#')) {
                e.preventDefault();
                
                const targetId = href.substring(1);
                
                // Close menu first
                closeMenu();
                
                // Wait for menu animation, then scroll
                setTimeout(() => {
                    if (!targetId || targetId === 'home') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                        const targetElement = document.getElementById(targetId);
                        if (targetElement) {
                            targetElement.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'start' 
                            });
                        } else {
                            // Fallback: scroll to top if element not found
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }
                }, 350);
                
                return false;
            }
        }, { capture: false });
    });
    
    // Prevent menu clicks from bubbling to overlay
    mobileMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            closeMenu();
        }
    });
    
    // Prevent body scroll when menu is open
    let touchStartY = 0;
    mobileMenu.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    mobileMenu.addEventListener('touchmove', (e) => {
        const touchY = e.touches[0].clientY;
        const menuScrollTop = mobileMenu.scrollTop;
        const menuHeight = mobileMenu.offsetHeight;
        const menuScrollHeight = mobileMenu.scrollHeight;
        
        // Allow scrolling if menu is scrollable
        if (menuScrollHeight > menuHeight) {
            if ((menuScrollTop === 0 && touchY > touchStartY) || 
                (menuScrollTop + menuHeight >= menuScrollHeight && touchY < touchStartY)) {
                e.preventDefault();
            }
        }
    }, { passive: false });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
} else {
    initMobileMenu();
}
