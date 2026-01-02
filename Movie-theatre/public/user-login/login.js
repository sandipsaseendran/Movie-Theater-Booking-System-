/**
 * Nilambur Films - Login System v5
 */

console.log('🎬 Nilambur Films - Login System Ready');

// ============================================
// ELEMENTS
// ============================================
const loginCard = document.getElementById('loginCard');
const registerCard = document.getElementById('registerCard');
const otpCard = document.getElementById('otpCard');

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const otpForm = document.getElementById('otpForm');

const goToRegister = document.getElementById('goToRegister');
const goToLogin = document.getElementById('goToLogin');
const backBtn = document.getElementById('backBtn');
const resendBtn = document.getElementById('resendBtn');

// ============================================
// VARIABLES
// ============================================
let userEmail = '';
let userName = '';
let countdown = null;

// ============================================
// NAVIGATION
// ============================================
function showCard(card) {
    console.log('Showing card:', card.id);
    loginCard.classList.add('hidden');
    registerCard.classList.add('hidden');
    otpCard.classList.add('hidden');
    card.classList.remove('hidden');
}

goToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    showCard(registerCard);
});

goToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    showCard(loginCard);
});

backBtn.addEventListener('click', () => {
    showCard(registerCard);
});

// ============================================
// NOTIFICATION
// ============================================
function showNotification(message, type) {
    const notif = document.getElementById('notification');
    notif.textContent = message;
    notif.className = 'notification ' + type;
    notif.style.display = 'block';
    
    if (type !== 'loading') {
        setTimeout(() => {
            notif.style.display = 'none';
        }, 4000);
    }
}

function hideNotification() {
    document.getElementById('notification').style.display = 'none';
}

// ============================================
// LOGIN
// ============================================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Login form submitted');
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('Please fill all fields', 'error');
        return;
    }
    
    showNotification('Signing in...', 'loading');
    
    try {
        const response = await fetch('../api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const text = await response.text();
        console.log('Login response:', text);
        
        const data = JSON.parse(text);
        
        if (data.status === 'success') {
            showNotification('Login successful!', 'success');
            localStorage.setItem('user', JSON.stringify(data.user));
            setTimeout(() => {
                window.location.href = '../index.html?login=success';
            }, 1500);
        } else if (data.status === 'not_verified') {
            showNotification('Please verify your email first', 'error');
            userEmail = data.email;
            setTimeout(() => {
                sendOTP();
            }, 1500);
        } else {
            showNotification(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Connection error', 'error');
    }
});

// ============================================
// REGISTER
// ============================================
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('📝 Register form submitted');
    
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const agree = document.getElementById('agreeTerms').checked;
    
    console.log('Form data:', { name, email, phone, passwordLength: password.length, agree });
    
    // Validation
    if (!name || !email || !phone || !password || !confirmPassword) {
        showNotification('Please fill all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (!agree) {
        showNotification('Please agree to Terms & Conditions', 'error');
        return;
    }
    
    showNotification('Creating account...', 'loading');
    
    try {
        console.log('📤 Sending registration request...');
        const response = await fetch('../api/register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password })
        });
        
        const text = await response.text();
        console.log('📥 Register response:', text);
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('JSON parse error:', e);
            showNotification('Server error', 'error');
            return;
        }
        
        console.log('📊 Parsed data:', data);
        
        if (data.status === 'otp_sent') {
            console.log('✅ OTP SENT! Showing OTP card...');
            
            userEmail = email;
            userName = name;
            
            // Update email display
            document.getElementById('displayEmail').textContent = email;
            
            // SHOW OTP CARD
            console.log('🔄 Switching to OTP card...');
            showCard(otpCard);
            
            // Start timer
            startTimer();
            
            // Focus first input
            const firstBox = document.querySelector('.otp-box');
            if (firstBox) firstBox.focus();
            
            hideNotification();
            showNotification('✅ Verification code sent to your email!', 'success');
            
            console.log('✅ OTP card should now be visible!');
        } else {
            console.log('❌ Registration failed:', data.message);
            showNotification(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('❌ Register error:', error);
        showNotification('Connection error', 'error');
    }
});

// ============================================
// OTP INPUTS
// ============================================
const otpBoxes = document.querySelectorAll('.otp-box');
console.log('OTP boxes found:', otpBoxes.length);

otpBoxes.forEach((box, index) => {
    box.addEventListener('input', (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = value;
        
        if (value && index < otpBoxes.length - 1) {
            otpBoxes[index + 1].focus();
        }
    });
    
    box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !box.value && index > 0) {
            otpBoxes[index - 1].focus();
        }
    });
    
    box.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
        pasted.split('').forEach((char, i) => {
            if (otpBoxes[i]) otpBoxes[i].value = char;
        });
    });
});

function getOTPValue() {
    return Array.from(otpBoxes).map(box => box.value).join('');
}

function clearOTPBoxes() {
    otpBoxes.forEach(box => box.value = '');
    if (otpBoxes[0]) otpBoxes[0].focus();
}

// ============================================
// OTP VERIFICATION
// ============================================
otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('OTP form submitted');
    
    const otp = getOTPValue();
    console.log('OTP entered:', otp);
    
    if (otp.length !== 6) {
        showNotification('Please enter all 6 digits', 'error');
        return;
    }
    
    showNotification('Verifying...', 'loading');
    
    try {
        const response = await fetch('../api/verify_otp.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, otp: otp })
        });
        
        const text = await response.text();
        console.log('Verify response:', text);
        
        const data = JSON.parse(text);
        
        if (data.status === 'success') {
            showNotification('🎉 Email verified successfully!', 'success');
            localStorage.setItem('user', JSON.stringify(data.user));
            setTimeout(() => {
                window.location.href = '../index.html?verified=success';
            }, 1500);
        } else {
            showNotification(data.message || 'Invalid code', 'error');
        }
    } catch (error) {
        console.error('Verify error:', error);
        showNotification('Connection error', 'error');
    }
});

// ============================================
// TIMER
// ============================================
function startTimer() {
    let time = 60;
    const timerText = document.getElementById('timerText');
    const resendBtnEl = document.getElementById('resendBtn');
    const timerEl = document.getElementById('timer');
    
    if (timerText) timerText.style.display = 'block';
    if (resendBtnEl) resendBtnEl.style.display = 'none';
    if (timerEl) timerEl.textContent = time;
    
    clearInterval(countdown);
    
    countdown = setInterval(() => {
        time--;
        if (timerEl) timerEl.textContent = time;
        
        if (time <= 0) {
            clearInterval(countdown);
            if (timerText) timerText.style.display = 'none';
            if (resendBtnEl) resendBtnEl.style.display = 'inline-block';
        }
    }, 1000);
}

// ============================================
// RESEND OTP
// ============================================
if (resendBtn) {
    resendBtn.addEventListener('click', () => {
        sendOTP();
    });
}

async function sendOTP() {
    showNotification('Sending new code...', 'loading');
    
    try {
        const response = await fetch('../api/send_otp.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, name: userName })
        });
        
        const text = await response.text();
        console.log('Send OTP response:', text);
        
        const data = JSON.parse(text);
        
        if (data.status === 'success') {
            document.getElementById('displayEmail').textContent = userEmail;
            showCard(otpCard);
            clearOTPBoxes();
            startTimer();
            showNotification('New code sent!', 'success');
        } else {
            showNotification(data.message || 'Failed to send', 'error');
        }
    } catch (error) {
        console.error('Send OTP error:', error);
        showNotification('Connection error', 'error');
    }
}

console.log('✅ All event listeners attached!');
