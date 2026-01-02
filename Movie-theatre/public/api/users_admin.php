<?php
/**
 * Users Admin API - Fetch and manage users
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
    switch ($method) {
        case 'GET':
            if ($action === 'stats') {
                getStats();
            } else {
                getUsers();
            }
            break;
        case 'PUT':
            updateUser();
            break;
        case 'DELETE':
            deleteUser();
            break;
        default:
            echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function getUsers() {
    global $conn;
    
    $sql = "SELECT id, name, email, phone, is_verified, created_at FROM users ORDER BY created_at DESC";
    $result = $conn->query($sql);
    
    if ($result) {
        $users = [];
        while ($row = $result->fetch_assoc()) {
            $row['status'] = 'active';
            $row['joined_date'] = $row['created_at'];
            $users[] = $row;
        }
        echo json_encode(['status' => 'success', 'data' => $users, 'count' => count($users)]);
    } else {
        echo json_encode(['status' => 'success', 'data' => [], 'count' => 0]);
    }
}

function getStats() {
    global $conn;
    
    $stats = [
        'total_users' => 0,
        'active_users' => 0,
        'verified_users' => 0,
        'total_movies' => 0,
        'now_showing' => 0,
        'total_bookings' => 0,
        'total_revenue' => 0,
        'today_bookings' => 0
    ];
    
    // Total users
    $result = $conn->query("SELECT COUNT(*) as count FROM users");
    if ($result) {
        $row = $result->fetch_assoc();
        $stats['total_users'] = intval($row['count']);
        $stats['active_users'] = intval($row['count']);
    }
    
    // Verified users
    $result = $conn->query("SELECT COUNT(*) as count FROM users WHERE is_verified = 1");
    if ($result) {
        $row = $result->fetch_assoc();
        $stats['verified_users'] = intval($row['count']);
    }
    
    // Total movies
    $result = $conn->query("SELECT COUNT(*) as count FROM movies");
    if ($result) {
        $row = $result->fetch_assoc();
        $stats['total_movies'] = intval($row['count']);
        $stats['now_showing'] = intval($row['count']);
    }
    
    // Total bookings
    $result = $conn->query("SELECT COUNT(*) as count FROM bookings");
    if ($result) {
        $row = $result->fetch_assoc();
        $stats['total_bookings'] = intval($row['count']);
    }
    
    // Total revenue
    $result = $conn->query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'success'");
    if ($result) {
        $row = $result->fetch_assoc();
        $stats['total_revenue'] = floatval($row['total']);
    }
    
    echo json_encode(['status' => 'success', 'data' => $stats]);
}

function updateUser() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? 0);
    
    if ($id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid user ID']);
        return;
    }
    
    $updates = [];
    if (isset($data['name'])) {
        $name = $conn->real_escape_string($data['name']);
        $updates[] = "name = '$name'";
    }
    if (isset($data['phone'])) {
        $phone = $conn->real_escape_string($data['phone']);
        $updates[] = "phone = '$phone'";
    }
    
    if (empty($updates)) {
        echo json_encode(['status' => 'error', 'message' => 'No fields to update']);
        return;
    }
    
    $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = $id";
    
    if ($conn->query($sql)) {
        echo json_encode(['status' => 'success', 'message' => 'User updated successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to update user']);
    }
}

function deleteUser() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? $_GET['id'] ?? 0);
    
    if ($id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid user ID']);
        return;
    }
    
    $sql = "DELETE FROM users WHERE id = $id";
    
    if ($conn->query($sql)) {
        echo json_encode(['status' => 'success', 'message' => 'User deleted successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to delete user']);
    }
}
?>
