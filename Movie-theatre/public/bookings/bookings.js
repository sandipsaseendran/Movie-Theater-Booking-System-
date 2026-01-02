/**
 * BOOKINGS PAGE - Nilambur Films
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
    
    // Load bookings
    loadBookings(user);
});

function loadBookings(user) {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const bookingsGrid = document.getElementById('bookingsGrid');
    
    // Fetch bookings by user ID
    if (user.id) {
        fetch(`../api/booking.php?action=get_bookings&user_id=${user.id}`)
            .then(res => res.json())
            .then(result => {
                loadingState.style.display = 'none';
                
                if (result.status === 'success' && result.data && result.data.length > 0) {
                    displayBookings(result.data);
                } else {
                    emptyState.style.display = 'block';
                }
            })
            .catch(err => {
                console.error('Error fetching bookings:', err);
                loadingState.style.display = 'none';
                emptyState.style.display = 'block';
            });
    } else if (user.email) {
        // Try fetching by email
        fetch(`../api/booking.php?action=get_by_email&email=${encodeURIComponent(user.email)}`)
            .then(res => res.json())
            .then(result => {
                loadingState.style.display = 'none';
                
                if (result.status === 'success' && result.data && result.data.length > 0) {
                    displayBookings(result.data);
                } else {
                    emptyState.style.display = 'block';
                }
            })
            .catch(err => {
                console.error('Error fetching bookings:', err);
                loadingState.style.display = 'none';
                emptyState.style.display = 'block';
            });
    } else {
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
    }
}

function displayBookings(bookings) {
    const bookingsGrid = document.getElementById('bookingsGrid');
    if (!bookingsGrid) return;
    
    bookingsGrid.innerHTML = bookings.map(booking => {
        const date = new Date(booking.show_date || booking.booking_date);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const showTime = booking.show_time || 'N/A';
        const seats = booking.seats ? (Array.isArray(booking.seats) ? booking.seats : JSON.parse(booking.seats)) : [];
        
        // Fix poster URL path - ensure it's relative to public folder
        let posterUrl = booking.poster_url || '../asset/images/hero.jpg';
        if (posterUrl && !posterUrl.startsWith('http://') && !posterUrl.startsWith('https://') && !posterUrl.startsWith('/')) {
            // If it's a relative path without ../, add it
            if (posterUrl.startsWith('asset/')) {
                posterUrl = '../' + posterUrl;
            } else if (!posterUrl.startsWith('../')) {
                posterUrl = '../' + posterUrl;
            }
        }
        
        return `
            <div class="booking-card liquid-card">
                <div class="booking-header">
                    <div class="booking-movie">
                        <h3>${booking.movie_title || 'Movie'}</h3>
                        <p>${booking.genre || ''} • ${booking.duration || ''} min</p>
                    </div>
                    <img src="${posterUrl}" alt="${booking.movie_title}" class="booking-poster" onerror="this.src='../asset/images/hero.jpg'">
                </div>
                
                <div class="booking-details">
                    <div class="detail-item">
                        <span class="detail-label">📅 Show Date</span>
                        <span class="detail-value">${formattedDate}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🕐 Show Time</span>
                        <span class="detail-value">${showTime}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🎬 Screen</span>
                        <span class="detail-value">${booking.screen_name || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">💺 Seats</span>
                        <div class="booking-seats">
                            ${seats.length > 0 ? seats.map(seat => 
                                `<span class="seat-badge">${seat}</span>`
                            ).join('') : `<span class="detail-value">${booking.num_seats || 0} seats</span>`}
                        </div>
                    </div>
                </div>
                
                <div class="booking-footer">
                    <div>
                        <div class="detail-label" style="margin-bottom: 0.5rem;">Total Amount</div>
                        <div class="booking-amount">₹${parseFloat(booking.total_amount || 0).toFixed(2)}</div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 1rem;">
                        <div class="booking-status confirmed">✓ Confirmed</div>
                        <div class="booking-actions">
                            <a href="../ticket/ticket.html" class="btn btn-primary">View Ticket</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}


