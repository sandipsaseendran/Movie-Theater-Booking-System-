// ========================================
// BOOKING PAGE - REAL THEATRE SYSTEM
// ========================================

const API_BASE = '../api';

// Booking State
let bookingState = {
    movieId: null,
    movie: null,
    showtimeId: null,
    showtime: null,
    screenId: null,
    screen: null,
    selectedDate: null,
    selectedTime: null,
    seatsNeeded: 2,
    selectedSeats: [],
    baseAmount: 0,
    gstAmount: 0,
    totalAmount: 0,
    bookingId: null,
    orderId: null,
    availableScreens: [],
    availableShowtimes: [],
    seatPollInterval: null, // For real-time polling
    lockedSeats: [] // Currently locked seats
};

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
        alert('Please login to book tickets');
        window.location.href = '../user-login/login.html?redirect=booking';
        return;
    }
    
    // Get movie ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    bookingState.movieId = urlParams.get('movie_id');
    
    if (!bookingState.movieId) {
        alert('No movie selected');
        window.location.href = '../movies/movies.html';
        return;
    }
    
    // Initialize
    loadMovieDetails();
    loadMovieShowtimes();
    setupEventListeners();
    
    console.log('%c🎬 Booking System Loaded', 'font-size: 16px; color: #8a50ff;');
});

// ========================================
// LOAD DATA
// ========================================

async function loadMovieDetails() {
    try {
        const response = await fetch(`${API_BASE}/movies.php`);
        const result = await response.json();
        
        if (result.status === 'success') {
            const movie = result.data.find(m => m.id == bookingState.movieId);
            if (movie) {
                bookingState.movie = movie;
                displayMovieInfo(movie);
            } else {
                alert('Movie not found');
                window.location.href = '../movies/movies.html';
            }
        }
    } catch (error) {
        console.error('Error loading movie:', error);
    }
}

function displayMovieInfo(movie) {
    let posterUrl = movie.poster_url || '';
    if (posterUrl && !posterUrl.startsWith('http') && !posterUrl.startsWith('data:')) {
        posterUrl = '../' + posterUrl;
    }
    if (!posterUrl) {
        posterUrl = 'https://placehold.co/150x225/1a1a2e/8a50ff?text=🎬';
    }
    
    document.getElementById('moviePoster').style.backgroundImage = `url('${posterUrl}')`;
    document.getElementById('movieTitle').textContent = movie.title;
    document.getElementById('movieMeta').textContent = `${movie.genre} • ${movie.duration} • ${movie.certificate || 'UA'}`;
    document.getElementById('movieRating').innerHTML = `⭐ ${movie.rating || '4.5'} Rating`;
}

async function loadMovieShowtimes() {
    const screensGrid = document.getElementById('screensGrid');
    const datesContainer = document.getElementById('datesContainer');
    const timesContainer = document.getElementById('timesContainer');
    
    screensGrid.innerHTML = '<p class="loading">Loading available shows...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/showtimes.php?action=get_by_movie&movie_id=${bookingState.movieId}`);
        const result = await response.json();
        
        if (result.status === 'success' && result.screens.length > 0) {
            bookingState.availableScreens = result.screens;
            bookingState.availableShowtimes = result.raw_showtimes;
            
            // Display available screens
            screensGrid.innerHTML = result.screens.map((screen, index) => `
                <div class="screen-card ${index === 0 ? 'selected' : ''}" data-screen-id="${screen.id}">
                    <h3>${screen.name}</h3>
                    <span class="screen-type">${screen.screen_type}</span>
                    <p class="screen-seats">${screen.total_seats} seats</p>
                </div>
            `).join('');
            
            // Select first screen
            bookingState.screenId = result.screens[0].id;
            bookingState.screen = result.screens[0];
            
            // Add click listeners to screens
            screensGrid.querySelectorAll('.screen-card').forEach(card => {
                card.addEventListener('click', () => {
                    screensGrid.querySelectorAll('.screen-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    bookingState.screenId = card.dataset.screenId;
                    bookingState.screen = result.screens.find(s => s.id == card.dataset.screenId);
                    updateAvailableDates();
                });
            });
            
            // Show dates for first screen
            updateAvailableDates();
            
        } else {
            screensGrid.innerHTML = `
                <div class="no-shows-message">
                    <p>😕 No showtimes available for this movie</p>
                    <p class="hint">Please check back later or choose another movie</p>
                    <a href="../movies/movies.html" class="glass-btn">Browse Movies</a>
                </div>
            `;
            document.getElementById('proceedToSeats').disabled = true;
        }
    } catch (error) {
        console.error('Error loading showtimes:', error);
        screensGrid.innerHTML = '<p class="error">Failed to load showtimes</p>';
    }
}

function updateAvailableDates() {
    const datesContainer = document.getElementById('datesContainer');
    const timesContainer = document.getElementById('timesContainer');
    
    // Filter showtimes for selected screen
    const screenShowtimes = bookingState.availableShowtimes.filter(
        st => st.screen_id == bookingState.screenId
    );
    
    // Get unique dates
    const dates = [...new Set(screenShowtimes.map(st => st.show_date))].sort();
    
    if (dates.length === 0) {
        datesContainer.innerHTML = '<p class="no-dates">No dates available for this screen</p>';
        timesContainer.innerHTML = '';
        return;
    }
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    datesContainer.innerHTML = dates.map((dateStr, index) => {
        const date = new Date(dateStr);
        let dayName = days[date.getDay()];
        if (dateStr === today) dayName = 'Today';
        else if (dateStr === tomorrow) dayName = 'Tomorrow';
        
        return `
            <button class="date-btn ${index === 0 ? 'selected' : ''}" data-date="${dateStr}">
                <div class="day">${dayName}</div>
                <div class="date">${date.getDate()}</div>
                <div class="month">${date.toLocaleString('default', { month: 'short' })}</div>
            </button>
        `;
    }).join('');
    
    // Select first date
    bookingState.selectedDate = dates[0];
    
    // Add click listeners to dates
    datesContainer.querySelectorAll('.date-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            datesContainer.querySelectorAll('.date-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            bookingState.selectedDate = btn.dataset.date;
            updateAvailableTimes();
        });
    });
    
    // Show times for first date
    updateAvailableTimes();
}

function updateAvailableTimes() {
    const timesContainer = document.getElementById('timesContainer');
    
    // Filter showtimes for selected screen and date
    const availableTimes = bookingState.availableShowtimes.filter(
        st => st.screen_id == bookingState.screenId && st.show_date === bookingState.selectedDate
    );
    
    if (availableTimes.length === 0) {
        timesContainer.innerHTML = '<p class="no-times">No shows available</p>';
        return;
    }
    
    timesContainer.innerHTML = availableTimes.map((st, index) => `
        <button class="time-btn ${index === 0 ? 'active' : ''}" 
                data-showtime-id="${st.id}" 
                data-time="${st.show_time}"
                data-standard="${st.price_standard}"
                data-premium="${st.price_premium}">
            ${formatTime12(st.show_time)}
            <span class="price-hint">₹${st.price_standard}</span>
        </button>
    `).join('');
    
    // Select first time
    const firstShow = availableTimes[0];
    bookingState.showtimeId = firstShow.id;
    bookingState.showtime = firstShow;
    bookingState.selectedTime = firstShow.show_time;
    
    // Add click listeners to times
    timesContainer.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            timesContainer.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            bookingState.showtimeId = btn.dataset.showtimeId;
            bookingState.selectedTime = btn.dataset.time;
            bookingState.showtime = availableTimes.find(st => st.id == btn.dataset.showtimeId);
        });
    });
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Seats counter
    document.getElementById('decreaseSeats').addEventListener('click', () => {
        if (bookingState.seatsNeeded > 1) {
            bookingState.seatsNeeded--;
            document.getElementById('seatsCount').textContent = bookingState.seatsNeeded;
        }
    });
    
    document.getElementById('increaseSeats').addEventListener('click', () => {
        if (bookingState.seatsNeeded < 10) {
            bookingState.seatsNeeded++;
            document.getElementById('seatsCount').textContent = bookingState.seatsNeeded;
        }
    });
    
    // Proceed to seat selection
    document.getElementById('proceedToSeats').addEventListener('click', () => {
        if (!bookingState.showtimeId) {
            alert('Please select a showtime');
            return;
        }
        showStep(2);
        loadSeatLayout();
    });
    
    // Back buttons
    document.getElementById('backToStep1').addEventListener('click', () => showStep(1));
    document.getElementById('backToStep2').addEventListener('click', () => showStep(2));
    
    // Proceed to payment
    document.getElementById('proceedToPayment').addEventListener('click', () => {
        if (bookingState.selectedSeats.length !== bookingState.seatsNeeded) {
            alert(`Please select ${bookingState.seatsNeeded} seats`);
            return;
        }
        showStep(3);
        updatePaymentSummary();
    });
    
    // Pay button
    document.getElementById('payNowBtn').addEventListener('click', initiatePayment);
    
    // Liquid card effect
    document.addEventListener('mousemove', (e) => {
        document.querySelectorAll('.liquid-card').forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mouse-x', `${x}%`);
            card.style.setProperty('--mouse-y', `${y}%`);
        });
    });
}

// ========================================
// STEP NAVIGATION
// ========================================

function showStep(step) {
    document.querySelectorAll('.booking-step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step${step}`).classList.add('active');
    window.scrollTo(0, 0);
    
    if (step === 2) {
        document.getElementById('selectedScreenName').textContent = bookingState.screen?.name || 'Screen';
        const dateObj = new Date(bookingState.selectedDate);
        const timeStr = formatTime12(bookingState.selectedTime);
        document.getElementById('selectedDateTime').textContent = `${dateObj.toDateString()}, ${timeStr}`;
    }
}

function formatTime12(time) {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
}

// ========================================
// SEAT LAYOUT
// ========================================

async function loadSeatLayout() {
    const container = document.getElementById('seatLayout');
    container.innerHTML = '<p>Loading seats...</p>';
    
    // Stop any existing polling
    if (bookingState.seatPollInterval) {
        clearInterval(bookingState.seatPollInterval);
        bookingState.seatPollInterval = null;
    }
    
    // Get screen details
    const screen = bookingState.screen;
    const rows = parseInt(screen?.rows_count) || 10;
    const seatsPerRow = parseInt(screen?.seats_per_row) || 20;
    
    // Get booked and locked seats - FIXED: Use showtime_id
    let bookedSeats = [];
    let lockedSeats = [];
    try {
        const response = await fetch(`${API_BASE}/booking.php?action=get_seats&screen_id=${bookingState.screenId}&showtime_id=${bookingState.showtimeId}`);
        const result = await response.json();
        if (result.status === 'success') {
            bookedSeats = result.booked_seats || [];
            lockedSeats = result.locked_seats || [];
            bookingState.lockedSeats = lockedSeats;
        }
    } catch (error) {
        console.error('Error loading booked seats:', error);
    }
    
    generateSeatLayout(rows, seatsPerRow, bookedSeats, lockedSeats);
    
    // Start real-time polling for seat updates
    startSeatPolling();
}

// NEW: Real-time polling for seat status
function startSeatPolling() {
    if (!bookingState.showtimeId) return;
    
    // Poll every 3 seconds
    bookingState.seatPollInterval = setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE}/booking.php?action=get_seat_status&showtime_id=${bookingState.showtimeId}`);
            const result = await response.json();
            
            if (result.status === 'success') {
                const newBookedSeats = result.booked_seats || [];
                const newLockedSeats = result.locked_seats || [];
                
                // Update seat layout if changes detected
                updateSeatStatus(newBookedSeats, newLockedSeats);
                bookingState.lockedSeats = newLockedSeats.map(l => l.seat_id);
            }
        } catch (error) {
            console.error('Error polling seat status:', error);
        }
    }, 3000); // Poll every 3 seconds
}

// NEW: Update seat status without reloading entire layout
function updateSeatStatus(bookedSeats, lockedSeats) {
    const container = document.getElementById('seatLayout');
    const lockedSeatIds = lockedSeats.map(l => l.seat_id);
    
    container.querySelectorAll('.seat').forEach(seatEl => {
        const seatId = seatEl.dataset.seat;
        const isBooked = bookedSeats.includes(seatId);
        const isLocked = lockedSeatIds.includes(seatId);
        
        // Update booked status
        if (isBooked && !seatEl.classList.contains('booked')) {
            seatEl.classList.add('booked');
            seatEl.classList.remove('selected', 'locked');
            seatEl.style.cursor = 'not-allowed';
        }
        
        // Update locked status (but not if user has it selected)
        if (isLocked && !seatEl.classList.contains('selected')) {
            seatEl.classList.add('locked');
            seatEl.style.cursor = 'not-allowed';
        } else if (!isLocked && !isBooked && !seatEl.classList.contains('selected')) {
            seatEl.classList.remove('locked');
            seatEl.style.cursor = 'pointer';
        }
    });
}

// Stop polling when leaving page
window.addEventListener('beforeunload', () => {
    if (bookingState.seatPollInterval) {
        clearInterval(bookingState.seatPollInterval);
    }
    // Unlock user's selected seats
    unlockUserSeats();
});

function generateSeatLayout(rows, seatsPerRow, bookedSeats, lockedSeats = []) {
    const container = document.getElementById('seatLayout');
    const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    let html = '';
    const lockedSeatIds = lockedSeats.map(l => typeof l === 'string' ? l : l.seat_id);
    
    for (let r = 0; r < rows; r++) {
        const rowLabel = rowLabels[r];
        const isPremium = r < 3; // First 3 rows are premium
        
        html += `<div class="seat-row">`;
        html += `<span class="row-label">${rowLabel}</span>`;
        
        for (let s = 1; s <= seatsPerRow; s++) {
            const seatId = `${rowLabel}${s}`;
            const isBooked = bookedSeats.includes(seatId);
            const isLocked = lockedSeatIds.includes(seatId);
            
            // Add aisle in the middle
            if (s === Math.floor(seatsPerRow / 2) + 1) {
                html += `<div class="aisle"></div>`;
            }
            
            html += `
                <div class="seat ${isBooked ? 'booked' : ''} ${isLocked ? 'locked' : ''} ${isPremium ? 'premium' : ''}" 
                     data-seat="${seatId}" 
                     data-premium="${isPremium}">
                    ${s}
                </div>
            `;
        }
        
        html += `<span class="row-label">${rowLabel}</span>`;
        html += `</div>`;
    }
    
    container.innerHTML = html;
    
    // Update price display using showtime prices
    const standardPrice = parseFloat(bookingState.showtime?.price_standard || 200);
    const premiumPrice = parseFloat(bookingState.showtime?.price_premium || 300);
    document.getElementById('pricePerSeat').textContent = `₹${standardPrice} / ₹${premiumPrice} (Premium)`;
    
    // Add click listeners to seats (exclude booked and locked)
    container.querySelectorAll('.seat:not(.booked):not(.locked)').forEach(seat => {
        seat.addEventListener('click', () => toggleSeat(seat));
    });
    
    // Reset selection
    bookingState.selectedSeats = [];
    updateSelectionSummary();
}

async function toggleSeat(seatEl) {
    const seatId = seatEl.dataset.seat;
    const isPremium = seatEl.dataset.premium === 'true';
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (seatEl.classList.contains('selected')) {
        // Unlock and deselect seat
        seatEl.classList.remove('selected');
        bookingState.selectedSeats = bookingState.selectedSeats.filter(s => s.id !== seatId);
        
        // Unlock seat on server
        if (bookingState.showtimeId && user?.id) {
            await unlockSeat(seatId);
        }
    } else {
        if (bookingState.selectedSeats.length >= bookingState.seatsNeeded) {
            alert(`You can only select ${bookingState.seatsNeeded} seats`);
            return;
        }
        
        // Lock seat first before selecting
        if (bookingState.showtimeId && user?.id) {
            const locked = await lockSeat(seatId);
            if (!locked) {
                alert('This seat was just taken by another user. Please select another seat.');
                return;
            }
        }
        
        seatEl.classList.add('selected');
        bookingState.selectedSeats.push({ id: seatId, isPremium: isPremium });
    }
    
    updateSelectionSummary();
}

// NEW: Lock a single seat
async function lockSeat(seatId) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch(`${API_BASE}/booking.php?action=lock_seats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                showtime_id: bookingState.showtimeId,
                seats: [seatId],
                user_id: user.id
            })
        });
        
        const result = await response.json();
        return result.status === 'success' && result.locked_seats.includes(seatId);
    } catch (error) {
        console.error('Error locking seat:', error);
        return false;
    }
}

// NEW: Unlock a single seat
async function unlockSeat(seatId) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        await fetch(`${API_BASE}/booking.php?action=unlock_seats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                showtime_id: bookingState.showtimeId,
                seats: [seatId],
                user_id: user.id
            })
        });
    } catch (error) {
        console.error('Error unlocking seat:', error);
    }
}

// NEW: Unlock all user's selected seats
async function unlockUserSeats() {
    if (bookingState.selectedSeats.length === 0 || !bookingState.showtimeId) return;
    
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        await fetch(`${API_BASE}/booking.php?action=unlock_seats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                showtime_id: bookingState.showtimeId,
                seats: bookingState.selectedSeats.map(s => s.id),
                user_id: user.id
            })
        });
    } catch (error) {
        console.error('Error unlocking seats:', error);
    }
}

function updateSelectionSummary() {
    const selectedList = document.getElementById('selectedSeatsList');
    const subtotalEl = document.getElementById('subtotal');
    const proceedBtn = document.getElementById('proceedToPayment');
    
    if (bookingState.selectedSeats.length === 0) {
        selectedList.textContent = 'None';
        subtotalEl.textContent = '₹0';
        proceedBtn.disabled = true;
        return;
    }
    
    selectedList.textContent = bookingState.selectedSeats.map(s => s.id).join(', ');
    
    // Calculate using showtime prices
    const standardPrice = parseFloat(bookingState.showtime?.price_standard || 200);
    const premiumPrice = parseFloat(bookingState.showtime?.price_premium || 300);
    
    let subtotal = 0;
    bookingState.selectedSeats.forEach(seat => {
        subtotal += seat.isPremium ? premiumPrice : standardPrice;
    });
    
    bookingState.baseAmount = subtotal;
    subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
    
    proceedBtn.disabled = bookingState.selectedSeats.length !== bookingState.seatsNeeded;
}

// ========================================
// PAYMENT
// ========================================

function updatePaymentSummary() {
    document.getElementById('summaryMovie').textContent = bookingState.movie?.title || '-';
    document.getElementById('summaryScreen').textContent = bookingState.screen?.name || '-';
    
    const dateObj = new Date(bookingState.selectedDate);
    document.getElementById('summaryDateTime').textContent = `${dateObj.toDateString()}, ${formatTime12(bookingState.selectedTime)}`;
    
    document.getElementById('summarySeats').textContent = bookingState.selectedSeats.map(s => s.id).join(', ');
    
    // Calculate with GST
    const gstRate = 0.18;
    bookingState.gstAmount = bookingState.baseAmount * gstRate;
    bookingState.totalAmount = bookingState.baseAmount + bookingState.gstAmount;
    
    document.getElementById('paymentSubtotal').textContent = `₹${bookingState.baseAmount.toFixed(2)}`;
    document.getElementById('paymentGST').textContent = `₹${bookingState.gstAmount.toFixed(2)}`;
    document.getElementById('paymentTotal').textContent = `₹${bookingState.totalAmount.toFixed(2)}`;
}

async function initiatePayment() {
    const user = JSON.parse(localStorage.getItem('user'));
    const payBtn = document.getElementById('payNowBtn');
    
    // Stop polling when payment starts
    if (bookingState.seatPollInterval) {
        clearInterval(bookingState.seatPollInterval);
        bookingState.seatPollInterval = null;
    }
    
    payBtn.querySelector('.btn-text').style.display = 'none';
    payBtn.querySelector('.btn-loader').style.display = 'inline';
    payBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/booking.php?action=create_order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.id,
                movie_id: bookingState.movieId,
                screen_id: bookingState.screenId,
                showtime_id: bookingState.showtimeId,
                seats: bookingState.selectedSeats.map(s => s.id),
                base_amount: bookingState.baseAmount
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            bookingState.bookingId = result.booking_id;
            bookingState.orderId = result.order_id;
            
            const options = {
                key: result.key_id,
                amount: result.amount_paise,
                currency: 'INR',
                name: 'Nilambur Films',
                description: `Tickets for ${bookingState.movie?.title}`,
                order_id: result.order_id,
                handler: function(response) {
                    verifyPayment(response);
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone || ''
                },
                theme: { color: '#8a50ff' },
                modal: {
                    ondismiss: function() {
                        payBtn.querySelector('.btn-text').style.display = 'inline';
                        payBtn.querySelector('.btn-loader').style.display = 'none';
                        payBtn.disabled = false;
                    }
                }
            };
            
            const rzp = new Razorpay(options);
            rzp.open();
        } else {
            throw new Error(result.message || 'Failed to create order');
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('Payment failed: ' + error.message);
        payBtn.querySelector('.btn-text').style.display = 'inline';
        payBtn.querySelector('.btn-loader').style.display = 'none';
        payBtn.disabled = false;
    }
}

async function verifyPayment(razorpayResponse) {
    try {
        const response = await fetch(`${API_BASE}/booking.php?action=verify_payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
                booking_id: bookingState.bookingId
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showConfirmation(result.booking);
        } else {
            throw new Error(result.message || 'Payment verification failed');
        }
    } catch (error) {
        console.error('Verification error:', error);
        alert('Payment verification failed. Please contact support.');
    }
}

// ========================================
// CONFIRMATION
// ========================================

function showConfirmation(booking) {
    showStep(4);
    
    document.getElementById('finalBookingId').textContent = booking?.booking_id || bookingState.bookingId;
    document.getElementById('confirmMovie').textContent = bookingState.movie?.title || '-';
    document.getElementById('confirmScreen').textContent = bookingState.screen?.name || '-';
    
    const dateObj = new Date(bookingState.selectedDate);
    document.getElementById('confirmDateTime').textContent = `${dateObj.toDateString()}, ${formatTime12(bookingState.selectedTime)}`;
    
    document.getElementById('confirmSeats').textContent = bookingState.selectedSeats.map(s => s.id).join(', ');
    document.getElementById('confirmAmount').textContent = `₹${bookingState.totalAmount.toFixed(2)}`;
    
    // Generate QR Code
    const qrData = encodeURIComponent(`NILAMBUR-FILMS|${bookingState.bookingId}|${bookingState.movie?.title}|${bookingState.selectedSeats.map(s => s.id).join(',')}`);
    const qrUrl = `https://chart.googleapis.com/chart?chs=160x160&cht=qr&chl=${qrData}`;
    document.getElementById('qrCodeContainer').innerHTML = `<img src="${qrUrl}" alt="QR Code">`;
}

window.toggleSeat = toggleSeat;
