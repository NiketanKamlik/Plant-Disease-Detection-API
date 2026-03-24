/**
 * Phyto-Scan - Unified Application Logic
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
    const userStr = sessionStorage.getItem('user');
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
                    sessionStorage.setItem('user', JSON.stringify(data.user));
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

        // Drag & Drop logic
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-active');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-active');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-active');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                handleFiles(e.dataTransfer.files);
            }
        });

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
                const headers = {};
                const activeKey = sessionStorage.getItem('active_api_key');
                if (activeKey) {
                    headers['X-API-KEY'] = activeKey;
                }

                const res = await fetch('/api/predict', { 
                    method: 'POST', 
                    headers: headers,
                    body: formData 
                });
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

            const diseaseName = data.disease_name || 'Unknown';
            const confidence = parseFloat(data.confidence || 0).toFixed(2);
            const recommendation = data.recommendation || 'No specific recommendation.';
            const isHealthy = data.is_healthy || diseaseName.toLowerCase().includes('healthy');
            const medicine = data.medicine || '';
            const precaution = data.precaution || '';
            const predictionSource = data.prediction_source || 'Local Model';

            document.getElementById('diseaseName').textContent = diseaseName;
            document.getElementById('confidenceText').textContent = `${confidence}%`;
            document.getElementById('confidenceLevel').style.width = `${Math.round(confidence)}%`;
            document.getElementById('recommendationText').textContent = recommendation;
            
            const sourceTextEl = document.getElementById('serviceSourceText');
            if (sourceTextEl) sourceTextEl.textContent = predictionSource;

            const medBox = document.getElementById('medicineBox');
            const precBox = document.getElementById('precautionBox');

            if (!isHealthy && (medicine || precaution)) {
                if (medicine && medicine !== 'None needed.' && medicine !== 'N/A') {
                    medBox.style.display = 'flex';
                    document.getElementById('medicineText').textContent = medicine;
                } else {
                    medBox.style.display = 'none';
                }

                if (precaution && precaution !== 'None needed.' && precaution !== 'N/A') {
                    precBox.style.display = 'flex';
                    document.getElementById('precautionText').textContent = precaution;
                } else {
                    precBox.style.display = 'none';
                }
            } else {
                if (medBox) medBox.style.display = 'none';
                if (precBox) precBox.style.display = 'none';
            }

            // Color the status indicator based on result
            const statusEl = document.getElementById('resultStatus');
            if (statusEl) {
                statusEl.classList.remove('healthy', 'diseased');
                statusEl.classList.add(isHealthy ? 'healthy' : 'diseased');
            }

            // Update result label
            const resultLabel = document.getElementById('resultLabel');
            if (resultLabel) {
                resultLabel.textContent = isHealthy ? '✓ Healthy Plant' : '⚠ Disease Detected';
                resultLabel.style.color = isHealthy ? '#10B981' : '#F59E0B';
            }
        };

        document.getElementById('removeFileBtn').onclick = () => window.location.reload();
        document.getElementById('resetBtn').onclick = () => window.location.reload();
    }

    // --- 7. Dashboard Sections & Logic ---
    const keysList = document.getElementById('keysList');
    if (keysList && userStr) {
        const user = JSON.parse(userStr);

        window.switchSection = (sectionId) => {
            const sections = ['overview', 'keys', 'history', 'profile'];
            sections.forEach(s => {
                const el = document.getElementById(`section-${s}`);
                if (el) el.style.display = (s === sectionId) ? 'block' : 'none';

                const nav = document.getElementById(`nav-${s}`);
                if (nav) nav.classList.toggle('active', s === sectionId);
            });

            if (sectionId === 'history') loadHistory();
            if (sectionId === 'profile') loadProfile();
            if (sectionId === 'overview' || sectionId === 'keys') loadKeys();
        };

        const loadHistory = async () => {
            try {
                const res = await fetch(`/api/auth/history/${user.id}`);
                const history = await res.json();
                const list = document.getElementById('historyList');
                if (!history || history.length === 0) return;
                list.innerHTML = history.map(h => `
                    <div class="history-item fade-in">
                        <div class="history-date">${new Date(h.created_at).toLocaleDateString()}</div>
                        <div class="history-name">${h.disease_name}</div>
                        <div class="history-confidence">${h.confidence}% Match</div>
                        <button class="btn btn-ghost btn-sm" onclick="alert('Rec: ${h.recommendation}')">View Rec</button>
                    </div>
                `).join('');
            } catch (e) { console.error(e); }
        };

        const loadProfile = async () => {
            try {
                const res = await fetch(`/api/auth/profile/${user.id}`);
                const data = await res.json();
                document.getElementById('profile-name').value = data.name;
                document.getElementById('profile-email').value = data.email;
            } catch (e) { console.error(e); }
        };

        const loadKeys = async () => {
            try {
                const res = await fetch(`/api/keys/?user_id=${user.id}`);
                const keys = await res.json();

                // --- Update Overview Stats ---
                const totalUsage = keys.reduce((sum, k) => sum + (k.usage_count || 0), 0);
                const quotaLimit = keys.reduce((sum, k) => sum + (k.usage_limit || 1000), 0);

                const welcomeName = document.getElementById('welcome-name');
                if (welcomeName) welcomeName.textContent = user.name;

                const totalReqEl = document.getElementById('stat-total-requests');
                if (totalReqEl) totalReqEl.textContent = totalUsage.toLocaleString();

                const quotaCountEl = document.getElementById('stat-quota-count');
                if (quotaCountEl) quotaCountEl.textContent = `${totalUsage}/${quotaLimit}`;

                const quotaBar = document.getElementById('stat-quota-bar');
                if (quotaBar) quotaBar.style.width = `${Math.min((totalUsage / quotaLimit) * 100, 100)}%`;

                // --- Render Keys List ---
                if (keys.length === 0) {
                    keysList.innerHTML = '<div class="empty-state">No keys found. Generate one to start scanning.</div>';
                } else {
                    keysList.innerHTML = keys.map(k => `
                        <div class="api-key-card" style="position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; margin-bottom: 1.25rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                    <div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: rgba(16, 185, 129, 0.1); color: var(--primary);">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                                    </div>
                                    <h4 style="margin: 0;">${k.name || 'API Key'}</h4>
                                    <span class="plan-badge">${user.plan_type || 'Free'}</span>
                                </div>
                                <div style="display: flex; gap: 0.5rem;">
                                    <button class="btn btn-ghost btn-sm" onclick="copyToClipboard('${k.key}')">Copy Secret</button>
                                </div>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                    <code style="font-family: monospace; color: var(--primary); font-size: 0.95rem;">${k.key.substring(0, 8)}••••••••••••••••</code>
                                    <div class="api-key-meta" style="display: flex; gap: 1.5rem; font-size: 0.75rem; color: var(--text-muted);">
                                        <span>Quota: <strong>${k.usage_count} / ${k.usage_limit}</strong></span>
                                        <span>Last Used: <strong>${k.last_used ? new Date(k.last_used).toLocaleDateString() : 'Never'}</strong></span>
                                    </div>
                                </div>
                                <div style="width: 120px;">
                                    <div class="confidence-bar" style="height: 4px; margin-bottom: 4px;">
                                        <div class="confidence-fill" style="width: ${(k.usage_count / k.usage_limit) * 100}%"></div>
                                    </div>
                                    <div style="font-size: 0.7rem; text-align: right; color: var(--text-muted);">${Math.round((k.usage_count / k.usage_limit) * 100)}% Used</div>
                                </div>
                            </div>
                        </div>
                    `).join('');
                }
            } catch (err) { console.error(err); }
        };

        // Profile Form Handling
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('updateProfileBtn');
                btn.disabled = true;
                btn.innerText = 'Saving...';
                try {
                    const res = await fetch(`/api/auth/profile/${user.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: document.getElementById('profile-name').value,
                            email: document.getElementById('profile-email').value
                        })
                    });
                    const updated = await res.json();
                    if (res.ok) {
                        sessionStorage.setItem('user', JSON.stringify(updated));
                        navAuth.innerHTML = `
                            <span style="color: var(--text-muted); margin-right: 15px;">Welcome, ${updated.name}</span>
                            <button class="btn btn-ghost" onclick="logout()">Logout</button>
                        `;
                        alert('Profile updated!');
                    }
                } catch (e) { alert('Update failed'); }
                btn.disabled = false;
                btn.innerText = 'Save Changes';
            });
        }

        window.generateNewKey = async () => {
            const nameInput = document.getElementById('key-name-input');
            const keyName = nameInput.value.trim();

            if (!keyName) {
                alert("Please enter a name for your API key.");
                return;
            }

            const btn = document.querySelector('[onclick="generateNewKey()"]');
            btn.disabled = true;
            btn.innerText = 'Generating...';

            try {
                const res = await fetch(`/api/keys/generate?user_id=${user.id}&user_name=${encodeURIComponent(user.name)}&key_name=${encodeURIComponent(keyName)}`, {
                    method: 'POST'
                });

                if (res.ok) {
                    nameInput.value = '';
                    loadKeys();
                } else {
                    const data = await res.json();
                    alert(data.detail || "Failed to generate key.");
                }
            } catch (err) {
                alert("Connection error.");
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Generate';
            }
        };

        window.copyToClipboard = (text) => {
            navigator.clipboard.writeText(text);
            alert('Secret copied to clipboard!');
        };

        window.switchSection('overview');
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
    sessionStorage.removeItem('user');
    window.location.href = '/login';
}
