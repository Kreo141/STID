<?php

$hostname = "";
$username = "";
$password = "";
$dbName = "";

$conn = new mysqli($hostname, $username, $password, $dbName);

if($conn->connect_error){
    die("Connection Error: " . $conn->connect_error);
}

$sql = "SELECT album_id, album_title, album_image_url FROM albums";
$result = $conn->query($sql);

$albums = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $albums[] = $row;
    }
}

$conn->close();

header('Content-Type: application/json');
echo json_encode($albums);

?>