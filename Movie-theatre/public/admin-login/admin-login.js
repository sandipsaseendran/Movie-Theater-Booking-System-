// Admin credentials (in production, this should be handled server-side)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'nandhan@123'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkRememberMe();
});

// Setup event listeners
function setupEventListeners() {
    // Login form submission
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Password toggle
    const togglePassword = document.getElementById('toggle-password');
    if (togglePassword) {
        togglePassword.addEventListener('click', togglePasswordVisibility);
    }
    
    // Forgot password
    const forgotPassword = document.getElementById('forgot-password');
    if (forgotPassword) {
        forgotPassword.addEventListener('click', (e) => {
            e.preventDefault();
            openResetModal();
        });
    }
    
    // Reset modal
    const modalClose = document.getElementById('modal-close');
    const resetOverlay = document.getElementById('reset-overlay');
    if (modalClose) modalClose.addEventListener('click', closeResetModal);
    if (resetOverlay) resetOverlay.addEventListener('click', closeResetModal);
    
    // Reset form
    const resetForm = document.getElementById('reset-form');
    if (resetForm) {
        resetForm.addEventListener('submit', handlePasswordReset);
    }
    
    // Clear error on input
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', clearError);
    });
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    // Show loading state
    const loginBtn = document.getElementById('login-btn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoader = loginBtn.querySelector('.btn-loader');
    
    loginBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'block';
    
    // Simulate authentication delay
    setTimeout(() => {
        // Validate credentials
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            // Success
            if (remember) {
                localStorage.setItem('adminRemember', 'true');
                localStorage.setItem('adminUsername', username);
            } else {
                localStorage.removeItem('adminRemember');
                localStorage.removeItem('adminUsername');
            }
            
            // Store session
            sessionStorage.setItem('adminLoggedIn', 'true');
            sessionStorage.setItem('adminUsername', username);
            
            // Show success and redirect
            showSuccess();
            
            setTimeout(() => {
                // Redirect to admin dashboard
                window.location.href = '../admin/admin.html';
            }, 1500);
        } else {
            // Failed
            showError('Invalid username or password');
            loginBtn.disabled = false;
            btnText.style.display = 'block';
            btnLoader.style.display = 'none';
        }
    }, 1500);
}

// Toggle password visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.querySelector('.eye-icon');
    const eyeOffIcon = document.querySelector('.eye-off-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.style.display = 'none';
        eyeOffIcon.style.display = 'block';
    } else {
        passwordInput.type = 'password';
        eyeIcon.style.display = 'block';
        eyeOffIcon.style.display = 'none';
    }
}

// Show error message
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    if (errorMessage && errorText) {
        errorText.textContent = message;
        errorMessage.style.display = 'flex';
        
        // Shake animation
        errorMessage.style.animation = 'none';
        setTimeout(() => {
            errorMessage.style.animation = 'shakeError 0.5s ease';
        }, 10);
    }
}

// Clear error message
function clearError() {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
}

// Show success message
function showSuccess() {
    const loginBtn = document.getElementById('login-btn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoader = loginBtn.querySelector('.btn-loader');
    
    btnLoader.style.display = 'none';
    btnText.textContent = '✓ Login Successful!';
    btnText.style.display = 'block';
    loginBtn.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
}

// Check remember me
function checkRememberMe() {
    const remember = localStorage.getItem('adminRemember');
    const savedUsername = localStorage.getItem('adminUsername');
    
    if (remember === 'true' && savedUsername) {
        document.getElementById('username').value = savedUsername;
        document.getElementById('remember').checked = true;
    }
}

// Open reset modal
function openResetModal() {
    const modal = document.getElementById('reset-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Close reset modal
function closeResetModal() {
    const modal = document.getElementById('reset-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Handle password reset
function handlePasswordReset(e) {
    e.preventDefault();
    
    const email = document.getElementById('reset-email').value;
    const resetBtn = e.target.querySelector('.reset-btn');
    
    resetBtn.disabled = true;
    resetBtn.textContent = 'Sending...';
    
    // Simulate sending email
    setTimeout(() => {
        resetBtn.textContent = '✓ Reset Link Sent!';
        resetBtn.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
        
        setTimeout(() => {
            closeResetModal();
            resetBtn.disabled = false;
            resetBtn.textContent = 'Send Reset Link';
            resetBtn.style.background = '';
            document.getElementById('reset-email').value = '';
        }, 2000);
    }, 1500);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape to close modal
    if (e.key === 'Escape') {
        closeResetModal();
    }
});

// Prevent multiple submissions
let isSubmitting = false;
document.getElementById('admin-login-form')?.addEventListener('submit', (e) => {
    if (isSubmitting) {
        e.preventDefault();
        return false;
    }
    isSubmitting = true;
    
    setTimeout(() => {
        isSubmitting = false;
    }, 2000);
});

// Add ripple effect to buttons
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        const existingRipple = this.querySelector('.ripple');
        if (existingRipple) {
            existingRipple.remove();
        }
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// Add ripple animation CSS
const style = document.createElement('style');
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Console message
console.log('%c🔐 Admin Portal - Nilambur Films', 'font-size: 20px; color: #8a50ff; font-weight: bold;');