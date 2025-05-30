document.addEventListener('DOMContentLoaded', function() {
    if (auth.isAuthenticated()) {
        window.location.href = 'pages/02-Dashboard/dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            await auth.login(username, password);
            window.location.href = 'pages/02-Dashboard/dashboard.html';
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        }
    });
});
