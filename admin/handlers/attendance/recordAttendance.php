<?php
require_once '../../config/database.php';

header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);

date_default_timezone_set('Asia/Manila');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['student_id']) || !isset($data['table_name']) || !isset($data['time_type']) || !isset($data['session'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

// sanitize
$tableName = $data['table_name'];

try {
    $stmt = $pdo->prepare("SELECT student_name, student_key FROM tblstudents WHERE student_id = ?");
    $stmt->execute([$data['student_id']]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        throw new Exception('Student not found');
    }

    $stmt = $pdo->query("SHOW TABLES LIKE '$tableName'");
    if (!$stmt->fetch()) {
        throw new Exception('Attendance table does not exist');
    }

    $currentTime = date('Y-m-d H:i:s');
    $columnName = "time_{$data['time_type']}_{$data['session']}";

    $stmt = $pdo->prepare("SELECT * FROM `$tableName` WHERE id = ?");
    $stmt->execute([$data['student_id']]);
    $existingRecord = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existingRecord) {
        if ($existingRecord[$columnName]) {
            throw new Exception(strtoupper($data['session']) . ' ' . ucfirst($data['time_type']) . ' time already recorded');
        }

        $stmt = $pdo->prepare("UPDATE `$tableName` SET $columnName = ?, student_name = ?, student_email = ? WHERE id = ?");
        $stmt->execute([$currentTime, $student['student_name'], $student['student_key'], $data['student_id']]);
    } else {
        $stmt = $pdo->prepare("
            INSERT INTO `$tableName` 
            (id, student_name, student_email, time_in_am, time_out_am, time_in_pm, time_out_pm)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");

        $timeValues = [null, null, null, null];
        
        $timeIndex = ($data['session'] === 'am' ? 0 : 2) + ($data['time_type'] === 'in' ? 0 : 1);
        $timeValues[$timeIndex] = $currentTime;

        $stmt->execute([
            $data['student_id'],
            $student['student_name'],
            $student['student_key'],
            $timeValues[0], // time_in_am
            $timeValues[1], // time_out_am
            $timeValues[2], // time_in_pm
            $timeValues[3]  // time_out_pm
        ]);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Attendance recorded successfully'
    ]);

} catch (Exception $e) {
    error_log('Error in recordAttendance.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        $tableName,
        'details' => 'Error occurred while recording attendance'
    ]);
}
?>
