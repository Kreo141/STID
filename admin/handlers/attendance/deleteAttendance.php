<?php
require_once '../../config/database.php';

header('Content-Type: application/json');

ini_set('display_errors', 1);
error_reporting(E_ALL);

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['table_name'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing table name']);
    exit;
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
    $stmt->execute([$data['table_name']]);
    if (!$stmt->fetch()) {
        throw new Exception('Attendance table does not exist');
    }

    $stmt = $pdo->prepare("DELETE FROM attendance_metadata WHERE table_name = ?");
    if (!$stmt->execute([$data['table_name']])) {
        throw new Exception('Failed to delete metadata: ' . implode(' ', $stmt->errorInfo()));
    }

    $tableName = preg_replace('/[^a-zA-Z0-9_]/', '', $data['table_name']);
    $dropStmt = $pdo->prepare("DROP TABLE IF EXISTS `$tableName`");
    if (!$dropStmt->execute()) {
        throw new Exception('Failed to delete attendance table: ' . implode(' ', $dropStmt->errorInfo()));
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Attendance deleted successfully'
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('Error in deleteAttendance.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'details' => 'Error occurred while deleting attendance'
    ]);
}
?>
