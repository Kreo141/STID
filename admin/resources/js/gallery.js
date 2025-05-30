document.addEventListener('DOMContentLoaded', function() {
    const galleryContent = document.getElementById('gallery-content');
    const addAlbumBtn = document.getElementById('addAlbumBtn');
    const addAlbumModal = new bootstrap.Modal(document.getElementById('addAlbumModal'));
    const albumForm = document.getElementById('albumForm');
    const albumImageInput = document.getElementById('albumImage');
    const albumTitleInput = document.getElementById('albumTitle');
    const saveAlbumBtn = document.getElementById('saveAlbumBtn');

    const photoModal = new bootstrap.Modal(document.getElementById('photoModal'));
    const photoForm = document.getElementById('photoForm');
    const photoImageInput = document.getElementById('photoImage');
    const savePhotoBtn = document.getElementById('savePhotoBtn');
    const addPhotoBtn = document.getElementById('addPhotoBtn');
    let currentAlbumId = null;
    let isEditMode = false;

    const toggleEditModeBtn = document.getElementById('toggleEditMode');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const editModeControls = document.getElementById('editModeControls');

    // Load albums on page load
    loadAlbums();

    // Handle add album button click
    addAlbumBtn.addEventListener('click', () => {
        albumForm.reset();
        albumForm.dataset.mode = 'create';
        document.getElementById('modalTitle').textContent = 'Add New Album';
        addAlbumModal.show();
    });

    // Handle image upload for albums
albumImageInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    const statusMsg = document.getElementById('albumUploadStatus');

    if (file) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', 'album');

        statusMsg.style.display = 'block';
        statusMsg.textContent = 'Creating...';

        fetch('../../handlers/gallery/upload.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                albumImageInput.dataset.url = data.url;
                statusMsg.textContent = 'Created!';
                statusMsg.classList.remove('text-danger');
                statusMsg.classList.add('text-success');
            } else {
                statusMsg.textContent = 'Error: ' + data.message;
                statusMsg.classList.remove('text-success');
                statusMsg.classList.add('text-danger');
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            statusMsg.textContent = 'Upload failed.';
            statusMsg.classList.remove('text-success');
            statusMsg.classList.add('text-danger');
        });
    }
});


    // Handle image upload for photos
    photoImageInput.addEventListener('change', function (e) {
        const files = e.target.files;
        const statusMsg = document.getElementById('photoUploadStatus');

        if (files.length > 0) {
            statusMsg.style.display = 'block';
            statusMsg.textContent = 'Uploading...';
            statusMsg.classList.remove('text-danger', 'text-success');

            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('image[]', files[i]);
            }
            formData.append('type', 'photo');

            fetch('../../handlers/gallery/upload.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const addPhotoPromises = data.urls.map(url => {
                        const photoFormData = new FormData();
                        photoFormData.append('action', 'add_photo');
                        photoFormData.append('albumId', currentAlbumId);
                        photoFormData.append('photoUrl', url);

                        return fetch('../../handlers/gallery/gallery.php', {
                            method: 'POST',
                            body: photoFormData
                        })
                        .then(response => response.json())
                        .then(result => {
                            if (!result.success) {
                                console.error('Error adding photo:', result);
                            }
                            return result;
                        });
                    });

                    Promise.all(addPhotoPromises)
                        .then(() => {
                            loadPhotos(currentAlbumId);
                            photoForm.style.display = 'none';
                            savePhotoBtn.style.display = 'none';
                            photoImageInput.value = '';
                            statusMsg.textContent = 'Uploaded!';
                            statusMsg.classList.add('text-success');
                        })
                        .catch(error => {
                            console.error('Error adding photos:', error);
                            statusMsg.textContent = 'Error uploading photos to album';
                            statusMsg.classList.add('text-danger');
                        });
                } else {
                    console.error('Server response:', data);
                    statusMsg.textContent = 'Error uploading photos';
                    statusMsg.classList.add('text-danger');
                }
            })
            .catch(error => {
                console.error('Upload error:', error);
                statusMsg.textContent = 'Upload failed';
                statusMsg.classList.add('text-danger');
            });
        }
    });


    // Handle form submission for albums
    saveAlbumBtn.addEventListener('click', handleAlbumSave);

    // Handle form submission for photos
    savePhotoBtn.addEventListener('click', handlePhotoSave);

    // Handle add photo button click
    addPhotoBtn.addEventListener('click', () => {
        photoForm.style.display = 'block';
        photoForm.dataset.mode = 'create';
        document.getElementById('photoFormTitle').textContent = 'Add New Photo';
        photoImageInput.value = ''; // Clear the file input
        photoImageInput.dataset.url = ''; // Clear the stored URL
        savePhotoBtn.style.display = 'block'; // Show save button
    });

    // Handle edit mode toggle
    toggleEditModeBtn.addEventListener('click', () => {
        isEditMode = !isEditMode;
        toggleEditModeBtn.classList.toggle('active');
        editModeControls.style.display = isEditMode ? 'block' : 'none';
        displayPhotos(currentPhotos); // Redisplay photos with/without checkboxes
    });

    // Handle delete selected photos
    deleteSelectedBtn.addEventListener('click', () => {
        const selectedPhotos = document.querySelectorAll('.photo-checkbox:checked');
        if (selectedPhotos.length === 0) {
            alert('Please select photos to delete');
            return;
        }

        if (confirm(`Are you sure you want to delete ${selectedPhotos.length} photo(s)?`)) {
            const deletePromises = Array.from(selectedPhotos).map(checkbox => {
                const photoId = checkbox.dataset.photoId;
                const formData = new FormData();
                formData.append('action', 'delete_photo');
                formData.append('photoId', photoId);

                return fetch('../../handlers/gallery/gallery.php', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json());
            });

            Promise.all(deletePromises)
                .then(() => {
                    loadPhotos(currentAlbumId);
                })
                .catch(error => {
                    console.error('Error deleting photos:', error);
                    alert('Error deleting photos');
                });
        }
    });

    // Keep track of current photos for redisplay
    let currentPhotos = [];

    function handleAlbumSave() {
        const mode = albumForm.dataset.mode;
        const title = albumTitleInput.value;
        const imageUrl = albumImageInput.dataset.url;

        if (!title || !imageUrl) {
            alert('Please fill in all fields');
            return;
        }

        const formData = new FormData();
        formData.append('action', mode);
        formData.append('title', title);
        formData.append('imageUrl', imageUrl);

        if (mode === 'update') {
            formData.append('id', albumForm.dataset.albumId);
        }

        fetch('../../handlers/gallery/gallery.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                addAlbumModal.hide();
                loadAlbums();
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error saving album');
        });
    }

    function handlePhotoSave() {
        const mode = photoForm.dataset.mode;
        const imageUrl = photoImageInput.dataset.url;

        if (!imageUrl) {
            alert('Please select an image');
            return;
        }

        const formData = new FormData();
        formData.append('action', mode === 'create' ? 'add_photo' : 'update_photo');
        formData.append('albumId', currentAlbumId);
        formData.append('photoUrl', imageUrl);

        if (mode === 'update') {
            formData.append('photoId', photoForm.dataset.photoId);
        }

        fetch('../../handlers/gallery/gallery.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                photoForm.style.display = 'none'; // Hide the form after saving
                savePhotoBtn.style.display = 'none'; // Hide save button
                loadPhotos(currentAlbumId);
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error saving photo');
        });
    }

    function loadAlbums() {
        fetch('../../handlers/gallery/gallery.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayAlbums(data.data);
                } else {
                    console.error('Error loading albums:', data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    function displayAlbums(albums) {
        galleryContent.innerHTML = '';
        
        albums.forEach(album => {
            const albumCard = document.createElement('div');
            albumCard.className = 'col-md-4 mb-4';
            albumCard.innerHTML = `
                <div class="card">
                    <img src="${album.album_image_url}" class="card-img-top" alt="${album.album_title}">
                    <div class="card-body">
                        <h5 class="card-title">${album.album_title}</h5>
                        <div class="btn-group">
                            <button class="btn btn-primary btn-sm edit-album" data-id="${album.album_id}">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-info btn-sm manage-photos" data-id="${album.album_id}">
                                <i class="fas fa-images"></i> Manage Photos
                            </button>
                            <button class="btn btn-danger btn-sm delete-album" data-id="${album.album_id}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
            galleryContent.appendChild(albumCard);
        });

        // Add event listeners
        document.querySelectorAll('.edit-album').forEach(btn => {
            btn.addEventListener('click', handleEdit);
        });

        document.querySelectorAll('.delete-album').forEach(btn => {
            btn.addEventListener('click', handleDelete);
        });

        document.querySelectorAll('.manage-photos').forEach(btn => {
            btn.addEventListener('click', handleManagePhotos);
        });
    }

    function handleEdit(e) {
        const albumId = e.target.closest('.edit-album').dataset.id;
        const card = e.target.closest('.card');
        const title = card.querySelector('.card-title').textContent;
        const imageUrl = card.querySelector('img').src.split('../').pop();

        albumForm.dataset.mode = 'update';
        albumForm.dataset.albumId = albumId;
        albumTitleInput.value = title;
        albumImageInput.dataset.url = imageUrl;
        document.getElementById('modalTitle').textContent = 'Edit Album';
        addAlbumModal.show();
    }

    function handleDelete(e) {
        if (confirm('Are you sure you want to delete this album?')) {
            const albumId = e.target.closest('.delete-album').dataset.id;
            
            const formData = new FormData();
            formData.append('action', 'delete');
            formData.append('id', albumId);

            fetch('../../handlers/gallery/gallery.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    loadAlbums();
                } else {
                    alert('Error: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error deleting album');
            });
        }
    }

    function handleManagePhotos(e) {
        currentAlbumId = e.target.closest('.manage-photos').dataset.id;
        const card = e.target.closest('.card');
        const title = card.querySelector('.card-title').textContent;
        
        document.getElementById('photoModalTitle').textContent = `Manage Photos - ${title}`;
        photoForm.style.display = 'none';
        savePhotoBtn.style.display = 'none';
        loadPhotos(currentAlbumId);
        photoModal.show();
    }

    function loadPhotos(albumId) {
        const formData = new FormData();
        formData.append('action', 'get_photos');
        formData.append('albumId', albumId);

        fetch('../../handlers/gallery/gallery.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentPhotos = data.data;
                displayPhotos(data.data);
            } else {
                console.error('Error loading photos:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    function displayPhotos(photos) {
        const photosContainer = document.getElementById('photos-container');
        photosContainer.innerHTML = '';
        
        photos.forEach(photo => {
            const photoCard = document.createElement('div');
            photoCard.className = 'col-md-3 mb-3';
            
            const checkboxHtml = isEditMode ? `
                <div class="form-check position-absolute top-0 start-0 m-2">
                    <input class="form-check-input photo-checkbox" type="checkbox" data-photo-id="${photo.photo_id}">
                </div>
            ` : '';

            photoCard.innerHTML = `
                <div class="card photo-card">
                    ${checkboxHtml}
                    <img src="${photo.photo_url}" class="card-img-top" alt="Photo">
                </div>
            `;
            photosContainer.appendChild(photoCard);
        });

        if (isEditMode) {
            document.querySelectorAll('.photo-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (e.target.classList.contains('form-check-input')) return;
                    const checkbox = card.querySelector('.photo-checkbox');
                    if (checkbox) {
                        checkbox.checked = !checkbox.checked;
                    }
                });
            });
        }
    }

    function handleEditPhoto(e) {
        const photoId = e.target.closest('.edit-photo').dataset.id;
        const card = e.target.closest('.photo-card');
        const imageUrl = card.querySelector('img').src.split('../').pop();

        photoForm.dataset.mode = 'update';
        photoForm.dataset.photoId = photoId;
        photoImageInput.dataset.url = imageUrl;
        document.getElementById('photoFormTitle').textContent = 'Edit Photo';
        photoForm.style.display = 'block';
        savePhotoBtn.style.display = 'block';
    }

    function handleDeletePhoto(e) {
        if (confirm('Are you sure you want to delete this photo?')) {
            const photoId = e.target.closest('.delete-photo').dataset.id;
            
            const formData = new FormData();
            formData.append('action', 'delete_photo');
            formData.append('photoId', photoId);

            fetch('../../handlers/gallery/gallery.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    loadPhotos(currentAlbumId);
                } else {
                    alert('Error: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error deleting photo');
            });
        }
    }
}); 