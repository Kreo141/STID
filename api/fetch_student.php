<?php
$config = include '../config/config.php';

$hostname = "";
$username = "";
$password = "";
$dbName = "";

$conn = new mysqli($hostname, $username, $password, $dbName);

if($conn->connect_error){
    die("Connection error: " . $conn->connect_error);
}

$studentID = $_GET["studentID"];

$sql = "SELECT student_key, student_id, student_name, student_qr_src FROM tblstudents WHERE student_key = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $studentID);
$stmt->execute();
$result = $stmt->get_result();

$row = [];

if($result->num_rows > 0){
    $row = $result->fetch_assoc();
    $row['student_exists'] = true;
}else{
    $row['student_exists'] = false;
}



header("Content-Type: application/json");
echo json_encode($row);

?>