document.addEventListener('DOMContentLoaded', () => {
    // Background blobs interaction
    const blobs = document.querySelectorAll('.blob');
    
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        blobs.forEach((blob, index) => {
            const speed = (index + 1) * 20;
            const xOffset = (x - 0.5) * speed;
            const yOffset = (y - 0.5) * speed;
            blob.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        });
    });

    // Password Toggle Logic
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle icons
            const eyeOpen = togglePasswordBtn.querySelector('.eye-open');
            const eyeClosed = togglePasswordBtn.querySelector('.eye-closed');
            
            if (type === 'text') {
                eyeOpen.style.display = 'none';
                eyeClosed.style.display = 'block';
            } else {
                eyeOpen.style.display = 'block';
                eyeClosed.style.display = 'none';
            }
        });
    }

    // Real Form Submissions to local SQLite Backend
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button[type="submit"]');
            btn.innerHTML = 'Logging in...';
            btn.style.opacity = '0.8';
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await res.json();
                if (res.ok && data.success) {
                    // For a real app, you would save JWT token to localStorage here
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = '/upload';
                } else {
                    alert(data.detail || 'Login failed');
                    btn.innerHTML = 'Log In';
                    btn.style.opacity = '1';
                }
            } catch (err) {
                console.error(err);
                alert('An error occurred during login');
                btn.innerHTML = 'Log In';
                btn.style.opacity = '1';
            }
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = registerForm.querySelector('button[type="submit"]');
            btn.innerHTML = 'Creating Account...';
            btn.style.opacity = '0.8';
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                if (res.ok) {
                    alert('Registration Successful! Redirecting to login...');
                    window.location.href = '/login';
                } else {
                    const data = await res.json();
                    alert(data.detail || 'Registration failed');
                    btn.innerHTML = 'Create Account';
                    btn.style.opacity = '1';
                }
            } catch (err) {
                console.error(err);
                alert('An error occurred during registration');
                btn.innerHTML = 'Create Account';
                btn.style.opacity = '1';
            }
        });
    }
});
