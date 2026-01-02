/**
 * PAYMENTS PAGE - Nilambur Films
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
    
    // Load payment history
    loadPaymentHistory(user);
});

function loadPaymentHistory(user) {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const paymentsGrid = document.getElementById('paymentsGrid');
    
    // Fetch bookings (which contain payment info)
    if (user.id) {
        fetch(`../api/booking.php?action=get_bookings&user_id=${user.id}`)
            .then(res => res.json())
            .then(result => {
                loadingState.style.display = 'none';
                
                if (result.status === 'success' && result.data && result.data.length > 0) {
                    const bookings = result.data;
                    displayPayments(bookings);
                    updateStats(bookings);
                } else {
                    emptyState.style.display = 'block';
                }
            })
            .catch(err => {
                console.error('Error fetching payments:', err);
                loadingState.style.display = 'none';
                emptyState.style.display = 'block';
            });
    } else {
        // Try fetching by email
        if (user.email) {
            fetch(`../api/booking.php?action=get_by_email&email=${encodeURIComponent(user.email)}`)
                .then(res => res.json())
                .then(result => {
                    loadingState.style.display = 'none';
                    
                    if (result.status === 'success' && result.data && result.data.length > 0) {
                        const bookings = result.data;
                        displayPayments(bookings);
                        updateStats(bookings);
                    } else {
                        emptyState.style.display = 'block';
                    }
                })
                .catch(err => {
                    console.error('Error fetching payments:', err);
                    loadingState.style.display = 'none';
                    emptyState.style.display = 'block';
                });
        } else {
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
        }
    }
}

function displayPayments(bookings) {
    const paymentsGrid = document.getElementById('paymentsGrid');
    if (!paymentsGrid) return;
    
    paymentsGrid.innerHTML = bookings.map(booking => {
        const date = new Date(booking.created_at || booking.booking_date);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const time = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="payment-card liquid-card">
                <div class="payment-info">
                    <div class="payment-movie">${booking.movie_title || 'Movie'}</div>
                    <div class="payment-details">
                        <span>📅 ${formattedDate}</span>
                        <span>🕐 ${time}</span>
                        <span>🎬 ${booking.screen_name || 'Screen'}</span>
                        <span>💺 ${booking.num_seats || 0} seats</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 1.5rem;">
                    <div class="payment-amount">₹${parseFloat(booking.total_amount || 0).toFixed(2)}</div>
                    <div class="payment-status success">✓ Paid</div>
                </div>
            </div>
        `;
    }).join('');
}

function updateStats(bookings) {
    const totalAmount = bookings.reduce((sum, booking) => {
        return sum + parseFloat(booking.total_amount || 0);
    }, 0);
    
    const totalTransactions = bookings.length;
    const successfulPayments = bookings.filter(b => b.booking_status === 'confirmed').length;
    
    const totalAmountEl = document.getElementById('totalAmount');
    const totalTransactionsEl = document.getElementById('totalTransactions');
    const successfulPaymentsEl = document.getElementById('successfulPayments');
    
    if (totalAmountEl) totalAmountEl.textContent = `₹${totalAmount.toFixed(2)}`;
    if (totalTransactionsEl) totalTransactionsEl.textContent = totalTransactions;
    if (successfulPaymentsEl) successfulPaymentsEl.textContent = successfulPayments;
}


