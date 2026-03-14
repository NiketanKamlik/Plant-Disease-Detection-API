// Check if user is logged in
document.addEventListener('DOMContentLoaded', () => {
    const userStr = localStorage.getItem('user');
    
    if (!userStr) {
        window.location.href = '/login';
        return;
    }

    const navAuth = document.getElementById('navAuth');
    if (userStr && navAuth) {
        const user = JSON.parse(userStr);
        navAuth.innerHTML = `
            <span style="color: var(--text-muted); margin-right: 15px;">Welcome, ${user.name}</span>
            <button class="btn btn-ghost" onclick="logout()">Logout</button>
        `;
    } else if (navAuth) {
        navAuth.innerHTML = `
            <a href="/login" class="btn btn-ghost">Login</a>
        `;
    }

    // Animate Blob follow mouse
    const blobs = document.querySelectorAll('.blob');
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        blobs.forEach((blob, index) => {
            const speed = (index + 1) * 20;
            blob.style.transform = `translate(${(x - 0.5) * speed}px, ${(y - 0.5) * speed}px)`;
        });
    });
});

function logout() {
    localStorage.removeItem('user');
    window.location.href = '/login';
}
