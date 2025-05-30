<?php
header('Content-Type: application/json');

// BASIC SHITS
$config = require '../../config/config.php';

$conn = new mysqli($config['DB_HOST'], $config['DB_USER'], $config['DB_PASS'], $config['DB_NAME']);

if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed'
    ]);
    exit;
}
// BASIC SHITS

// fetch all slides
$sql = "SELECT id, image_url, title, description FROM slides ORDER BY id DESC";
$result = $conn->query($sql);

$slides = [];
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $filename = basename($row['image_url']);
        $row['filename'] = $filename;
        $slides[] = $row;
    }
}

echo json_encode([
    'success' => true,
    'slides' => $slides
]);

$conn->close();
?> 