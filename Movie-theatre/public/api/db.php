<?php
// Suppress PHP errors from being output as HTML
error_reporting(0);
ini_set('display_errors', 0);

// XAMPP Local MySQL Server Configuration
$host = "localhost"; 
$user = "root";
$pass = "";
$db   = "nilambur_films";

// Connect to MySQL
$conn = new mysqli($host, $user, $pass);

if ($conn->connect_error) {
    header("Content-Type: application/json");
    die(json_encode([
        "status" => "error",
        "message" => "Database connection failed. Make sure XAMPP MySQL is running."
    ]));
}

// Create database if it doesn't exist
$conn->query("CREATE DATABASE IF NOT EXISTS `$db`");
$conn->select_db($db);
$conn->set_charset("utf8mb4");

// Create users table
$conn->query("CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    otp VARCHAR(6) DEFAULT NULL,
    otp_expiry DATETIME DEFAULT NULL,
    is_verified TINYINT(1) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    profile_picture VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

// Check if status column exists, add if not
$result = $conn->query("SHOW COLUMNS FROM users LIKE 'status'");
if ($result && $result->num_rows == 0) {
    $conn->query("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active'");
}

// Create screens table
$conn->query("CREATE TABLE IF NOT EXISTS screens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    screen_type VARCHAR(20) NOT NULL DEFAULT 'Standard',
    total_seats INT NOT NULL,
    rows_count INT NOT NULL,
    seats_per_row INT NOT NULL,
    price_standard DECIMAL(10,2) DEFAULT 250.00,
    price_premium DECIMAL(10,2) DEFAULT 350.00,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Insert default screens if table is empty
$checkScreens = $conn->query("SELECT COUNT(*) as count FROM screens");
if ($checkScreens) {
    $row = $checkScreens->fetch_assoc();
    if ($row['count'] == 0) {
        $conn->query("INSERT INTO screens (name, screen_type, total_seats, rows_count, seats_per_row, price_standard, price_premium) VALUES
            ('Screen 1', 'Standard', 400, 20, 20, 150.00, 250.00),
            ('Screen 2', 'Premium', 300, 15, 20, 200.00, 300.00),
            ('Screen 3', 'Dolby Atmos', 200, 10, 20, 250.00, 350.00),
            ('IMAX', 'IMAX', 100, 10, 10, 400.00, 550.00)
        ");
    }
}

// Update existing screens to correct names
$conn->query("UPDATE screens SET name = 'Screen 1', screen_type = 'Standard', total_seats = 400, rows_count = 20, seats_per_row = 20, price_standard = 150.00, price_premium = 250.00 WHERE id = 1");
$conn->query("UPDATE screens SET name = 'Screen 2', screen_type = 'Premium', total_seats = 300, rows_count = 15, seats_per_row = 20, price_standard = 200.00, price_premium = 300.00 WHERE id = 2");
$conn->query("UPDATE screens SET name = 'Screen 3', screen_type = 'Dolby Atmos', total_seats = 200, rows_count = 10, seats_per_row = 20, price_standard = 250.00, price_premium = 350.00 WHERE id = 3");
$conn->query("UPDATE screens SET name = 'IMAX', screen_type = 'IMAX', total_seats = 100, rows_count = 10, seats_per_row = 10, price_standard = 400.00, price_premium = 550.00 WHERE id = 4");

// Create movies table
$conn->query("CREATE TABLE IF NOT EXISTS movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    genre VARCHAR(50) NOT NULL,
    sub_genre VARCHAR(50),
    duration VARCHAR(20) NOT NULL,
    rating DECIMAL(2,1) DEFAULT 0.0,
    badge VARCHAR(20) DEFAULT 'Standard',
    poster_url VARCHAR(500),
    cloudinary_id VARCHAR(200),
    trailer_url VARCHAR(500),
    release_date DATE,
    language VARCHAR(50) DEFAULT 'Malayalam',
    certificate VARCHAR(10) DEFAULT 'UA',
    status VARCHAR(20) DEFAULT 'now_showing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

// Create showtimes table
$conn->query("CREATE TABLE IF NOT EXISTS showtimes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    screen_id INT NOT NULL,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    price_standard DECIMAL(10,2),
    price_premium DECIMAL(10,2),
    available_seats INT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Create bookings table
$conn->query("CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(20) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    showtime_id INT,
    movie_id INT,
    screen_id INT,
    seats TEXT,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_id VARCHAR(100),
    booking_status VARCHAR(20) DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Create payments table
$conn->query("CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    booking_id INT,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'card',
    status VARCHAR(20) DEFAULT 'pending',
    payment_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Create seat_locks table for temporary seat reservations
$conn->query("CREATE TABLE IF NOT EXISTS seat_locks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    showtime_id INT NOT NULL,
    seat_id VARCHAR(10) NOT NULL,
    user_id INT NOT NULL,
    lock_expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_seat_lock (showtime_id, seat_id),
    INDEX idx_expires (lock_expires_at),
    INDEX idx_showtime (showtime_id),
    INDEX idx_user (user_id)
)");

// Add foreign key constraints if they don't exist
$conn->query("SET FOREIGN_KEY_CHECKS=0");

// Add indexes for better performance
$conn->query("CREATE INDEX IF NOT EXISTS idx_bookings_showtime ON bookings(showtime_id)");
$conn->query("CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status, payment_status)");
$conn->query("CREATE INDEX IF NOT EXISTS idx_bookings_movie_screen ON bookings(movie_id, screen_id)");
$conn->query("CREATE INDEX IF NOT EXISTS idx_showtimes_movie_screen_date ON showtimes(movie_id, screen_id, show_date)");

// Clean up expired locks (run periodically)
$conn->query("DELETE FROM seat_locks WHERE lock_expires_at < NOW()");

$conn->query("SET FOREIGN_KEY_CHECKS=1");
?>
