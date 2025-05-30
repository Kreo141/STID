document.addEventListener('DOMContentLoaded', function() {
    const eventsContent = document.getElementById('events-content');
    const addEventBtn = document.getElementById('addEventBtn');
    const eventModal = new bootstrap.Modal(document.getElementById('eventModal'));
    const eventForm = document.getElementById('eventForm');
    const modalTitle = document.getElementById('modalTitle');
    const saveEventBtn = document.getElementById('saveEventBtn');
    let currentEventId = null;

    loadEvents();

    addEventBtn.addEventListener('click', () => {
        currentEventId = null;
        modalTitle.textContent = 'Add New Event';
        eventForm.reset();
        eventModal.show();
    });

    saveEventBtn.addEventListener('click', () => {
        const formData = new FormData(eventForm);
        const action = currentEventId ? 'update' : 'create';

        // DEBUGGING
        console.log(Object.fromEntries(formData.entries()))
        
        if (currentEventId) {
            formData.append('id', currentEventId);
        }
        formData.append('action', action);

        fetch('../../handlers/events_handler.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                eventModal.hide();
                loadEvents();
                showAlert('success', data.message);
            } else {
                showAlert('danger', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('danger', 'An error occurred while saving the event');
        });
    });

    function loadEvents() {
        fetch('../../handlers/events_handler.php')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(events => {
                if (Array.isArray(events)) {
                    displayEvents(events);
                } else {
                    showAlert('warning', 'No events found');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('danger', 'Failed to load events');
            });
    }

    function displayEvents(events) {
        if (!events || events.length === 0) {
            eventsContent.innerHTML = '<div class="alert alert-info">No events found</div>';
            return;
        }

        const table = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Date</th>
                            <th>day/s</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${events.map(event => `
                            <tr>
                                <td>${event.event_id}</td>
                                <td>${event.title}</td>
                                <td>${event.description}</td>
                                <td>${formatDate(event.date)}</td>
                                <td>${event.days}</td>
                                <td class="action-buttons">
                                    <button class="btn btn-sm btn-primary edit-btn" data-id="${event.event_id}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger delete-btn" data-id="${event.event_id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        eventsContent.innerHTML = table;

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', handleEdit);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', handleDelete);
        });
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function handleEdit(e) {
        const eventId = e.target.closest('.edit-btn').dataset.id;
        currentEventId = eventId;
        modalTitle.textContent = 'Edit Event';

        fetch(`../../handlers/events_handler.php?id=${eventId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(event => {
                if (event) {
                    document.getElementById('eventTitle').value = event.title;
                    document.getElementById('eventDescription').value = event.description;
                    document.getElementById('eventDate').value = event.date;
                    document.getElementById('eventDays').value = event.days;
                    eventModal.show();
                } else {
                    showAlert('danger', 'Event not found');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('danger', 'Failed to load event details');
            });
    }

    function handleDelete(e) {
        if (confirm('Are you sure you want to delete this event?')) {
            const eventId = e.target.closest('.delete-btn').dataset.id;
            
            const formData = new FormData();
            formData.append('action', 'delete');
            formData.append('id', eventId);

            fetch('../../handlers/events_handler.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    loadEvents();
                    showAlert('success', data.message);
                } else {
                    showAlert('danger', data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('danger', 'Failed to delete event');
            });
        }
    }

    function showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        eventsContent.insertBefore(alertDiv, eventsContent.firstChild);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }
}); 