// Authentication functions
const auth = {
    hashPassword: function(password) {
        return crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
            .then(hash => {
                return Array.from(new Uint8Array(hash))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');
            });
    },
 
    login: function(username, password) {
        return new Promise((resolve, reject) => {
            const deviceInfo = `${navigator.platform} - ${navigator.userAgent}`;

            fetch('api/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    device: deviceInfo
                })
            })
            .then(response => response.json())
            .then(result => {
                if (result === true) {
                    sessionStorage.setItem('isLoggedIn', 'true');
                    sessionStorage.setItem('username', username);
                    resolve(true);
                } else {
                    reject(new Error('Invalid username or password'));
                }
            })
            .catch(error => {
                reject(new Error('Authentication error'));
            });
        });
    },
 
 
    logout: function() {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('username');
        window.location.href = '../../index.html';
    },
 
    isAuthenticated: function() {
        return sessionStorage.getItem('isLoggedIn') === 'true';
    },
 
    checkAuth: function() {
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath.endsWith('index.html') || currentPath === '/';
 
        if (!this.isAuthenticated() && !isLoginPage) {
            window.location.href = '../../index.html';
        } else if (this.isAuthenticated() && isLoginPage) {
            window.location.href = 'pages/02-Dashboard/dashboard.html';
        }
    }
};