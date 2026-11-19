// --- 1. Premium Particle System ---
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.size = Math.random() * 2 + 0.5;
        this.color = Math.random() > 0.5 ? 'rgba(0, 242, 255, ' : 'rgba(189, 0, 255, ';
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color + '0.5)';
        ctx.fill();
    }
}

for (let i = 0; i < 50; i++) {
    particles.push(new Particle());
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    // Draw subtle connections
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 120) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 - distance/1500})`;
                ctx.lineWidth = 0.5;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animateParticles);
}
animateParticles();

// --- 2. UI Logic & API Integration ---
const downloadBtn = document.getElementById('downloadBtn');
const urlInput = document.getElementById('videoUrl');
const resultSection = document.getElementById('resultSection');
const videoTitle = document.getElementById('videoTitle');
const videoThumbnail = document.getElementById('videoThumbnail');
const qualitiesContainer = document.getElementById('qualitiesContainer');

// Toast Notification System
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

downloadBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    
    // Frontend Validation
    const fbRegex = /^(https?:\/\/)?(www\.)?(facebook|fb)\.(com|watch|reel)\/.+$/;
    if (!fbRegex.test(url)) {
        showToast('Please enter a valid Facebook video URL.', 'error');
        urlInput.focus();
        return;
    }

    // Loading State
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<span class="spinner"></span> Processing...';
    resultSection.classList.add('hidden');

    try {
        // Call Backend API
        const response = await fetch('/api/get-video-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch video information.');
        }

        // Populate Results
        videoTitle.textContent = data.title;
        videoThumbnail.src = data.thumbnail;
        qualitiesContainer.innerHTML = '';

        data.qualities.forEach(q => {
            const btn = document.createElement('a');
            btn.href = q.url;
            btn.target = '_blank';
            btn.rel = 'noopener noreferrer';
            btn.className = 'quality-btn';
            btn.innerHTML = `
                <span><i class="fa-solid fa-download"></i> Download ${q.quality}</span>
                <span class="resolution">${q.resolution}</span>
            `;
            qualitiesContainer.appendChild(btn);
        });

        resultSection.classList.remove('hidden');
        showToast('Video processed successfully!', 'success');
        
        // Smooth scroll to results
        setTimeout(() => {
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);

    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '<span>DOWNLOAD VIDEO</span>';
    }
});

// --- 3. Back to Top Button ---
const backToTopBtn = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTopBtn.classList.remove('hidden');
    } else {
        backToTopBtn.classList.add('hidden');
    }
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Allow "Enter" key to trigger download
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        downloadBtn.click();
    }
});
