<?php
require_once '../../config/database.php';

header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $attendanceTables = [];

    foreach ($tables as $table) {
        $stmt = $pdo->prepare("
            SELECT title, date, session 
            FROM attendance_metadata
            WHERE table_name = ?
        ");
        $stmt->execute([$table]);
        $metadata = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($metadata) {
            $attendanceTables[] = [
                'name' => $table,
                'title' => $metadata['title'],
                'date' => $metadata['date'],
                'session' => $metadata['session']
            ];
        }
    }

    echo json_encode($attendanceTables);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
