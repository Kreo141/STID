document.addEventListener('DOMContentLoaded', function() {
    const createAttendanceModal = new bootstrap.Modal(document.getElementById('createAttendanceModal'));
    const createFromEventModal = new bootstrap.Modal(document.getElementById('createFromEventModal'));
    const editAttendanceModal = new bootstrap.Modal(document.getElementById('editAttendanceModal'));

    loadAttendanceTables();

    document.getElementById('createAttendanceBtn').addEventListener('click', () => {
        createAttendanceModal.show();
    });

    document.getElementById('createFromEventBtn').addEventListener('click', () => {
        loadEvents();
        createFromEventModal.show();
    });

    document.getElementById('saveAttendanceBtn').addEventListener('click', createAttendance);
    document.getElementById('saveEventAttendanceBtn').addEventListener('click', createAttendanceFromEvent);
    document.getElementById('updateAttendanceBtn').addEventListener('click', updateAttendance);

    // Functions
    async function loadAttendanceTables() {
        try {
            const response = await fetch('../../handlers/attendance/getAttendanceTables.php');
            const data = await response.json();
            
            const attendanceList = document.getElementById('attendanceList');
            attendanceList.innerHTML = '';

            data.forEach(table => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${table.title}</td>
                    <td>${formatDate(table.date)}</td>
                    <td>${table.session}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-primary" onclick="viewAttendance('${table.name}', '${table.session}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="editAttendance('${table.name}', '${table.title}', '${table.date}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteAttendance('${table.name}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                attendanceList.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading attendance tables:', error);
            showAlert('Error loading attendance tables', 'danger');
        }
    }

    async function loadEvents() {
        try {
            const response = await fetch('../../handlers/events/getEvents.php');
            const data = await response.json();
            
            const eventSelect = document.getElementById('eventSelect');
            eventSelect.innerHTML = '<option value="">Select an event</option>';

            data.forEach(event => {
                const option = document.createElement('option');
                option.value = event.event_id;
                option.textContent = `${event.title} - ${formatDate(event.date)}`;
                eventSelect.appendChild(option);
                if(event.days > 1){
                    console.log("EVENT HAS MULTIPLE DAYS")
                    for(var day = 2; day <= event.days; day++){
                        const option = document.createElement('option');
                        option.value = -event.event_id;
                        option.textContent = `${event.title} - DAY ${day}`;
                        eventSelect.appendChild(option);
                    }
                }
            });
        } catch (error) {
            console.error('Error loading events:', error);
            showAlert('Error loading events', 'danger');
        }
    }

    async function createAttendance() {
        const sessionRadio = document.querySelector('input[name="flexRadioDefault"]:checked');

        const title = document.getElementById('attendanceTitle').value;
        const date = document.getElementById('attendanceDate').value;
        const session = document.querySelector('input[name="flexRadioDefault"]:checked').value;

        console.log(sessionRadio.value);

        if (!title || !date) {
            showAlert('Please fill in all fields', 'warning');
            return;
        }

        try {
            const response = await fetch('../../handlers/attendance/createAttendance.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, date, session })
            });

            const data = await response.json();

            // Clear form
            document.getElementById('attendanceTitle').value = '';
            document.getElementById('attendanceDate').value = '';

            if (data.success) {
                showAlert('Attendance created successfully', 'success');
                createAttendanceModal.hide();
                // Add a small delay before reloading to ensure the database has updated
                setTimeout(() => {
                    loadAttendanceTables();
                }, 500);
            } else if (data.error) {
                showAlert(data.error, 'danger');
            } else {
                showAlert('Error creating attendance', 'danger');
            }
        } catch (error) {
            console.error('Error creating attendance:', error);
            // Even if we get an error, try to reload the tables as the creation might have succeeded
            setTimeout(() => {
                loadAttendanceTables();
            }, 500);
            showAlert('Attendance may have been created. Refreshing list...', 'warning');
        }
    }

    async function createAttendanceFromEvent() {
        const eventSelect = document.getElementById('eventSelect');
        const eventId = eventSelect.value;
        const session = document.querySelector('input[name="eventSession"]:checked').value;

        if(eventId < 0){
            const eventTitle = eventSelect.options[eventSelect.selectedIndex].text
            createFromEventModal.hide();
            createAttendanceModal.show();
            document.getElementById('attendanceTitle').value = eventTitle;
        }

        if (!eventId) {
            showAlert('Please select an event', 'warning');
            return;
        }

        try {
            const response = await fetch('../../handlers/attendance/createFromEvent.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ event_id: eventId, session: session })
            });

            const data = await response.json();

            document.getElementById('eventSelect').value = '';

            if (data.success) {
                showAlert('Attendance created from event successfully', 'success');
                createFromEventModal.hide();
                setTimeout(() => {
                    loadAttendanceTables();
                }, 500);
            } else if (data.error) {
                showAlert(data.error, 'danger');
            } else {
                showAlert('Error creating attendance from event', 'danger');
            }
        } catch (error) {
            console.error('Error creating attendance from event:', error);
            setTimeout(() => {
                loadAttendanceTables();
            }, 500);
            showAlert('Attendance may have been created. Refreshing list...', 'warning');
        }
    }

    async function updateAttendance() {
        const tableName = document.getElementById('editAttendanceId').value;
        const title = document.getElementById('editAttendanceTitle').value;
        const date = document.getElementById('editAttendanceDate').value;

        if (!tableName || !title || !date) {
            showAlert('Please fill in all fields', 'warning');
            return;
        }

        try {
            const response = await fetch('../../handlers/attendance/updateAttendance.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ table_name: tableName, title, date })
            });

            const data = await response.json();

            if (data.success) {
                showAlert('Attendance updated successfully', 'success');
                editAttendanceModal.hide();
                loadAttendanceTables();
            } else {
                showAlert(data.message || 'Error updating attendance', 'danger');
            }
        } catch (error) {
            console.error('Error updating attendance:', error);
            showAlert('Error updating attendance', 'danger');
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
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

    window.viewAttendance = function(tableName, session) {
        window.location.href = `manageAttendance.html?table=${encodeURIComponent(tableName)}&session=${encodeURIComponent(session)}`;
    };

    window.editAttendance = function(tableName, title, date) {
        document.getElementById('editAttendanceId').value = tableName;
        document.getElementById('editAttendanceTitle').value = title;
        document.getElementById('editAttendanceDate').value = date;
        editAttendanceModal.show();
    };

    window.deleteAttendance = async function(tableName) {
        if (!confirm('Are you sure you want to delete this attendance record?')) {
            return;
        }

        try {
            const response = await fetch('../../handlers/attendance/deleteAttendance.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ table_name: tableName })
            });

            const data = await response.json();

            if (data.success) {
                showAlert('Attendance deleted successfully', 'success');
                loadAttendanceTables();
            } else {
                showAlert(data.message || 'Error deleting attendance', 'danger');
            }
        } catch (error) {
            console.error('Error deleting attendance:', error);
            showAlert('Error deleting attendance', 'danger');
        }
    };
});
