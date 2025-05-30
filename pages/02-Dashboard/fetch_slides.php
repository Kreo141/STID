<?php

$hostname = "";
$username = "";
$password = "";
$dbName = "";

$conn = new mysqli($hostname, $username, $password, $dbName);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$sql = "SELECT * FROM slides ORDER BY id ASC";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        echo '<div class="mySlides fade">
                <img src="' . htmlspecialchars($row["image_url"]) . '" alt="' . htmlspecialchars($row["title"]) . '">
                <div class="slide-content">
                    <h2 class="slide-title">' . htmlspecialchars($row["title"]) . '</h2>
                    <p class="slide-description">' . htmlspecialchars($row["description"]) . '</p>
                </div>
              </div>';
    }
} else {
    echo "No slides available.";
}

$conn->close();
?>
