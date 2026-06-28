/**
 * dashboard.js — Dashboard section switching, API keys, history, profile
 * Used by: dashboard.html
 */
document.addEventListener('DOMContentLoaded', () => {

    const userStr = sessionStorage.getItem('user');
    const keysList = document.getElementById('keysList');
    if (!keysList || !userStr) return;

    const user = JSON.parse(userStr);
    const navAuth = document.getElementById('navAuth');

    const getAuthHeaders = (includeJson = true) => {
        const headers = {};
        if (includeJson) {
            headers['Content-Type'] = 'application/json';
        }
        const token = sessionStorage.getItem('access_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    };

    // Update nav with user info
    if (navAuth) {
        navAuth.innerHTML = `
            <span style="color: var(--text-muted); margin-right: 15px;">Welcome, ${user.name}</span>
            <button class="btn btn-ghost" onclick="logout()">Logout</button>
        `;
    }

    // ===== SECTION SWITCHING =====
    window.switchSection = (sectionId) => {
        const sections = ['overview', 'scan', 'keys', 'history', 'profile'];
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

    // ===== HISTORY =====
    const loadHistory = async () => {
        try {
            const res = await fetch(`/api/auth/history/${user.id}`, {
                headers: getAuthHeaders(false)
            });
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

    // ===== PROFILE =====
    const loadProfile = async () => {
        try {
            const res = await fetch(`/api/auth/profile/${user.id}`, {
                headers: getAuthHeaders(false)
            });
            const data = await res.json();
            document.getElementById('profile-name').value = data.name;
            document.getElementById('profile-email').value = data.email;
        } catch (e) { console.error(e); }
    };

    // ===== API KEYS =====
    const loadKeys = async () => {
        try {
            const res = await fetch(`/api/keys/`, {
                headers: getAuthHeaders(false)
            });
            const keys = await res.json();

            const totalUsage = keys.reduce((sum, k) => sum + (k.usage_count || 0), 0);
            const quotaLimit = keys.reduce((sum, k) => sum + (k.usage_limit || 1000), 0);

            const totalReqEl = document.getElementById('stat-total-requests');
            if (totalReqEl) totalReqEl.textContent = totalUsage.toLocaleString();

            const quotaCountEl = document.getElementById('stat-quota-count');
            if (quotaCountEl) quotaCountEl.textContent = `${totalUsage}/${quotaLimit}`;

            const quotaBar = document.getElementById('stat-quota-bar');
            if (quotaBar) quotaBar.style.width = `${Math.min((totalUsage / quotaLimit) * 100, 100)}%`;

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
                            <button class="btn btn-ghost btn-sm" onclick="copyToClipboard('${k.key}')">Copy Secret</button>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                <code style="font-family: monospace; color: var(--primary); font-size: 0.95rem;">${k.key.substring(0, 8)}••••••••••••••••</code>
                                <div style="display: flex; gap: 1.5rem; font-size: 0.75rem; color: var(--text-muted);">
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

    // ===== PROFILE FORM =====
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
                        headers: getAuthHeaders(),
                    body: JSON.stringify({
                        name: document.getElementById('profile-name').value,
                        email: document.getElementById('profile-email').value
                    })
                });
                const updated = await res.json();
                if (res.ok) {
                    sessionStorage.setItem('user', JSON.stringify(updated));
                    alert('Profile updated!');
                }
            } catch (e) { alert('Update failed'); }
            btn.disabled = false;
            btn.innerText = 'Save Changes';
        });
    }

    // ===== GENERATE KEY =====
    window.generateNewKey = async () => {
        const nameInput = document.getElementById('key-name-input');
        const keyName = nameInput.value.trim();
        if (!keyName) { alert('Please enter a name for your API key.'); return; }

        const btn = document.querySelector('[onclick="generateNewKey()"]');
        btn.disabled = true;
        btn.innerText = 'Generating...';

        try {
            const res = await fetch(`/api/keys/generate?key_name=${encodeURIComponent(keyName)}`, {
                method: 'POST',
                headers: getAuthHeaders(false)
            });
            if (res.ok) { nameInput.value = ''; loadKeys(); }
            else { const data = await res.json(); alert(data.detail || 'Failed to generate key.'); }
        } catch (err) { alert('Connection error.'); }
        finally {
            btn.disabled = false;
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Generate';
        }
    };

    window.copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Secret copied to clipboard!');
    };

    // Initialize
    window.switchSection('overview');
});
