<?php
header('Content-Type: application/json');

// Load database configuration
$config = require '../../config/config.php';

// Create database connection
$conn = new mysqli($config['DB_HOST'], $config['DB_USER'], $config['DB_PASS'], $config['DB_NAME']);

// Check connection
if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed'
    ]);
    exit;
}

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if file was uploaded and required fields are present
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK &&
        isset($_POST['title']) && isset($_POST['description'])) {
        
        $file = $_FILES['image'];
        $title = $_POST['title'];
        $description = $_POST['description'];
        
        // Get file extension
        $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        // Set upload directory (relative to the admin directory)
        $uploadDir = '../../../resources/images/slides/';
        
        // Create directory if it doesn't exist
        if (!file_exists($uploadDir)) {
            if (!mkdir($uploadDir, 0777, true)) {
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to create upload directory'
                ]);
                exit;
            }
        }

        // Get the current highest image number from the database
        $result = $conn->query("SELECT image_url FROM slides ORDER BY id DESC LIMIT 1");
        $nextNumber = 1;
        
        if ($result && $result->num_rows > 0) {
            $lastImage = $result->fetch_assoc()['image_url'];
            if (preg_match('/image(\d+)\./', basename($lastImage), $matches)) {
                $nextNumber = (int)$matches[1] + 1;
            }
        }
        
        // Generate new filename with sequential number
        $newFilename = 'image' . $nextNumber . '.' . $fileExtension;
        $uploadPath = $uploadDir . $newFilename;
        
        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
            // Prepare the image URL for database
            $imageUrl = '../../resources/images/slides/' . $newFilename;
            
            // Prepare SQL statement
            $stmt = $conn->prepare("INSERT INTO slides (image_url, title, description) VALUES (?, ?, ?)");
            $stmt->bind_param("sss", $imageUrl, $title, $description);
            
            // Execute the statement
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'filename' => $newFilename,
                    'path' => $imageUrl,
                    'title' => $title,
                    'description' => $description
                ]);
            } else {
                // If database insertion fails, delete the uploaded file
                unlink($uploadPath);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to save to database'
                ]);
            }
            $stmt->close();
        } else {
            echo json_encode([
                'success' => false,
                'error' => 'Failed to move uploaded file'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Missing required fields or file upload error'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Invalid request method'
    ]);
}

$conn->close();
?> 