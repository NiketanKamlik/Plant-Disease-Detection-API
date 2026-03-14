let userData = null;

document.addEventListener('DOMContentLoaded', () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '/login';
        return;
    }

    userData = JSON.parse(userStr);
    const navAuth = document.getElementById('navAuth');
    if (navAuth) {
        navAuth.innerHTML = `
            <span style="color: var(--text-muted); margin-right: 15px;">${userData.name}</span>
            <button class="btn btn-ghost" onclick="logout()">Logout</button>
        `;
    }

    loadKeys();
});

async function loadKeys() {
    try {
        const res = await fetch(`/api/keys/?user_id=${userData.id}`);
        const keys = await res.json();
        renderKeys(keys);
    } catch (err) {
        console.error(err);
        const list = document.getElementById('keysList');
        if (list) {
            list.innerHTML = '<div class="empty-state">Failed to load keys.</div>';
        }
    }
}

function renderKeys(keys) {
    const list = document.getElementById('keysList');
    if (!list) return;

    if (!keys || keys.length === 0) {
        list.innerHTML = '<div class="empty-state">No API keys found. Generate one to get started!</div>';
        return;
    }

    list.innerHTML = keys.map(k => {
        const isLifetime = !k.expires_at;
        const expiryStr = isLifetime ? 'Lifetime Access (Admin)' : `Expires: ${new Date(k.expires_at).toLocaleDateString()}`;
        const isActive = !k.expires_at || new Date(k.expires_at) > new Date();
        
        return `
            <div class="api-key-card">
                <div class="api-key-info">
                    <h4>${k.key}</h4>
                    <div class="api-key-meta">${expiryStr}</div>
                </div>
                <span class="status-badge ${isActive ? 'status-active' : 'status-expired'}">
                    ${isActive ? 'ACTIVE' : 'EXPIRED'}
                </span>
            </div>
        `;
    }).join('');
}

async function generateNewKey() {
    try {
        const res = await fetch(`/api/keys/generate?user_id=${userData.id}&user_name=${userData.name}`, {
            method: 'POST'
        });
        if (res.ok) {
            loadKeys();
        } else {
            alert('Failed to generate key');
        }
    } catch (err) {
        console.error(err);
        alert('Connection error');
    }
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = '/login';
}
