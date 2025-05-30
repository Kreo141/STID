<?php
require_once '../../config/database.php';

header('Content-Type: application/json');

ini_set('display_errors', 1);
error_reporting(E_ALL);

$tableName = $_GET['table'] ?? '';

if (!$tableName) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing table name']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT title, date 
        FROM attendance_metadata 
        WHERE table_name = ?
    ");
    $stmt->execute([$tableName]);
    $metadata = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$metadata) {
        throw new Exception('Attendance metadata not found');
    }

    $stmt = $pdo->query("SHOW TABLES LIKE '$tableName'");
    if (!$stmt->fetch()) {
        throw new Exception('Attendance table does not exist');
    }

    $query = "SELECT * FROM `$tableName` ORDER BY created_at DESC";
    $stmt = $pdo->query($query);
    
    if ($stmt === false) {
        throw new Exception('Error executing query: ' . implode(' ', $pdo->errorInfo()));
    }
    
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'title' => $metadata['title'],
        'date' => $metadata['date'],
        'records' => $records
    ]);
} catch (Exception $e) {
    error_log('Error in getAttendanceData.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'details' => 'Error occurred while fetching attendance data'
    ]);
}
?> 