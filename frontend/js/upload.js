/**
 * upload.js — Plant image upload, scanning, and result display
 * Used by: upload.html, dashboard.html (scan section)
 */
document.addEventListener('DOMContentLoaded', () => {

    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;

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

    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-active'); });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.classList.remove('drag-active'); });
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
                if (imagePreview) imagePreview.src = e.target.result;
                if (scanImagePreview) scanImagePreview.src = e.target.result;
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
        formData.append('file', currentFile);

        try {
            const headers = {};
            const activeKey = sessionStorage.getItem('active_api_key');
            if (activeKey) headers['X-API-KEY'] = activeKey;

            const res = await fetch('/api/predict', { method: 'POST', headers, body: formData });
            const data = await res.json();
            showResults(data);
        } catch (err) {
            console.error(err);
            alert('Analysis failed.');
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

        document.getElementById('diseaseName').textContent = diseaseName;
        document.getElementById('confidenceText').textContent = `${confidence}%`;
        document.getElementById('confidenceLevel').style.width = `${Math.round(confidence)}%`;
        const recBox = document.getElementById('recommendationBox');
        if (recBox) {
            recBox.style.display = recommendation ? 'flex' : 'none';
            document.getElementById('recommendationText').textContent = recommendation;
        }

        // Medicine & Precaution boxes
        const medBox = document.getElementById('medicineBox');
        const precBox = document.getElementById('precautionBox');
        if (!isHealthy && (medicine || precaution)) {
            if (medBox && medicine && medicine !== 'None needed.' && medicine !== 'N/A') {
                medBox.style.display = 'flex';
                document.getElementById('medicineText').textContent = medicine;
            } else if (medBox) medBox.style.display = 'none';

            if (precBox && precaution && precaution !== 'None needed.' && precaution !== 'N/A') {
                precBox.style.display = 'flex';
                document.getElementById('precautionText').textContent = precaution;
            } else if (precBox) precBox.style.display = 'none';
        } else {
            if (medBox) medBox.style.display = 'none';
            if (precBox) precBox.style.display = 'none';
        }

        // Status badge color
        const statusEl = document.getElementById('resultStatus');
        if (statusEl) { statusEl.classList.remove('healthy', 'diseased'); statusEl.classList.add(isHealthy ? 'healthy' : 'diseased'); }

        const resultLabel = document.getElementById('resultLabel');
        if (resultLabel) {
            resultLabel.textContent = isHealthy ? '✓ Healthy Plant' : '⚠ Disease Detected';
            resultLabel.style.color = isHealthy ? '#10B981' : '#F59E0B';
        }

        // --- REFRESH DASHBOARD CONTEXT ---
        if (typeof window.loadHistory === 'function') window.loadHistory();
        if (typeof window.loadKeys === 'function') window.loadKeys();
    };

    const removeBtn = document.getElementById('removeFileBtn');
    const resetBtn = document.getElementById('resetBtn');
    if (removeBtn) removeBtn.onclick = () => window.location.reload();
    if (resetBtn) resetBtn.onclick = () => window.location.reload();
});
