/**
 * PlantCare AI - Unified Application Logic
 * Consolidates: script.js, auth.js, upload.js, info.js, dashboard.js
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Common UI Animations (Blobs) ---
    const blobs = document.querySelectorAll('.blob');
    if (blobs.length > 0) {
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            blobs.forEach((blob, index) => {
                const speed = (index + 1) * 20;
                blob.style.transform = `translate(${(x - 0.5) * speed}px, ${(y - 0.5) * speed}px)`;
            });
        });
    }

    // --- 2. Loader Logic (Index Page) ---
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            loader.style.visibility = 'hidden';
        }, 2000);
    }

    // --- 3. Auth Guard & User State (Shared) ---
    const userStr = localStorage.getItem('user');
    const navAuth = document.getElementById('navAuth');
    
    // Auth Guard for Info/Dashboard/Upload (if needed)
    const protectedPages = ['/info', '/dashboard'];
    if (protectedPages.some(p => window.location.pathname.includes(p)) && !userStr) {
        window.location.href = '/login';
        return;
    }

    if (navAuth && userStr) {
        const user = JSON.parse(userStr);
        navAuth.innerHTML = `
            <span style="color: var(--text-muted); margin-right: 15px;">Welcome, ${user.name}</span>
            <button class="btn btn-ghost" onclick="logout()">Logout</button>
        `;
    }

    // --- 4. Login Form Logic ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Logging in...';
            btn.disabled = true;
            
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
                    localStorage.setItem('user', JSON.stringify(data.user));
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

    // --- 5. Register Form Logic ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = registerForm.querySelector('button[type="submit"]');
            btn.innerHTML = 'Creating Account...';
            btn.disabled = true;
            
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
                    btn.disabled = false;
                }
            } catch (err) {
                console.error(err);
                btn.innerHTML = 'Create Account';
                btn.disabled = false;
            }
        });
    }

    // --- 6. Upload / Prediction Scanner Logic ---
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
        const fileInput = document.getElementById('fileInput');
        const browseBtn = document.getElementById('browseBtn');
        const uploadContent = document.getElementById('uploadContent');
        const previewContent = document.getElementById('previewContent');
        const analyzingContent = document.getElementById('analyzingContent');
        const resultsContent = document.getElementById('resultsContent');
        const imagePreview = document.getElementById('imagePreview');
        const scanImagePreview = document.getElementById('scanImagePreview');
        const analyzeBtn = document.getElementById('analyzeBtn');
        let currentFile = null;

        browseBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

        const handleFiles = (files) => {
            if (files && files[0]) {
                currentFile = files[0];
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.src = e.target.result;
                    scanImagePreview.src = e.target.result;
                    uploadContent.style.display = 'none';
                    previewContent.style.display = 'flex';
                };
                reader.readAsDataURL(currentFile);
            }
        };

        analyzeBtn.addEventListener('click', async () => {
            if (!currentFile) return;
            previewContent.style.display = 'none';
            analyzingContent.style.display = 'flex';

            const formData = new FormData();
            formData.append("file", currentFile);

            try {
                const res = await fetch('/api/predict', { method: 'POST', body: formData });
                const data = await res.json();
                setTimeout(() => showResults(data), 2000);
            } catch (err) {
                console.error(err);
                alert("Analysis failed.");
            }
        });

        const showResults = (data) => {
            analyzingContent.style.display = 'none';
            resultsContent.style.display = 'flex';
            document.getElementById('diseaseName').textContent = data.disease_name || 'Done';
            document.getElementById('confidenceText').textContent = `${data.confidence}%`;
            document.getElementById('confidenceLevel').style.width = `${data.confidence}%`;
            document.getElementById('recommendationText').textContent = data.recommendation || 'No specific recommendation.';
        };

        document.getElementById('removeFileBtn').onclick = () => window.location.reload();
        document.getElementById('resetBtn').onclick = () => window.location.reload();
    }

    // --- 7. Dashboard / API Key Management ---
    const keysList = document.getElementById('keysList');
    if (keysList && userStr) {
        const user = JSON.parse(userStr);
        const loadKeys = async () => {
            try {
                const res = await fetch(`/api/keys/?user_id=${user.id}`);
                const keys = await res.json();
                if (keys.length === 0) {
                    keysList.innerHTML = '<div class="empty-state">No keys found.</div>';
                } else {
                    keysList.innerHTML = keys.map(k => `
                        <div class="api-key-card">
                            <div class="api-key-info">
                                <h4>${k.key}</h4>
                                <div class="api-key-meta">${k.expires_at ? 'Expires: ' + new Date(k.expires_at).toLocaleDateString() : 'Lifetime Access'}</div>
                            </div>
                            <span class="status-badge status-active">ACTIVE</span>
                        </div>
                    `).join('');
                }
            } catch (err) { console.error(err); }
        };
        loadKeys();
        
        // Globally accessible for the button
        window.generateNewKey = async () => {
            const res = await fetch(`/api/keys/generate?user_id=${user.id}&user_name=${user.name}`, { method: 'POST' });
            if (res.ok) loadKeys();
        };
    }

    // --- 8. Password Toggle ---
    const toggleBtn = document.getElementById('togglePassword');
    if (toggleBtn) {
        toggleBtn.onclick = () => {
            const input = document.getElementById('password');
            const isPass = input.type === 'password';
            input.type = isPass ? 'text' : 'password';
            toggleBtn.querySelector('.eye-open').style.display = isPass ? 'none' : 'block';
            toggleBtn.querySelector('.eye-closed').style.display = isPass ? 'block' : 'none';
        };
    }
});

function logout() {
    localStorage.removeItem('user');
    window.location.href = '/login';
}
