<?php
require "generateQR/phpqrcode/qrlib.php";
$config = require "../config/config.php";

$servername = $config['DB_HOST'];
$username = $config['DB_USER'];
$password = $config['DB_PASS'];
$dbName   = $config['DB_NAME'];

$conn = new mysqli($servername, $username, $password, $dbName);
if ($conn->connect_error) {
    die("DB connection failed: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST["qr_text"])) {
    $qr_text = $_POST["qr_text"];
    $qr_filename = $_POST["filename"];
    $student_id = $_POST["student_id"];
    $student_email = $_POST["student_email"];
    $student_name = explode("_", $qr_text, 2)[1];

    $directory = "../resources/images/qrcodes/";
    $filename = $directory . $qr_filename . "_qrcode.png";
    $client_src = "../" . $directory . $qr_filename . "_qrcode.png";

    if (!is_dir($directory)) {
        mkdir($directory, 0777, true);
    }

    QRcode::png($qr_text, $filename, QR_ECLEVEL_L, 10);

    $stmt = $conn->prepare("INSERT INTO tblstudents (student_key, student_id, student_name, student_qr_src) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE student_id=VALUES(student_id), student_name=VALUES(student_name)");
    $stmt->bind_param("ssss", $student_email, $student_id, $student_name, $client_src);
    $stmt->execute();
    $stmt->close();

    $conn->close();
    exit();
}
?>