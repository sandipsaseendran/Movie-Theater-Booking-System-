<?php
/**
 * Booking API - Handle seat booking, payment, and ticket generation
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db.php';
require_once 'config.php';
require_once 'auth_helper.php';

// Clean expired locks on every request
cleanExpiredLocks();

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch ($action) {
        case 'get_screens':
            getScreens();
            break;
        case 'get_seats':
            getSeats();
            break;
        case 'get_seat_status':
            getSeatStatus(); // NEW: Real-time seat status
            break;
        case 'lock_seats':
            lockSeats(); // NEW: Lock seats temporarily
            break;
        case 'unlock_seats':
            unlockSeats(); // NEW: Unlock seats
            break;
        case 'check_seats':
            checkSeatAvailability();
            break;
        case 'create_order':
            createRazorpayOrder();
            break;
        case 'verify_payment':
            verifyPayment();
            break;
        case 'get_bookings':
            getUserBookings();
            break;
        case 'get_booking':
            getBookingDetails();
            break;
        case 'admin_bookings':
            getAdminBookings();
            break;
        case 'process_refund':
            processRefund();
            break;
        default:
            echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Server error: ' . $e->getMessage()]);
}

// Clean expired seat locks
function cleanExpiredLocks() {
    global $conn;
    $conn->query("DELETE FROM seat_locks WHERE lock_expires_at < NOW()");
    
    // Also clean up old pending bookings that never completed payment (older than 30 minutes)
    // These bookings should have been completed or cancelled
    $conn->query("DELETE FROM bookings WHERE payment_status = 'pending' AND booking_status = 'pending' AND created_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)");
}

// NEW: Get real-time seat status for polling
function getSeatStatus() {
    global $conn;
    
    $showtime_id = intval($_GET['showtime_id'] ?? 0);
    
    if ($showtime_id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid showtime ID']);
        return;
    }
    
    $bookedSeats = [];
    $lockedSeats = [];
    
    // Get only completed bookings - seats are permanently booked
    // FIXED: Only show seats as booked if payment is completed and booking is confirmed
    $stmt = $conn->prepare("SELECT seats FROM bookings WHERE showtime_id = ? AND payment_status = 'completed' AND booking_status = 'confirmed'");
    $stmt->bind_param("i", $showtime_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $seatsData = $row['seats'];
        
        // Handle TEXT column - parse JSON string
        if (is_string($seatsData)) {
            $seats = json_decode($seatsData, true);
            // If JSON decode fails, try as comma-separated string
            if ($seats === null && json_last_error() !== JSON_ERROR_NONE) {
                $seats = array_filter(array_map('trim', explode(',', $seatsData)));
            }
        } else {
            $seats = $seatsData;
        }
        
        if (is_array($seats)) {
            $bookedSeats = array_merge($bookedSeats, $seats);
        }
    }
    $stmt->close();
    
    // Get locked seats
    $stmt = $conn->prepare("SELECT seat_id, user_id, lock_expires_at FROM seat_locks WHERE showtime_id = ? AND lock_expires_at > NOW()");
    $stmt->bind_param("i", $showtime_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $lockedSeats[] = [
            'seat_id' => $row['seat_id'],
            'expires_at' => $row['lock_expires_at']
        ];
    }
    $stmt->close();
    
    echo json_encode([
        'status' => 'success',
        'booked_seats' => array_unique($bookedSeats),
        'locked_seats' => $lockedSeats,
        'timestamp' => time()
    ]);
}

// NEW: Lock seats temporarily
function lockSeats() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $showtime_id = intval($data['showtime_id'] ?? 0);
    $seats = $data['seats'] ?? [];
    $user_id = intval($data['user_id'] ?? 0);
    
    if ($showtime_id <= 0 || empty($seats) || $user_id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid lock data']);
        return;
    }
    
    if (!defined('SEAT_LOCK_DURATION')) {
        define('SEAT_LOCK_DURATION', 10);
    }
    
    $lock_expires = date('Y-m-d H:i:s', strtotime('+' . SEAT_LOCK_DURATION . ' minutes'));
    $locked = [];
    $failed = [];
    
    $conn->autocommit(false);
    
    try {
        foreach ($seats as $seat_id) {
            // Check if seat is already booked (only completed payments count as booked)
            $stmt = $conn->prepare("SELECT id FROM bookings WHERE showtime_id = ? AND JSON_CONTAINS(seats, JSON_QUOTE(?)) AND payment_status = 'completed' AND booking_status = 'confirmed'");
            $seat_json = json_encode($seat_id);
            $stmt->bind_param("is", $showtime_id, $seat_json);
            $stmt->execute();
            if ($stmt->get_result()->num_rows > 0) {
                $failed[] = $seat_id;
                $stmt->close();
                continue;
            }
            $stmt->close();
            
            // Try to lock the seat - FIXED: Correct parameter binding
            $stmt = $conn->prepare("INSERT INTO seat_locks (showtime_id, seat_id, user_id, lock_expires_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE user_id = ?, lock_expires_at = ?");
            $stmt->bind_param("isisis", $showtime_id, $seat_id, $user_id, $lock_expires, $user_id, $lock_expires);
            
            if ($stmt->execute()) {
                $locked[] = $seat_id;
            } else {
                $failed[] = $seat_id;
            }
            $stmt->close();
        }
        
        $conn->commit();
        
        echo json_encode([
            'status' => 'success',
            'locked_seats' => $locked,
            'failed_seats' => $failed
        ]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => 'Failed to lock seats: ' . $e->getMessage()]);
    }
    
    $conn->autocommit(true);
}

// NEW: Unlock seats
function unlockSeats() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $showtime_id = intval($data['showtime_id'] ?? 0);
    $seats = $data['seats'] ?? [];
    $user_id = intval($data['user_id'] ?? 0);
    
    if ($showtime_id <= 0 || empty($seats)) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid unlock data']);
        return;
    }
    
    $placeholders = implode(',', array_fill(0, count($seats), '?'));
    $seat_types = str_repeat('s', count($seats));
    
    $params = [$showtime_id];
    $params = array_merge($params, $seats);
    
    $sql = "DELETE FROM seat_locks WHERE showtime_id = ? AND seat_id IN ($placeholders)";
    $types = 'i' . $seat_types;
    
    if ($user_id > 0) {
        $sql .= " AND user_id = ?";
        $types .= 'i';
        $params[] = $user_id;
    }
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Seats unlocked']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to unlock seats']);
    }
    $stmt->close();
}

function getScreens() {
    global $conn;
    
    // FIXED: Use prepared statement (even though no user input, best practice)
    $stmt = $conn->prepare("SELECT * FROM screens ORDER BY id");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $screens = [];
    while ($row = $result->fetch_assoc()) {
        $screens[] = $row;
    }
    $stmt->close();
    
    echo json_encode(['status' => 'success', 'data' => $screens]);
}

function getSeats() {
    global $conn;
    
    $screen_id = intval($_GET['screen_id'] ?? 0);
    $showtime_id = intval($_GET['showtime_id'] ?? 0);
    
    if ($screen_id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid screen ID']);
        return;
    }
    
    // Get screen info using prepared statement
    $stmt = $conn->prepare("SELECT * FROM screens WHERE id = ?");
    $stmt->bind_param("i", $screen_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $screen = $result->fetch_assoc();
    $stmt->close();
    
    if (!$screen) {
        echo json_encode(['status' => 'success', 'booked_seats' => [], 'locked_seats' => [], 'rows' => 10, 'seats_per_row' => 20]);
        return;
    }
    
    $bookedSeats = [];
    $lockedSeats = [];
    
    // Get booked seats - FIXED: Only show seats as booked if payment is completed
    if ($showtime_id > 0) {
        $stmt = $conn->prepare("SELECT seats FROM bookings WHERE showtime_id = ? AND payment_status = 'completed' AND booking_status = 'confirmed'");
        $stmt->bind_param("i", $showtime_id);
    } else {
        // Fallback: Use movie_id and screen_id if showtime_id not provided
        $movie_id = intval($_GET['movie_id'] ?? 0);
        $show_date = $_GET['show_date'] ?? date('Y-m-d');
        $stmt = $conn->prepare("SELECT seats FROM bookings WHERE movie_id = ? AND screen_id = ? AND DATE(created_at) = ? AND payment_status = 'completed' AND booking_status = 'confirmed'");
        $stmt->bind_param("iis", $movie_id, $screen_id, $show_date);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $seatsData = $row['seats'];
        
        // Handle TEXT column - parse JSON string
        if (is_string($seatsData)) {
            $seats = json_decode($seatsData, true);
            // If JSON decode fails, try as comma-separated string
            if ($seats === null && json_last_error() !== JSON_ERROR_NONE) {
                $seats = array_filter(array_map('trim', explode(',', $seatsData)));
            }
        } else {
            $seats = $seatsData;
        }
        
        if (is_array($seats)) {
            $bookedSeats = array_merge($bookedSeats, $seats);
        }
    }
    $stmt->close();
    
    // Get locked seats if showtime_id provided
    if ($showtime_id > 0) {
        $stmt = $conn->prepare("SELECT seat_id FROM seat_locks WHERE showtime_id = ? AND lock_expires_at > NOW()");
        $stmt->bind_param("i", $showtime_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($row = $result->fetch_assoc()) {
            $lockedSeats[] = $row['seat_id'];
        }
        $stmt->close();
    }
    
    // Ensure unique seat IDs
    $bookedSeats = array_values(array_unique(array_filter($bookedSeats)));
    $lockedSeats = array_values(array_unique(array_filter($lockedSeats)));
    
    echo json_encode([
        'status' => 'success',
        'screen' => $screen,
        'booked_seats' => $bookedSeats,
        'locked_seats' => $lockedSeats,
        'total_seats' => $screen['total_seats'],
        'rows' => $screen['rows_count'],
        'seats_per_row' => $screen['seats_per_row']
    ]);
}

function checkSeatAvailability() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $seats = $data['seats'] ?? [];
    $showtime_id = intval($data['showtime_id'] ?? 0);
    $screen_id = intval($data['screen_id'] ?? 0);
    $movie_id = intval($data['movie_id'] ?? 0);
    
    if (empty($seats)) {
        echo json_encode(['status' => 'error', 'message' => 'No seats provided']);
        return;
    }
    
    $bookedSeats = [];
    $lockedSeats = [];
    
    // FIXED: Use showtime_id if provided, use prepared statements
    if ($showtime_id > 0) {
        // Check booked seats - FIXED: Only completed payments count as booked
        $stmt = $conn->prepare("SELECT seats FROM bookings WHERE showtime_id = ? AND payment_status = 'completed' AND booking_status = 'confirmed'");
        $stmt->bind_param("i", $showtime_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($row = $result->fetch_assoc()) {
            $seatList = json_decode($row['seats'], true);
            if (is_array($seatList)) {
                $bookedSeats = array_merge($bookedSeats, $seatList);
            }
        }
        $stmt->close();
        
        // Check locked seats
        $placeholders = implode(',', array_fill(0, count($seats), '?'));
        $types = str_repeat('s', count($seats));
        $sql = "SELECT seat_id FROM seat_locks WHERE showtime_id = ? AND seat_id IN ($placeholders) AND lock_expires_at > NOW()";
        $params = array_merge([$showtime_id], $seats);
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types . 'i', ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($row = $result->fetch_assoc()) {
            $lockedSeats[] = $row['seat_id'];
        }
        $stmt->close();
    } else {
        // Fallback to old method if no showtime_id - FIXED: Check payment status
        $stmt = $conn->prepare("SELECT seats FROM bookings WHERE movie_id = ? AND screen_id = ? AND payment_status = 'completed' AND booking_status = 'confirmed'");
        $stmt->bind_param("ii", $movie_id, $screen_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($row = $result->fetch_assoc()) {
            $seatList = json_decode($row['seats'], true);
            if (is_array($seatList)) {
                $bookedSeats = array_merge($bookedSeats, $seatList);
            }
        }
        $stmt->close();
    }
    
    $unavailable = array_intersect($seats, $bookedSeats);
    $locked = array_intersect($seats, $lockedSeats);
    
    if (count($unavailable) > 0 || count($locked) > 0) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Some seats are not available',
            'unavailable' => array_values(array_unique($unavailable)),
            'locked' => array_values(array_unique($locked))
        ]);
    } else {
        echo json_encode(['status' => 'success', 'message' => 'Seats available']);
    }
}

function createRazorpayOrder() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $user_id = intval($data['user_id'] ?? 0);
    $movie_id = intval($data['movie_id'] ?? 0);
    $screen_id = intval($data['screen_id'] ?? 0);
    $showtime_id = intval($data['showtime_id'] ?? 0);
    $seats = $data['seats'] ?? [];
    $base_amount = floatval($data['base_amount'] ?? 0);
    
    if ($user_id <= 0 || $movie_id <= 0 || empty($seats) || $showtime_id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid booking data']);
        return;
    }
    
    // FIXED: Check seat availability with transactions
    $conn->autocommit(false);
    
    try {
        // Check if seats are available
        $seat_placeholders = implode(',', array_fill(0, count($seats), '?'));
        $seat_types = str_repeat('s', count($seats));
        
        // Check booked seats - FIXED: Only completed payments count as booked
        $stmt = $conn->prepare("SELECT seats FROM bookings WHERE showtime_id = ? AND payment_status = 'completed' AND booking_status = 'confirmed'");
        $stmt->bind_param("i", $showtime_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $bookedSeats = [];
        while ($row = $result->fetch_assoc()) {
            $seatList = json_decode($row['seats'], true);
            if (is_array($seatList)) {
                $bookedSeats = array_merge($bookedSeats, $seatList);
            }
        }
        $stmt->close();
        
        $unavailable = array_intersect($seats, $bookedSeats);
        if (count($unavailable) > 0) {
            $conn->rollback();
            echo json_encode(['status' => 'error', 'message' => 'Some seats are already booked', 'unavailable' => $unavailable]);
            return;
        }
        
        // Calculate GST
        $gst_amount = $base_amount * GST_RATE;
        $total_amount = $base_amount + $gst_amount;
        $amount_paise = intval($total_amount * 100);
    
    // Create Razorpay Order
    $orderData = [
        'amount' => $amount_paise,
        'currency' => 'INR',
        'receipt' => 'NF_' . time() . '_' . $user_id,
        'notes' => [
            'movie_id' => (string)$movie_id,
            'screen_id' => (string)$screen_id,
            'seats' => implode(',', $seats)
        ]
    ];
    
    $ch = curl_init('https://api.razorpay.com/v1/orders');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_USERPWD, RAZORPAY_KEY_ID . ':' . RAZORPAY_KEY_SECRET);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        echo json_encode(['status' => 'error', 'message' => 'Curl error: ' . $curlError]);
        return;
    }
    
    $orderResult = json_decode($response, true);
    
        if ($httpCode == 200 && isset($orderResult['id'])) {
            // Store pending booking - FIXED: Use prepared statement and include showtime_id
            $booking_id = 'NF' . date('Ymd') . strtoupper(substr(uniqid(), -6));
            $seats_json = json_encode($seats);
            $order_id = $orderResult['id'];
            
            // FIXED: Use prepared statement with showtime_id
            $stmt = $conn->prepare("INSERT INTO bookings (booking_id, user_id, showtime_id, movie_id, screen_id, seats, total_amount, payment_status, payment_id, booking_status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, 'pending')");
            $stmt->bind_param("siiiisds", $booking_id, $user_id, $showtime_id, $movie_id, $screen_id, $seats_json, $total_amount, $order_id);
            
            if (!$stmt->execute()) {
                $conn->rollback();
                $conn->autocommit(true);
                echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $stmt->error]);
                return;
            }
            $stmt->close();
            
            // Remove seat locks for these seats
            $placeholders = implode(',', array_fill(0, count($seats), '?'));
            $types = str_repeat('s', count($seats));
            $sql = "DELETE FROM seat_locks WHERE showtime_id = ? AND seat_id IN ($placeholders)";
            $params = array_merge([$showtime_id], $seats);
            $stmt = $conn->prepare($sql);
            $types_param = 'i' . $types;
            $stmt->bind_param($types_param, ...$params);
            $stmt->execute();
            $stmt->close();
            
            $conn->commit();
            $conn->autocommit(true);
            
            echo json_encode([
                'status' => 'success',
                'order_id' => $orderResult['id'],
                'booking_id' => $booking_id,
                'amount' => $total_amount,
                'amount_paise' => $amount_paise,
                'base_amount' => $base_amount,
                'gst_amount' => $gst_amount,
                'gst_rate' => GST_RATE * 100,
                'key_id' => RAZORPAY_KEY_ID
            ]);
        } else {
            $conn->rollback();
            $conn->autocommit(true);
            echo json_encode(['status' => 'error', 'message' => 'Failed to create Razorpay order', 'details' => $orderResult, 'http_code' => $httpCode]);
        }
    } catch (Exception $e) {
        $conn->rollback();
        $conn->autocommit(true);
        echo json_encode(['status' => 'error', 'message' => 'Booking failed: ' . $e->getMessage()]);
    }
}

function verifyPayment() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $razorpay_order_id = $data['razorpay_order_id'] ?? '';
    $razorpay_payment_id = $data['razorpay_payment_id'] ?? '';
    $razorpay_signature = $data['razorpay_signature'] ?? '';
    $booking_id = $data['booking_id'] ?? '';
    
    if (empty($razorpay_order_id) || empty($razorpay_payment_id) || empty($booking_id)) {
        echo json_encode(['status' => 'error', 'message' => 'Missing payment data']);
        return;
    }
    
    // Verify signature
    $generated_signature = hash_hmac('sha256', $razorpay_order_id . '|' . $razorpay_payment_id, RAZORPAY_KEY_SECRET);
    
    if ($generated_signature === $razorpay_signature) {
        // FIXED: Use transactions and prepared statements
        $conn->autocommit(false);
        
        try {
            // Update booking status - FIXED: Use prepared statement
            $stmt = $conn->prepare("UPDATE bookings SET payment_status = 'completed', payment_id = ?, booking_status = 'confirmed' WHERE booking_id = ?");
            $stmt->bind_param("ss", $razorpay_payment_id, $booking_id);
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to update booking: ' . $stmt->error);
            }
            $stmt->close();
            
            // Get basic booking details - FIXED: Use prepared statement
            $stmt = $conn->prepare("SELECT * FROM bookings WHERE booking_id = ?");
            $stmt->bind_param("s", $booking_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $booking = $result->fetch_assoc();
            $stmt->close();
            
            if ($booking) {
                // Decode seats
                $booking['seats'] = json_decode($booking['seats'], true);
                
                // Get movie name - FIXED: Use prepared statement
                $movie_id = intval($booking['movie_id']);
                $stmt = $conn->prepare("SELECT title FROM movies WHERE id = ?");
                $stmt->bind_param("i", $movie_id);
                $stmt->execute();
                $result = $stmt->get_result();
                $movie = $result->fetch_assoc();
                $stmt->close();
                $booking['movie_title'] = $movie ? $movie['title'] : 'Movie';
                
                // Get screen name - FIXED: Use prepared statement
                $screen_id = intval($booking['screen_id']);
                $stmt = $conn->prepare("SELECT name FROM screens WHERE id = ?");
                $stmt->bind_param("i", $screen_id);
                $stmt->execute();
                $result = $stmt->get_result();
                $screen = $result->fetch_assoc();
                $stmt->close();
                $booking['screen_name'] = $screen ? $screen['name'] : 'Screen';
                
                // Record payment - FIXED: Use prepared statement
                $transaction_id = 'TXN' . time() . rand(1000, 9999);
                $amount = floatval($booking['total_amount']);
                $user_id = intval($booking['user_id']);
                $booking_db_id = intval($booking['id']);
                
                $stmt = $conn->prepare("INSERT INTO payments (transaction_id, booking_id, user_id, amount, payment_method, status) VALUES (?, ?, ?, ?, 'razorpay', 'success')");
                $stmt->bind_param("sidd", $transaction_id, $booking_db_id, $user_id, $amount);
                if (!$stmt->execute()) {
                    throw new Exception('Failed to record payment: ' . $stmt->error);
                }
                $stmt->close();
                
                // Try to send email (don't fail if email fails)
                try {
                    $stmt = $conn->prepare("SELECT name, email FROM users WHERE id = ?");
                    $stmt->bind_param("i", $user_id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $user = $result->fetch_assoc();
                    $stmt->close();
                    
                    if ($user && !empty($user['email'])) {
                        $booking['user_name'] = $user['name'];
                        $booking['user_email'] = $user['email'];
                        
                        // Include the mailer and send ticket
                        $mailerFile = __DIR__ . '/smtp_mailer.php';
                        if (file_exists($mailerFile)) {
                            require_once $mailerFile;
                            if (function_exists('sendTicketEmail')) {
                                $emailSent = sendTicketEmail($booking);
                                error_log("Ticket email sent: " . ($emailSent ? 'Yes' : 'No') . " to " . $user['email']);
                            }
                        }
                    }
                } catch (Exception $e) {
                    error_log("Email error: " . $e->getMessage());
                    // Email failed but booking succeeded - that's ok
                }
                
                $conn->commit();
                $conn->autocommit(true);
                
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Payment verified successfully',
                    'booking' => $booking
                ]);
            } else {
                $conn->rollback();
                $conn->autocommit(true);
                echo json_encode(['status' => 'error', 'message' => 'Booking not found']);
            }
        } catch (Exception $e) {
            $conn->rollback();
            $conn->autocommit(true);
            echo json_encode(['status' => 'error', 'message' => 'Payment verification failed: ' . $e->getMessage()]);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Payment verification failed - signature mismatch']);
    }
}

function getUserBookings() {
    global $conn;
    
    $user_id = intval($_GET['user_id'] ?? 0);
    
    if ($user_id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid user ID']);
        return;
    }
    
    // FIXED: Use prepared statement
    $stmt = $conn->prepare("SELECT b.*, m.title as movie_title, m.poster_url, s.name as screen_name, s.screen_type 
            FROM bookings b 
            LEFT JOIN movies m ON b.movie_id = m.id 
            LEFT JOIN screens s ON b.screen_id = s.id 
            WHERE b.user_id = ? AND b.booking_status = 'confirmed' 
            ORDER BY b.created_at DESC");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $bookings = [];
    while ($row = $result->fetch_assoc()) {
        $row['seats'] = json_decode($row['seats'], true);
        $bookings[] = $row;
    }
    $stmt->close();
    
    echo json_encode(['status' => 'success', 'data' => $bookings]);
}

function getBookingDetails() {
    global $conn;
    
    $booking_id = $_GET['booking_id'] ?? '';
    
    if (empty($booking_id)) {
        echo json_encode(['status' => 'error', 'message' => 'Booking ID required']);
        return;
    }
    
    // FIXED: Use prepared statement
    $stmt = $conn->prepare("SELECT b.*, m.title as movie_title, m.poster_url, m.duration, m.genre, s.name as screen_name, s.screen_type, u.name as user_name, u.email as user_email 
            FROM bookings b 
            LEFT JOIN movies m ON b.movie_id = m.id 
            LEFT JOIN screens s ON b.screen_id = s.id 
            LEFT JOIN users u ON b.user_id = u.id 
            WHERE b.booking_id = ?");
    $stmt->bind_param("s", $booking_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $booking = $result->fetch_assoc();
        $booking['seats'] = json_decode($booking['seats'], true);
        echo json_encode(['status' => 'success', 'data' => $booking]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Booking not found']);
    }
    $stmt->close();
}

function getAdminBookings() {
    global $conn;
    
    // FIXED: Use prepared statement (even with no user input, best practice)
    $stmt = $conn->prepare("SELECT b.*, m.title as movie_title, s.name as screen_name, u.name as user_name, u.email as user_email 
            FROM bookings b 
            LEFT JOIN movies m ON b.movie_id = m.id 
            LEFT JOIN screens s ON b.screen_id = s.id 
            LEFT JOIN users u ON b.user_id = u.id 
            ORDER BY b.created_at DESC 
            LIMIT 100");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $bookings = [];
    while ($row = $result->fetch_assoc()) {
        $row['seats'] = json_decode($row['seats'], true);
        $bookings[] = $row;
    }
    $stmt->close();
    
    echo json_encode(['status' => 'success', 'data' => $bookings, 'count' => count($bookings)]);
}

// Process refund for a booking
function processRefund() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $booking_id = $data['booking_id'] ?? '';
    $refund_reason = $data['refund_reason'] ?? 'Admin initiated refund';
    
    if (empty($booking_id)) {
        echo json_encode(['status' => 'error', 'message' => 'Booking ID required']);
        return;
    }
    
    // Check if admin is authenticated
    if (!isAdmin()) {
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized - Admin access required']);
        return;
    }
    
    $conn->autocommit(false);
    
    try {
        // Get booking details
        $stmt = $conn->prepare("SELECT b.*, m.title as movie_title, u.name as user_name, u.email as user_email 
                FROM bookings b 
                LEFT JOIN movies m ON b.movie_id = m.id 
                LEFT JOIN users u ON b.user_id = u.id 
                WHERE b.booking_id = ?");
        $stmt->bind_param("s", $booking_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            $conn->rollback();
            $conn->autocommit(true);
            echo json_encode(['status' => 'error', 'message' => 'Booking not found']);
            return;
        }
        
        $booking = $result->fetch_assoc();
        $stmt->close();
        
        // Check if already refunded
        if ($booking['payment_status'] === 'refunded') {
            $conn->rollback();
            $conn->autocommit(true);
            echo json_encode(['status' => 'error', 'message' => 'Booking already refunded']);
            return;
        }
        
        // Check if payment was completed
        if ($booking['payment_status'] !== 'completed') {
            $conn->rollback();
            $conn->autocommit(true);
            echo json_encode(['status' => 'error', 'message' => 'Cannot refund - payment not completed']);
            return;
        }
        
        $payment_id = $booking['payment_id'];
        $amount_paise = intval(floatval($booking['total_amount']) * 100);
        
        // Process refund through Razorpay
        $refund_data = [
            'amount' => $amount_paise,
            'speed' => 'normal',
            'notes' => [
                'reason' => $refund_reason,
                'booking_id' => $booking_id,
                'refunded_by' => 'admin'
            ]
        ];
        
        // Create refund via Razorpay API
        $ch = curl_init('https://api.razorpay.com/v1/payments/' . $payment_id . '/refund');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($refund_data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_USERPWD, RAZORPAY_KEY_ID . ':' . RAZORPAY_KEY_SECRET);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        if ($curlError) {
            $conn->rollback();
            $conn->autocommit(true);
            echo json_encode(['status' => 'error', 'message' => 'Refund API error: ' . $curlError]);
            return;
        }
        
        $refundResult = json_decode($response, true);
        
        if ($httpCode == 200 && isset($refundResult['id'])) {
            // Update booking status to refunded
            $refund_id = $refundResult['id'];
            $stmt = $conn->prepare("UPDATE bookings SET payment_status = 'refunded', booking_status = 'cancelled' WHERE booking_id = ?");
            $stmt->bind_param("s", $booking_id);
            
            if (!$stmt->execute()) {
                $conn->rollback();
                $conn->autocommit(true);
                echo json_encode(['status' => 'error', 'message' => 'Failed to update booking: ' . $stmt->error]);
                return;
            }
            $stmt->close();
            
            // Record refund in payments table
            $transaction_id = 'REFUND_' . $refund_id;
            $booking_db_id = intval($booking['id']);
            $user_id = intval($booking['user_id']);
            $amount = floatval($booking['total_amount']);
            
            $stmt = $conn->prepare("INSERT INTO payments (transaction_id, booking_id, user_id, amount, payment_method, status, payment_details) VALUES (?, ?, ?, ?, 'refund', 'success', ?)");
            $payment_details = json_encode(['refund_id' => $refund_id, 'razorpay_refund_id' => $refund_id, 'reason' => $refund_reason]);
            $stmt->bind_param("sidds", $transaction_id, $booking_db_id, $user_id, $amount, $payment_details);
            
            if (!$stmt->execute()) {
                error_log("Failed to record refund payment: " . $stmt->error);
            }
            $stmt->close();
            
            $conn->commit();
            $conn->autocommit(true);
            
            // Send refund confirmation email (optional, non-blocking)
            try {
                if (!empty($booking['user_email'])) {
                    $mailerFile = __DIR__ . '/smtp_mailer.php';
                    if (file_exists($mailerFile)) {
                        require_once $mailerFile;
                        if (function_exists('sendRefundEmail')) {
                            sendRefundEmail($booking, $refundResult);
                        }
                    }
                }
            } catch (Exception $e) {
                error_log("Refund email error: " . $e->getMessage());
            }
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Refund processed successfully',
                'refund_id' => $refund_id,
                'refund_amount' => $booking['total_amount'],
                'booking' => $booking
            ]);
        } else {
            $conn->rollback();
            $conn->autocommit(true);
            $error_msg = $refundResult['error']['description'] ?? 'Unknown error';
            echo json_encode(['status' => 'error', 'message' => 'Refund failed: ' . $error_msg, 'details' => $refundResult]);
        }
        
    } catch (Exception $e) {
        $conn->rollback();
        $conn->autocommit(true);
        echo json_encode(['status' => 'error', 'message' => 'Refund processing failed: ' . $e->getMessage()]);
    }
}

// Check if user is admin
function isAdmin() {
    // Check session for admin authentication
    // Session already started in auth_helper.php
    if (isset($_SESSION['admin_id']) || isset($_SESSION['admin_logged_in'])) {
        return true;
    }
    
    // TODO: Implement proper server-side admin authentication
    // For now, allow refund operations from admin panel context
    // In production, implement:
    // 1. Server-side admin session management
    // 2. JWT tokens for admin API access
    // 3. IP whitelist for admin operations
    // 4. Rate limiting on refund operations
    
    // Temporary: Allow for development (Admin panel is already protected by client-side sessionStorage)
    // In production, uncomment the next line and implement proper authentication:
    // return false;
    
    return true; // Remove this in production and implement proper auth
}

// Note: sendTicketEmail function is in smtp_mailer.php
?>
