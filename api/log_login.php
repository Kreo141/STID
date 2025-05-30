<?php
date_default_timezone_set('Asia/Manila');

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['username'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing username']);
    exit;
}

$username = $input['username'];
$timestamp = date('Y-m-d H:i:s');
$logMessage = "$username logged in at $timestamp\n";

file_put_contents('logs/login_log.txt', $logMessage, FILE_APPEND | LOCK_EX);

echo json_encode(['message' => 'Login logged successfully']);
?>
