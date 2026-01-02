<?php
/**
 * Screens API
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

try {
    switch ($method) {
        case 'GET':
            getScreens();
            break;
        case 'POST':
            addScreen();
            break;
        case 'PUT':
            updateScreen();
            break;
        case 'DELETE':
            deleteScreen();
            break;
        default:
            echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function getScreens() {
    global $conn;
    
    $sql = "SELECT * FROM screens ORDER BY id ASC";
    $result = $conn->query($sql);
    
    if ($result) {
        $screens = [];
        while ($row = $result->fetch_assoc()) {
            $screens[] = $row;
        }
        echo json_encode(['status' => 'success', 'data' => $screens]);
    } else {
        echo json_encode(['status' => 'success', 'data' => []]);
    }
}

function addScreen() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $name = $conn->real_escape_string($data['name'] ?? '');
    $screen_type = $conn->real_escape_string($data['screen_type'] ?? 'Standard');
    $total_seats = intval($data['total_seats'] ?? 0);
    $rows_count = intval($data['rows_count'] ?? 0);
    $seats_per_row = intval($data['seats_per_row'] ?? 0);
    $price_standard = floatval($data['price_standard'] ?? 250);
    $price_premium = floatval($data['price_premium'] ?? 350);
    
    $sql = "INSERT INTO screens (name, screen_type, total_seats, rows_count, seats_per_row, price_standard, price_premium) 
            VALUES ('$name', '$screen_type', $total_seats, $rows_count, $seats_per_row, $price_standard, $price_premium)";
    
    if ($conn->query($sql)) {
        echo json_encode(['status' => 'success', 'message' => 'Screen added successfully', 'screen_id' => $conn->insert_id]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to add screen']);
    }
}

function updateScreen() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? 0);
    
    if ($id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid screen ID']);
        return;
    }
    
    $updates = [];
    if (isset($data['name'])) $updates[] = "name = '" . $conn->real_escape_string($data['name']) . "'";
    if (isset($data['screen_type'])) $updates[] = "screen_type = '" . $conn->real_escape_string($data['screen_type']) . "'";
    if (isset($data['total_seats'])) $updates[] = "total_seats = " . intval($data['total_seats']);
    
    if (empty($updates)) {
        echo json_encode(['status' => 'error', 'message' => 'No fields to update']);
        return;
    }
    
    $sql = "UPDATE screens SET " . implode(', ', $updates) . " WHERE id = $id";
    
    if ($conn->query($sql)) {
        echo json_encode(['status' => 'success', 'message' => 'Screen updated successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to update screen']);
    }
}

function deleteScreen() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? $_GET['id'] ?? 0);
    
    if ($id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid screen ID']);
        return;
    }
    
    $sql = "DELETE FROM screens WHERE id = $id";
    
    if ($conn->query($sql)) {
        echo json_encode(['status' => 'success', 'message' => 'Screen deleted successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to delete screen']);
    }
}
?>
