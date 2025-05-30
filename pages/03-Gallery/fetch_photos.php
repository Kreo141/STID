<?php
header('Content-Type: application/json');
$config = require '../../config/config.php'; 

$hostname = $config['DB_HOST'];
$username = $config['DB_USER'];
$password = $config["DB_PASS"];
$dbName = $config['DB_NAME'];

$conn = new mysqli($hostname, $username, $password, $dbName);

if($conn->connect_error){
    die("Connection Error: " . $conn->connect_error);
}

if (isset($_GET['galleryId'])) {
    $galleryId = intval($_GET['galleryId']);
    
    $stmt = $conn->prepare("SELECT photo_id, gallery_id, photo_url FROM photos WHERE gallery_id = ?");
    $stmt->bind_param("i", $galleryId);
    $stmt->execute();
    
    $result = $stmt->get_result();
    $photos = [];

    while ($row = $result->fetch_assoc()) {
        $photos[] = $row;
    }

    echo json_encode($photos);
}

$conn->close();
?>
