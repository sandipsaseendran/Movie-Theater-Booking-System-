/**
 * PROFILE PAGE - Nilambur Films
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '../user-login/login.html';
        return;
    }
    
    let user;
    try {
        user = JSON.parse(userStr);
    } catch (e) {
        console.error('Error parsing user data:', e);
        window.location.href = '../user-login/login.html';
        return;
    }
    
    // Load user profile
    loadUserProfile(user);
    loadUserStats(user);
    
    // Edit profile button
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            enableEditMode();
        });
    }
    
    // Change password button
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            alert('Password change feature coming soon!');
        });
    }
});

function loadUserProfile(user) {
    // Set avatar initials
    const initials = getInitials(user.name || 'User');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileInitials = document.getElementById('profileInitials');
    
    if (profileAvatar && profileInitials) {
        profileInitials.textContent = initials;
    }
    
    // Set user information
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');
    const accountStatus = document.getElementById('accountStatus');
    
    if (profileName) profileName.value = user.name || 'Not set';
    if (profileEmail) profileEmail.value = user.email || 'Not set';
    if (profilePhone) profilePhone.value = user.phone || 'Not set';
    
    if (accountStatus) {
        if (user.is_verified) {
            accountStatus.className = 'status-badge verified';
            accountStatus.innerHTML = '<span>✓ Verified</span>';
        } else {
            accountStatus.className = 'status-badge unverified';
            accountStatus.innerHTML = '<span>⚠ Not Verified</span>';
        }
    }
}

function loadUserStats(user) {
    // Fetch user bookings to calculate stats
    if (user.id) {
        fetch(`../api/booking.php?action=get_bookings&user_id=${user.id}`)
            .then(res => res.json())
            .then(result => {
                if (result.status === 'success' && result.data) {
                    const bookings = result.data;
                    const totalBookings = bookings.length;
                    const totalSpent = bookings.reduce((sum, booking) => {
                        return sum + parseFloat(booking.total_amount || 0);
                    }, 0);
                    
                    const totalBookingsEl = document.getElementById('totalBookings');
                    const totalSpentEl = document.getElementById('totalSpent');
                    
                    if (totalBookingsEl) totalBookingsEl.textContent = totalBookings;
                    if (totalSpentEl) totalSpentEl.textContent = `₹${totalSpent.toFixed(2)}`;
                }
            })
            .catch(err => {
                console.error('Error fetching bookings:', err);
            });
    }
    
    // Set member since date
    const memberSinceEl = document.getElementById('memberSince');
    if (memberSinceEl && user.created_at) {
        const date = new Date(user.created_at);
        memberSinceEl.textContent = date.toLocaleDateString('en-US', { 
            month: 'short', 
            year: 'numeric' 
        });
    } else if (memberSinceEl) {
        memberSinceEl.textContent = 'Recently';
    }
}

function enableEditMode() {
    const inputs = document.querySelectorAll('.profile-info input');
    const editBtn = document.getElementById('editProfileBtn');
    
    inputs.forEach(input => {
        input.removeAttribute('readonly');
        input.style.cursor = 'text';
        input.style.opacity = '1';
    });
    
    if (editBtn) {
        editBtn.textContent = 'Save Changes';
        editBtn.onclick = saveProfile;
    }
}

function saveProfile() {
    const name = document.getElementById('profileName').value;
    const phone = document.getElementById('profilePhone').value;
    
    // Update localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        user.name = name;
        user.phone = phone;
        localStorage.setItem('user', JSON.stringify(user));
    }
    
    // Show success message
    alert('Profile updated successfully!');
    
    // Disable edit mode
    const inputs = document.querySelectorAll('.profile-info input');
    const editBtn = document.getElementById('editProfileBtn');
    
    inputs.forEach(input => {
        input.setAttribute('readonly', 'readonly');
        input.style.cursor = 'not-allowed';
        input.style.opacity = '0.8';
    });
    
    if (editBtn) {
        editBtn.textContent = 'Edit Profile';
        editBtn.onclick = enableEditMode;
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


