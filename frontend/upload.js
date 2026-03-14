document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    
    const uploadContent = document.getElementById('uploadContent');
    const previewContent = document.getElementById('previewContent');
    const analyzingContent = document.getElementById('analyzingContent');
    const resultsContent = document.getElementById('resultsContent');
    
    const imagePreview = document.getElementById('imagePreview');
    const scanImagePreview = document.getElementById('scanImagePreview');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resetBtn = document.getElementById('resetBtn');

    let currentFile = null;

    // --- Drag and Drop Handling ---
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('drag-active');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('drag-active');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    // --- Button / Input Handling ---
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    removeFileBtn.addEventListener('click', () => {
        resetState();
    });

    resetBtn.addEventListener('click', () => {
        resetState();
    });

    // --- Core Logic ---
    function handleFiles(files) {
        if (files && files.length > 0) {
            const file = files[0];
            
            // Basic validation
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file (JPEG, PNG, WEBP).');
                return;
            }

            currentFile = file;
            
            // Show preview
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = function() {
                imagePreview.src = reader.result;
                scanImagePreview.src = reader.result;
                
                // Switch views
                uploadContent.style.display = 'none';
                previewContent.style.display = 'flex';
            }
        }
    }

    function resetState() {
        fileInput.value = '';
        currentFile = null;
        imagePreview.src = '';
        scanImagePreview.src = '';
        
        previewContent.style.display = 'none';
        analyzingContent.style.display = 'none';
        resultsContent.style.display = 'none';
        uploadContent.style.display = 'flex';
    }

    analyzeBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        // Switch to analyzing view
        previewContent.style.display = 'none';
        analyzingContent.style.display = 'flex';

        // Real API Call
        const formData = new FormData();
        formData.append("file", currentFile);

        try {
            const response = await fetch('/api/predict', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Artificial delay just for the cool scanning animation UX (optional but nice)
            setTimeout(() => {
                showResults(result);
            }, 2000);

        } catch (error) {
            console.error("Error during analysis:", error);
            alert("An error occurred during analyzing. Please ensure the backend is running and the model is loaded properly.");
            resetState();
        }
    });

    function showResults(data) {
        analyzingContent.style.display = 'none';
        resultsContent.style.display = 'flex';

        const resultStatus = document.getElementById('resultStatus');
        const diseaseName = document.getElementById('diseaseName');
        const confidenceLevel = document.getElementById('confidenceLevel');
        const confidenceText = document.getElementById('confidenceText');
        const recommendationText = document.getElementById('recommendationText');

        if (data.success) {
            // Animate confidence bar
            setTimeout(() => {
                confidenceLevel.style.width = `${data.confidence}%`;
                confidenceText.textContent = `${data.confidence}%`;
            }, 100);

            if (data.is_healthy) {
                resultStatus.className = 'status-indicator healthy';
                diseaseName.textContent = data.disease_name || 'Plant is Healthy';
                confidenceLevel.style.background = 'var(--primary)';
                recommendationText.textContent = data.recommendation || 'Great job! Your plant shows no signs of disease.';
            } else {
                resultStatus.className = 'status-indicator warning';
                diseaseName.textContent = data.disease_name || 'Disease Detected';
                confidenceLevel.style.background = 'var(--accent)';
                recommendationText.textContent = data.recommendation || 'Please take appropriate action based on the detected disease.';
            }
        } else {
            diseaseName.textContent = 'Analysis Failed';
            resultStatus.className = 'status-indicator danger';
            recommendationText.textContent = `Error: ${data.error}`;
            confidenceLevel.style.width = '0%';
            confidenceText.textContent = '--%';
        }
    }

    // Optional: Add moving blobs background effect
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
