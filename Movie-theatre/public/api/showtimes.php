<?php
/**
 * Showtimes API - Manage movie showtimes for screens
 */

error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch ($action) {
        case 'get_by_movie':
            getShowtimesByMovie();
            break;
        case 'get_by_screen':
            getShowtimesByScreen();
            break;
        case 'get_all':
            getAllShowtimes();
            break;
        case 'add':
            addShowtime();
            break;
        case 'update':
            updateShowtime();
            break;
        case 'delete':
            deleteShowtime();
            break;
        case 'get_available_dates':
            getAvailableDates();
            break;
        case 'get_times_for_date':
            getTimesForDate();
            break;
        default:
            if ($method === 'GET') {
                getAllShowtimes();
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
            }
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function getAllShowtimes() {
    global $conn;
    
    $sql = "SELECT st.*, m.title as movie_title, m.poster_url, s.name as screen_name, s.screen_type, s.total_seats
            FROM showtimes st
            JOIN movies m ON st.movie_id = m.id
            JOIN screens s ON st.screen_id = s.id
            WHERE st.show_date >= CURDATE()
            ORDER BY st.show_date ASC, st.show_time ASC";
    
    $result = $conn->query($sql);
    
    $showtimes = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            // Calculate actual seats available
            $showtime_id = intval($row['id']);
            $total_seats = intval($row['total_seats']);
            
            // Count booked seats for this showtime - FIXED: Only count completed payments
            $booked_stmt = $conn->prepare("SELECT seats FROM bookings WHERE showtime_id = ? AND payment_status = 'completed' AND booking_status = 'confirmed'");
            $booked_stmt->bind_param("i", $showtime_id);
            $booked_stmt->execute();
            $booked_result = $booked_stmt->get_result();
            
            $booked_count = 0;
            while ($booking_row = $booked_result->fetch_assoc()) {
                $seats = json_decode($booking_row['seats'], true);
                if (is_array($seats)) {
                    $booked_count += count($seats);
                }
            }
            $booked_stmt->close();
            
            // Count locked seats (temporary reservations during booking process)
            $locked_stmt = $conn->prepare("SELECT COUNT(*) as locked_count FROM seat_locks WHERE showtime_id = ? AND lock_expires_at > NOW()");
            $locked_stmt->bind_param("i", $showtime_id);
            $locked_stmt->execute();
            $locked_result = $locked_stmt->get_result();
            $locked_row = $locked_result->fetch_assoc();
            $locked_count = intval($locked_row['locked_count'] ?? 0);
            $locked_stmt->close();
            
            // Calculate seats left (excluding booked and locked seats)
            $seats_left = max(0, $total_seats - $booked_count - $locked_count);
            $row['seats_left'] = $seats_left;
            $row['seats_booked'] = $booked_count;
            $row['seats_locked'] = $locked_count;
            $row['total_seats'] = $total_seats;
            
            $showtimes[] = $row;
        }
    }
    
    echo json_encode(['status' => 'success', 'data' => $showtimes]);
}

function getShowtimesByMovie() {
    global $conn;
    
    $movie_id = intval($_GET['movie_id'] ?? 0);
    
    if ($movie_id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid movie ID']);
        return;
    }
    
    // Get unique screens for this movie
    $screensSql = "SELECT DISTINCT s.id, s.name, s.screen_type, s.total_seats, s.rows_count, s.seats_per_row
                   FROM showtimes st
                   JOIN screens s ON st.screen_id = s.id
                   WHERE st.movie_id = $movie_id 
                   AND st.show_date >= CURDATE()
                   AND st.status = 'active'
                   ORDER BY s.id";
    
    $screensResult = $conn->query($screensSql);
    $screens = [];
    if ($screensResult) {
        while ($row = $screensResult->fetch_assoc()) {
            $screens[] = $row;
        }
    }
    
    // Get all showtimes grouped by screen and date
    $showtimesSql = "SELECT st.*, s.name as screen_name, s.screen_type
                     FROM showtimes st
                     JOIN screens s ON st.screen_id = s.id
                     WHERE st.movie_id = $movie_id 
                     AND st.show_date >= CURDATE()
                     AND st.status = 'active'
                     ORDER BY st.screen_id, st.show_date, st.show_time";
    
    $showtimesResult = $conn->query($showtimesSql);
    $showtimes = [];
    if ($showtimesResult) {
        while ($row = $showtimesResult->fetch_assoc()) {
            $showtimes[] = $row;
        }
    }
    
    // Group showtimes by screen
    $groupedByScreen = [];
    foreach ($showtimes as $st) {
        $screenId = $st['screen_id'];
        if (!isset($groupedByScreen[$screenId])) {
            $groupedByScreen[$screenId] = [
                'screen_id' => $screenId,
                'screen_name' => $st['screen_name'],
                'screen_type' => $st['screen_type'],
                'dates' => []
            ];
        }
        
        $date = $st['show_date'];
        if (!isset($groupedByScreen[$screenId]['dates'][$date])) {
            $groupedByScreen[$screenId]['dates'][$date] = [];
        }
        
        $groupedByScreen[$screenId]['dates'][$date][] = [
            'id' => $st['id'],
            'time' => $st['show_time'],
            'price_standard' => $st['price_standard'],
            'price_premium' => $st['price_premium'],
            'available_seats' => $st['available_seats']
        ];
    }
    
    echo json_encode([
        'status' => 'success',
        'screens' => $screens,
        'showtimes' => array_values($groupedByScreen),
        'raw_showtimes' => $showtimes
    ]);
}

function getShowtimesByScreen() {
    global $conn;
    
    $screen_id = intval($_GET['screen_id'] ?? 0);
    $date = $conn->real_escape_string($_GET['date'] ?? date('Y-m-d'));
    
    $sql = "SELECT st.*, m.title as movie_title, m.poster_url 
            FROM showtimes st
            JOIN movies m ON st.movie_id = m.id
            WHERE st.screen_id = $screen_id 
            AND st.show_date = '$date'
            AND st.status = 'active'
            ORDER BY st.show_time ASC";
    
    $result = $conn->query($sql);
    
    $showtimes = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $showtimes[] = $row;
        }
    }
    
    echo json_encode(['status' => 'success', 'data' => $showtimes]);
}

function getAvailableDates() {
    global $conn;
    
    $movie_id = intval($_GET['movie_id'] ?? 0);
    $screen_id = intval($_GET['screen_id'] ?? 0);
    
    $sql = "SELECT DISTINCT show_date FROM showtimes 
            WHERE movie_id = $movie_id 
            AND screen_id = $screen_id 
            AND show_date >= CURDATE()
            AND status = 'active'
            ORDER BY show_date ASC";
    
    $result = $conn->query($sql);
    
    $dates = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $dates[] = $row['show_date'];
        }
    }
    
    echo json_encode(['status' => 'success', 'data' => $dates]);
}

function getTimesForDate() {
    global $conn;
    
    $movie_id = intval($_GET['movie_id'] ?? 0);
    $screen_id = intval($_GET['screen_id'] ?? 0);
    $date = $conn->real_escape_string($_GET['date'] ?? date('Y-m-d'));
    
    $sql = "SELECT id, show_time, price_standard, price_premium, available_seats 
            FROM showtimes 
            WHERE movie_id = $movie_id 
            AND screen_id = $screen_id 
            AND show_date = '$date'
            AND status = 'active'
            ORDER BY show_time ASC";
    
    $result = $conn->query($sql);
    
    $times = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $times[] = $row;
        }
    }
    
    echo json_encode(['status' => 'success', 'data' => $times]);
}

function addShowtime() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $movie_id = intval($data['movie_id'] ?? 0);
    $screen_id = intval($data['screen_id'] ?? 0);
    $show_date = $conn->real_escape_string($data['show_date'] ?? '');
    $show_time = $conn->real_escape_string($data['show_time'] ?? '');
    $price_standard = floatval($data['price_standard'] ?? 0);
    $price_premium = floatval($data['price_premium'] ?? 0);
    
    if ($movie_id <= 0 || $screen_id <= 0 || empty($show_date) || empty($show_time)) {
        echo json_encode(['status' => 'error', 'message' => 'Movie, screen, date and time are required']);
        return;
    }
    
    // Get screen capacity
    $screenResult = $conn->query("SELECT total_seats FROM screens WHERE id = $screen_id");
    $screen = $screenResult ? $screenResult->fetch_assoc() : null;
    $available_seats = $screen ? $screen['total_seats'] : 100;
    
    // Check for duplicate
    $checkSql = "SELECT id FROM showtimes WHERE movie_id = $movie_id AND screen_id = $screen_id AND show_date = '$show_date' AND show_time = '$show_time'";
    $checkResult = $conn->query($checkSql);
    
    if ($checkResult && $checkResult->num_rows > 0) {
        echo json_encode(['status' => 'error', 'message' => 'This showtime already exists']);
        return;
    }
    
    // Check for time conflict on same screen
    $conflictSql = "SELECT id, show_time FROM showtimes 
                    WHERE screen_id = $screen_id 
                    AND show_date = '$show_date' 
                    AND ABS(TIME_TO_SEC(TIMEDIFF(show_time, '$show_time'))) < 10800"; // 3 hours gap
    $conflictResult = $conn->query($conflictSql);
    
    if ($conflictResult && $conflictResult->num_rows > 0) {
        $conflict = $conflictResult->fetch_assoc();
        echo json_encode(['status' => 'error', 'message' => "Time conflict! Another show at {$conflict['show_time']} on this screen. Minimum 3 hours gap required."]);
        return;
    }
    
    $sql = "INSERT INTO showtimes (movie_id, screen_id, show_date, show_time, price_standard, price_premium, available_seats, status) 
            VALUES ($movie_id, $screen_id, '$show_date', '$show_time', $price_standard, $price_premium, $available_seats, 'active')";
    
    if ($conn->query($sql)) {
        echo json_encode(['status' => 'success', 'message' => 'Showtime added successfully', 'id' => $conn->insert_id]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to add showtime: ' . $conn->error]);
    }
}

function updateShowtime() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? 0);
    
    if ($id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid showtime ID']);
        return;
    }
    
    $fields = [];
    if (isset($data['show_date'])) $fields[] = "show_date = '" . $conn->real_escape_string($data['show_date']) . "'";
    if (isset($data['show_time'])) $fields[] = "show_time = '" . $conn->real_escape_string($data['show_time']) . "'";
    if (isset($data['price_standard'])) $fields[] = "price_standard = " . floatval($data['price_standard']);
    if (isset($data['price_premium'])) $fields[] = "price_premium = " . floatval($data['price_premium']);
    if (isset($data['status'])) $fields[] = "status = '" . $conn->real_escape_string($data['status']) . "'";
    
    if (empty($fields)) {
        echo json_encode(['status' => 'error', 'message' => 'No fields to update']);
        return;
    }
    
    $sql = "UPDATE showtimes SET " . implode(', ', $fields) . " WHERE id = $id";
    
    if ($conn->query($sql)) {
        echo json_encode(['status' => 'success', 'message' => 'Showtime updated']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to update']);
    }
}

function deleteShowtime() {
    global $conn;
    
    $id = intval($_GET['id'] ?? 0);
    
    if ($id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid showtime ID']);
        return;
    }
    
    if ($conn->query("DELETE FROM showtimes WHERE id = $id")) {
        echo json_encode(['status' => 'success', 'message' => 'Showtime deleted']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to delete']);
    }
}
?>

