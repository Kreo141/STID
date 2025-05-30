document.addEventListener('DOMContentLoaded', function() {
    if (!auth.isAuthenticated()) {
        window.location.href = '../../index.html';
        return;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.logout();
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const tableName = urlParams.get('table');
    const session = urlParams.get('session');
    console.log(session);

    if (session == 'Morning') {
        document.getElementById('amRadio').checked = true;
        document.getElementById('pmRadio').disabled = true;


        const table = document.querySelector("table");
        const headerRow = table.querySelector("thead tr");
        headerRow.deleteCell(5); 
        headerRow.deleteCell(4); 

        const rows = table.querySelectorAll("tbody tr");
        rows.forEach(row => {
            row.deleteCell(5);
            row.deleteCell(4); 
        });
        
    }else if (session == 'Afternoon') {
        document.getElementById('pmRadio').checked = true;
        document.getElementById('amRadio').disabled = true;

        const table = document.querySelector("table");
        const headerRow = table.querySelector("thead tr");
        headerRow.deleteCell(3); 
        headerRow.deleteCell(2); 

        const rows = table.querySelectorAll("tbody tr");
        rows.forEach(row => {
            row.deleteCell(3);
            row.deleteCell(2); 
        });
    }

    if (!tableName) {
        showAlert('No attendance table specified', 'danger');
        return;
    }

    loadAttendanceData(tableName);

    initTableSorting();


    const recordAttendanceModal = new bootstrap.Modal(document.getElementById('recordAttendanceModal'));
    const qrScannerModal = new bootstrap.Modal(document.getElementById('qrScannerModal'));
    const studentConfirmationModal = new bootstrap.Modal(document.getElementById('studentConfirmationModal'));

    let html5QrcodeScanner = null;

    document.getElementById('recordAttendanceBtn').addEventListener('click', () => {
        recordAttendanceModal.show();
    });

    document.getElementById('scanQRBtn').addEventListener('click', () => {
        recordAttendanceModal.hide();
        qrScannerModal.show();
        initializeQRScanner();
    });


    document.getElementById('exportAttendance').addEventListener('click', async function(event){
        event.preventDefault();

        const response = await fetch(`../../handlers/attendance/exportAttendance.php?table=${encodeURIComponent(tableName)}`);

        const jsonData = await response.json(); 

        if(session == 'Morning'){
            jsonData.forEach(student => {
                delete student.time_in_pm;
                delete student.time_out_pm;
            });
        } else if(session == 'Afternoon'){
            jsonData.forEach(student => { 
                delete student.time_in_am;
                delete student.time_out_am;
            }) 
        }

        console.log(jsonData) 

        const worksheet = XLSX.utils.json_to_sheet(jsonData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        XLSX.writeFile(workbook, `${tableName}_data.xlsx`);
    })

    document.getElementById('recordAttendanceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentId = document.getElementById('studentId').value;
        const timeType = document.querySelector('input[name="timeType"]:checked').value;
        const session = document.querySelector('input[name="session"]:checked').value;
        
        const result = await recordAttendance(studentId, tableName, timeType, session);
        if (result) {
            document.getElementById('studentId').value = '';
            document.getElementById('studentId').focus();
        }
    });

    document.getElementById('confirmRecordBtn').addEventListener('click', async () => {
        const studentId = document.getElementById('studentID').value;
        const timeType = document.querySelector('input[name="timeType"]:checked').value;
        const session = document.querySelector('input[name="session"]:checked').value;
        
        const result = await recordAttendance(studentId, tableName, timeType, session);
        if (result) {
            studentConfirmationModal.hide();
            if (confirm('Would you like to scan another QR code?')) {
                qrScannerModal.show();
                initializeQRScanner();
            } else {
                recordAttendanceModal.show();
                document.getElementById('studentId').focus();
            }
        }
    });

    // Functions
    async function loadAttendanceData(tableName) {
        try {
            const response = await fetch(`../../handlers/attendance/getAttendanceData.php?table=${encodeURIComponent(tableName)}`);
            const data = await response.json();

            if (data.success) {
                document.getElementById('attendanceTitle').textContent = data.title + " | " + session;

                const attendanceTable = document.getElementById('attendanceTable');
                attendanceTable.innerHTML = '';

            data.records.forEach(record => {
                const row = document.createElement('tr');

                let cells = `
                    <td>${record.student_name || ''}</td>
                    <td>${record.student_email || ''}</td>
                `;

                if (session === "Morning") {
                    cells += `
                        <td>${formatTime(record.time_in_am)}</td>
                        <td>${formatTime(record.time_out_am)}</td>
                    `;
                } else if (session === "Afternoon") {
                    cells += `
                        <td>${formatTime(record.time_in_pm)}</td>
                        <td>${formatTime(record.time_out_pm)}</td>
                    `;
                } else if (session === "Whole Day") {
                    cells += `
                        <td>${formatTime(record.time_in_am)}</td>
                        <td>${formatTime(record.time_out_am)}</td>
                        <td>${formatTime(record.time_in_pm)}</td>
                        <td>${formatTime(record.time_out_pm)}</td>
                    `;
                }

                row.innerHTML = cells;
                attendanceTable.appendChild(row);
            });
            } else {
                showAlert(data.message || 'Error loading attendance data', 'danger');
            }
        } catch (error) {
            console.error('Error loading attendance data:', error);
            showAlert('Error loading attendance data', 'danger');
        }
    }

    async function recordAttendance(studentId, tableName, timeType, session) {
        try {
            const response = await fetch('../../handlers/attendance/recordAttendance.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    student_id: studentId,
                    table_name: tableName,
                    time_type: timeType,
                    session: session
                })
            });

            const data = await response.json();

            if (data.success) {
                showAlert('Attendance recorded successfully', 'success');
                loadAttendanceData(tableName);
                return true;
            } else {
                showAlert(data.error || 'Error recording attendance', 'danger');
                return false;
            }
        } catch (error) {
            console.error('Error recording attendance:', error);
            showAlert('Error recording attendance', 'danger');
            return false;
        }
    }

    function initializeQRScanner() {
        if (html5QrcodeScanner) {
            html5QrcodeScanner.clear();
        }

        html5QrcodeScanner = new Html5QrcodeScanner(
            "qrScannerContainer",
            { fps: 10, qrbox: 250 },
            false
        );

        html5QrcodeScanner.render(async (decodedText) => {
            // Extract the student ID and name
            const idMatch = decodedText.match(/\.(\d+)@/);
            const nameMatch = decodedText.match(/_(.+)$/);

            if (idMatch && nameMatch) {
                const studentId = idMatch[1];
                const studentName = nameMatch[1];

                html5QrcodeScanner.clear();
                qrScannerModal.hide();

                const timeType = document.querySelector('input[name="timeType"]:checked').value;
                const session = document.querySelector('input[name="session"]:checked').value;

                const result = await recordAttendance(studentId, tableName, timeType, session);
                if (result) {
                    const confirmMsg = `${studentName}. Scan another QR code?`;
                    if (confirm(confirmMsg)) {
                        qrScannerModal.show();
                        initializeQRScanner();
                    } else {
                        recordAttendanceModal.show();
                        document.getElementById('studentId').focus();
                    }
                }
            } else {
                showAlert('Invalid QR code format', 'danger');
            }
        });
    }



    function formatTime(timeString) {
        if (!timeString) return '';
        
        const date = new Date(timeString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.dashboard-content');
        container.insertBefore(alertDiv, container.firstChild);

        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}); 

function initTableSorting() {
    const table = document.querySelector("table");
    const headers = table.querySelectorAll("th.sortable");
    let sortDirection = {}; // Keeps track of sort order for each column

    headers.forEach((header, index) => {
        header.style.cursor = 'pointer';
        header.addEventListener("click", () => {
            const rowsArray = Array.from(table.querySelectorAll("tbody tr"));
            const isTimeColumn = header.textContent.toLowerCase().includes("time");

            const direction = sortDirection[index] === 'asc' ? 'desc' : 'asc';
            sortDirection = { [index]: direction }; // Reset all, keep only one

            rowsArray.sort((a, b) => {
                const cellA = a.children[index].textContent.trim();
                const cellB = b.children[index].textContent.trim();

                if (isTimeColumn) {
                    const dateA = parseTime(cellA);
                    const dateB = parseTime(cellB);
                    return direction === 'asc' ? dateA - dateB : dateB - dateA;
                } else {
                    return direction === 'asc'
                        ? cellA.localeCompare(cellB)
                        : cellB.localeCompare(cellA);
                }
            });

            const tbody = table.querySelector("tbody");
            tbody.innerHTML = "";
            rowsArray.forEach(row => tbody.appendChild(row));
        });
    });
}

// Helper to parse time string like "10:45 AM" into Date
function parseTime(timeStr) {
    if (!timeStr) return new Date(0); // sort empty times to top
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}
