<?php
require_once '../../config/database.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['event_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing event ID']);
    exit;
}

try {
    // Get event info (no DB prefix needed if already connected)
    $stmt = $pdo->prepare("
        SELECT title, date 
        FROM events 
        WHERE event_id = ?
    ");
    $stmt->execute([$data['event_id']]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$event) {
        throw new Exception('Event not found');
    }

    // Make sure metadata table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'attendance_metadata'");
    if (!$stmt->fetch()) {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS attendance_metadata (
                id INT AUTO_INCREMENT PRIMARY KEY,
                table_name VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                date DATE NOT NULL,
                event_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events(event_id)
            )
        ");
    }

    // Generate attendance table name
    $tableName = strtolower(str_replace(' ', '_', $event['title'])) . '_' . date('d_m_y', strtotime($event['date']));

    // Create attendance table if it doesn't exist
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `$tableName` (
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

    // Insert into metadata table
    $stmt = $pdo->prepare("
        INSERT INTO attendance_metadata (table_name, title, date, event_id, session)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$tableName, $event['title'], $event['date'], $data['event_id'], $data['session']]);

    echo json_encode([
        'success' => true,
        'message' => 'Attendance table created from event successfully',
        'table_name' => $tableName
    ]);

} catch (Exception $e) {
    error_log('Error in createFromEvent.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
