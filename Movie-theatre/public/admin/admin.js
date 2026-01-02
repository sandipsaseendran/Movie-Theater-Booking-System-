// ========================================
// ADMIN PANEL - COMPLETE JAVASCRIPT
// ========================================

const API_BASE = '../api';

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Check admin auth
    if (!sessionStorage.getItem('adminLoggedIn')) {
        window.location.href = '../admin-login/admin-login.html';
        return;
    }
    
    setupEventListeners();
    loadDashboard();
    
    console.log('%c🎬 Admin Panel Loaded', 'font-size: 20px; color: #8a50ff;');
});

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
        });
    });
    
    // Logout
    document.querySelector('.logout-btn').addEventListener('click', () => {
        if (confirm('Logout?')) {
            sessionStorage.clear();
            window.location.href = '../admin-login/admin-login.html';
        }
    });
    
    // Movie Modal
    document.getElementById('addMovieBtn')?.addEventListener('click', openMovieModal);
    document.getElementById('cancelMovieBtn')?.addEventListener('click', closeMovieModal);
    document.querySelector('#movieModal .modal-close')?.addEventListener('click', closeMovieModal);
    document.getElementById('movieForm')?.addEventListener('submit', handleMovieSubmit);
    
    // Poster upload - Click to upload
    const uploadArea = document.getElementById('uploadArea');
    const posterUpload = document.getElementById('posterUpload');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const posterPreview = document.getElementById('posterPreview');
    const previewImg = document.getElementById('previewImg');
    const removeImageBtn = document.getElementById('removeImage');
    
    if (uploadArea && posterUpload) {
        // Click to select file
        uploadArea.addEventListener('click', (e) => {
            if (e.target !== removeImageBtn && !e.target.closest('#removeImage')) {
                posterUpload.click();
            }
        });
        
        // Handle file selection
        posterUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                showImagePreview(file);
            }
        });
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                // Create a new FileList-like object
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                posterUpload.files = dataTransfer.files;
                showImagePreview(file);
            }
        });
        
        // Remove image
        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                posterUpload.value = '';
                posterPreview.style.display = 'none';
                uploadPlaceholder.style.display = 'flex';
            });
        }
    }
    
    function showImagePreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            posterPreview.style.display = 'block';
            uploadPlaceholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
    
    // Showtime Modal
    document.getElementById('addShowtimeBtn')?.addEventListener('click', openShowtimeModal);
    document.getElementById('cancelShowtimeBtn')?.addEventListener('click', closeShowtimeModal);
    document.querySelector('#showtimeModal .modal-close')?.addEventListener('click', closeShowtimeModal);
    document.getElementById('showtimeForm')?.addEventListener('submit', handleShowtimeSubmit);
    
    // Quick time buttons
    document.querySelectorAll('.quick-time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('input[name="show_time"]').value = btn.dataset.time;
        });
    });
    
    // Set minimum date for showtime
    const dateInput = document.querySelector('input[name="show_date"]');
    if (dateInput) {
        dateInput.min = new Date().toISOString().split('T')[0];
    }
}

// ========================================
// SECTION SWITCHING
// ========================================

function switchSection(sectionName) {
    // Update menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === sectionName);
    });
    
    // Update sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionName}-section`)?.classList.add('active');
    
    // Load data for section
    switch(sectionName) {
        case 'dashboard': loadDashboard(); break;
        case 'movies': loadMovies(); break;
        case 'showtimes': loadShowtimes(); break;
        case 'users': loadUsers(); break;
        case 'bookings': loadBookings(); break;
        case 'payments': loadPayments(); break;
        case 'screens': loadScreens(); break;
    }
}

// ========================================
// DASHBOARD
// ========================================

async function loadDashboard() {
    try {
        // Load stats
        const [moviesRes, usersRes, bookingsRes] = await Promise.all([
            fetch(`${API_BASE}/movies.php`),
            fetch(`${API_BASE}/users_admin.php`),
            fetch(`${API_BASE}/booking.php?action=admin_bookings`)
        ]);
        
        const movies = await moviesRes.json();
        const users = await usersRes.json();
        const bookings = await bookingsRes.json();
        
        document.getElementById('totalMovies').textContent = movies.data?.length || 0;
        document.getElementById('totalUsers').textContent = users.data?.length || 0;
        document.getElementById('totalTickets').textContent = bookings.data?.length || 0;
        
        // Calculate revenue
        let revenue = 0;
        if (bookings.data) {
            bookings.data.forEach(b => {
                if (b.booking_status === 'confirmed') {
                    revenue += parseFloat(b.total_amount) || 0;
                }
            });
        }
        document.getElementById('totalRevenue').textContent = `₹${revenue.toLocaleString()}`;
        
        // Recent bookings
        const recentDiv = document.getElementById('recentBookings');
        if (bookings.data && bookings.data.length > 0) {
            recentDiv.innerHTML = bookings.data.slice(0, 5).map(b => `
                <div class="activity-item">
                    <span class="activity-icon">🎫</span>
                    <div class="activity-details">
                        <p><strong>${b.user_name || 'User'}</strong> booked <strong>${b.movie_title}</strong></p>
                        <span class="activity-time">${new Date(b.created_at).toLocaleString()}</span>
                    </div>
                    <span class="activity-amount">₹${b.total_amount}</span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Dashboard error:', error);
    }
}

// ========================================
// MOVIES
// ========================================

async function loadMovies() {
    const tbody = document.querySelector('#moviesTable tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading...</td></tr>';
    
    try {
        const response = await fetch(`${API_BASE}/movies.php`);
        const result = await response.json();
        
        if (result.status === 'success' && result.data.length > 0) {
            // Get showtime counts for each movie
            const showtimesRes = await fetch(`${API_BASE}/showtimes.php?action=get_all`);
            const showtimesData = await showtimesRes.json();
            const showtimeCounts = {};
            
            if (showtimesData.data) {
                showtimesData.data.forEach(st => {
                    showtimeCounts[st.movie_id] = (showtimeCounts[st.movie_id] || 0) + 1;
                });
            }
            
            tbody.innerHTML = result.data.map(movie => {
                let posterUrl = movie.poster_url || '';
                if (posterUrl && !posterUrl.startsWith('http')) {
                    posterUrl = '../' + posterUrl;
                }
                if (!posterUrl) posterUrl = 'https://placehold.co/50x75/1a1a2e/8a50ff?text=🎬';
                
                const showtimeCount = showtimeCounts[movie.id] || 0;
                
                return `
                    <tr>
                        <td><img src="${posterUrl}" alt="${movie.title}" class="poster-thumb"></td>
                        <td>${movie.title}</td>
                        <td>${movie.genre}</td>
                        <td>${movie.duration}</td>
                        <td>⭐ ${movie.rating || 'N/A'}</td>
                        <td>
                            <span class="showtime-count ${showtimeCount > 0 ? 'has-shows' : 'no-shows'}">
                                ${showtimeCount} shows
                            </span>
                            <button class="btn-sm" onclick="openShowtimeModalForMovie(${movie.id}, '${movie.title}')">+ Add</button>
                        </td>
                        <td>
                            <button class="action-btn delete" onclick="deleteMovie(${movie.id})">Delete</button>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="empty">No movies found. Add your first movie!</td></tr>';
        }
    } catch (error) {
        console.error('Error loading movies:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="error">Failed to load movies</td></tr>';
    }
}

function openMovieModal() {
    document.getElementById('movieModal').classList.add('active');
    document.getElementById('movieForm').reset();
    
    // Reset preview
    const posterPreview = document.getElementById('posterPreview');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    if (posterPreview) posterPreview.style.display = 'none';
    if (uploadPlaceholder) uploadPlaceholder.style.display = 'flex';
}

function closeMovieModal() {
    document.getElementById('movieModal').classList.remove('active');
}

async function handleMovieSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const posterFile = formData.get('poster');
    
    let posterUrl = '';
    
    // Upload poster if exists
    if (posterFile && posterFile.size > 0) {
        try {
            const uploadData = new FormData();
            uploadData.append('poster', posterFile);
            
            const uploadRes = await fetch(`${API_BASE}/upload_image.php`, {
                method: 'POST',
                body: uploadData
            });
            const uploadResult = await uploadRes.json();
            
            if (uploadResult.status === 'success') {
                posterUrl = uploadResult.url;
            }
        } catch (error) {
            console.error('Upload error:', error);
        }
    }
    
    // Save movie
    const movieData = {
        title: formData.get('title'),
        duration: formData.get('duration'),
        genre: formData.get('genre'),
        rating: parseFloat(formData.get('rating')) || 0,
        description: formData.get('description'),
        poster_url: posterUrl
    };
    
    try {
        const response = await fetch(`${API_BASE}/movies.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(movieData)
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✓ Movie added successfully!\n\nNow add showtimes for this movie in the Showtimes section.');
            closeMovieModal();
            loadMovies();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to save movie');
    }
}

async function deleteMovie(id) {
    if (!confirm('Delete this movie and all its showtimes?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/movies.php?id=${id}`, { method: 'DELETE' });
        const result = await response.json();
        
        if (result.status === 'success') {
            loadMovies();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        alert('Failed to delete');
    }
}

// ========================================
// SHOWTIMES
// ========================================

// Helper functions for seat availability display
function getSeatBadgeClass(showtime) {
    const seatsLeft = showtime.seats_left !== undefined ? showtime.seats_left : (showtime.available_seats || 0);
    const totalSeats = showtime.total_seats || 0;
    const percentageLeft = totalSeats > 0 ? (seatsLeft / totalSeats) * 100 : 0;
    
    if (seatsLeft <= 0) {
        return 'sold-out';
    } else if (percentageLeft <= 20) {
        return 'low-seats';
    }
    return 'available';
}

function getSeatTooltip(showtime) {
    const seatsLeft = showtime.seats_left !== undefined ? showtime.seats_left : (showtime.available_seats || 0);
    const totalSeats = showtime.total_seats || 0;
    const booked = totalSeats - seatsLeft;
    return `${seatsLeft} seats available out of ${totalSeats} total (${booked} booked)`;
}

function getSeatCount(showtime) {
    const seatsLeft = showtime.seats_left !== undefined ? showtime.seats_left : (showtime.available_seats || 0);
    const totalSeats = showtime.total_seats || 0;
    return `${seatsLeft} / ${totalSeats}`;
}

async function loadShowtimes() {
    const tbody = document.querySelector('#showtimesTable tbody');
    tbody.innerHTML = '<tr><td colspan="8" class="loading">Loading...</td></tr>';
    
    try {
        const response = await fetch(`${API_BASE}/showtimes.php?action=get_all`);
        const result = await response.json();
        
        if (result.status === 'success' && result.data.length > 0) {
            tbody.innerHTML = result.data.map(st => `
                <tr>
                    <td>
                        <div class="movie-cell">
                            <img src="${st.poster_url ? '../' + st.poster_url : 'https://placehold.co/40x60/1a1a2e/8a50ff?text=🎬'}" class="mini-poster">
                            <span>${st.movie_title}</span>
                        </div>
                    </td>
                    <td>
                        <span class="screen-badge ${st.screen_type.toLowerCase()}">${st.screen_name}</span>
                    </td>
                    <td>${formatDate(st.show_date)}</td>
                    <td>${formatTime12(st.show_time)}</td>
                    <td>₹${st.price_standard}</td>
                    <td>₹${st.price_premium}</td>
                    <td>
                        <span class="seats-left-badge ${getSeatBadgeClass(st)}" title="${getSeatTooltip(st)}">
                            ${getSeatCount(st)}
                        </span>
                    </td>
                    <td>
                        <button class="action-btn delete" onclick="deleteShowtime(${st.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="8" class="empty">No showtimes found. Add showtimes to make movies available for booking!</td></tr>';
        }
    } catch (error) {
        console.error('Error loading showtimes:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="error">Failed to load showtimes</td></tr>';
    }
}

async function openShowtimeModal() {
    const modal = document.getElementById('showtimeModal');
    modal.classList.add('active');
    document.getElementById('showtimeForm').reset();
    
    // Load movies dropdown
    await loadMoviesDropdown();
    await loadScreensDropdown();
}

function openShowtimeModalForMovie(movieId, movieTitle) {
    openShowtimeModal().then(() => {
        document.getElementById('showtimeMovieSelect').value = movieId;
    });
}

function closeShowtimeModal() {
    document.getElementById('showtimeModal').classList.remove('active');
}

async function loadMoviesDropdown() {
    const select = document.getElementById('showtimeMovieSelect');
    
    try {
        const response = await fetch(`${API_BASE}/movies.php`);
        const result = await response.json();
        
        if (result.status === 'success') {
            select.innerHTML = '<option value="">-- Select Movie --</option>' +
                result.data.map(m => `<option value="${m.id}">${m.title}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading movies:', error);
    }
}

async function loadScreensDropdown() {
    const select = document.getElementById('showtimeScreenSelect');
    
    try {
        const response = await fetch(`${API_BASE}/screens.php`);
        const result = await response.json();
        
        if (result.status === 'success') {
            select.innerHTML = '<option value="">-- Select Screen --</option>' +
                result.data.map(s => `
                    <option value="${s.id}" data-standard="${s.price_standard}" data-premium="${s.price_premium}">
                        ${s.name} (${s.screen_type}) - ${s.total_seats} seats
                    </option>
                `).join('');
            
            // Update prices when screen changes
            select.addEventListener('change', (e) => {
                const selected = e.target.options[e.target.selectedIndex];
                if (selected.dataset.standard) {
                    document.querySelector('input[name="price_standard"]').value = selected.dataset.standard;
                    document.querySelector('input[name="price_premium"]').value = selected.dataset.premium;
                }
            });
        }
    } catch (error) {
        console.error('Error loading screens:', error);
    }
}

async function handleShowtimeSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    const showtimeData = {
        movie_id: formData.get('movie_id'),
        screen_id: formData.get('screen_id'),
        show_date: formData.get('show_date'),
        show_time: formData.get('show_time'),
        price_standard: parseFloat(formData.get('price_standard')),
        price_premium: parseFloat(formData.get('price_premium'))
    };
    
    try {
        const response = await fetch(`${API_BASE}/showtimes.php?action=add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(showtimeData)
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✓ Showtime added successfully!');
            // Don't close modal - allow adding more showtimes
            form.querySelector('input[name="show_time"]').value = '';
            loadShowtimes();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to add showtime');
    }
}

async function deleteShowtime(id) {
    if (!confirm('Delete this showtime?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/showtimes.php?action=delete&id=${id}`, { method: 'DELETE' });
        const result = await response.json();
        
        if (result.status === 'success') {
            loadShowtimes();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        alert('Failed to delete');
    }
}

// ========================================
// USERS
// ========================================

async function loadUsers() {
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading...</td></tr>';
    
    try {
        const response = await fetch(`${API_BASE}/users_admin.php`);
        const result = await response.json();
        
        if (result.status === 'success' && result.data.length > 0) {
            tbody.innerHTML = result.data.map(user => `
                <tr>
                    <td>#${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.phone || '-'}</td>
                    <td>${formatDate(user.created_at)}</td>
                    <td><span class="status-badge ${user.status}">${user.status}</span></td>
                    <td>
                        <button class="action-btn delete" onclick="deleteUser(${user.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="empty">No users found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading users:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="error">Failed to load users</td></tr>';
    }
}

async function deleteUser(id) {
    if (!confirm('Delete this user?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/users_admin.php?id=${id}`, { method: 'DELETE' });
        const result = await response.json();
        
        if (result.status === 'success') {
            loadUsers();
        }
    } catch (error) {
        alert('Failed to delete');
    }
}

// ========================================
// BOOKINGS
// ========================================

async function loadBookings() {
    const tbody = document.querySelector('#bookingsTable tbody');
    tbody.innerHTML = '<tr><td colspan="10" class="loading">Loading...</td></tr>';
    
    try {
        const response = await fetch(`${API_BASE}/booking.php?action=admin_bookings`);
        const result = await response.json();
        
        if (result.status === 'success' && result.data.length > 0) {
            tbody.innerHTML = result.data.map(b => {
                const canRefund = b.payment_status === 'completed' && b.booking_status === 'confirmed';
                const isRefunded = b.payment_status === 'refunded';
                return `
                <tr>
                    <td><code>${b.booking_id}</code></td>
                    <td>${b.movie_title}</td>
                    <td>${b.user_name}<br><small>${b.user_email}</small></td>
                    <td>${b.screen_name}</td>
                    <td>${Array.isArray(b.seats) ? b.seats.join(', ') : b.seats}</td>
                    <td>₹${b.total_amount}</td>
                    <td><span class="status-badge ${b.payment_status}">${b.payment_status}</span></td>
                    <td><span class="status-badge ${b.booking_status}">${b.booking_status}</span></td>
                    <td>${formatDate(b.created_at)}</td>
                    <td>
                        ${canRefund ? `<button class="action-btn refund" onclick="processRefund('${b.booking_id}', '${b.movie_title}', ${b.total_amount})">Refund</button>` : ''}
                        ${isRefunded ? '<span class="refunded-badge">✓ Refunded</span>' : ''}
                    </td>
                </tr>
            `;
            }).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="10" class="empty">No bookings found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        tbody.innerHTML = '<tr><td colspan="10" class="error">Failed to load bookings</td></tr>';
    }
}

// Process refund for a booking
async function processRefund(bookingId, movieTitle, amount) {
    if (!confirm(`Are you sure you want to refund ₹${amount} for booking ${bookingId}?\n\nMovie: ${movieTitle}\n\nThis action cannot be undone.`)) {
        return;
    }
    
    const reason = prompt('Enter refund reason (optional):', 'Admin initiated refund');
    if (reason === null) {
        return; // User cancelled
    }
    
    try {
        const response = await fetch(`${API_BASE}/booking.php?action=process_refund`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                booking_id: bookingId,
                refund_reason: reason || 'Admin initiated refund'
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            alert(`✓ Refund processed successfully!\n\nRefund ID: ${result.refund_id}\nAmount: ₹${result.refund_amount}\n\nThe amount will be credited to the customer's account within 5-7 business days.`);
            loadBookings(); // Refresh bookings table
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Refund error:', error);
        alert('Failed to process refund. Please try again.');
    }
}

// ========================================
// PAYMENTS
// ========================================

async function loadPayments() {
    const tbody = document.querySelector('#paymentsTable tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading...</td></tr>';
    
    try {
        const response = await fetch(`${API_BASE}/booking.php?action=admin_bookings`);
        const result = await response.json();
        
        if (result.status === 'success' && result.data.length > 0) {
            tbody.innerHTML = result.data
                .filter(b => b.payment_status === 'completed')
                .map(b => `
                    <tr>
                        <td><code>${b.payment_id || 'N/A'}</code></td>
                        <td>${b.user_name}</td>
                        <td>₹${b.total_amount}</td>
                        <td>Razorpay</td>
                        <td>${formatDate(b.created_at)}</td>
                        <td><span class="status-badge success">Success</span></td>
                    </tr>
                `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="empty">No payments found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading payments:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="error">Failed to load payments</td></tr>';
    }
}

// ========================================
// SCREENS
// ========================================

async function loadScreens() {
    const container = document.getElementById('screensGrid');
    container.innerHTML = '<p class="loading">Loading screens...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/screens.php`);
        const result = await response.json();
        
        if (result.status === 'success' && result.data.length > 0) {
            container.innerHTML = result.data.map(screen => `
                <div class="screen-card liquid-card">
                    <div class="screen-header">
                        <h3>${screen.name}</h3>
                        <span class="screen-type-badge ${screen.screen_type.toLowerCase()}">${screen.screen_type}</span>
                    </div>
                    <div class="screen-details">
                        <div class="detail-item">
                            <span class="label">Total Seats</span>
                            <span class="value">${screen.total_seats}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Layout</span>
                            <span class="value">${screen.rows_count} rows × ${screen.seats_per_row} seats</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Standard Price</span>
                            <span class="value">₹${screen.price_standard}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Premium Price</span>
                            <span class="value">₹${screen.price_premium}</span>
                        </div>
                    </div>
                    <div class="screen-visual">
                        <div class="mini-screen"></div>
                        <div class="seats-preview">
                            ${generateMiniSeats(screen.rows_count, screen.seats_per_row)}
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="empty">No screens configured</p>';
        }
    } catch (error) {
        console.error('Error loading screens:', error);
        container.innerHTML = '<p class="error">Failed to load screens</p>';
    }
}

function generateMiniSeats(rows, cols) {
    let html = '';
    const maxRows = Math.min(rows, 6);
    const maxCols = Math.min(cols, 10);
    
    for (let r = 0; r < maxRows; r++) {
        html += '<div class="mini-row">';
        for (let c = 0; c < maxCols; c++) {
            html += '<div class="mini-seat"></div>';
        }
        html += '</div>';
    }
    return html;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime12(timeStr) {
    if (!timeStr) return '-';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
}

// Make functions global
window.deleteMovie = deleteMovie;
window.deleteShowtime = deleteShowtime;
window.deleteUser = deleteUser;
window.openShowtimeModalForMovie = openShowtimeModalForMovie;
window.processRefund = processRefund;
