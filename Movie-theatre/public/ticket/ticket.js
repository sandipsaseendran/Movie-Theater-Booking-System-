/**
 * TICKETS PAGE - Nilambur Films
 * Premium Liquid Glassmorphism Design
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const ticketsGrid = document.getElementById('ticketsGrid');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const loginRequired = document.getElementById('loginRequired');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const ticketModal = document.getElementById('ticketModal');
    const modalBody = document.getElementById('modalBody');
    
    let allBookings = [];
    let currentFilter = 'all';
    
    // Check user login status - Use localStorage.getItem('user')
    const userStr = localStorage.getItem('user');
    let user = null;
    
    if (userStr) {
        try {
            user = JSON.parse(userStr);
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
    
    if (!user || !user.id) {
        loadingState.style.display = 'none';
        loginRequired.style.display = 'block';
        return;
    }
    
    console.log('👤 User logged in:', user.name);
    
    // Fetch bookings
    fetchBookings(user.id);
    
    // Filter tabs functionality
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            displayBookings();
        });
    });
    
    async function fetchBookings(userId) {
        try {
            const response = await fetch(`../api/booking.php?action=get_bookings&user_id=${userId}`);
            const result = await response.json();
            
            loadingState.style.display = 'none';
            
            if (result.status === 'success' && result.data && result.data.length > 0) {
                allBookings = result.data;
                displayBookings();
            } else {
                emptyState.style.display = 'block';
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
        }
    }
    
    function displayBookings() {
        const now = new Date();
        
        let filtered = allBookings.filter(booking => {
            const showDate = new Date(booking.created_at);
            const isUpcoming = showDate > now;
            
            if (currentFilter === 'upcoming') return isUpcoming;
            if (currentFilter === 'past') return !isUpcoming;
            return true;
        });
        
        if (filtered.length === 0) {
            ticketsGrid.style.display = 'none';
            emptyState.style.display = 'block';
            emptyState.querySelector('p').textContent = 
                currentFilter === 'upcoming' ? 'No upcoming bookings' : 
                currentFilter === 'past' ? 'No past bookings' : 
                'No tickets yet';
            return;
        }
        
        emptyState.style.display = 'none';
        ticketsGrid.style.display = 'grid';
        
        ticketsGrid.innerHTML = filtered.map(booking => {
            const seats = Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats;
            const posterUrl = booking.poster_url ? `../${booking.poster_url}` : 'https://via.placeholder.com/110x165/1a1a2e/8a50ff?text=🎬';
            const bookingDate = new Date(booking.created_at);
            const formattedDate = bookingDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
            const formattedTime = bookingDate.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
            });
            
            // Generate QR Code URL
            const qrData = encodeURIComponent(`NILAMBUR|${booking.booking_id}|${booking.movie_title}`);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${qrData}&bgcolor=ffffff`;
            
            // Escape booking data for HTML attribute
            const bookingDataStr = encodeURIComponent(JSON.stringify(booking));
            
            return `
                <div class="ticket-card" data-booking-id="${booking.booking_id}">
                    <div class="ticket-top">
                        <div class="ticket-poster">
                            <img src="${posterUrl}" alt="${booking.movie_title}" onerror="this.src='https://via.placeholder.com/110x165/1a1a2e/8a50ff?text=🎬'">
                        </div>
                        <div class="ticket-main">
                            <div class="ticket-header">
                                <h3>${booking.movie_title}</h3>
                                <span class="ticket-status confirmed">✓ Confirmed</span>
                            </div>
                            <div class="ticket-details">
                                <div class="detail-row">
                                    <span class="icon">📍</span>
                                    <span>${booking.screen_name} (${booking.screen_type || 'Standard'})</span>
                                </div>
                                <div class="detail-row">
                                    <span class="icon">📅</span>
                                    <span>${formattedDate}, ${formattedTime}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="icon">💺</span>
                                    <span>Seats: ${seats}</span>
                                </div>
                                <div class="detail-row highlight">
                                    <span class="icon">💰</span>
                                    <span>₹${parseFloat(booking.total_amount).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="ticket-footer">
                        <div class="ticket-qr">
                            <div class="qr-image">
                                <img src="${qrUrl}" alt="QR Code">
                            </div>
                            <div class="qr-info">
                                <span class="booking-id">${booking.booking_id}</span>
                                <span class="qr-hint">Show at entrance</span>
                            </div>
                        </div>
                        <button class="view-btn" data-booking="${bookingDataStr}">
                            View Details
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click listeners to view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookingData = JSON.parse(decodeURIComponent(this.dataset.booking));
                showTicketDetails(bookingData);
            });
        });
    }
    
    function showTicketDetails(booking) {
        const seats = Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats;
        const posterUrl = booking.poster_url ? `../${booking.poster_url}` : 'https://via.placeholder.com/150x225/1a1a2e/8a50ff?text=🎬';
        const bookingDate = new Date(booking.created_at);
        const formattedDate = bookingDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
        });
        const formattedTime = bookingDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        });
        
        // Generate QR Code
        const qrData = encodeURIComponent(`NILAMBUR-FILMS|${booking.booking_id}|${booking.movie_title}|${seats}`);
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}&bgcolor=ffffff`;
        
        modalBody.innerHTML = `
            <div class="modal-ticket">
                <div class="modal-poster">
                    <img src="${posterUrl}" alt="${booking.movie_title}" onerror="this.src='https://via.placeholder.com/150x225/1a1a2e/8a50ff?text=🎬'">
                </div>
                <h2>${booking.movie_title}</h2>
                <p class="modal-meta">${booking.screen_name} • ${booking.screen_type || 'Standard'}</p>
                
                <div class="modal-qr">
                    <img src="${qrUrl}" alt="QR Code">
                </div>
                
                <div class="modal-booking-id">${booking.booking_id}</div>
                
                <div class="modal-details">
                    <div class="modal-detail-row">
                        <span class="label">Date & Time</span>
                        <span class="value">${formattedDate}<br>${formattedTime}</span>
                    </div>
                    <div class="modal-detail-row">
                        <span class="label">Seats</span>
                        <span class="value seats">${seats}</span>
                    </div>
                    <div class="modal-detail-row total-row">
                        <span class="label">Total Paid</span>
                        <span class="value amount">₹${parseFloat(booking.total_amount).toFixed(2)}</span>
                    </div>
                </div>
                
                <p class="modal-note">
                    🎬 Please arrive 15 minutes before showtime<br>
                    🎫 Show this QR code at the entrance
                </p>
            </div>
        `;
        
        ticketModal.classList.add('active');
    }
    
    window.closeModal = function() {
        ticketModal.classList.remove('active');
    };
    
    // Close modal when clicking overlay
    ticketModal.querySelector('.modal-overlay').addEventListener('click', closeModal);
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
});
