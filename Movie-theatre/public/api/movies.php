<?php
/**
 * Movies API - CRUD Operations
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
            if ($action === 'single' && isset($_GET['id'])) {
                getMovie($_GET['id']);
            } else {
                getMovies();
            }
            break;
        case 'POST':
            addMovie();
            break;
        case 'PUT':
            updateMovie();
            break;
        case 'DELETE':
            deleteMovie();
            break;
        default:
            echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

// Get all movies
function getMovies() {
    global $conn;
    
    $sql = "SELECT * FROM movies ORDER BY created_at DESC";
    $result = $conn->query($sql);
    
    if ($result) {
        $movies = [];
        while ($row = $result->fetch_assoc()) {
            $movies[] = $row;
        }
        echo json_encode(['status' => 'success', 'data' => $movies, 'count' => count($movies)]);
    } else {
        echo json_encode(['status' => 'success', 'data' => [], 'count' => 0]);
    }
}

// Get single movie
function getMovie($id) {
    global $conn;
    
    $id = intval($id);
    $sql = "SELECT * FROM movies WHERE id = $id";
    $result = $conn->query($sql);
    
    if ($result && $result->num_rows > 0) {
        $movie = $result->fetch_assoc();
        echo json_encode(['status' => 'success', 'data' => $movie]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Movie not found']);
    }
}

// Add new movie
function addMovie() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        $data = $_POST;
    }
    
    $title = $conn->real_escape_string($data['title'] ?? '');
    $description = $conn->real_escape_string($data['description'] ?? '');
    $genre = $conn->real_escape_string($data['genre'] ?? '');
    $sub_genre = $conn->real_escape_string($data['sub_genre'] ?? '');
    $duration = $conn->real_escape_string($data['duration'] ?? '');
    $rating = floatval($data['rating'] ?? 0);
    $badge = $conn->real_escape_string($data['badge'] ?? 'Standard');
    $poster_url = $conn->real_escape_string($data['poster_url'] ?? '');
    $cloudinary_id = $conn->real_escape_string($data['cloudinary_id'] ?? '');
    $status = $conn->real_escape_string($data['status'] ?? 'now_showing');
    
    if (empty($title) || empty($genre) || empty($duration)) {
        echo json_encode(['status' => 'error', 'message' => 'Title, genre, and duration are required']);
        return;
    }
    
    $sql = "INSERT INTO movies (title, description, genre, sub_genre, duration, rating, badge, poster_url, cloudinary_id, status) 
            VALUES ('$title', '$description', '$genre', '$sub_genre', '$duration', $rating, '$badge', '$poster_url', '$cloudinary_id', '$status')";
    
    if ($conn->query($sql)) {
        $movieId = $conn->insert_id;
        echo json_encode([
            'status' => 'success', 
            'message' => 'Movie added successfully',
            'movie_id' => $movieId
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to add movie: ' . $conn->error]);
    }
}

// Update movie
function updateMovie() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? 0);
    
    if ($id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Movie ID is required']);
        return;
    }
    
    $updates = [];
    
    if (isset($data['title'])) $updates[] = "title = '" . $conn->real_escape_string($data['title']) . "'";
    if (isset($data['description'])) $updates[] = "description = '" . $conn->real_escape_string($data['description']) . "'";
    if (isset($data['genre'])) $updates[] = "genre = '" . $conn->real_escape_string($data['genre']) . "'";
    if (isset($data['sub_genre'])) $updates[] = "sub_genre = '" . $conn->real_escape_string($data['sub_genre']) . "'";
    if (isset($data['duration'])) $updates[] = "duration = '" . $conn->real_escape_string($data['duration']) . "'";
    if (isset($data['rating'])) $updates[] = "rating = " . floatval($data['rating']);
    if (isset($data['badge'])) $updates[] = "badge = '" . $conn->real_escape_string($data['badge']) . "'";
    if (isset($data['poster_url'])) $updates[] = "poster_url = '" . $conn->real_escape_string($data['poster_url']) . "'";
    if (isset($data['status'])) $updates[] = "status = '" . $conn->real_escape_string($data['status']) . "'";
    
    if (empty($updates)) {
        echo json_encode(['status' => 'error', 'message' => 'No fields to update']);
        return;
    }
    
    $sql = "UPDATE movies SET " . implode(', ', $updates) . " WHERE id = $id";
    
    if ($conn->query($sql)) {
        echo json_encode(['status' => 'success', 'message' => 'Movie updated successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to update movie']);
    }
}

// Delete movie
function deleteMovie() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? $_GET['id'] ?? 0);
    
    if ($id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Movie ID is required']);
        return;
    }
    
    $sql = "DELETE FROM movies WHERE id = $id";
    
    if ($conn->query($sql)) {
        echo json_encode(['status' => 'success', 'message' => 'Movie deleted successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to delete movie']);
    }
}
?>
