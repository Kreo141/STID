<?php
$config = require '../../config/config.php'; 

$hostname = $config['DB_HOST'];
$username = $config['DB_USER'];
$password = $config["DB_PASS"];
$dbName = $config['DB_NAME'];

$conn = new mysqli($hostname, $username, $password, $dbName);

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed"]));
}

$galleryId = isset($_GET['galleryId']) ? intval($_GET['galleryId']) : 0;

$response = ["error" => "Invalid gallery ID"];

if ($galleryId > 0) {
    $stmt = $conn->prepare("SELECT album_title FROM albums WHERE album_id = ?");
    $stmt->bind_param("i", $galleryId);
    $stmt->execute();
    $stmt->bind_result($albumTitle);
    
    if ($stmt->fetch()) {
        $response = ["album_title" => $albumTitle];
    } else {
        $response = ["error" => "Album not found"];
    }

    $stmt->close();
}

$conn->close();
+
header("Content-Type: application/json");
echo json_encode($response);
?>