document.addEventListener('DOMContentLoaded', function() {
    const addSlideModal = new bootstrap.Modal(document.getElementById('addSlideModal'));
    
    document.getElementById('addSlideBtn').addEventListener('click', function() {
        addSlideModal.show();
    });

    document.getElementById('saveSlideBtn').addEventListener('click', function() {
        const form = document.getElementById('addSlideForm');
        if (form.checkValidity()) {
            const formData = new FormData();
            const imageFile = document.getElementById('slideImage').files[0];
            
            if (!imageFile) {
                alert('Please select an image');
                return;
            }
            
            formData.append('image', imageFile);
            formData.append('title', document.getElementById('slideTitle').value);
            formData.append('description', document.getElementById('slideDescription').value);

            fetch('../../handlers/slideshow/upload_slide.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Slide saved successfully:', data);
                    form.reset();
                    addSlideModal.hide();
                    loadSlides();
                } else {
                    alert('Error saving slide: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error saving slide');
            });
        } else {
            form.reportValidity();
        }
    });

    function loadSlides() {
        fetch('../../handlers/slideshow/fetch_slides.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const slidesContainer = document.getElementById('slideshow-content');
                    
                    let tableHTML = `
                        <table class="table table-hover">
                            <thead class="table-dark">
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Image</th>
                                    <th>Description</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;

                    data.slides.forEach(slide => {
                        tableHTML += `
                            <tr>
                                <td>${slide.id}</td>
                                <td>${slide.title}</td>
                                <td>
                                    <img src="../${slide.image_url}" alt="${slide.title}" style="max-height: 50px;">
                                    <br>
                                    <small>${slide.filename}</small>
                                </td>
                                <td>${slide.description}</td>
                                <td class="actions-cell">
                                    <div class="action-buttons">
                                        <button class="btn btn-sm btn-primary edit-btn" onclick="editSlide(${slide.id}, '${slide.title}', '${slide.description}', '${slide.image_url}')">
                                            <i class="fas fa-edit"></i> Edit
                                        </button>
                                        <button class="btn btn-sm btn-danger delete-btn" onclick="deleteSlide(${slide.id})">
                                            <i class="fas fa-trash"></i> Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    });

                    tableHTML += `
                            </tbody>
                        </table>
                    `;

                    slidesContainer.innerHTML = tableHTML;

                    const style = document.createElement('style');
                    style.textContent = `
                        .actions-cell {
                            position: relative;
                        }
                        .action-buttons {
                            opacity: 0;
                            transition: opacity 0.3s ease;
                        }
                        tr:hover .action-buttons {
                            opacity: 1;
                        }
                        .action-buttons button {
                            margin: 0 5px;
                        }
                    `;
                    document.head.appendChild(style);
                }
            })
            .catch(error => {
                console.error('Error loading slides:', error);
            });
    }

    loadSlides();

    window.deleteSlide = function(id) {
        if (confirm('Are you sure you want to delete this slide?')) {
            const formData = new FormData();
            formData.append('id', id);

            fetch('../../handlers/slideshow/delete_slide.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    loadSlides();
                } else {
                    alert('Error deleting slide: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error deleting slide');
            });
        }
    };

    window.editSlide = function(id, title, description, imageUrl) {
        let editModal = document.getElementById('editSlideModal');
        if (!editModal) {
            const modalHTML = `
                <div class="modal fade" id="editSlideModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Edit Slide</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <form id="editSlideForm">
                                    <input type="hidden" id="editSlideId">
                                    <div class="mb-3">
                                        <label for="editSlideImage" class="form-label">Image</label>
                                        <input type="file" class="form-control" id="editSlideImage" accept="image/*">
                                        <img id="currentSlideImage" src="" alt="Current Image" style="max-height: 100px; margin-top: 10px;">
                                    </div>
                                    <div class="mb-3">
                                        <label for="editSlideTitle" class="form-label">Title</label>
                                        <input type="text" class="form-control" id="editSlideTitle" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="editSlideDescription" class="form-label">Description</label>
                                        <textarea class="form-control" id="editSlideDescription" rows="3" required></textarea>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="updateSlideBtn">Update Slide</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            editModal = document.getElementById('editSlideModal');
            
            document.getElementById('updateSlideBtn').addEventListener('click', function() {
                const form = document.getElementById('editSlideForm');
                if (form.checkValidity()) {
                    const formData = new FormData();
                    const imageFile = document.getElementById('editSlideImage').files[0];
                    const slideId = document.getElementById('editSlideId').value;
                    
                    formData.append('id', slideId);
                    formData.append('title', document.getElementById('editSlideTitle').value);
                    formData.append('description', document.getElementById('editSlideDescription').value);
                    if (imageFile) {
                        formData.append('image', imageFile);
                    }

                    fetch('../../handlers/slideshow/update_slide.php', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            const modal = bootstrap.Modal.getInstance(editModal);
                            modal.hide();
                            loadSlides();
                        } else {
                            alert('Error updating slide: ' + data.error);
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('Error updating slide');
                    });
                } else {
                    form.reportValidity();
                }
            });
        }

        document.getElementById('editSlideId').value = id;
        document.getElementById('editSlideTitle').value = title;
        document.getElementById('editSlideDescription').value = description;
        document.getElementById('currentSlideImage').src = "../" + imageUrl;

        const modal = new bootstrap.Modal(editModal);
        modal.show();
    };
}); 