<?php
require_once '../../config/database.php';

header('Content-Type: application/json');

ini_set('display_errors', 1);
error_reporting(E_ALL);

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['table_name']) || !isset($data['title']) || !isset($data['date'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

try {

    $stmt = $pdo->query("SHOW TABLES LIKE '{$data['table_name']}'");
    if (!$stmt->fetch()) {
        throw new Exception('Attendance table does not exist');
    }

    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        UPDATE attendance_metadata 
        SET title = ?, date = ?
        WHERE table_name = ?
    ");
    
    $updateResult = $stmt->execute([
        $data['title'],
        $data['date'],
        $data['table_name']
    ]);

    if (!$updateResult) {
        throw new Exception('Failed to update metadata: ' . implode(' ', $stmt->errorInfo()));
    }

    if ($stmt->rowCount() === 0) {
        throw new Exception('No metadata found for this table');
    }

    $stmt = $pdo->prepare("
        SELECT event_id 
        FROM attendance_metadata 
        WHERE table_name = ?
    ");
    $stmt->execute([$data['table_name']]);
    $metadata = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($metadata && $metadata['event_id']) {
        
        $stmt = $pdo->prepare("
            UPDATE events 
            SET date = ? 
            WHERE event_id = ?
        ");
        
        $eventUpdateResult = $stmt->execute([
            $data['date'],
            $metadata['event_id']
        ]);

        if (!$eventUpdateResult) {
            throw new Exception('Failed to update linked event: ' . implode(' ', $stmt->errorInfo()));
        }
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Attendance updated successfully'
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    error_log('Error in updateAttendance.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'details' => 'Error occurred while updating attendance'
    ]);
}
?> 