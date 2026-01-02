// ========================================
// MOVIES PAGE - Fetch from Database
// ========================================

const API_BASE = '../api';
let allMovies = [];
let currentFilter = 'all';

// ========================================
// FETCH AND DISPLAY MOVIES
// ========================================

async function loadMovies() {
    const moviesGrid = document.getElementById('moviesGrid');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    if (!moviesGrid) return;
    
    // Show loading
    moviesGrid.innerHTML = '';
    if (loadingState) loadingState.style.display = 'flex';
    if (emptyState) emptyState.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE}/movies.php?status=now_showing`);
        const result = await response.json();
        
        if (loadingState) loadingState.style.display = 'none';
        
        if (result.status === 'success' && result.data.length > 0) {
            allMovies = result.data;
            displayMovies(allMovies);
        } else {
            if (emptyState) emptyState.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error loading movies:', error);
        if (loadingState) loadingState.style.display = 'none';
        moviesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: rgba(255,255,255,0.6);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🎬</div>
                <h3>Coming Soon!</h3>
                <p>New movies will be available shortly.</p>
            </div>
        `;
    }
}

function displayMovies(movies) {
    const moviesGrid = document.getElementById('moviesGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!moviesGrid) return;
    
    if (movies.length === 0) {
        moviesGrid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    moviesGrid.innerHTML = movies.map((movie, index) => {
        // Fix poster URL path
        let posterUrl = movie.poster_url || '';
        if (posterUrl && !posterUrl.startsWith('http') && !posterUrl.startsWith('data:')) {
            posterUrl = '../' + posterUrl;
        }
        if (!posterUrl) {
            posterUrl = 'https://placehold.co/300x450/1a1a2e/8a50ff?text=🎬';
        }
        
        return `
        <div class="movie-card-full liquid-card" data-genre="${(movie.genre || '').toLowerCase()}" style="animation-delay: ${index * 0.1}s;">
            <div class="movie-poster-full" style="background-image: url('${posterUrl}'); background-size: cover; background-position: center;">
                <span class="movie-badge">${movie.badge || 'Premium'}</span>
                <div class="movie-overlay">
                    <button class="play-btn" onclick="playTrailer('${movie.trailer_url || ''}')">▶</button>
                </div>
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <p class="movie-genre">${movie.genre}${movie.sub_genre ? ' • ' + movie.sub_genre : ''}</p>
                <div class="movie-meta">
                    <span class="movie-rating">⭐ ${movie.rating || '4.5'}</span>
                    <span class="movie-duration">${movie.duration}</span>
                </div>
                <p class="movie-description">${movie.description ? movie.description.substring(0, 100) + '...' : 'An exciting cinematic experience awaits you!'}</p>
                <div class="movie-actions">
                    <button class="btn-primary" onclick="bookTickets(${movie.id})">Book Tickets</button>
                    <button class="btn-secondary" onclick="viewDetails(${movie.id})">Details</button>
                </div>
            </div>
        </div>
    `}).join('');
    
    // Add fade-in animation
    document.querySelectorAll('.movie-card-full').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// ========================================
// FILTER FUNCTIONALITY
// ========================================

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active state
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        currentFilter = btn.dataset.filter;
        filterMovies();
    });
});

function filterMovies() {
    let filtered = allMovies;
    
    if (currentFilter !== 'all') {
        filtered = allMovies.filter(movie => 
            movie.genre.toLowerCase() === currentFilter.toLowerCase()
        );
    }
    
    displayMovies(filtered);
}

// ========================================
// SORT FUNCTIONALITY
// ========================================

const sortSelect = document.querySelector('.sort-select');
if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
        const sortBy = e.target.value;
        let sorted = [...allMovies];
        
        switch(sortBy) {
            case 'latest':
                sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'popular':
                sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'rating':
                sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'title':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }
        
        displayMovies(sorted);
    });
}

// ========================================
// MOVIE ACTIONS
// ========================================

function bookTickets(movieId) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        // Not logged in
        alert('Please login to book tickets');
        window.location.href = '../user-login/login.html?redirect=movies';
        return;
    }
    
    // Redirect to booking page with movie ID
    window.location.href = `../booking/booking.html?movie_id=${movieId}`;
}

function viewDetails(movieId) {
    const movie = allMovies.find(m => m.id == movieId);
    if (movie) {
        alert(`
🎬 ${movie.title}

Genre: ${movie.genre}${movie.sub_genre ? ' • ' + movie.sub_genre : ''}
Duration: ${movie.duration}
Rating: ⭐ ${movie.rating || 'N/A'}
Badge: ${movie.badge || 'Standard'}

${movie.description || 'An exciting cinematic experience awaits you!'}
        `);
    }
}

function playTrailer(url) {
    if (url) {
        window.open(url, '_blank');
    } else {
        alert('Trailer not available yet. Coming soon!');
    }
}

// ========================================
// LIQUID CARD EFFECT
// ========================================

document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.liquid-card');
    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mouse-x', `${x}%`);
        card.style.setProperty('--mouse-y', `${y}%`);
    });
});

// ========================================
// SEARCH FOCUS (from navigation)
// ========================================

window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('search') === 'true') {
        // Focus on search if available
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }
});

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    loadMovies();
    console.log('%c🎬 Movies Page Loaded', 'font-size: 16px; color: #8a50ff;');
});

// Make functions globally available
window.bookTickets = bookTickets;
window.viewDetails = viewDetails;
window.playTrailer = playTrailer;
