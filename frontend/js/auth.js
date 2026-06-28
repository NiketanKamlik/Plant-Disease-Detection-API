/**
 * auth.js — Auth guard, login form, register form, logout
 * Used by: login.html, register.html, and any protected page
 */
document.addEventListener('DOMContentLoaded', () => {

    const userStr = sessionStorage.getItem('user');
    const navAuth = document.getElementById('navAuth');

    // Auth guard for protected pages
    const protectedPages = ['/info', '/dashboard'];
    if (protectedPages.some(p => window.location.pathname.includes(p)) && !userStr) {
        window.location.href = '/login';
        return;
    }

    // Update nav when logged in
    if (navAuth && userStr) {
        const user = JSON.parse(userStr);
        navAuth.innerHTML = `
            <span style="color: var(--text-muted); margin-right: 15px;">Welcome, ${user.name}</span>
            <button class="btn btn-ghost" onclick="logout()">Logout</button>
        `;
    }

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Logging in...';
            btn.disabled = true;

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: document.getElementById('email').value,
                        password: document.getElementById('password').value
                    })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    sessionStorage.setItem('user', JSON.stringify(data.user));
                    if (data.access_token) {
                        sessionStorage.setItem('access_token', data.access_token);
                    }
                    window.location.href = '/dashboard';
                } else {
                    alert(data.detail || 'Login failed');
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            } catch (err) {
                console.error(err);
                alert('Connection error');
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = registerForm.querySelector('button[type="submit"]');
            btn.innerHTML = 'Creating Account...';
            btn.disabled = true;

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: document.getElementById('name').value,
                        email: document.getElementById('email').value,
                        password: document.getElementById('password').value
                    })
                });
                if (res.ok) {
                    alert('Registration Successful! Redirecting to login...');
                    window.location.href = '/login';
                } else {
                    const data = await res.json();
                    alert(data.detail || 'Registration failed');
                    btn.innerHTML = 'Create Account';
                    btn.disabled = false;
                }
            } catch (err) {
                console.error(err);
                btn.innerHTML = 'Create Account';
                btn.disabled = false;
            }
        });
    }
});

function logout() {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('access_token');
    window.location.href = '/login';
}
