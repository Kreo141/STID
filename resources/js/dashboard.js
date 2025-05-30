/** PROFILE CARD FUNCTION **/
document.addEventListener("DOMContentLoaded", function () {
    const profile = document.getElementById("profile");
    const profileCard = document.getElementById("profileCard");
    const profileLarge = document.getElementById("profileLarge");
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const studentInfoBtn = document.getElementById("studentInfoBtn");
    const gotoStudentInfo = document.getElementById("gotoStudentInfo");

    profile.addEventListener("click", function () {
        profileCard.classList.toggle("show");
    });

    document.addEventListener("click", function (event) {
        if (!profileCard.contains(event.target) && event.target !== profile) {
            profileCard.classList.remove("show");
        }
    });

    studentInfoBtn.addEventListener("click", function() {
        const basePath = window.location.pathname.includes("/FNL_Group3") ? "/FNL_Group3" : "";
        window.location.href = `${basePath}/pages/04-studentInfo/studentInfos.html`;
    });

    gotoStudentInfo.addEventListener("click", function() {
        const basePath = window.location.pathname.includes("/FNL_Group3") ? "/FNL_Group3" : "";
        window.location.href = `${basePath}/pages/04-studentInfo/studentInfos.html`;
    });

    fetchSlides();
    fetchAndRenderEvents();
    fetchGalleryAlbums();
});

/** HEADER FUNCTION **/
document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("menu-toggle");
    const sidebar = document.getElementById("sidebar");

    menuToggle.addEventListener("click", function () {
        if (sidebar.style.left === "0px") {
            sidebar.style.left = "-250px";
        } else {
            sidebar.style.left = "0px";
        }
    });

    document.addEventListener("click", function (event) {
        if (!sidebar.contains(event.target) && event.target !== menuToggle) {
            sidebar.style.left = "-250px";
        }
    });
});








/** SLIDESHOW FUNCTIONS **/
let slideIndex = 0;
let slideInterval;
let isTransitioning = false;

function showSlides() {
    const slides = document.getElementsByClassName("mySlides");
    const dots = document.getElementsByClassName("dot");

    if (slides.length === 0 || isTransitioning) return;

    isTransitioning = true;

    // Update slide index
    slideIndex++;
    if (slideIndex > slides.length) {
        slideIndex = 1;
    }

    // Get current and next slides
    const currentSlide = slides[slideIndex - 1];
    const prevSlide = slides[slideIndex - 2 >= 0 ? slideIndex - 2 : slides.length - 1];

    // Set up the transition
    currentSlide.style.transform = 'translateX(0)';
    currentSlide.classList.add('active');
    prevSlide.classList.add('prev');

    // Update dots
    for (let i = 0; i < dots.length; i++) {
        dots[i].classList.remove("active");
    }
    if (dots[slideIndex - 1]) {
        dots[slideIndex - 1].classList.add("active");
    }

    // Reset transition state after animation
    setTimeout(() => {
        isTransitioning = false;
        // Reset positions for next transition
        prevSlide.style.transform = 'translateX(100%)';
        prevSlide.classList.remove('prev');
    }, 500);
}

function startSlideshow() {
    // Clear any existing interval
    if (slideInterval) {
        clearInterval(slideInterval);
    }
    // Start new interval
    slideInterval = setInterval(showSlides, 3500);
}

function showSlide(n) {
    if (isTransitioning) return;
    
    // Clear the interval when manually changing slides
    if (slideInterval) {
        clearInterval(slideInterval);
    }
    
    const slides = document.getElementsByClassName("mySlides");
    const currentSlide = slides[slideIndex - 1];
    const nextSlide = slides[n];
    
    // Determine slide direction
    const direction = n > slideIndex - 1 ? 1 : -1;
    
    // Set up the transition
    nextSlide.style.transform = 'translateX(0)';
    currentSlide.style.transform = `translateX(${direction * -100}%)`;
    
    // Update classes
    currentSlide.classList.remove('active');
    nextSlide.classList.add('active');
    
    // Update dots
    const dots = document.getElementsByClassName("dot");
    for (let i = 0; i < dots.length; i++) {
        dots[i].classList.remove("active");
    }
    dots[n].classList.add("active");
    
    // Update index
    slideIndex = n + 1;
    
    // Reset transition state after animation
    setTimeout(() => {
        isTransitioning = false;
        // Reset positions for next transition
        currentSlide.style.transform = 'translateX(100%)';
    }, 500);
    
    // Restart the interval
    startSlideshow();
}

function fetchSlides() {
    fetch('fetch_slides.php')
        .then(response => response.text())
        .then(data => {
            document.getElementById("slideContainer").innerHTML = data;
            addDots();
            // Set initial position for all slides
            const slides = document.getElementsByClassName("mySlides");
            for (let i = 0; i < slides.length; i++) {
                slides[i].style.transform = 'translateX(100%)';
            }
            // Show first slide
            slides[0].style.transform = 'translateX(0)';
            slides[0].classList.add('active');
            startSlideshow();
        })
        .catch(error => console.error('Error fetching slides:', error));
}

function addDots() {
    const slides = document.querySelectorAll('.mySlides');
    const dotsContainer = document.querySelector('.dots');
    dotsContainer.innerHTML = ''; 

    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        dot.setAttribute('onclick', `showSlide(${index})`);
        dotsContainer.appendChild(dot);
    });
}



/** EVENTS FUNCTIONS **/
function fetchAndRenderEvents() {
    fetch("../../pages/02-Dashboard/fetch_events.php")
        .then(response => response.json())
        .then(events => renderEvents(events))
        .catch(error => {
            console.error("Error fetching events:", error);
            document.querySelector(".timeline-container").innerHTML =
                "<p>Error loading events. Please try again later.</p>";
        });
}

function renderEvents(events) {
    const timelineContainer = document.querySelector(".timeline-container");
    timelineContainer.innerHTML = "";

    events.forEach(event => {
        const eventHtml = `
            <div class="timeline-event" data-event-id="${event.event_id}">
                <div class="event-marker"></div>
                <div class="event-box">
                    <h3>${event.title}</h3>
                    <p>${new Date(event.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
            </div>
        `;
        timelineContainer.innerHTML += eventHtml;
    });

    // Add click event listeners to each event
    document.querySelectorAll('.timeline-event').forEach(eventElement => {
        eventElement.addEventListener('click', function() {
            const eventId = this.getAttribute('data-event-id');
            const event = events.find(e => e.event_id == eventId);
            if (event) {
                showPopUp(event);
            }
        });
    });
}

$(document).ready(function () {
    $(".timeline-container").on("click", function () {
        showPopUp();
    });

    $("#popUpContainer").on("click", function (event) {
        closePopUp(event); 
    });
});

function showPopUp(event) {
    const popUp = document.querySelector('.popUp');
    popUp.querySelector('h2').innerHTML = event.title;
    popUp.querySelector('p').textContent = new Date(event.date).toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
    });
    popUp.querySelector('.popUp-content').innerHTML = event.description;
    document.getElementById("popUpContainer").classList.add("show");
}

function closePopUp(event) {
    // Close if clicking outside the popup or on the close button
    if (event.target.id === "popUpContainer" || event.target.classList.contains('closeButton')) {
        document.getElementById("popUpContainer").classList.remove("show");
    }
}



/** GALLERY FUNCTIONS **/
function fetchGalleryAlbums() {
    fetch("fetch_album.php")
        .then(response => response.json())
        .then(albums => renderGallery(albums))
        .catch(error => console.error("Error fetching albums:", error));
}

function renderGallery(albums) {
    const galleryContainer = document.getElementById("albumGallery");
    galleryContainer.innerHTML = "";

    albums.forEach(album => {
        const albumDiv = document.createElement("div");
        albumDiv.classList.add("album", `album_${album.album_id}`);
        albumDiv.innerHTML = `
            <p>${album.album_title}</p>
            <img class="albumImage" src="${album.album_image_url}" alt="${album.album_title}">
            <img class="albumBlur" src="${album.album_image_url}" alt="${album.album_title}">
        `;
        albumDiv.addEventListener("click", () => navigateToGallery(album.album_id));
        galleryContainer.appendChild(albumDiv);
    });
}

function navigateToGallery(albumId) {
    const basePath = window.location.pathname.includes("/FNL_Group3") ? "/FNL_Group3" : "";
    window.location.href = `${basePath}/pages/03-Gallery/gallery.html?galleryId=${albumId}`;
}
