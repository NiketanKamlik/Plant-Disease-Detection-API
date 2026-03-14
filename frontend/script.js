document.addEventListener('DOMContentLoaded', () => {
    // 1. Loading Animation Logic
    const loader = document.getElementById('loader');
    
    // Simulate loading time for visual effect (min 1.5s, max 3s based on actual load time)
    setTimeout(() => {
        loader.style.opacity = '0';
        loader.style.visibility = 'hidden';
    }, 2000);

    // 2. Upload Feature now handled via navigation in HTML
    

    // 3. Optional: Add a subtle mouse move effect to blobs
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
});

// Adding keyframe style for spinner via JS to avoid cluttering CSS further
const style = document.createElement('style');
style.innerHTML = `
.spin-anim {
    animation: spin 2s linear infinite;
}
@keyframes spin {
    100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);
