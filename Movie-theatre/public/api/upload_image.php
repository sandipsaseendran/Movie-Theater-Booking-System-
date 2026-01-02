<?php
/**
 * Local Image Upload API
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Only POST method allowed']);
    exit;
}

// Create uploads directory if it doesn't exist
$uploadDir = __DIR__ . '/../asset/uploads/posters/';
if (!file_exists($uploadDir)) {
    if (!mkdir($uploadDir, 0777, true)) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to create upload directory']);
        exit;
    }
}

// Check for file - accept both 'poster' and 'image' field names
$file = null;
if (isset($_FILES['poster']) && $_FILES['poster']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['poster'];
} elseif (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['image'];
}

if (!$file) {
    $error = 'No file uploaded';
    if (isset($_FILES['poster'])) {
        $error .= ' (poster error: ' . $_FILES['poster']['error'] . ')';
    }
    if (isset($_FILES['image'])) {
        $error .= ' (image error: ' . $_FILES['image']['error'] . ')';
    }
    echo json_encode(['status' => 'error', 'message' => $error, 'files' => array_keys($_FILES)]);
    exit;
}

$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
$allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if (!in_array($ext, $allowedExts)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid file type. Only JPEG, PNG, GIF, WEBP allowed. Got: ' . $ext]);
    exit;
}

// Max 10MB
if ($file['size'] > 10 * 1024 * 1024) {
    echo json_encode(['status' => 'error', 'message' => 'File too large. Max 10MB allowed']);
    exit;
}

// Generate unique filename
$filename = 'poster_' . time() . '_' . uniqid() . '.' . $ext;
$filepath = $uploadDir . $filename;

if (move_uploaded_file($file['tmp_name'], $filepath)) {
    // Return the URL relative to public folder
    $imageUrl = 'asset/uploads/posters/' . $filename;
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Image uploaded successfully',
        'url' => $imageUrl,
        'filename' => $filename
    ]);
} else {
    echo json_encode([
        'status' => 'error', 
        'message' => 'Failed to save image. Check folder permissions.',
        'upload_dir' => $uploadDir,
        'filepath' => $filepath
    ]);
}
?>
