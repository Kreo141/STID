<?php
require_once '../../config/database.php';

date_default_timezone_set('Asia/Manila');

function displayForm($error = '', $success = '') {
    echo "<h2>Debug Attendance Form</h2>";
    if ($error) {
        echo "<p style='color: red;'>Error: $error</p>";
    }
    if ($success) {
        echo "<p style='color: green;'>$success</p>";
    }
    echo '
    <form method="POST">
        <label>Student ID: <input type="text" name="student_id" required></label><br><br>
        <label>Table Name: <input type="text" name="table_name" required></label><br><br>
        <label>Time Type: 
            <select name="time_type" required>
                <option value="in">In</option>
                <option value="out">Out</option>
            </select>
        </label><br><br>
        <label>Session:
            <select name="session" required>
                <option value="am">AM</option>
                <option value="pm">PM</option>
            </select>
        </label><br><br>
        <input type="submit" value="Record Attendance">
    </form>';
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    displayForm();
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = $_POST;

    if (!isset($data['student_id'], $data['table_name'], $data['time_type'], $data['session'])) {
        displayForm('Missing required fields');
        exit;
    }

    // No sanitization for debugging
    $tableName = $data['table_name'];

    try {
        global $pdo;
        $stmt = $pdo->prepare("SELECT student_name, student_key FROM tblstudents WHERE student_id = ?");
        $stmt->execute([$data['student_id']]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$student) {
            throw new Exception('Student not found');
        }

        $stmt = $pdo->query("SHOW TABLES LIKE '$tableName'");
        if (!$stmt->fetch()) {
            throw new Exception("Attendance table '$tableName' does not exist");
        }

        $currentTime = date('Y-m-d H:i:s');
        $columnName = "time_{$data['time_type']}_{$data['session']}";

        $stmt = $pdo->prepare("SELECT * FROM `$tableName` WHERE id = ?");
        $stmt->execute([$data['student_id']]);
        $existingRecord = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existingRecord) {
            if (!empty($existingRecord[$columnName])) {
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

        displayForm('', 'Attendance recorded successfully at ' . $currentTime);

    } catch (Exception $e) {
        displayForm($e->getMessage());
    }
}
?>
