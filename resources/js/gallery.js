window.onload = function(){

    loadImages()

}

const images = []; 

function loadImages(){
    const urlParams = new URLSearchParams(window.location.search);
    const galleryId = urlParams.get("galleryId");

    if (galleryId) {
        fetch(`fetch_photos.php?galleryId=${galleryId}`)
        .then(response => response.json())
        .then(data => {
            const galleryDiv = document.querySelector(".gallery");

            data.forEach((photo, index) => {
                images.push(photo.photo_url); 

                const photoElement = document.createElement("div");
                photoElement.classList.add("photo");
                photoElement.setAttribute("onclick", `openLightbox(${index})`);
                photoElement.innerHTML = `<img src="${photo.photo_url}" alt="Image ${photo.photo_id}">`;
                galleryDiv.appendChild(photoElement);
            });

            console.log("Global Images Array:", images);
        })
        .catch(error => console.error("Error fetching photos:", error));
    }

    if (galleryId) {
        fetch(`fetch_albumTitle.php?galleryId=${galleryId}`)
            .then(response => response.json())
            .then(data => {
                if (data.album_title) {
                    document.title = data.album_title;
                    document.querySelector(".title").textContent = data.album_title;
                } else {
                    console.error(data.error);
                }
            })
            .catch(error => console.error("Error fetching album title:", error));
    }
}

// LIGHTBOX FUNCTIONALITY
let currentIndex = 0;

function openLightbox(index) {
    currentIndex = index;
    document.getElementById('lightbox-img').src = images[currentIndex];
    document.getElementById('download-btn').href = images[currentIndex];
    document.getElementById('lightbox').style.display = 'flex';
    document.querySelector('.navbar').style.display = 'none';
}

function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
    document.querySelector('.navbar').style.display = 'flex';
}

function nextPhoto() {
    currentIndex = (currentIndex + 1) % images.length;
    openLightbox(currentIndex);
}

function prevPhoto() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    openLightbox(currentIndex);
}

function reportImage() {
    alert('This image has been reported.');
}