-- Nilambur Films Database Setup
-- Run this in phpMyAdmin or MySQL CLI

CREATE DATABASE IF NOT EXISTS nilambur_films;
USE nilambur_films;

-- Users table (updated)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    otp VARCHAR(6),
    otp_expiry DATETIME,
    is_verified TINYINT(1) DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Screens table
CREATE TABLE IF NOT EXISTS screens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    screen_type ENUM('Standard', 'Premium', 'Dolby', 'IMAX', '4DX') NOT NULL,
    total_seats INT NOT NULL,
    rows_count INT NOT NULL,
    seats_per_row INT NOT NULL,
    price_standard DECIMAL(10,2) DEFAULT 250.00,
    price_premium DECIMAL(10,2) DEFAULT 350.00,
    status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default screens
INSERT INTO screens (name, screen_type, total_seats, rows_count, seats_per_row, price_standard, price_premium) VALUES
('Screen 1', 'Standard', 400, 20, 20, 200.00, 300.00),
('Screen 2', 'Premium', 300, 15, 20, 250.00, 350.00),
('Screen 3', 'Dolby', 200, 10, 20, 300.00, 400.00),
('Screen 4', 'IMAX', 100, 10, 10, 450.00, 600.00)
ON DUPLICATE KEY UPDATE name=name;

-- Movies table
CREATE TABLE IF NOT EXISTS movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    genre VARCHAR(50) NOT NULL,
    sub_genre VARCHAR(50),
    duration VARCHAR(20) NOT NULL,
    rating DECIMAL(2,1) DEFAULT 0.0,
    badge ENUM('Premium', 'IMAX', '4DX', 'Dolby', 'Standard') DEFAULT 'Standard',
    poster_url VARCHAR(500),
    cloudinary_id VARCHAR(200),
    trailer_url VARCHAR(500),
    release_date DATE,
    language VARCHAR(50) DEFAULT 'Malayalam',
    certificate ENUM('U', 'UA', 'A', 'S') DEFAULT 'UA',
    status ENUM('now_showing', 'coming_soon', 'archived') DEFAULT 'now_showing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Showtimes table
CREATE TABLE IF NOT EXISTS showtimes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    screen_id INT NOT NULL,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    price_standard DECIMAL(10,2),
    price_premium DECIMAL(10,2),
    available_seats INT,
    status ENUM('active', 'cancelled', 'sold_out') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(20) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    showtime_id INT NOT NULL,
    seats JSON NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_id VARCHAR(100),
    booking_status ENUM('confirmed', 'cancelled', 'used') DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    booking_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('card', 'upi', 'netbanking', 'wallet') NOT NULL,
    status ENUM('success', 'pending', 'failed') DEFAULT 'pending',
    payment_details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_movies_status ON movies(status);
CREATE INDEX idx_showtimes_date ON showtimes(show_date);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_payments_status ON payments(status);
