<?php
$config = require '../../config/config.php';
$conn = new mysqli($config['DB_HOST'], $config['DB_USER'], $config['DB_PASS'], $config['DB_NAME']);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$tableName = $_GET['table'];

$sql = "SELECT student_name, id, student_email, time_in_am, time_out_am, time_in_pm, time_out_pm FROM `$tableName` ORDER BY student_name";
$result = $conn->query($sql);

$data = [];

if ($result === false) {
    http_response_code(500);
    echo json_encode(["error" => "Query failed: " . $conn->error]);
    exit;
}

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
}

header('Content-Type: application/json');
echo json_encode($data);
?>
