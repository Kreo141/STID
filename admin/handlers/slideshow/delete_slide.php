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

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id'])) {
    $id = (int)$_POST['id'];
    
    // kunin muna ang url sa file na i delete
    $stmt = $conn->prepare("SELECT image_url FROM slides WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        $imageUrl = $row['image_url'];
        // mao nani sya, dugay kaayo ko na na stuck diri <:
        $imagePath = str_replace('../../', '../../../', $imageUrl);
        
        // i delete sa database sa
        $deleteStmt = $conn->prepare("DELETE FROM slides WHERE id = ?");
        $deleteStmt->bind_param("i", $id);
        
        if ($deleteStmt->execute()) {
            // if success ang pag delete sa database i delete na ang file
            if (file_exists($imagePath)) {
                if (unlink($imagePath)) {
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode([
                        'success' => false,
                        'error' => 'Database record deleted but failed to delete image file'
                    ]);
                }
            } else {
                echo json_encode([
                    'success' => true,
                    'warning' => 'Database record deleted but image file not found'
                ]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'error' => 'Failed to delete from database'
            ]);
        }
        $deleteStmt->close();
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Slide not found'
        ]);
    }
    $stmt->close();
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Invalid request'
    ]);
}

$conn->close();
?> 