<?php
require_once "../../config/database.php";

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

$username = $data['username'];
$oldPassword = $data['oldPassword'];
$newPassword = $data['newPassword'];

$response = [];
$response['status'] = 0;

try{
    $stmt = $pdo->prepare("SELECT * FROM admin WHERE username = :username LIMIT 1");
    $stmt->execute(['username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        $response['status'] = 2;
        echo json_encode($response);
        exit;
    }

    if (password_verify($oldPassword, $user['password'])) {
        $hashedNewPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE admin SET password= :password WHERE username = :username LIMIT 1");
        $stmt->execute(['username' => $username, 'password' => $hashedNewPassword]);
        
        $response['status'] = 1;
        echo json_encode($response);
    } else {
        $response['status'] = 2;
        echo json_encode($response);
    }
}catch(PDOException $e){
    $response['status'] = 3;
    echo json_encode($response);
}
?>