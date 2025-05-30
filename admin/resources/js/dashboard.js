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

    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetSection = item.getAttribute('data-section');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            contentSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active', 'fade-in');
                }
            });
        });
    });

    loadStudentCount();
});

function loadStudentCount(){
    console.log("okay")
    fetch('../../handlers/studentCount_handler.php')
    .then(result => result.json())
    .then(data => {
        if(data.success){
            document.getElementById('studentCounter').innerHTML = `Students: ${data.count}`;
        }
    })
}