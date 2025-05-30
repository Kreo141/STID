<?php
require_once '../../config/database.php';

header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['title']) || !isset($data['date'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Make sure the metadata table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'attendance_metadata'");
    if (!$stmt->fetch()) {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS attendance_metadata (
                id INT AUTO_INCREMENT PRIMARY KEY,
                table_name VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                date DATE NOT NULL,
                event_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_table_name (table_name)
            )
        ");
    }

    // Generate table name from title and date
    $tableName = strtolower(str_replace(' ', '_', $data['title'])) . '_' . date('d_m_y', strtotime($data['date']));

    // Check if table already exists
    $stmt = $pdo->query("SHOW TABLES LIKE '$tableName'");
    if ($stmt->fetch()) {
        throw new Exception('An attendance table with this name already exists');
    }

    // Create the actual attendance table
    $pdo->exec("
        CREATE TABLE `$tableName` (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_name VARCHAR(255),
            student_email VARCHAR(255),
            time_in_am DATETIME,
            time_out_am DATETIME,
            time_in_pm DATETIME,
            time_out_pm DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");

    // Insert metadata record
    $stmt = $pdo->prepare("
        INSERT INTO attendance_metadata (table_name, title, date, session)
        VALUES (?, ?, ?, ?)
    ");
    $metadataResult = $stmt->execute([$tableName, $data['title'], $data['date'], $data['session'] ?? null]);

    if (!$metadataResult) {
        throw new Exception('Failed to create metadata: ' . implode(' ', $stmt->errorInfo()));
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Attendance created successfully',
        'table_name' => $tableName
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('Error in createAttendance.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'details' => 'Error occurred while creating attendance'
    ]);
}
?>
