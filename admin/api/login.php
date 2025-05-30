<?php
require_once '../config/database.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['username']) || !isset($input['password'])) {
    echo json_encode(false);
    exit;
}

$username = $input['username'];
$password = $input['password'];
$device = $input['device'] ?? 'Unknown device';

function getClientIP() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) return $_SERVER['HTTP_CLIENT_IP'];
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) return $_SERVER['HTTP_X_FORWARDED_FOR'];
    return $_SERVER['REMOTE_ADDR'];
}

try {
    $stmt = $pdo->prepare("SELECT * FROM admin WHERE username = :username LIMIT 1");
    $stmt->execute(['username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(false);
        exit;
    }

    if (password_verify($password, $user['password'])) {
        $ip = getClientIP();
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "$timestamp | LOGIN SUCCESS | Username: $username | IP: $ip | Device: $device" . PHP_EOL;

        file_put_contents('adminLogs.txt', $logEntry, FILE_APPEND | LOCK_EX);

        echo json_encode(true);
    } else {
        $ip = getClientIP();
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "$timestamp | LOGIN FAILED  | Username: $username | IP: $ip | Device: $device" . PHP_EOL;

        file_put_contents('adminLogs.txt', $logEntry, FILE_APPEND | LOCK_EX);

        echo json_encode(false);
    }
} catch (PDOException $e) {
    error_log("DB error: " . $e->getMessage());
    echo json_encode(false);
}
