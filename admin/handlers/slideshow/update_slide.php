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
    $title = $_POST['title'];
    $description = $_POST['description'];
    
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        // get old image tapos i delete
        $stmt = $conn->prepare("SELECT image_url FROM slides WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $oldImage = $result->fetch_assoc()['image_url'];
        $stmt->close();
        
        // extract ang number gikan sa old image filename
        preg_match('/image(\d+)\./', basename($oldImage), $matches);
        $imageNumber = isset($matches[1]) ? $matches[1] : '1';
        
        // upload new image
        $file = $_FILES['image'];
        $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $uploadDir = '../../../resources/images/slides/';
        
        // use the same number as the old image (PARA DILI MO FUCKING CONFLICT)
        $newFilename = 'image' . $imageNumber . '.' . $fileExtension;
        $uploadPath = $uploadDir . $newFilename;
        
        if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
            // diri na i update to new image
            $imageUrl = '../../resources/images/slides/' . $newFilename;
            $stmt = $conn->prepare("UPDATE slides SET title = ?, description = ?, image_url = ? WHERE id = ?");
            $stmt->bind_param("sssi", $title, $description, $imageUrl, $id);
            
            if ($stmt->execute()) {
                $oldImagePath = "../../../" . $oldImage;
                if (file_exists($oldImagePath) && $oldImagePath !== $uploadPath) {
                    unlink($oldImagePath);
                }
                echo json_encode(['success' => true]);
            } else {
                unlink($uploadPath);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to update database'
                ]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'error' => 'Failed to upload new image'
            ]);
        }
    } else {
        // Update title and description (ONLY)
        $stmt = $conn->prepare("UPDATE slides SET title = ?, description = ? WHERE id = ?");
        $stmt->bind_param("ssi", $title, $description, $id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode([
                'success' => false,
                'error' => 'Failed to update database'
            ]);
        }
    }
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Invalid request'
    ]);
}

$conn->close();
?> 